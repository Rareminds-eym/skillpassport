import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    entry: ['index.html', 'src/main.tsx', 'src/main.jsx'],
    project: ['src/**/*.{ts,tsx,js,jsx}'],
    ignore: [
        // Build artifacts and tooling configs
        'dist/**',
        'node_modules/**',
        'docs/**',
        '.wrangler/**',
        '.venv/**',
        'public/**',
        '.kiro/**',
        '.bolt/**',
        '.claude/**',
        '.emergent/**',
        '.zenflow/**',
        // Scripts and one-off files
        'scripts/**',
        'sync-program-field-everywhere.js',
        'repair-*.sh',
        '*.sh',
        // Cloudflare workers are independent entry points
        'cloudflare-workers/**',
        // Supabase migrations and functions
        'supabase/**',
        'functions/**',
    ],
    ignoreDependencies: [
        // PostCSS / Tailwind plugins — used in config files, not imported directly
        'autoprefixer',
        'tailwindcss',
        'postcss',
        // Vite and testing infra
        '@vitejs/plugin-react',
        'vite',
        'vitest',
        // Type-only packages
        '@types/*',
        // Husky / lint-staged toolchain
        'husky',
        'lint-staged',
        'secretlint',
        '@secretlint/secretlint-rule-preset-recommend',
        'commitlint',
        '@commitlint/cli',
        '@commitlint/config-conventional',
        'prettier',
        'eslint',
        'cspell',
        'tsc-files',
        'typescript',
        'typescript-eslint',
        'globals',
        // E2E and testing
        'puppeteer',
        'jest',
        'ts-jest',
        'ts-node',
        'jsdom',
        'fast-check',
        'concurrently',
        // Self (these tools)
        'knip',
        'madge',
        'depcheck',
    ],
    ignoreBinaries: ['wrangler', 'supabase', 'bash'],
};

export default config;
