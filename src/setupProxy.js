// client/src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

module.exports = function(app) {
  // Handle image requests specifically
  const imageProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
      '^/images': '/images'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Image Proxy] ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[Image Proxy Error] ${req.method} ${req.path}:`, err.message);
      
      // Send a fallback 1x1 transparent pixel image
      if (!res.headersSent) {
        try {
          // Path to a local fallback avatar in the public folder
          const fallbackImage = path.join(__dirname, '../public/default-avatar.png');
          
          if (fs.existsSync(fallbackImage)) {
            // If we have a local fallback, use it
            res.sendFile(fallbackImage);
          } else {
            // Otherwise return a transparent pixel
            const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            const img = Buffer.from(transparentPixel, 'base64');
            res.writeHead(200, {
              'Content-Type': 'image/png',
              'Content-Length': img.length
            });
            res.end(img);
          }
        } catch (e) {
          console.error('Failed to send fallback image:', e);
          res.writeHead(404);
          res.end();
        }
      }
    }
  });

  // Handle API requests that should be proxied to backend
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    },
    // Don't proxy settings/language requests - let them 404
    filter: function(path, req) {
      return !path.includes('/api/settings/language');
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log proxied requests for debugging
      console.log(`[API Proxy] ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[API Proxy Error] ${req.method} ${req.path}:`, err.message);
      
      // Only send response if headers haven't been sent yet
      if (!res.headersSent) {
        try {
          res.writeHead(500, {
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({
            success: false,
            error: 'Backend service unavailable',
          }));
        } catch (e) {
          console.error('Failed to send error response:', e);
        }
      }
    }
  });

  // Mount Image proxy for image requests
  app.use('/images', imageProxy);
  
  // Mount API proxy for all API requests except settings/language
  app.use('/api', apiProxy);
  
  // Special handler for settings/language endpoint - respond with mock data
  app.post('/api/settings/language', (req, res) => {
    res.json({
      success: true,
      data: { language: req.body?.language || 'en' }
    });
  });
};