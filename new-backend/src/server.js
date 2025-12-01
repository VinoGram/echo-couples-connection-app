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
const invitationRoutes = require('./routes/invitations');
const socketHandler = require('./services/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true); // Allow all origins for socket.io
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB().then(async () => {
  // Ensure tables exist
  const CoupleActivity = require('./models/CoupleActivity');
  const OTP = require('./models/OTP');
  const Question = require('./models/Question');
  await CoupleActivity.sync({ alter: true });
  await OTP.sync({ alter: true });
  await Question.sync({ alter: true });
  
  const Message = require('./models/Message');
  await Message.sync({ alter: true });
  
  // Seed questions if database is empty
  const questionCount = await Question.count();
  if (questionCount === 0) {
    await seedQuestions();
  }
  
  console.log('All tables synced and questions seeded');
}).catch(console.error);

// Seed initial questions
async function seedQuestions() {
  const Question = require('./models/Question');
  
  const questions = [
    { text: "What makes you feel most loved by me?", type: 'open_ended', category: 'relationship', difficulty: 'easy' },
    { text: "What's your favorite memory of us together?", type: 'open_ended', category: 'memories', difficulty: 'easy' },
    { text: "What's one dream you'd like us to pursue together?", type: 'open_ended', category: 'deep', difficulty: 'hard' },
    { text: "What's your ideal date night?", type: 'open_ended', category: 'fun', difficulty: 'easy' },
    { text: "How do you envision our future family?", type: 'open_ended', category: 'deep', difficulty: 'hard' },
    { text: "What's the silliest thing we've done together?", type: 'open_ended', category: 'fun', difficulty: 'easy' },
    { text: "What does unconditional love mean to you?", type: 'open_ended', category: 'relationship', difficulty: 'hard' },
    { text: "Where would you like to go on our next adventure?", type: 'open_ended', category: 'fun', difficulty: 'medium' },
    { text: "What family traditions would you like to start?", type: 'open_ended', category: 'deep', difficulty: 'hard' },
    { text: "What's your favorite way to show affection?", type: 'open_ended', category: 'relationship', difficulty: 'medium' }
  ];
  
  await Question.bulkCreate(questions);
  console.log(`Seeded ${questions.length} questions to database`);
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://echoo-three.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
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
app.use('/api/invitations', invitationRoutes);

// Socket.io
socketHandler(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

module.exports = app;