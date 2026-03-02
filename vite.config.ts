import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime'],
  },
  build: {
    // Reduce memory usage during build
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.preview.emergentagent.com',
      'vscode-3e173968-b5c6-4add-bbe3-b1d06d0f0aa4.preview.emergentagent.com'
    ],
    hmr: {
      port: 3000
    },
    watch: {
      // Exclude large non-source directories so Vite doesn't exhaust the
      // OS inotify file-watcher limit (ENOSPC: too many watchers).
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/ai_department/**',   // contains a Python .venv with 100k+ files
        '**/docs/**',
        '**/.venv/**',
        '**/.wrangler/**',
        '**/cloudflare-workers/*/node_modules/**',
        '**/scripts/**',
        '**/tests/**',
        '**/*.py',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
