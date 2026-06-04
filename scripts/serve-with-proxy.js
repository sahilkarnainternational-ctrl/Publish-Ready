import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 4174;
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:8080';
const FRONTEND_TARGET = process.env.FRONTEND_TARGET || 'http://127.0.0.1:4173';

// Proxy /api to backend API server
app.use('/api', createProxyMiddleware({ 
  target: API_TARGET, 
  changeOrigin: true, 
  logLevel: 'info',
  pathRewrite: (path, req) => {
    // Forward the path to the API server without duplicating the /api prefix.
    // Example: incoming /api/chapter -> forwarded /api/chapter (no double /api)
    return path.replace(/^\/api/, '/api');
  }
}));

// Proxy all other requests to Vite dev server
app.use(createProxyMiddleware({ 
  target: FRONTEND_TARGET, 
  changeOrigin: true, 
  logLevel: 'info',
  ws: true,
  pathRewrite: {
    '^/(?!api)': '/'
  }
}));

app.listen(PORT, () => {
  console.log(`Proxy running on http://127.0.0.1:${PORT}`);
  console.log(`  ├─ /api -> ${API_TARGET}`);
  console.log(`  └─ /* -> ${FRONTEND_TARGET} (Vite dev server)`);
});
