# Echo - Couples Connection App

A real-time couples connection app with adaptive learning ML service using Neon PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Neon Database account

### Setup

1. **Configure Neon Database**
   - Create a Neon project at [neon.tech](https://neon.tech)
   - Copy your connection string
   - Update `DATABASE_URL` in both `.env` files

2. **Install Dependencies & Run**
   ```bash
   # Start all services at once
   start-all.bat
   
   # Or start individually:
   start-backend.bat     # Backend on :3000
   start-ml-service.bat  # ML Service on :8000
   ```

3. **Access the App**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - ML Service: http://localhost:8000

## 🏗️ Architecture

```
Frontend (React) → Backend (Express.js) → Neon PostgreSQL
                      ↓
                 ML Service (FastAPI)
                      ↓
                 Redis (Optional)
```

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### ML Service (.env)
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
BACKEND_URL=http://localhost:3000
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## 📊 Database Models

- **Users**: User accounts and preferences
- **Questions**: Game questions with categories
- **GameSessions**: Real-time game data
- **UserPerformance**: ML training data

## 🤖 ML Features

- Adaptive difficulty adjustment
- Question recommendation
- Performance analytics
- Real-time learning

## 🔗 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/questions` - Get questions
- `POST /api/games` - Create game session
- `GET /api/users/stats` - User statistics