import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.token = token
    this.socket = io('http://localhost:3001', {
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
      this.socket.emit('send_message', { content })
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
      this.socket.on('new_message', callback)
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

  offAllListeners() {
    if (this.socket) {
      this.socket.off('new_message')
      this.socket.off('partner_typing')
      this.socket.off('partner_stopped_typing')
    }
  }

  get connected() {
    return this.socket?.connected || false
  }
}

export const socketManager = new SocketManager()