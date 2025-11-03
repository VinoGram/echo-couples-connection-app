const { Server } = require('socket.io')

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('join-couple', (coupleId) => {
      socket.join(coupleId)
      console.log(`User ${socket.id} joined couple ${coupleId}`)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  return io
}

module.exports = { initializeWebSocket }