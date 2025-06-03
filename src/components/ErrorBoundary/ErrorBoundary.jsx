import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Alert
            message="组件渲染出错"
            description={
              <div>
                <p>抱歉，页面出现了一些问题。这可能是由于组件加载失败或数据格式错误导致的。</p>
                {this.props.showDetails && this.state.error && (
                  <details style={{ marginTop: 16, textAlign: 'left' }}>
                    <summary>错误详情</summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {this.state.error && this.state.error.toString()}
                      <br />
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={this.handleReload}
                    style={{ marginRight: 8 }}
                  >
                    重新加载页面
                  </Button>
                  <Button 
                    onClick={this.handleRetry}
                  >
                    重试
                  </Button>
                </div>
              </div>
            }
            type="error"
            icon={<ExclamationCircleOutlined />}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 