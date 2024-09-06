import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import bodyParser from 'body-parser';
import generateSongHandler from './api/generate-song.js';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        setupMiddleware(server.middlewares);
      },
      configurePreviewServer(server) {
        setupMiddleware(server.middlewares);
      }
    },
  ],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Adjust this if your API is on a different port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  },
  define: {
    'process.env.MINIMAXI_API_KEY': JSON.stringify(process.env.MINIMAXI_API_KEY)
  }
});

function setupMiddleware(middlewares) {
  middlewares.use(bodyParser.json());
  middlewares.use((req, res, next) => {
    if (req.url === '/api/generate-song' && req.method === 'POST') {
      // Wrap the response object with Express-like methods
      const wrappedRes = {
        status: (statusCode) => {
          res.statusCode = statusCode;
          return wrappedRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        // Add other methods as needed
      };
      generateSongHandler(req, wrappedRes, process.env);
    } else {
      next();
    }
  });
}
