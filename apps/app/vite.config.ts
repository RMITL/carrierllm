import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    allowedHosts: ['carrierllm.com', 'www.carrierllm.com', 'app.carrierllm.com', 'localhost', '127.0.0.1']
  }
});
