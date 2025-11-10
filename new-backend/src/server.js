const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { connectDB } = require('./utils/database');
require('./models'); // Initialize model associations
require('./models/CoupleActivity'); // Ensure CoupleActivity model is loaded
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const questionRoutes = require('./routes/questions');
const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');
const notificationRoutes = require('./routes/notifications');
const coupleRoutes = require('./routes/couples');
const chatRoutes = require('./routes/chat');
const awardsRoutes = require('./routes/awards');
const quizzesRoutes = require('./routes/quizzes');
const coupleActivitiesRoutes = require('./routes/coupleActivities');
const socketHandler = require('./services/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB().then(async () => {
  // Ensure CoupleActivity table exists
  const CoupleActivity = require('./models/CoupleActivity');
  await CoupleActivity.sync({ alter: true });
  console.log('CoupleActivity table synced');
}).catch(console.error);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/couples', coupleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/awards', awardsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/activities', coupleActivitiesRoutes);

// Socket.io
socketHandler(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;