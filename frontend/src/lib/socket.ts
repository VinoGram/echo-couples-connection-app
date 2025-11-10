import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.token = token
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    this.socket = io(socketUrl, {
      auth: { token }
    })

    this.socket.on('connect', () => {
      console.log('Connected to chat server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  sendMessage(content: string) {
    if (this.socket?.connected) {
      console.log('Sending message:', content)
      this.socket.emit('send_message', { content })
    } else {
      console.log('Socket not connected, cannot send message')
    }
  }

  startTyping() {
    if (this.socket?.connected) {
      this.socket.emit('typing_start')
    }
  }

  stopTyping() {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop')
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', (message) => {
        console.log('Received new message:', message)
        callback(message)
      })
    }
  }

  onPartnerTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('partner_typing', callback)
    }
  }

  onPartnerStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('partner_stopped_typing', callback)
    }
  }

  notifyMessagesRead() {
    if (this.socket?.connected) {
      this.socket.emit('messages_read')
    }
  }

  onMessagesRead(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('messages_marked_read', callback)
    }
  }

  offAllListeners() {
    if (this.socket) {
      this.socket.off('new_message')
      this.socket.off('partner_typing')
      this.socket.off('partner_stopped_typing')
      this.socket.off('messages_marked_read')
    }
  }

  get connected() {
    return this.socket?.connected || false
  }
}

export const socketManager = new SocketManager()