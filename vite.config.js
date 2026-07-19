import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pavlov-1/',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html',
        privacy: 'src/privacy.html',
        consent: 'src/consent.html',
        disclaimer: 'src/disclaimer.html',
      },
    },
  },
  
  server: {
    port: 3000,
    open: true,
  },
});