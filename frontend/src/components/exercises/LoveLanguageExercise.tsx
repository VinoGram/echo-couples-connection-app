import { useState } from 'react'
import { Heart, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface LoveLanguageExerciseProps {
  onBack: () => void
}

export function LoveLanguageExercise({ onBack }: LoveLanguageExerciseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const questions = [
    {
      id: 'q1',
      question: 'What makes you feel most loved?',
      options: [
        { id: 'words', text: 'Hearing "I love you" and compliments', language: 'Words of Affirmation' },
        { id: 'time', text: 'Spending uninterrupted time together', language: 'Quality Time' },
        { id: 'gifts', text: 'Receiving thoughtful gifts', language: 'Receiving Gifts' },
        { id: 'service', text: 'Having your partner help with tasks', language: 'Acts of Service' },
        { id: 'touch', text: 'Physical affection and closeness', language: 'Physical Touch' }
      ]
    },
    {
      id: 'q2',
      question: 'When you\'re stressed, what helps most?',
      options: [
        { id: 'words', text: 'Encouraging words and reassurance', language: 'Words of Affirmation' },
        { id: 'time', text: 'Undivided attention and conversation', language: 'Quality Time' },
        { id: 'gifts', text: 'A surprise gift to cheer you up', language: 'Receiving Gifts' },
        { id: 'service', text: 'Help with responsibilities', language: 'Acts of Service' },
        { id: 'touch', text: 'A hug or physical comfort', language: 'Physical Touch' }
      ]
    },
    {
      id: 'q3',
      question: 'How do you prefer to show love?',
      options: [
        { id: 'words', text: 'Saying loving words and giving praise', language: 'Words of Affirmation' },
        { id: 'time', text: 'Planning special activities together', language: 'Quality Time' },
        { id: 'gifts', text: 'Giving meaningful presents', language: 'Receiving Gifts' },
        { id: 'service', text: 'Doing helpful things for them', language: 'Acts of Service' },
        { id: 'touch', text: 'Being physically affectionate', language: 'Physical Touch' }
      ]
    }
  ]

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers({ ...answers, [questionId]: answerId })
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      calculateResults()
    }
  }

  const calculateResults = async () => {
    setLoading(true)
    try {
      // Calculate love language scores
      const scores = { words: 0, time: 0, gifts: 0, service: 0, touch: 0 }
      Object.values(answers).forEach(answer => {
        scores[answer as keyof typeof scores]++
      })

      const topLanguage = Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0]
      
      const languageNames = {
        words: 'Words of Affirmation',
        time: 'Quality Time', 
        gifts: 'Receiving Gifts',
        service: 'Acts of Service',
        touch: 'Physical Touch'
      }

      const result = {
        primaryLanguage: languageNames[topLanguage as keyof typeof languageNames],
        scores,
        recommendations: getRecommendations(topLanguage)
      }

      // Save to backend
      await api.submitExerciseResult('love_language', result)
      
      setResults(result)
      toast.success('Love language assessment complete!')
    } catch (error) {
      toast.error('Failed to save results')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendations = (language: string) => {
    const recommendations = {
      words: [
        'Leave loving notes for your partner',
        'Give specific compliments daily',
        'Send encouraging text messages'
      ],
      time: [
        'Schedule regular date nights',
        'Put away phones during conversations',
        'Plan activities you both enjoy'
      ],
      gifts: [
        'Give small, thoughtful surprises',
        'Remember special occasions',
        'Create handmade gifts'
      ],
      service: [
        'Help with household chores',
        'Take care of tasks they dislike',
        'Anticipate their needs'
      ],
      touch: [
        'Hold hands more often',
        'Give hugs and kisses daily',
        'Sit close together'
      ]
    }
    return recommendations[language as keyof typeof recommendations] || []
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Love Language</h2>
            <div className="text-3xl font-bold text-pink-500 mb-4">{results.primaryLanguage}</div>
          </div>

          <div className="bg-pink-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">How to connect better:</h3>
            <ul className="space-y-2">
              {results.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl"
          >
            Complete Exercise
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-pink-500">
            <Heart className="w-6 h-6" />
            <span className="font-bold">Love Language Assessment</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Question {currentStep + 1} of {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion.question}</h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(currentQuestion.id, option.id)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-pink-50 rounded-xl border border-gray-200 hover:border-pink-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                <div>
                  <span className="text-gray-700">{option.text}</span>
                  <div className="text-xs text-gray-500 mt-1">{option.language}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}