import { useState, useEffect } from 'react'
import { BookOpen, ArrowLeft, Send, RotateCcw, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface StoryBuilderProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function StoryBuilder({ onComplete, onExit }: StoryBuilderProps) {
  const [story, setStory] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [storyPrompt, setStoryPrompt] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(true)
  const [partnerName, setPartnerName] = useState('Partner')
  const [loading, setLoading] = useState(true)
  const [bothJoined, setBothJoined] = useState(false)

  const storyPrompts = [
    "Once upon a time, in a world where couples could travel through time...",
    "It was a dark and stormy night when we discovered a mysterious door in our apartment...",
    "The day we won the lottery, we decided to...",
    "If we were superheroes, our first mission would be to...",
    "In a parallel universe where we first met at...",
    "The aliens landed and chose us as Earth's representatives because..."
  ]

  useEffect(() => {
    loadStorySession()
    const interval = setInterval(loadStorySession, 1000) // Poll more frequently
    return () => clearInterval(interval)
  }, [])

  const loadStorySession = async () => {
    try {
      const results = await api.getCoupleActivityResults('game', 'story_builder')
      if (results.results) {
        // Get the most recent story data from either user or partner
        const userResponse = results.results.user.response
        const partnerResponse = results.results.partner.response
        
        let latestStoryData = null
        if (userResponse && partnerResponse) {
          // Both have data, use the most recently updated
          const userTime = new Date(userResponse.updatedAt || userResponse.startedAt || 0)
          const partnerTime = new Date(partnerResponse.updatedAt || partnerResponse.startedAt || 0)
          latestStoryData = userTime > partnerTime ? userResponse : partnerResponse
        } else {
          latestStoryData = userResponse || partnerResponse
        }
        
        if (latestStoryData?.story) {
          setStory(latestStoryData.story)
          setStoryPrompt(latestStoryData.story[0] || '')
          // Check if it's my turn based on currentTurn field
          setIsMyTurn(latestStoryData.currentTurn === 'user')
        }
        setBothJoined(results.bothCompleted || (userResponse && partnerResponse))
        setPartnerName(results.results.partner.name || 'Partner')
      }
    } catch (error) {
      console.log('No existing story session')
    } finally {
      setLoading(false)
    }
  }

  const startStory = async () => {
    const randomPrompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)]
    const storyData = {
      story: [randomPrompt],
      currentTurn: 'user',
      startedAt: new Date().toISOString()
    }
    
    try {
      await api.submitCoupleActivity('game', 'story_builder', storyData)
      setStoryPrompt(randomPrompt)
      setStory([randomPrompt])
      setIsMyTurn(false) // Partner goes first after prompt
      toast.success('Story started! Waiting for your partner to join...')
    } catch (error) {
      toast.error('Failed to start story')
    }
  }

  const addToStory = async () => {
    if (!currentInput.trim() || !isMyTurn) return
    
    const newStory = [...story, currentInput.trim()]
    const storyData = {
      story: newStory,
      currentTurn: 'partner', // Switch turn to partner
      lastAddedBy: 'user',
      updatedAt: new Date().toISOString()
    }
    
    try {
      await api.submitCoupleActivity('game', 'story_builder', storyData)
      setStory(newStory)
      setCurrentInput('')
      setIsMyTurn(false)
      toast.success('Added to story! Your partner\'s turn now.')
    } catch (error) {
      toast.error('Failed to add to story')
    }
  }

  const resetStory = () => {
    setStory([])
    setStoryPrompt('')
    setIsMyTurn(true)
    setCurrentInput('')
  }

  const completeStory = async () => {
    const storyData = {
      story,
      completed: true,
      finalStory: story.join(' '),
      totalParts: story.length,
      completedAt: new Date().toISOString()
    }
    
    try {
      await api.submitCoupleActivity('game', 'story_builder', storyData)
      onComplete({
        gameType: 'story_builder',
        story: story.join(' '),
        totalSentences: story.length,
        completed: true
      })
      toast.success('Story completed! What a creative collaboration!')
    } catch (error) {
      toast.error('Failed to complete story')
    }
  }

  if (!storyPrompt) {
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
            <div className="flex items-center gap-2 text-orange-500">
              <BookOpen className="w-6 h-6" />
              <span className="font-bold">Story Builder</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Story Together</h2>
            <p className="text-gray-600">Take turns adding to a collaborative story. Be creative and have fun!</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">How to Play:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                We'll give you a story starter
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Take turns adding 1-2 sentences
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Build on each other's ideas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Create something amazing together!
              </li>
            </ul>
          </div>

          <button
            onClick={startStory}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all"
          >
            Start Our Story
          </button>
        </div>
      </div>
    )
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
          <div className="flex items-center gap-2 text-orange-500">
            <BookOpen className="w-6 h-6" />
            <span className="font-bold">Story Builder</span>
          </div>
          <button
            onClick={resetStory}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Turn:</p>
                <p className="font-bold text-orange-600">{isMyTurn ? 'Your Turn' : `${partnerName}'s Turn`}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">{bothJoined ? 'Both Active' : 'Waiting for partner'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Our Story So Far:</h3>
          <div className="bg-gray-50 rounded-2xl p-4 max-h-64 overflow-y-auto">
            {story.map((sentence, index) => (
              <p
                key={index}
                className={`mb-2 p-2 rounded-lg ${
                  index === 0 
                    ? 'text-gray-600 italic bg-gray-100' 
                    : index % 2 === 1 
                      ? 'text-blue-700 bg-blue-50 border-l-4 border-blue-300' 
                      : 'text-purple-700 bg-purple-50 border-l-4 border-purple-300'
                }`}
              >
                {index === 0 && <span className="text-xs text-gray-500 block mb-1">Story Prompt:</span>}
                {index > 0 && <span className="text-xs text-gray-500 block mb-1">{index % 2 === 1 ? 'You:' : partnerName + ':'}</span>}
                {sentence}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isMyTurn ? 'Your turn - Add to the story:' : `Waiting for ${partnerName} to add to the story...`}
          </label>
          <div className="flex gap-2">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Continue the story... (1-2 sentences)"
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
              rows={3}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addToStory()
                }
              }}
            />
            <button
              onClick={addToStory}
              disabled={!currentInput.trim() || !isMyTurn}
              className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {story.length > 3 && (
          <button
            onClick={completeStory}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            Complete Our Story ({story.length} parts)
          </button>
        )}
      </div>
    </div>
  )
}