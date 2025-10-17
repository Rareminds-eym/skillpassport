import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.preview.emergentagent.com',
      'vscode-3e173968-b5c6-4add-bbe3-b1d06d0f0aa4.preview.emergentagent.com'
    ],
    hmr: {
      host: 'vscode-3e173968-b5c6-4add-bbe3-b1d06d0f0aa4.preview.emergentagent.com',
      protocol: 'wss',
      clientPort: 443
    }
  },
});
