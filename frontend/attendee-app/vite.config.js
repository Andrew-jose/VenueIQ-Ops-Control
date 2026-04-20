import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/predict': 'http://localhost:8001',
      '/chat': 'http://localhost:8001',
      '/webhook': 'http://localhost:8000',
    },
  },
  define: {
    __DEMO_MODE__: JSON.stringify(!process.env.VITE_MAPS_API_KEY || process.env.VITE_MAPS_API_KEY.includes('REPLACE'))
  }
});
