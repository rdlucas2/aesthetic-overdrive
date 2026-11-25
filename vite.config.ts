import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /<repo>/ and in wrappers (Electron/Capacitor).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
});
