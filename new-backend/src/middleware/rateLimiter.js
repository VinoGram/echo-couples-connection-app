const rateLimit = require('express-rate-limit');

const onLimitReached = (req, res) => {
  res.status(429).json({ error: 'Too many requests, please try again later.' });
};

// Strict: auth endpoints (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  handler: onLimitReached,
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate: general API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  handler: onLimitReached,
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed: read-only endpoints (questions, awards)
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  handler: onLimitReached,
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-socket event rate limiter (returns middleware function for socketHandler)
const socketEventLimiter = () => {
  const counts = new Map();
  const WINDOW_MS = 10 * 1000; // 10s window
  const MAX_EVENTS = 50;       // max events per window per socket

  return (socket, next) => {
    const now = Date.now();
    const entry = counts.get(socket.id) || { count: 0, resetAt: now + WINDOW_MS };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + WINDOW_MS;
    }

    entry.count++;
    counts.set(socket.id, entry);

    if (entry.count > MAX_EVENTS) {
      return next(new Error('Rate limit exceeded'));
    }

    socket.on('disconnect', () => counts.delete(socket.id));
    next();
  };
};

module.exports = { authLimiter, apiLimiter, readLimiter, socketEventLimiter };
