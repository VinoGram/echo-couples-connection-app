import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { verifyToken } from './auth'
import { db } from './db'
import { ObjectId } from 'mongodb'

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      const userId = verifyToken(token)
      if (!userId) {
        return next(new Error('Invalid token'))
      }

      socket.userId = userId
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`)

    // Join couple room
    try {
      const couples = await db.getCouples()
      const couple = await couples.findOne({
        $or: [
          { user1Id: new ObjectId(socket.userId) },
          { user2Id: new ObjectId(socket.userId) }
        ]
      })

      if (couple) {
        socket.join(couple._id.toString())
        socket.coupleId = couple._id.toString()
      }
    } catch (error) {
      console.error('Error joining couple room:', error)
    }

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { content } = data
        if (!socket.coupleId || !content?.trim()) return

        const messages = await db.getMessages()
        const message = await messages.insertOne({
          coupleId: new ObjectId(socket.coupleId),
          senderId: new ObjectId(socket.userId),
          content: content.trim(),
          createdAt: new Date()
        })

        // Get sender info
        const users = await db.getUsers()
        const profiles = await db.getUserProfiles()
        const sender = await users.findOne({ _id: new ObjectId(socket.userId) })
        const senderProfile = await profiles.findOne({ userId: new ObjectId(socket.userId) })

        const messageData = {
          _id: message.insertedId,
          content: content.trim(),
          createdAt: new Date(),
          sender: {
            _id: socket.userId,
            displayName: senderProfile?.displayName || 'Unknown'
          }
        }

        // Broadcast to couple room
        io.to(socket.coupleId).emit('new_message', messageData)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing_start', () => {
      if (socket.coupleId) {
        socket.to(socket.coupleId).emit('partner_typing', { userId: socket.userId })
      }
    })

    socket.on('typing_stop', () => {
      if (socket.coupleId) {
        socket.to(socket.coupleId).emit('partner_stopped_typing', { userId: socket.userId })
      }
    })

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`)
    })
  })

  return io
}

declare module 'socket.io' {
  interface Socket {
    userId: string
    coupleId: string
  }
}