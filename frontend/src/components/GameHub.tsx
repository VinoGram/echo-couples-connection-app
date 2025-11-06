import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Gamepad2, ArrowRight, Heart, Clock, HelpCircle, Shuffle, Target, Dice1, Brain, Calendar, BookOpen, Zap } from 'lucide-react'
import { TruthOrDareGame } from './games/TruthOrDareGame'
import { ThisOrThatGame } from './games/ThisOrThatGame'
import { MemoryLaneGame } from './games/MemoryLaneGame'
import { LoveLanguageGame } from './games/LoveLanguageGame'
import { CoupleTrivia } from './games/CoupleTrivia'
import { DateNightPlanner } from './games/DateNightPlanner'
import { RelationshipGoals } from './games/RelationshipGoals'
import { StoryBuilder } from './games/StoryBuilder'
import { AdaptiveGameSession } from './games/AdaptiveGameSession'
import { GenerativeGameSession } from './games/GenerativeGameSession'

export function GameHub() {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [gameData, setGameData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const games = [
    {
      id: 'adaptive_session',
      title: 'AI-Powered Game',
      description: 'Personalized questions that adapt to your relationship using machine learning',
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      example: 'Questions selected just for you based on your history'
    },
    {
      id: 'generative_session',
      title: 'AI Question Generator',
      description: 'Brand new questions created in real-time by AI based on your relationship',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      example: 'Completely unique questions generated just for you'
    },
    {
      id: 'this_or_that',
      title: 'This or That?',
      description: 'Quick-fire preference questions to learn about each other',
      icon: ArrowRight,
      color: 'from-pink-500 to-rose-500',
      example: 'Beach vacation or mountain cabin?'
    },
    {
      id: 'love_language',
      title: 'Love Language Quiz',
      description: 'Discover how you and your partner prefer to give and receive love',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      example: 'What makes you feel most loved?'
    },
    {
      id: 'couple_trivia',
      title: 'Couple Trivia',
      description: 'Test how well you know each other with fun trivia questions',
      icon: Brain,
      color: 'from-blue-500 to-indigo-500',
      example: 'What\'s your partner\'s favorite childhood memory?'
    },
    {
      id: 'date_night_planner',
      title: 'Date Night Planner',
      description: 'Get personalized date ideas based on your preferences',
      icon: Calendar,
      color: 'from-purple-500 to-violet-500',
      example: 'Plan the perfect evening together'
    },
    {
      id: 'story_builder',
      title: 'Story Builder',
      description: 'Create collaborative stories together, taking turns adding parts',
      icon: BookOpen,
      color: 'from-orange-500 to-yellow-500',
      example: 'Once upon a time, we discovered...'
    },
    {
      id: 'relationship_goals',
      title: 'Relationship Goals',
      description: 'Set and track meaningful goals for your relationship',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      example: 'Plan weekly date nights together'
    },
    {
      id: 'memory_lane',
      title: 'Memory Lane',
      description: 'A quiz about your relationship history and special moments',
      icon: Clock,
      color: 'from-indigo-500 to-purple-500',
      example: 'Where was our first date?'
    },
    {
      id: 'truth_or_dare',
      title: 'Truth or Dare',
      description: 'Fun truth questions and playful dares for couples',
      icon: Shuffle,
      color: 'from-teal-500 to-cyan-500',
      example: 'Truth: What\'s your biggest fear about our relationship?'
    }
  ]

  const startGame = async (gameId: string) => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch game questions
      setActiveGame(gameId)
      setGameData({ questions: [], currentQuestion: 0, score: 0 })
      toast.success('Game started! Have fun!')
    } catch (error) {
      toast.error('Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  const submitGameResult = async (gameType: string, data: any) => {
    try {
      await api.submitGameResult(gameType, data)
      toast.success('Game completed! XP earned!')
      setActiveGame(null)
      setGameData(null)
    } catch (error) {
      toast.error('Failed to save game result')
    }
  }

  if (activeGame === 'truth_or_dare') {
    return (
      <TruthOrDareGame
        onComplete={(data) => submitGameResult('truth_or_dare', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'this_or_that') {
    return (
      <ThisOrThatGame
        onBack={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'memory_lane') {
    return (
      <MemoryLaneGame
        onComplete={(data) => submitGameResult('memory_lane', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'love_language') {
    return (
      <LoveLanguageGame
        onComplete={(data) => submitGameResult('love_language', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'couple_trivia') {
    return (
      <CoupleTrivia
        onComplete={(data) => submitGameResult('couple_trivia', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'date_night_planner') {
    return (
      <DateNightPlanner
        onComplete={(data) => submitGameResult('date_night_planner', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'relationship_goals') {
    return (
      <RelationshipGoals
        onComplete={(data) => submitGameResult('relationship_goals', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'story_builder') {
    return (
      <StoryBuilder
        onComplete={(data) => submitGameResult('story_builder', data)}
        onExit={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'adaptive_session') {
    return (
      <AdaptiveGameSession
        gameType="adaptive"
        onBack={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame === 'generative_session') {
    return (
      <GenerativeGameSession
        onBack={() => setActiveGame(null)}
      />
    )
  }

  if (activeGame) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {games.find(g => g.id === activeGame)?.title}
          </h2>
          <p className="text-gray-600 mb-6">Game in progress...</p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-lg font-medium text-gray-800">
                Sample question would appear here
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => submitGameResult(activeGame, { completed: true })}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                Complete Game
              </button>
              <button
                onClick={() => setActiveGame(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Games for Couples
        </h2>
        <p className="text-gray-600">Fun games to learn more about each other and strengthen your bond</p>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mt-4 border border-yellow-200">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-600" />
            <strong>New!</strong> All games now support optional betting - make it interesting with friendly wagers!
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const IconComponent = game.icon
          return (
            <div
              key={game.id}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-2xl flex items-center justify-center`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{game.title}</h3>
                  <p className="text-gray-600 text-sm">{game.description}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Example:</p>
                <p className="font-medium text-gray-800">"{game.example}"</p>
              </div>

              <button
                onClick={() => startGame(game.id)}
                disabled={loading}
                className={`w-full bg-gradient-to-r ${game.color} text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    <span>Start Game</span>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-3">
          <Dice1 className="w-6 h-6 text-pink-500" />
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Optional Betting Feature
          </h3>
        </div>
        <p className="text-gray-700">
          Make games more exciting by enabling optional betting! Set fun stakes like "loser does dishes" or "winner picks the movie" to add some competitive spirit to your games. You can enable or disable betting for each game.
        </p>
      </div>
    </div>
  )
}