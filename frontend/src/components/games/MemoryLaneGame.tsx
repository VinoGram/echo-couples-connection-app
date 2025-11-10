import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Clock, Heart, ArrowLeft, Plus, Send, User } from 'lucide-react'
import { api } from '../../lib/api'

interface MemoryLaneGameProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function MemoryLaneGame({ onComplete, onExit }: MemoryLaneGameProps) {
  const [memories, setMemories] = useState<any[]>([])
  const [newMemory, setNewMemory] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const memoryPrompts = [
    "Our first date",
    "The first time we said 'I love you'",
    "Our funniest moment together",
    "A time we overcame a challenge",
    "Our most romantic moment",
    "A silly inside joke we have",
    "Our favorite shared activity",
    "A time we surprised each other",
    "Our most adventurous experience",
    "A moment we felt closest"
  ]

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      const coupleResults = await api.getCoupleActivityResults('game', 'memory_lane')
      if (coupleResults.results) {
        const allMemories = [
          ...(coupleResults.results.user.response?.memories || []),
          ...(coupleResults.results.partner.response?.memories || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setMemories(allMemories)
      }
    } catch (error) {
      console.log('No existing memories')
    }
  }

  const addMemory = async () => {
    if (!newMemory.trim()) {
      toast.error('Please write a memory')
      return
    }

    setLoading(true)
    try {
      const memory = {
        text: newMemory,
        prompt: selectedPrompt,
        author: 'You',
        date: new Date().toISOString(),
        id: Date.now().toString()
      }

      const updatedMemories = [...memories, memory]
      setMemories(updatedMemories)
      
      // Save to couple activities
      await api.submitCoupleActivity('game', 'memory_lane', { memories: updatedMemories })
      
      setNewMemory('')
      setSelectedPrompt('')
      toast.success('Memory shared! Your partner can see it now.')
    } catch (error) {
      toast.error('Failed to save memory')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onComplete({
      gameType: 'memory_lane',
      memories,
      completed: true
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-purple-500">
            <Clock className="w-6 h-6" />
            <span className="font-bold">Memory Lane</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Share Your Memories</h2>
          <p className="text-gray-600">Create a shared collection of your favorite relationship moments</p>
        </div>

        {/* Add New Memory */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Add a Memory</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose a prompt (optional)</label>
            <select
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select a memory prompt...</option>
              {memoryPrompts.map((prompt, index) => (
                <option key={index} value={prompt}>{prompt}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <textarea
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder={selectedPrompt ? `Tell us about: ${selectedPrompt}` : "Share a special memory..."}
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none h-24 resize-none"
              maxLength={500}
            />
          </div>

          <button
            onClick={addMemory}
            disabled={loading || !newMemory.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Sharing...' : 'Share Memory'}
          </button>
        </div>

        {/* Shared Memories */}
        {memories.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Your Shared Memories ({memories.length})
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className={`p-4 rounded-xl border ${
                    memory.author === 'You' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  {memory.prompt && (
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      {memory.prompt}
                    </div>
                  )}
                  <p className="text-gray-800 mb-2">{memory.text}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {memory.author}
                    </span>
                    <span>{new Date(memory.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {memories.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No memories yet</h3>
            <p className="text-gray-500">Start sharing your favorite moments together!</p>
          </div>
        )}

        <button
          onClick={handleComplete}
          className="w-full mt-6 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Save Memory Collection
        </button>
      </div>
    </div>
  )
}