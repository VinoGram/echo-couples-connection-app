import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Trophy, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface AdaptiveGameSessionProps {
  gameType: string
  onBack: () => void
}

interface GameResults {
  session_id: string
  participants: Record<string, any>
  comparisons: Array<{
    question: any
    user1_answer: any
    user2_answer: any
    match: boolean
    similarity_score: number
  }>
  summary: {
    total_questions: number
    matches: number
    compatibility_score: number
    insights: string[]
  }
}

export function AdaptiveGameSession({ gameType, onBack }: AdaptiveGameSessionProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [gamePhase, setGamePhase] = useState<'loading' | 'playing' | 'waiting' | 'results'>('loading')
  const [results, setResults] = useState<GameResults | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [showPartnerAnswers, setShowPartnerAnswers] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = async () => {
    try {
      const coupleId = 'couple_123' // Get from auth context
      const userId = 'user_123' // Get from auth context
      
      const response = await fetch('http://localhost:8000/games/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couple_id: coupleId, game_type: gameType, user_id: userId })
      })
      
      const data = await response.json()
      setSessionId(data.session_id)
      setQuestions(data.questions)
      setGamePhase('playing')
      
      toast.success(`Adaptive questions selected based on your preferences!`)
    } catch (error) {
      toast.error('Failed to start game')
      onBack()
    }
  }

  const submitAnswer = async (answer: any) => {
    if (!sessionId || !questions[currentQuestion]) return

    const questionId = questions[currentQuestion].id
    const userId = 'user_123' // Get from auth context

    try {
      await fetch('http://localhost:8000/games/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          question_id: questionId,
          response: answer
        })
      })

      setResponses({ ...responses, [questionId]: answer })

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        completeGame()
      }
    } catch (error) {
      toast.error('Failed to submit answer')
    }
  }

  const completeGame = async () => {
    setGamePhase('waiting')
    
    try {
      const userId = 'user_123'
      const gameData = {
        couple_id: 'couple_123',
        partner_id: 'partner_123',
        game_type: gameType,
        responses,
        score: Object.keys(responses).length / questions.length,
        engagement_score: 0.8,
        question_ids: questions.map(q => q.id)
      }

      const response = await fetch('http://localhost:8000/games/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          game_data: gameData
        })
      })

      const data = await response.json()
      setResults(data.results)
      setInsights(data.insights)
      setGamePhase('results')
      
      toast.success('Game completed! Check your compatibility results!')
    } catch (error) {
      toast.error('Failed to complete game')
    }
  }

  const startNewGame = () => {
    setSessionId(null)
    setQuestions([])
    setCurrentQuestion(0)
    setResponses({})
    setResults(null)
    setInsights(null)
    setShowPartnerAnswers(false)
    setGamePhase('loading')
    initializeGame()
  }

  if (gamePhase === 'loading') {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Selecting personalized questions...</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'waiting') {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Waiting for Partner</h3>
          <p className="text-gray-600">Your partner is still answering questions...</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'results' && results) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPartnerAnswers(!showPartnerAnswers)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPartnerAnswers ? 'Hide' : 'Show'} Partner Answers
            </button>
            <button
              onClick={startNewGame}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        </div>

        {/* Compatibility Score */}
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Compatibility Score</h2>
          <div className="text-6xl font-bold text-blue-500 mb-4">
            {Math.round(results.summary.compatibility_score * 100)}%
          </div>
          <p className="text-gray-600 mb-6">
            You matched on {results.summary.matches} out of {results.summary.total_questions} questions
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-3">Insights:</h3>
            <ul className="space-y-2">
              {results.summary.insights.map((insight, index) => (
                <li key={index} className="text-gray-700">{insight}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question Comparisons */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Question by Question</h3>
          <div className="space-y-4">
            {results.comparisons.map((comparison, index) => (
              <div key={index} className={`p-4 rounded-2xl border-2 ${
                comparison.match ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{comparison.question.text}</h4>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    comparison.match ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {comparison.match ? 'Match!' : 'Different'}
                  </div>
                </div>
                
                {showPartnerAnswers && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-500 mb-1">Your Answer:</div>
                      <div className="font-medium text-gray-800">{comparison.user1_answer}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-500 mb-1">Partner's Answer:</div>
                      <div className="font-medium text-gray-800">{comparison.user2_answer}</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Similarity: {Math.round(comparison.similarity_score * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Insights */}
        {insights && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Learning Progress</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Performance Stats</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>Games Played: {insights.games_played}</li>
                  <li>Average Score: {insights.avg_score}</li>
                  <li>Engagement Level: {insights.engagement_level}</li>
                  <li>Optimal Difficulty: {insights.optimal_difficulty}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Suggestions</h4>
                <ul className="space-y-2">
                  {insights.improvement_suggestions?.map((suggestion: string, index: number) => (
                    <li key={index} className="text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Playing phase
  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{question.text}</h3>
          {question.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {question.category}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {question.type === 'multiple_choice' && question.options?.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => submitAnswer(option)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
            >
              {option}
            </button>
          ))}

          {question.type === 'this_or_that' && question.options?.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => submitAnswer(option)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
            >
              {option}
            </button>
          ))}

          {question.type === 'open_ended' && (
            <div className="space-y-4">
              <textarea
                placeholder="Type your answer..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                rows={4}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const target = e.target as HTMLTextAreaElement
                    if (target.value.trim()) {
                      submitAnswer(target.value.trim())
                    }
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const textarea = e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea?.value.trim()) {
                    submitAnswer(textarea.value.trim())
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}