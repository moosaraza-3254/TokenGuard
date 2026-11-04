import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages: https://thimmegowdatp.github.io/jwt-workbench/
  base: '/jwt-workbench/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
