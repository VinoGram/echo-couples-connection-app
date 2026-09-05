import { io, Socket } from 'socket.io-client'

class SocketManager {
  private _socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this._socket?.connected) return this._socket

    this.token = token
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    this._socket = io(socketUrl, { auth: { token } })

    this._socket.on('connect', () => console.log('Connected to chat server'))
    this._socket.on('disconnect', () => console.log('Disconnected from chat server'))
    this._socket.on('connect_error', (error) => console.error('Connection error:', error))

    return this._socket
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect()
      this._socket = null
    }
  }

  sendMessage(content: string) {
    if (this._socket?.connected) {
      this._socket.emit('send_message', { content })
    }
  }

  startTyping() {
    if (this._socket?.connected) this._socket.emit('typing_start')
  }

  stopTyping() {
    if (this._socket?.connected) this._socket.emit('typing_stop')
  }

  onNewMessage(callback: (message: any) => void) {
    this._socket?.on('new_message', callback)
  }

  onPartnerTyping(callback: (data: any) => void) {
    this._socket?.on('partner_typing', callback)
  }

  onPartnerStoppedTyping(callback: (data: any) => void) {
    this._socket?.on('partner_stopped_typing', callback)
  }

  notifyMessagesRead() {
    if (this._socket?.connected) this._socket.emit('messages_read')
  }

  onMessagesRead(callback: (data: any) => void) {
    this._socket?.on('messages_marked_read', callback)
  }

  offAllListeners() {
    this._socket?.off('new_message')
    this._socket?.off('partner_typing')
    this._socket?.off('partner_stopped_typing')
    this._socket?.off('messages_marked_read')
  }

  get connected() {
    return this._socket?.connected || false
  }

  // Public getter so WatchParty and other components can access the socket directly
  get socket() {
    return this._socket
  }
}

export const socketManager = new SocketManager()
