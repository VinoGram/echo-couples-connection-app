import { useState } from 'react'
import { BookOpen, ArrowLeft, Send, RotateCcw } from 'lucide-react'

interface StoryBuilderProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function StoryBuilder({ onComplete, onExit }: StoryBuilderProps) {
  const [story, setStory] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [storyPrompt, setStoryPrompt] = useState('')

  const storyPrompts = [
    "Once upon a time, in a world where couples could travel through time...",
    "It was a dark and stormy night when we discovered a mysterious door in our apartment...",
    "The day we won the lottery, we decided to...",
    "If we were superheroes, our first mission would be to...",
    "In a parallel universe where we first met at...",
    "The aliens landed and chose us as Earth's representatives because..."
  ]

  const startStory = () => {
    const randomPrompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)]
    setStoryPrompt(randomPrompt)
    setStory([randomPrompt])
  }

  const addToStory = () => {
    if (currentInput.trim()) {
      setStory([...story, currentInput.trim()])
      setCurrentInput('')
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    }
  }

  const resetStory = () => {
    setStory([])
    setStoryPrompt('')
    setCurrentPlayer(1)
    setCurrentInput('')
  }

  const completeStory = () => {
    onComplete({
      gameType: 'story_builder',
      story: story.join(' '),
      totalSentences: story.length,
      completed: true
    })
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
            <p className="text-sm text-gray-600 mb-1">Current Turn:</p>
            <p className="font-bold text-orange-600">Player {currentPlayer}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Our Story So Far:</h3>
          <div className="bg-gray-50 rounded-2xl p-4 max-h-64 overflow-y-auto">
            {story.map((sentence, index) => (
              <p
                key={index}
                className={`mb-2 ${
                  index === 0 
                    ? 'text-gray-600 italic' 
                    : index % 2 === 1 
                      ? 'text-blue-700' 
                      : 'text-purple-700'
                }`}
              >
                {sentence}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add to the story (Player {currentPlayer}):
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
              disabled={!currentInput.trim()}
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