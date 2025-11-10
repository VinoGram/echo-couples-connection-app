const jwt = require('jsonwebtoken');
const GameSession = require('../models/GameSession');
const memcached = require('./memcached');

module.exports = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Join user's personal room for chat
    socket.join(`user_${socket.userId}`);

    // Join game room
    socket.on('join_game', async (gameId) => {
      socket.join(gameId);
      socket.gameId = gameId;
      
      const gameSession = await GameSession.findById(gameId).populate('players.userId');
      socket.to(gameId).emit('player_joined', {
        playerId: socket.userId,
        players: gameSession.players
      });
    });

    // Start game
    socket.on('start_game', async (gameId) => {
      const gameSession = await GameSession.findById(gameId);
      if (gameSession.players.length >= 2) {
        gameSession.status = 'active';
        gameSession.startTime = new Date();
        await gameSession.save();
        
        io.to(gameId).emit('game_started', { gameSession });
      }
    });

    // Submit answer
    socket.on('submit_answer', async (data) => {
      const { gameId, questionId, answer, responseTime } = data;
      
      // Emit to other players
      socket.to(gameId).emit('player_answered', {
        playerId: socket.userId,
        questionId,
        responseTime
      });

      // Update leaderboard
      const score = await memcached.zscore('leaderboard', socket.userId) || 0;
      io.emit('leaderboard_update', {
        playerId: socket.userId,
        score: parseInt(score)
      });
    });

    // Game completed
    socket.on('game_complete', async (gameId) => {
      const gameSession = await GameSession.findById(gameId);
      gameSession.status = 'completed';
      gameSession.endTime = new Date();
      gameSession.duration = gameSession.endTime - gameSession.startTime;
      await gameSession.save();

      io.to(gameId).emit('game_ended', { gameSession });
    });

    // Chat events
    socket.on('send_message', async (data) => {
      const { content } = data;
      console.log(`User ${socket.userId} sent message: ${content}`);
      // Broadcast to all connected users
      socket.broadcast.emit('new_message', {
        id: Date.now(),
        content,
        sender: { id: socket.userId },
        createdAt: new Date()
      });
      console.log('Message broadcasted to other users');
    });

    socket.on('typing_start', () => {
      console.log(`User ${socket.userId} started typing`);
      socket.broadcast.emit('partner_typing');
    });

    socket.on('typing_stop', () => {
      console.log(`User ${socket.userId} stopped typing`);
      socket.broadcast.emit('partner_stopped_typing');
    });

    socket.on('messages_read', () => {
      console.log(`User ${socket.userId} read messages`);
      socket.broadcast.emit('messages_marked_read', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      if (socket.gameId) {
        socket.to(socket.gameId).emit('player_left', { playerId: socket.userId });
      }
    });
  });
};