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
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'framer-motion',
      'react-icons/ri',
      'react-icons/fa',
      'react-icons/md',
      'react-icons/io',
      'react-icons/ai',
      'react-icons/bs',
      'react-icons/hi',
      'react-icons/fi',
      '@tabler/icons-react',
    ],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      maxParallelFileOps: 3,
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Extract package name from node_modules path
          const parts = id.split('node_modules/')[1]?.split('/') ?? [];
          if (!parts.length) return 'vendor-misc';

          // Get the actual package name (handle scoped packages like @supabase/supabase-js)
          const packageName = parts[0].startsWith('@') && parts.length > 1
            ? `${parts[0]}/${parts[1]}`
            : parts[0];

          // React core - keep together to avoid circular deps
          if (packageName === 'react' || packageName === 'react-dom' ||
            packageName === 'react-router-dom' || packageName === 'react-is' ||
            packageName === 'scheduler') {
            return 'vendor-react';
          }

          // Victory charts and d3 - keep together to avoid circular deps
          if (packageName.startsWith('victory') || packageName === 'victory-vendor' || packageName.startsWith('d3-')) {
            return 'vendor-charts';
          }

          // Other chart libraries
          if (packageName === 'recharts') {
            return 'vendor-recharts';
          }

          // Large individual packages that need their own chunks
          if (packageName === '@supabase/supabase-js' || packageName === '@supabase/postgrest-js' ||
            packageName === '@supabase/realtime-js' || packageName === '@supabase/storage-js' ||
            packageName === '@supabase/functions-js' || packageName === '@supabase/auth-js') {
            return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
          }

          if (packageName === '@tanstack/react-query') {
            return 'vendor-tanstack-react-query';
          }

          if (packageName === 'lucide-react') {
            return 'vendor-lucide-react';
          }

          if (packageName === 'xlsx') {
            return 'vendor-xlsx';
          }

          if (packageName === 'react-datepicker' || packageName === 'date-fns') {
            return 'vendor-datepicker';
          }

          if (packageName === 'country-state-city') {
            return 'vendor-country-state-city';
          }

          if (packageName === 'indian-pincodes') {
            return 'vendor-indian-pincodes';
          }

          // Radix UI - split each package separately
          if (packageName.startsWith('@radix-ui/')) {
            return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
          }

          // PDF libraries
          if (packageName === 'jspdf' || packageName === 'jspdf-autotable' ||
            packageName === 'pdfjs-dist' || packageName === 'pdf-lib' ||
            packageName === 'html2canvas') {
            return `vendor-${packageName}`;
          }

          // AI libraries
          if (packageName === '@google/generative-ai' || packageName === 'openai' ||
            packageName === '@xenova/transformers') {
            return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
          }

          // Animation libraries
          if (packageName === 'framer-motion' || packageName === 'motion' ||
            packageName === 'gsap' || packageName === 'lottie-react' ||
            packageName === '@tsparticles/react' || packageName === '@tsparticles/slim' ||
            packageName === '@lottiefiles/dotlottie-react') {
            return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
          }

          // Icon libraries
          if (packageName === 'react-icons' || packageName === '@heroicons/react' ||
            packageName === '@tabler/icons-react') {
            return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
          }

          // Everything else gets its own chunk to avoid exceeding 25MB limit
          return `vendor-${packageName.replace(/[@\/]/g, '-')}`;
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
