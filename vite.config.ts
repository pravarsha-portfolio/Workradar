import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` inlines everything into one HTML file (used for the hosted Claude artifact demo).
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    rollupOptions: mode === 'single' ? undefined : { input: { main: 'index.html', styleguide: 'styleguide.html' } },
  },
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: { environment: 'node' },
}));
