import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://echo-backend-pml9.onrender.com'),
    'process.env.VITE_ML_SERVICE_URL': JSON.stringify(process.env.VITE_ML_SERVICE_URL || 'https://vinogram-echo-ml-service.hf.space')
  }
})