import { useState } from 'react'
import { Heart, ArrowLeft, CheckCircle } from 'lucide-react'

interface LoveLanguageGameProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function LoveLanguageGame({ onComplete, onExit }: LoveLanguageGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  const questions = [
    {
      question: "What makes you feel most loved?",
      options: [
        "Hearing 'I love you' and compliments",
        "Receiving thoughtful gifts",
        "Spending quality time together",
        "Physical touch and affection",
        "Acts of service and help"
      ]
    },
    {
      question: "When stressed, what would help you most?",
      options: [
        "Encouraging words and reassurance",
        "A surprise gift to cheer you up",
        "Undivided attention and conversation",
        "A hug or physical comfort",
        "Help with tasks or responsibilities"
      ]
    },
    {
      question: "How do you prefer to show love?",
      options: [
        "Saying loving words and giving praise",
        "Giving meaningful presents",
        "Planning special activities together",
        "Being physically affectionate",
        "Doing helpful things for them"
      ]
    }
  ]

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      onComplete({
        gameType: 'love_language',
        answers: newAnswers,
        completed: true
      })
    }
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
          <div className="flex items-center gap-2 text-pink-500">
            <Heart className="w-6 h-6" />
            <span className="font-bold">Love Language Quiz</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentQuestion ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {questions[currentQuestion].question}
          </h3>
        </div>

        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full p-4 text-left bg-gray-50 hover:bg-pink-50 rounded-xl border border-gray-200 hover:border-pink-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100" />
                </div>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}