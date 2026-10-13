import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works from any folder or subpath (routing is hash-based).
export default defineConfig({
  base: './',
  plugins: [react()],
});
