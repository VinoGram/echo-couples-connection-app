import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Heart, DollarSign, Users, BarChart3, CheckCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string
  questions: Array<{
    question: string
    options: string[]
    type: 'multiple_choice' | 'scale'
  }>
}

export function QuizHub() {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const quizzes = [
    {
      id: 'love_language',
      title: 'Love Language Quiz',
      description: 'Discover and compare your primary love languages',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      questions: [
        {
          question: 'What makes you feel most loved?',
          options: ['Physical touch', 'Words of affirmation', 'Quality time', 'Acts of service', 'Receiving gifts'],
          type: 'multiple_choice' as const
        },
        {
          question: 'How do you prefer to show love?',
          options: ['Physical affection', 'Compliments and encouragement', 'Spending time together', 'Helping with tasks', 'Giving thoughtful gifts'],
          type: 'multiple_choice' as const
        },
        {
          question: 'What hurts you most in a relationship?',
          options: ['Lack of physical affection', 'Criticism or harsh words', 'Not spending enough time together', 'Partner not helping out', 'Forgetting special occasions'],
          type: 'multiple_choice' as const
        }
      ]
    },
    {
      id: 'financial_personality',
      title: 'Financial Personality Quiz',
      description: 'Are you a Saver or a Spender? Understand your money dynamics',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      questions: [
        {
          question: 'When you get unexpected money, you:',
          options: ['Save it immediately', 'Spend it on something fun', 'Invest it', 'Use it for necessities'],
          type: 'multiple_choice' as const
        },
        {
          question: 'Your approach to budgeting is:',
          options: ['Detailed tracking of every expense', 'General awareness of spending', 'Minimal planning', 'What budget?'],
          type: 'multiple_choice' as const
        },
        {
          question: 'How do you feel about debt?',
          options: ['Avoid it at all costs', 'Acceptable for major purchases', 'Not a big concern', 'Part of life'],
          type: 'multiple_choice' as const
        }
      ]
    },
    {
      id: 'communication_style',
      title: 'Communication Style Quiz',
      description: 'Understand how you and your partner communicate and resolve conflicts',
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      questions: [
        {
          question: 'During disagreements, you tend to:',
          options: ['Address issues immediately', 'Need time to think first', 'Avoid conflict when possible', 'Get emotional quickly'],
          type: 'multiple_choice' as const
        },
        {
          question: 'You prefer to receive feedback:',
          options: ['Directly and honestly', 'Gently and diplomatically', 'In private settings', 'With specific examples'],
          type: 'multiple_choice' as const
        },
        {
          question: 'When making decisions together, you:',
          options: ['Like to lead the discussion', 'Prefer to collaborate equally', 'Happy to follow your partner\'s lead', 'Need lots of information first'],
          type: 'multiple_choice' as const
        }
      ]
    },
    {
      id: 'adaptive_communication',
      title: 'AI Communication Quiz',
      description: 'Dynamically generated questions about your communication patterns',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      isAdaptive: true,
      category: 'communication'
    },
    {
      id: 'adaptive_intimacy',
      title: 'AI Intimacy Assessment',
      description: 'Personalized questions about emotional and physical connection',
      icon: Sparkles,
      color: 'from-red-500 to-rose-500',
      isAdaptive: true,
      category: 'intimacy'
    },
    {
      id: 'adaptive_fun',
      title: 'AI Compatibility Quiz',
      description: 'Fun questions generated based on your shared interests',
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-500',
      isAdaptive: true,
      category: 'fun'
    }
  ]

  const startQuiz = (quiz: any) => {
    if (quiz.isAdaptive) {
      generateAdaptiveQuiz(quiz.category)
    } else {
      setActiveQuiz(quiz)
      setCurrentQuestion(0)
      setAnswers([])
      setResults(null)
    }
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestion < activeQuiz!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz completed, calculate results
      calculateResults(newAnswers)
    }
  }

  const calculateResults = async (finalAnswers: string[]) => {
    setLoading(true)
    try {
      // Simple result calculation - in a real app, this would be more sophisticated
      const result = {
        quizType: activeQuiz!.id,
        answers: finalAnswers,
        primaryResult: finalAnswers[0], // Simplified
        summary: getResultSummary(activeQuiz!.id, finalAnswers)
      }
      
      await api.submitQuiz(activeQuiz!.id, result)
      setResults(result)
      toast.success('Quiz completed!')
    } catch (error) {
      toast.error('Failed to save quiz results')
    } finally {
      setLoading(false)
    }
  }

  const getResultSummary = (quizId: string, answers: string[]) => {
    switch (quizId) {
      case 'love_language':
        return `Your primary love language appears to be: ${answers[0]}`
      case 'financial_personality':
        return answers[0].includes('Save') ? 'You are a Saver' : 'You are a Spender'
      case 'communication_style':
        return `Your communication style: ${answers[0]}`
      default:
        return 'Results calculated'
    }
  }

  if (results) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-2">{activeQuiz?.title} Results</h3>
            <p className="text-gray-700">{results.summary}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setActiveQuiz(null)
                setResults(null)
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Take Another Quiz
            </button>
            <p className="text-sm text-gray-500">
              Compare your results with your partner to learn more about each other!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (activeQuiz) {
    const question = activeQuiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{activeQuiz.title}</h2>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} of {activeQuiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-6">{question.question}</h3>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={loading}
                  className="w-full text-left p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 hover:border-pink-300 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800">{option}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Calculating results...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quizzes & Assessments
        </h2>
        <p className="text-gray-600">Discover more about yourselves and your relationship dynamics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const IconComponent = quiz.icon
          return (
            <div
              key={quiz.id}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="text-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${quiz.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                <p className="text-gray-600 text-sm">{quiz.description}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                {quiz.isAdaptive ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <p className="text-sm text-purple-600 font-medium">AI-Generated</p>
                    </div>
                    <p className="text-xs text-gray-500">Questions created based on your relationship patterns</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-2">{quiz.questions?.length || 5} questions</p>
                    <p className="text-xs text-gray-500">Takes about 2-3 minutes</p>
                  </>
                )}
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                disabled={isGenerating}
                className={`w-full bg-gradient-to-r ${quiz.color} text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50`}
              >
                <div className="flex items-center justify-center gap-2">
                  {quiz.isAdaptive ? (
                    isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Quiz</span>
                      </>
                    )
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      <span>Start Quiz</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="w-6 h-6 text-pink-500" />
          <h3 className="font-bold text-gray-800">Understanding Each Other</h3>
        </div>
        <p className="text-gray-700">
          These quizzes help you understand your individual preferences and styles. Share your results with your partner to deepen your connection!
        </p>
      </div>
    </div>
  )
}