const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理API请求到后端服务器
  app.use(
    '/admin',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        res.status(500).send('代理服务器错误');
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('代理请求:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('代理响应:', proxyRes.statusCode, req.url);
      }
    })
  );

  // 代理认证相关请求
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug'
    })
  );

  // 代理图片上传等其他API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug'
    })
  );
}; 