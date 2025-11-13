import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    entry: 'src/main/main.js',
  },
  preload: {
    input: 'src/main/preload.js',
  },
  renderer: {
    plugins: [react()],
    root: '.',
    build: {
      rollupOptions: {
        input: './index.html',
      },
    },
  },
});
