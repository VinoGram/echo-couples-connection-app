import { useState } from 'react'
import { Brain, ArrowLeft, Trophy, X } from 'lucide-react'

interface CoupleTriviaProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function CoupleTrivia({ onComplete, onExit }: CoupleTriviaProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const questions = [
    {
      question: "What's your partner's favorite childhood memory?",
      options: ["Family vacation", "Birthday party", "Christmas morning", "Summer camp"],
      correct: 0
    },
    {
      question: "What's your partner's biggest pet peeve?",
      options: ["Loud chewing", "Being late", "Messy spaces", "Interrupting"],
      correct: 1
    },
    {
      question: "What's your partner's dream job?",
      options: ["Travel blogger", "Chef", "Teacher", "Artist"],
      correct: 2
    },
    {
      question: "What's your partner's favorite way to relax?",
      options: ["Reading", "Netflix", "Bath", "Music"],
      correct: 0
    }
  ]

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex.toString())
    setShowResult(true)
    
    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        onComplete({
          gameType: 'couple_trivia',
          score: score + (answerIndex === questions[currentQuestion].correct ? 1 : 0),
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
            <span className="font-bold">{score}/{questions.length}</span>
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

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {questions[currentQuestion].question}
          </h3>
        </div>

        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
            
            if (showResult) {
              if (index === questions[currentQuestion].correct) {
                buttonClass = "w-full p-4 text-left bg-green-100 rounded-xl border border-green-300"
              } else if (selectedAnswer === index.toString()) {
                buttonClass = "w-full p-4 text-left bg-red-100 rounded-xl border border-red-300"
              }
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswer(index)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{option}</span>
                  {showResult && index === questions[currentQuestion].correct && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                  {showResult && selectedAnswer === index.toString() && index !== questions[currentQuestion].correct && (
                    <X className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}