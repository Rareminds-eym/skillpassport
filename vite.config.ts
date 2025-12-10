import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/dev-skillpassport/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Reduce memory usage during build
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        },
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
    proxy: {
      '/api/upload-to-r2': {
        target: 'https://dpooleduinyyzxgrcwko.supabase.co/functions/v1/upload-to-r2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upload-to-r2/, '')
      },
      '/api/delete-from-r2': {
        target: 'https://dpooleduinyyzxgrcwko.supabase.co/functions/v1/delete-from-r2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/delete-from-r2/, '')
      }
    }
  },
}));
