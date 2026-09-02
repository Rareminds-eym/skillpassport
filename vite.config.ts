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
      'jose': path.resolve(__dirname, './node_modules/jose'),
      '@rareminds-eym/auth-core/internal': path.resolve(__dirname, '../skill-echosystem-packages/auth-core/dist/internal.js'),
      '@rareminds-eym/auth-core': path.resolve(__dirname, '../skill-echosystem-packages/auth-core/dist/index.js'),
      '@rareminds-eym/sso-gateway': path.resolve(__dirname, '../skill-echosystem-packages/sso-gateway/dist/index.js'),
      '@rareminds-eym/entitlements': path.resolve(__dirname, '../skill-echosystem-packages/entitlements/dist/index.js'),
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
    target: 'esnext',
    rollupOptions: {
      maxParallelFileOps: 1,
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Extract package name from node_modules path
          const parts = id.split('node_modules/')[1]?.split('/') ?? [];
          if (!parts.length) return 'vendor';

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

          // Radix UI components - group together
          if (packageName.startsWith('@radix-ui/')) {
            return 'vendor-radix';
          }

          // Supabase - group together
          if (packageName.startsWith('@supabase/')) {
            return 'vendor-supabase';
          }

          if (packageName.startsWith('@rareminds-eym/') ||
            packageName === '@fingerprintjs/fingerprintjs' ||
            packageName === 'jose' ||
            packageName === 'aws4fetch') {
            return 'vendor-auth';
          }

          if (packageName === '@google/generative-ai' || packageName === 'openai') {
            return 'vendor-ai';
          }

          if (packageName === '@tanstack/react-query' || packageName === 'zustand') {
            return 'vendor-state';
          }

          // Charts - group together
          if (packageName.startsWith('victory') || packageName === 'victory-vendor' ||
            packageName.startsWith('d3-') || packageName === 'recharts' ||
            packageName === 'apexcharts' || packageName === 'react-apexcharts') {
            return 'vendor-charts';
          }

          // UI/Animation libraries - group together
          if (packageName === 'framer-motion' || packageName === 'gsap' ||
            packageName === 'lottie-react' || packageName.startsWith('@tsparticles/') ||
            packageName.startsWith('@lottiefiles/')) {
            return 'vendor-animation';
          }

          if (packageName === 'pdfjs-dist') {
            return 'vendor-pdfjs';
          }

          if (packageName === 'jspdf' || packageName === 'jspdf-autotable') {
            return 'vendor-jspdf';
          }

          if (packageName === 'pdf-lib') {
            return 'vendor-pdflib';
          }

          if (packageName === 'html2canvas') {
            return 'vendor-html2canvas';
          }

          if (packageName === 'docx') {
            return 'vendor-docx';
          }

          // Icons - group together
          if (packageName === 'react-icons' || packageName === '@heroicons/react' ||
            packageName === '@tabler/icons-react' || packageName === 'lucide-react') {
            return 'vendor-icons';
          }

          if (packageName === 'country-state-city') {
            const normalizedId = id.replace(/\\/g, '/');

            if (
              normalizedId.includes('/lib/city.') ||
              normalizedId.includes('/lib/assets/city.json')
            ) {
              return 'vendor-geo-city';
            }

            if (
              normalizedId.includes('/lib/state.') ||
              normalizedId.includes('/lib/assets/state.json')
            ) {
              return 'vendor-geo-state';
            }

            if (
              normalizedId.includes('/lib/country.') ||
              normalizedId.includes('/lib/assets/country.json')
            ) {
              return 'vendor-geo-country';
            }

            return 'vendor-geo';
          }

          if (packageName === 'xlsx') {
            return 'vendor-xlsx';
          }

          if (packageName === 'indian-pincodes') {
            return 'vendor-pincodes';
          }

          if (packageName === 'papaparse' || packageName === 'csv-parse') {
            return 'vendor-csv';
          }

          if (packageName === 'react-markdown' ||
            packageName === 'rehype-sanitize' ||
            packageName.startsWith('remark-') ||
            packageName.startsWith('rehype-') ||
            packageName.startsWith('micromark') ||
            packageName.startsWith('mdast-') ||
            packageName.startsWith('hast-') ||
            packageName.startsWith('unist-') ||
            packageName === 'unified' ||
            packageName === 'vfile') {
            return 'vendor-markdown';
          }

          if (packageName === 'react-hook-form' ||
            packageName === 'react-datepicker' ||
            packageName === 'react-day-picker' ||
            packageName === 'react-calendar' ||
            packageName === 'cmdk' ||
            packageName === 'embla-carousel-react') {
            return 'vendor-forms';
          }

          if (packageName === 'date-fns' ||
            packageName === 'uuid' ||
            packageName === 'zod' ||
            packageName === 'qrcode' ||
            packageName === 'qrcode.react' ||
            packageName === 'file-saver' ||
            packageName === 'class-variance-authority' ||
            packageName === 'clsx' ||
            packageName === 'tailwind-merge') {
            return 'vendor-utils';
          }

          // Everything else
          return 'vendor';
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
        ws: true,
      },
    },
  },
});
