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
    // Express mounts this middleware at /api and strips the prefix before forwarding.
    // Re-prepend /api so the backend (which mounts router at /api) receives /api/* paths.
    return '/api' + path;
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
