import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { socketManager } from '../lib/socket'
import { Send, Loader2, Sparkles, Brain } from 'lucide-react'

interface ChatProps {
  couple: any
  selectedQuestion?: string | null
  onQuestionSent?: () => void
  onNewMessage?: () => void
}

export function Chat({ couple, selectedQuestion, onQuestionSent, onNewMessage }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  if (!couple || !couple.isComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Connect with your partner to start chatting!</p>
      </div>
    )
  }

  useEffect(() => {
    loadMessages()
    initializeSocket()
    
    // Load partner name from backend
    loadPartnerName()
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      socketManager.offAllListeners()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [couple])

  // Handle selected question from Questions Bank
  useEffect(() => {
    if (selectedQuestion) {
      setNewMessage(selectedQuestion)
    }
  }, [selectedQuestion])

  const initializeSocket = () => {
    const token = sessionStorage.getItem('auth_token')
    if (!token) return

    const socket = socketManager.connect(token)
    
    socket.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    // Set initial connection state
    setConnected(socket.connected)

    socketManager.onNewMessage((message) => {
      setMessages((prev: any[]) => {
        const newMessages = [...prev, message]
        analyzeConversation(newMessages)
        return newMessages
      })
      
      // Notify parent component about new message
      onNewMessage?.()
      
      // Show notification for received message
      toast.success(`💬 ${partnerName || 'Partner'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`, {
        duration: 4000,
        position: 'top-right'
      })
      
      // Browser notification if page is not visible
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Message from ${partnerName || 'Partner'}`, {
          body: message.content,
          icon: '/favicon.ico',
          tag: 'chat-message'
        })
      }
    })

    socketManager.onPartnerTyping(() => {
      setPartnerTyping(true)
    })

    socketManager.onPartnerStoppedTyping(() => {
      setPartnerTyping(false)
    })

    socketManager.onMessagesRead(() => {
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true, readAt: new Date() })))
    })
  }

  useEffect(() => {
    // Mark messages as read when viewing chat (debounced)
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        markMessagesAsRead()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [messages])

  const markMessagesAsRead = async () => {
    try {
      await api.markMessagesAsRead()
      socketManager.notifyMessagesRead()
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const data = await api.getMessages()
      setMessages(data)
      if (data.length > 0) {
        analyzeConversation(data)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeConversation = async (messages: any[]) => {
    if (messages.length < 3) return
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }
    
    analysisTimeoutRef.current = setTimeout(async () => {
      try {
        const recentMessages = messages.slice(-10).map(m => m.content)
        
        // Analyze conversation for AI insights
        const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8001'
        const response = await fetch(`${mlServiceUrl}/analyze-communication`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recentMessages })
        })
        
        if (response.ok) {
          const analysis = await response.json()
          
          // Generate contextual questions based on conversation
          if (analysis.communication_health < 0.7) {
            generateContextualQuestions(recentMessages, analysis)
          }
          
          // Update conversation data for ML learning
          await updateConversationContext(recentMessages, analysis)
        }
        
      } catch (error) {
        console.error('Failed to analyze conversation:', error)
      }
    }, 2000) // Analyze after 2 seconds of no new messages
  }
  
  const generateContextualQuestions = async (messages: string[], analysis: any) => {
    try {
      const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8001'
      const response = await fetch(`${mlServiceUrl}/questions/contextual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_context: messages,
          communication_analysis: analysis,
          user_id: 'user_123',
          partner_id: 'partner_123'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.suggestions && data.suggestions.length > 0) {
          setAiSuggestions(data.suggestions)
          setShowSuggestions(true)
          
          // Auto-hide after 10 seconds
          setTimeout(() => setShowSuggestions(false), 10000)
        }
      }
    } catch (error) {
      console.error('Failed to generate contextual questions:', error)
    }
  }
  
  const updateConversationContext = async (messages: string[], analysis: any) => {
    try {
      const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8001'
      await fetch(`${mlServiceUrl}/conversation/update-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_123',
          partner_id: 'partner_123',
          messages,
          analysis,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to update conversation context:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      // Send via API to store in database
      const message = await api.sendMessage(newMessage.trim())
      
      // Also send via socket for real-time delivery
      if (connected) {
        socketManager.sendMessage(newMessage.trim())
      }
      
      // Add message to local state immediately
      setMessages(prev => [...prev, message])
      
      // Show success notification
      toast.success('Message sent!')
      
      setNewMessage('')
      socketManager.stopTyping()
      
      // Clear selected question after sending
      if (selectedQuestion && onQuestionSent) {
        onQuestionSent()
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    if (connected) {
      socketManager.startTyping()
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketManager.stopTyping()
      }, 1000)
    }
  }

  const loadPartnerName = async () => {
    try {
      const response = await api.getPartnerName()
      setPartnerName(response.partnerName || couple?.partner?.username || 'Partner')
    } catch (error) {
      setPartnerName(couple?.partner?.username || 'Partner')
    }
  }

  const savePartnerName = async () => {
    try {
      await api.updatePartnerName(partnerName)
      toast.success('Partner name updated!')
    } catch (error) {
      toast.error('Failed to update partner name')
      loadPartnerName()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center font-bold text-xl border border-white/30">
            {partnerName?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="flex-1">
            {editingName ? (
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                onBlur={() => {
                  setEditingName(false)
                  savePartnerName()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingName(false)
                    savePartnerName()
                  }
                }}
                className="bg-white/20 text-white font-semibold outline-none border-b border-white/30 w-full placeholder-white/70 rounded-lg px-3 py-1"
                autoFocus
              />
            ) : (
              <h3 
                className="font-bold text-xl cursor-pointer hover:text-white/80 transition-colors"
                onClick={() => setEditingName(true)}
                title="Click to edit name"
              >
                {partnerName}
              </h3>
            )}
            <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
              }`}></div>
              <span className="font-medium">{connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
        
      {showSuggestions && aiSuggestions.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">AI Conversation Insights</span>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="ml-auto text-purple-400 hover:text-purple-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-1">
            {aiSuggestions.slice(0, 2).map((suggestion, index) => (
              <p key={index} className="text-xs text-purple-600">
                💡 {suggestion}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin h-6 w-6 text-white" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Send className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Start Your Conversation</h3>
            <p className="text-gray-600 text-lg">Send a message to begin your journey together</p>
          </div>
        ) : (
          <>
            {messages.map((message: any, index) => {
              let currentUserId = null
              try {
                const token = sessionStorage.getItem('auth_token')
                if (token) {
                  currentUserId = JSON.parse(atob(token.split('.')[1])).userId
                }
              } catch (error) {
                console.error('Error parsing token:', error)
              }
              const isCurrentUser = message.sender?.id === currentUserId
              return (
                <div
                  key={message.id || index}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`max-w-xs lg:max-w-sm group ${isCurrentUser ? 'ml-16' : 'mr-16'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl relative shadow-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                      <div className={`flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2 mt-2 opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <span className={`text-xs font-medium ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {isCurrentUser && (
                          <div className={`${message.isRead ? 'text-blue-300' : 'text-blue-100'}`}>
                            {message.isRead ? (
                              <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                                <path d="M10.5 0L4.5 6L1.5 3L0 4.5L4.5 9L12 1.5L10.5 0Z"/>
                                <path d="M8.5 0L2.5 6L6.5 2L8 3.5L2.5 9L10 1.5L8.5 0Z"/>
                              </svg>
                            ) : (
                              <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                                <path d="M4.5 6L1.5 3L0 4.5L4.5 9L12 1.5L10.5 0L4.5 6Z"/>
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            

            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={sendMessage} className="bg-white p-6 border-t border-gray-200">
        <div className="flex items-end gap-4">
          <div className="flex-1 bg-gray-100 rounded-2xl px-5 py-4 flex items-center shadow-sm">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 font-medium"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {sending ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}