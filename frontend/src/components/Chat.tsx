import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { socketManager } from '../lib/socket'
import { Send, Loader2, Sparkles, Brain } from 'lucide-react'

interface ChatProps {
  couple: any
}

export function Chat({ couple }: ChatProps) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const analysisTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadMessages()
    initializeSocket()
    
    return () => {
      socketManager.offAllListeners()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const initializeSocket = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const socket = socketManager.connect(token)
    
    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socketManager.onNewMessage((message) => {
      setMessages(prev => {
        const newMessages = [...prev, message]
        analyzeConversation(newMessages)
        return newMessages
      })
    })

    socketManager.onPartnerTyping(() => {
      setPartnerTyping(true)
    })

    socketManager.onPartnerStoppedTyping(() => {
      setPartnerTyping(false)
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        const response = await fetch('http://localhost:8000/analyze-communication', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recentMessages })
        })
        
        const analysis = await response.json()
        
        // Generate contextual questions based on conversation
        if (analysis.communication_health < 0.7) {
          generateContextualQuestions(recentMessages, analysis)
        }
        
        // Update conversation data for ML learning
        await updateConversationContext(recentMessages, analysis)
        
      } catch (error) {
        console.error('Failed to analyze conversation:', error)
      }
    }, 2000) // Analyze after 2 seconds of no new messages
  }
  
  const generateContextualQuestions = async (messages: string[], analysis: any) => {
    try {
      const response = await fetch('http://localhost:8000/questions/contextual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_context: messages,
          communication_analysis: analysis,
          user_id: 'user_123',
          partner_id: 'partner_123'
        })
      })
      
      const data = await response.json()
      if (data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions)
        setShowSuggestions(true)
        
        // Auto-hide after 10 seconds
        setTimeout(() => setShowSuggestions(false), 10000)
      }
    } catch (error) {
      console.error('Failed to generate contextual questions:', error)
    }
  }
  
  const updateConversationContext = async (messages: string[], analysis: any) => {
    try {
      await fetch('http://localhost:8000/conversation/update-context', {
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
    if (!newMessage.trim() || !connected) return

    setSending(true)
    try {
      socketManager.sendMessage(newMessage.trim())
      setNewMessage('')
      socketManager.stopTyping()
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
    <div className="flex flex-col h-96 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Chat with {couple.partnerName}
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-xs text-gray-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <Brain className="w-4 h-4 text-purple-500" title="AI is analyzing your conversation" />
          </div>
        </div>
        
        {showSuggestions && aiSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-pink-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p>Start your conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message: any, index) => {
              const isCurrentUser = message.sender?._id === localStorage.getItem('user_id')
              return (
                <div
                  key={message._id || index}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-pink-100' : 'text-gray-500'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {partnerTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder={connected ? "Type a message..." : "Connecting..."}
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all"
            disabled={sending || !connected}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !connected}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {sending ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}