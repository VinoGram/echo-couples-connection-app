# Deployment Guide

## 1. Hugging Face Spaces (ML Service)
1. Create new Space on Hugging Face
2. Upload `ml-service/` folder contents
3. Set environment variables:
   - `DATABASE_URL`: Your Neon database URL
   - `BACKEND_URL`: Your Render backend URL

## 2. Render (Backend)
1. Connect GitHub repo to Render
2. Set root directory to `new-backend`
3. Set environment variables:
   - `DATABASE_URL`: Your Neon database URL
   - `JWT_SECRET`: Generate secure secret
   - `FRONTEND_URL`: https://echoo-three.vercel.app
   - `ML_SERVICE_URL`: Your Hugging Face Space URL
   - `NODE_ENV`: production

## 3. Vercel (Frontend)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set environment variables:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_ML_SERVICE_URL`: Your Hugging Face Space URL

## URLs to Update:
- Replace `your-backend.onrender.com` with actual Render URL
- Replace `your-hf-space.hf.space` with actual HF Space URL
- Update `echoo-three.vercel.app` if different