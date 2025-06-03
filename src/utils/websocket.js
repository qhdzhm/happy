class AdminWebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.listeners = new Map();
        this.serviceId = null;
        this.connected = false;
        this.heartbeatTimer = null;
        this.heartbeatInterval = 30000; // 30秒心跳
    }

    // 获取WebSocket基础URL
    getWebSocketBaseUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NODE_ENV === 'production' 
            ? window.location.host 
            : 'localhost:8080';
        return `${protocol}//${host}`;
    }

    // 启动心跳
    startHeartbeat() {
        this.stopHeartbeat(); // 先停止之前的心跳
        this.heartbeatTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                console.log('发送心跳包');
                this.send({ type: 'ping', timestamp: Date.now() });
            }
        }, this.heartbeatInterval);
    }

    // 停止心跳
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // 连接WebSocket (客服端)
    connect(serviceId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        this.serviceId = serviceId;

        try {
            const wsUrl = `${this.getWebSocketBaseUrl()}/ws/admin/${serviceId}`;
            console.log('正在连接客服工作台WebSocket:', wsUrl);
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('客服工作台WebSocket连接已建立');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat(); // 启动心跳
                this.emit('connected');
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('收到WebSocket消息:', data);
                    
                    // 处理心跳响应
                    if (data.type === 'pong') {
                        console.log('收到心跳响应');
                        return;
                    }
                    
                    this.emit('message', data);
                } catch (error) {
                    console.error('解析WebSocket消息失败:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('客服工作台WebSocket连接已关闭');
                this.connected = false;
                this.stopHeartbeat(); // 停止心跳
                this.emit('disconnected');
                this.handleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('客服工作台WebSocket错误:', error);
                this.connected = false;
                this.stopHeartbeat(); // 停止心跳
                this.emit('error', error);
            };
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.handleReconnect();
        }
    }

    // 断开连接
    disconnect() {
        this.stopHeartbeat(); // 停止心跳
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.reconnectAttempts = 0;
        this.listeners.clear();
    }

    // 发送消息
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket未连接，无法发送消息');
            return false;
        }
    }

    // 重连机制
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (this.serviceId) {
                    this.connect(this.serviceId);
                }
            }, this.reconnectInterval);
        } else {
            console.error('WebSocket重连失败，已达到最大重连次数');
            this.emit('reconnectFailed');
        }
    }

    // 添加事件监听器
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    // 移除事件监听器
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    // 触发事件
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('WebSocket事件处理器错误:', error);
                }
            });
        }
    }

    // 获取连接状态
    getConnectionState() {
        if (!this.socket) return 'DISCONNECTED';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'CONNECTED';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'DISCONNECTED';
            default:
                return 'UNKNOWN';
        }
    }

    // 是否已连接
    isConnected() {
        return this.connected;
    }
}

// 创建单例实例
const adminWebSocketService = new AdminWebSocketService();

export default adminWebSocketService; 