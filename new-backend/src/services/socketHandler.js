const jwt = require('jsonwebtoken');
const GameSession = require('../models/GameSession');
const memcached = require('./memcached');
const { socketEventLimiter } = require('../middleware/rateLimiter');

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

  // Per-socket event rate limiting
  io.use(socketEventLimiter());

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

    // Watch party signaling
    // Each user hosts a room named after their own userId.
    // Sharer joins their own room and waits.
    // Joiner sends { hostId } — server puts joiner in host's room and fires peer-joined.
    socket.on('watch-party:join', ({ hostId } = {}) => {
      if (hostId && hostId !== socket.userId) {
        // This socket is the joiner — enter the host's room
        const room = `watch-party:${hostId}`;
        socket.join(room);
        socket.watchRoom = room;
        socket.to(room).emit('watch-party:peer-joined');
        console.log(`[watch] joiner ${socket.userId} joined host room ${room}`);
      } else {
        // This socket is the sharer — create their own room
        const room = `watch-party:${socket.userId}`;
        socket.join(room);
        socket.watchRoom = room;
        // Emit the hostId back so the frontend can share it with the partner
        socket.emit('watch-party:room-ready', { hostId: socket.userId });
        console.log(`[watch] sharer ${socket.userId} opened room ${room}`);
      }
    });

    socket.on('watch-party:signal', (data) => {
      if (socket.watchRoom) {
        socket.to(socket.watchRoom).emit('watch-party:signal', data);
      }
    });

    socket.on('watch-party:leave', () => {
      if (socket.watchRoom) {
        socket.to(socket.watchRoom).emit('watch-party:peer-left');
        socket.leave(socket.watchRoom);
        socket.watchRoom = null;
      }
    });
  });
};