import { useState, useEffect } from 'react'
import { Brain, ArrowLeft, Trophy, X, User, Heart } from 'lucide-react'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface CoupleTriviaProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function CoupleTrivia({ onComplete, onExit }: CoupleTriviaProps) {
  const [phase, setPhase] = useState<'setup' | 'guessing' | 'results'>('setup')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [myAnswers, setMyAnswers] = useState<string[]>([])
  const [myGuesses, setMyGuesses] = useState<string[]>([])
  const [partnerAnswers, setPartnerAnswers] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const questions = [
    {
      setupQuestion: "What's your favorite childhood memory?",
      guessQuestion: "What's your partner's favorite childhood memory?",
      options: ["Family vacation", "Birthday party", "Christmas morning", "Summer camp"]
    },
    {
      setupQuestion: "What's your biggest pet peeve?",
      guessQuestion: "What's your partner's biggest pet peeve?",
      options: ["Loud chewing", "Being late", "Messy spaces", "Interrupting"]
    },
    {
      setupQuestion: "What's your dream job?",
      guessQuestion: "What's your partner's dream job?",
      options: ["Travel blogger", "Chef", "Teacher", "Artist"]
    },
    {
      setupQuestion: "What's your favorite way to relax?",
      guessQuestion: "What's your partner's favorite way to relax?",
      options: ["Reading", "Netflix", "Bath", "Music"]
    }
  ]

  useEffect(() => {
    checkPartnerAnswers()
  }, [])

  const checkPartnerAnswers = async () => {
    try {
      const results = await api.getCoupleActivityResults('game', 'couple_trivia')
      if (results.results && results.results.partner.response?.answers) {
        setPartnerAnswers(results.results.partner.response.answers)
        if (results.results.user.response?.answers) {
          setMyAnswers(results.results.user.response.answers)
          setPhase('guessing')
        }
      }
    } catch (error) {
      console.log('No partner answers yet')
    }
  }

  const handleSetupAnswer = async (answerIndex: number) => {
    const newAnswers = [...myAnswers, answerIndex.toString()]
    setMyAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Save my answers and check if partner is ready
      setLoading(true)
      try {
        await api.submitCoupleActivity('game', 'couple_trivia', { answers: newAnswers, phase: 'setup' })
        
        // Check if partner has answered
        const results = await api.getCoupleActivityResults('game', 'couple_trivia')
        if (results.results && results.results.partner.response?.answers) {
          setPartnerAnswers(results.results.partner.response.answers)
          setPhase('guessing')
          setCurrentQuestion(0)
        } else {
          toast.info('Waiting for your partner to answer their questions...')
        }
      } catch (error) {
        toast.error('Failed to save answers')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGuess = (answerIndex: number) => {
    setSelectedAnswer(answerIndex.toString())
    setShowResult(true)
    
    const newGuesses = [...myGuesses, answerIndex.toString()]
    setMyGuesses(newGuesses)
    
    if (answerIndex.toString() === partnerAnswers[currentQuestion]) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        setPhase('results')
        onComplete({
          gameType: 'couple_trivia',
          myAnswers,
          myGuesses: newGuesses,
          score: score + (answerIndex.toString() === partnerAnswers[currentQuestion] ? 1 : 0),
          totalQuestions: questions.length,
          completed: true
        })
      }
    }, 2000)
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
          <div className="flex items-center gap-2 text-blue-500">
            <Brain className="w-6 h-6" />
            <span className="font-bold">Couple Trivia</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-500">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">
              {phase === 'guessing' ? `${score}/${questions.length}` : `${myAnswers.length}/${questions.length}`}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {phase === 'setup' && (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <User className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-semibold text-blue-600">Answer about yourself</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {questions[currentQuestion].setupQuestion}
              </h3>
            </div>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSetupAnswer(index)}
                  disabled={loading}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all disabled:opacity-50"
                >
                  <span className="text-gray-700">{option}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'guessing' && partnerAnswers.length > 0 && (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-pink-500" />
                <span className="text-lg font-semibold text-pink-600">Guess your partner's answer</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {questions[currentQuestion].guessQuestion}
              </h3>
            </div>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => {
                let buttonClass = "w-full p-4 text-left bg-gray-50 hover:bg-pink-50 rounded-xl border border-gray-200 hover:border-pink-300 transition-all"
                
                if (showResult) {
                  if (index.toString() === partnerAnswers[currentQuestion]) {
                    buttonClass = "w-full p-4 text-left bg-green-100 rounded-xl border border-green-300"
                  } else if (selectedAnswer === index.toString()) {
                    buttonClass = "w-full p-4 text-left bg-red-100 rounded-xl border border-red-300"
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && handleGuess(index)}
                    disabled={showResult}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">{option}</span>
                      {showResult && index.toString() === partnerAnswers[currentQuestion] && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                      {showResult && selectedAnswer === index.toString() && index.toString() !== partnerAnswers[currentQuestion] && (
                        <X className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {phase === 'guessing' && partnerAnswers.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Waiting for Partner</h3>
              <p className="text-gray-700">Your partner needs to answer the setup questions first.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}