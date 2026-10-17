import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/vision': 'http://127.0.0.1:8000',
      '/api/videos': 'http://127.0.0.1:8000',
      '/api/model': 'http://127.0.0.1:8000',
      '/api/images': 'http://127.0.0.1:8000',
      '/api/analytics': 'http://127.0.0.1:8000',
      '/api/reports': 'http://127.0.0.1:8000',
      '/api/health': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-maps': ['leaflet', 'react-leaflet', '@turf/turf'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
});
