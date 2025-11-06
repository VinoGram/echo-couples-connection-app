import { useState } from 'react'
import { toast } from 'sonner'
import { Clock, Trophy, Dice1, Brain, Target, CheckCircle, XCircle } from 'lucide-react'
import { BettingSystem } from './BettingSystem'

interface MemoryLaneGameProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function MemoryLaneGame({ onComplete, onExit }: MemoryLaneGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [betData, setBetData] = useState<any>(null)
  const [showBetting, setShowBetting] = useState(false)
  const [bettingEnabled, setBettingEnabled] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const memoryQuestions = [
    { question: "Where did we have our first date?", options: ["Restaurant", "Park", "Movies", "Coffee shop"], correct: 0 },
    { question: "What was the first movie we watched together?", options: ["Romance", "Action", "Comedy", "Horror"], correct: 2 },
    { question: "What's my favorite color?", options: ["Blue", "Red", "Green", "Purple"], correct: 0 },
    { question: "Where did we first say 'I love you'?", options: ["At home", "In the car", "At a restaurant", "On a walk"], correct: 1 },
    { question: "What's my biggest pet peeve?", options: ["Loud chewing", "Being late", "Messy spaces", "Interrupting"], correct: 2 },
    { question: "What's my dream vacation destination?", options: ["Beach", "Mountains", "City", "Countryside"], correct: 0 },
    { question: "What's my favorite way to spend a weekend?", options: ["Going out", "Staying in", "Outdoor activities", "Visiting family"], correct: 1 },
    { question: "What's my comfort food?", options: ["Pizza", "Ice cream", "Chocolate", "Pasta"], correct: 1 }
  ]

  const startGame = () => {
    setGameStarted(true)
    setCurrentQuestion(memoryQuestions[0])
    setQuestionIndex(0)
    setScore(0)
  }

  const handleAnswer = (selectedOption: number) => {
    const isCorrect = selectedOption === currentQuestion.correct
    if (isCorrect) {
      setScore(score + 1)
      toast.success('Correct!')
    } else {
      toast.error('Wrong answer!')
    }
    
    if (questionIndex < memoryQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1)
      setCurrentQuestion(memoryQuestions[questionIndex + 1])
    } else {
      completeGame()
    }
  }

  const completeGame = () => {
    const finalScore = score + (currentQuestion && currentQuestion.correct ? 1 : 0)
    onComplete({ type: 'memory_lane', completed: true, score: finalScore, total: memoryQuestions.length, bet: betData })
  }

  const handleBetPlaced = (bet: any) => {
    setBetData(bet)
    setShowBetting(false)
  }

  const toggleBetting = () => {
    setBettingEnabled(!bettingEnabled)
    if (!bettingEnabled) {
      setShowBetting(true)
    } else {
      setShowBetting(false)
      setBetData(null)
    }
  }

  const handleWinnerSelected = (winner: 'player1' | 'player2') => {
    toast.success(`${winner === 'player1' ? betData.player1 : betData.player2} wins the bet!`)
  }

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        {bettingEnabled && showBetting && (
          <BettingSystem
            onBetPlaced={handleBetPlaced}
            onWinnerSelected={handleWinnerSelected}
            gameActive={false}
            isEnabled={bettingEnabled}
          />
        )}
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleBetting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                bettingEnabled 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Dice1 className="w-4 h-4" />
              {bettingEnabled ? 'Disable Betting' : 'Enable Betting'}
            </button>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            Memory Lane
          </h2>
          <p className="text-gray-600 mb-8">Test how well you know each other with questions about your relationship!</p>
          
          <div className="bg-purple-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-purple-800 mb-2 flex items-center justify-center gap-2">
              <Brain className="w-5 h-5" />
              How it works:
            </h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Answer questions about your partner</li>
              <li>• Get points for correct answers</li>
              <li>• See how well you really know each other!</li>
            </ul>
          </div>
          
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            Start Memory Lane
          </button>
        </div>
      </div>
    )
  }

  if (currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        {betData && questionIndex === memoryQuestions.length - 1 && (
          <BettingSystem
            onBetPlaced={handleBetPlaced}
            onWinnerSelected={handleWinnerSelected}
            gameActive={true}
            isEnabled={bettingEnabled}
          />
        )}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">Question {questionIndex + 1}/{memoryQuestions.length}</div>
              <div className="text-sm font-semibold text-purple-600">Score: {score}/{questionIndex}</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / memoryQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-purple-100 hover:to-violet-100 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onExit}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}