import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@game': path.resolve(__dirname, 'src/game'),
      '@react': path.resolve(__dirname, 'src/react'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        timeout: 10000,
        proxyTimeout: 10000,
        configure: (proxy) => {
          proxy.on('error', () => {}); // suppress ECONNRESET noise
        },
      },
    },
  },
});
