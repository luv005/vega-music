import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import bodyParser from 'body-parser';
import generateMusicHandler from './api/generate-music.js';

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
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  },
});

function setupMiddleware(middlewares) {
  middlewares.use(bodyParser.json());
  middlewares.use((req, res, next) => {
    if (req.url === '/api/generate-music' && req.method === 'POST') {
      generateMusicHandler(req, res, process.env);
    } else {
      next();
    }
  });
}
