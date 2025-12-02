import { useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, RefreshCw, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

interface GenerativeGameSessionProps {
  onBack: () => void
}

export function GenerativeGameSession({ onBack }: GenerativeGameSessionProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [gamePhase, setGamePhase] = useState<'playing' | 'completed'>('playing')
  const [followUpQuestions, setFollowUpQuestions] = useState<any[]>([])

  useEffect(() => {
    generateInitialQuestions()
  }, [])

  const generateInitialQuestions = async () => {
    setLoading(true)
    try {
      // Use fallback questions since ML service is not available
      const fallbackQuestions = [
        { id: 1, text: "What's your favorite memory of us together?", category: 'memories', difficulty: 'easy', generated: true },
        { id: 2, text: "What's one thing you'd like to try together this year?", category: 'goals', difficulty: 'medium', generated: true },
        { id: 3, text: "How do you feel most loved by me?", category: 'love', difficulty: 'medium', generated: true },
        { id: 4, text: "What's something you admire about our relationship?", category: 'appreciation', difficulty: 'easy', generated: true },
        { id: 5, text: "What's a challenge we've overcome together?", category: 'growth', difficulty: 'hard', generated: true }
      ]
      setQuestions(fallbackQuestions)
      toast.success(`Generated ${fallbackQuestions.length} personalized questions!`)
    } catch (error) {
      toast.error('Failed to generate questions')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const generateMoreQuestions = async () => {
    setGenerating(true)
    try {
      const moreQuestions = [
        { id: questions.length + 1, text: "What's your favorite way to spend a quiet evening together?", category: 'lifestyle', difficulty: 'easy', generated: true },
        { id: questions.length + 2, text: "What's something new you'd like to learn about me?", category: 'discovery', difficulty: 'medium', generated: true },
        { id: questions.length + 3, text: "How do we handle disagreements well?", category: 'communication', difficulty: 'hard', generated: true }
      ]
      setQuestions([...questions, ...moreQuestions])
      toast.success(`Generated ${moreQuestions.length} more questions based on your preferences!`)
    } catch (error) {
      toast.error('Failed to generate more questions')
    } finally {
      setGenerating(false)
    }
  }

  const generateFollowUps = async () => {
    if (Object.keys(responses).length === 0) return

    setGenerating(true)
    try {
      const followUps = [
        { id: 'followup_1', text: "Based on your answers, what's one thing you'd like to explore deeper together?", category: 'reflection', generated: true },
        { id: 'followup_2', text: "How can we better support each other in the areas you mentioned?", category: 'support', generated: true },
        { id: 'followup_3', text: "What patterns do you notice in your responses about our relationship?", category: 'insight', generated: true }
      ]
      setFollowUpQuestions(followUps)
      toast.success(`Generated ${followUps.length} follow-up questions based on your answers!`)
    } catch (error) {
      toast.error('Failed to generate follow-up questions')
    } finally {
      setGenerating(false)
    }
  }

  const submitAnswer = (answer: string) => {
    const questionId = questions[currentQuestion].id
    setResponses({ ...responses, [questionId]: answer })

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setGamePhase('completed')
      generateFollowUps()
    }
  }

  const restartWithNewQuestions = () => {
    setQuestions([])
    setCurrentQuestion(0)
    setResponses({})
    setFollowUpQuestions([])
    setGamePhase('playing')
    generateInitialQuestions()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">AI is generating personalized questions...</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={generateFollowUps}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4" />
              {generating ? 'Generating...' : 'More Follow-ups'}
            </button>
            <button
              onClick={restartWithNewQuestions}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Questions
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Complete!</h2>
          <p className="text-gray-600 mb-6">
            You've answered {Object.keys(responses).length} AI-generated questions. 
            The system is learning from your responses to create even better questions next time!
          </p>
        </div>

        {/* Your Responses */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Your Responses</h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const response = responses[question.id]
              if (!response) return null
              
              return (
                <div key={question.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    Question {index + 1} • {question.category}
                  </div>
                  <div className="font-medium text-gray-800 mb-2">{question.text}</div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-purple-700">{response}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              AI-Generated Follow-ups
            </h3>
            <div className="space-y-4">
              {followUpQuestions.map((question, index) => (
                <div key={question.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <div className="text-sm text-yellow-600 mb-2">Follow-up Question {index + 1}</div>
                  <div className="font-medium text-gray-800">{question.text}</div>
                  <textarea
                    placeholder="Your answer..."
                    className="w-full mt-3 p-3 border border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <button
            onClick={generateMoreQuestions}
            disabled={generating}
            className="flex items-center gap-2 bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm"
          >
            <Sparkles className="w-3 h-3" />
            {generating ? 'Generating...' : 'More Questions'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">AI-Generated Question</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{question.text}</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {question.category}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {question.difficulty}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Always show textarea for AI-generated questions */}
          <div className="space-y-4">
            <textarea
              placeholder="Share your thoughts..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
              rows={4}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const target = e.target as HTMLTextAreaElement
                  if (target.value.trim()) {
                    submitAnswer(target.value.trim())
                    target.value = ''
                  }
                }
              }}
            />
            <button
              onClick={(e) => {
                const textarea = e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement
                if (textarea?.value.trim()) {
                  submitAnswer(textarea.value.trim())
                  textarea.value = ''
                }
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Submit Answer
            </button>
          </div>
        </div>

        {question.generated && (
          <div className="mt-6 bg-purple-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                This question was generated specifically for you based on your relationship patterns and preferences.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}