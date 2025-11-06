import { useState } from 'react'
import { toast } from 'sonner'
import { Shuffle, Trophy, Dice1, HelpCircle, Target } from 'lucide-react'
import { BettingSystem } from './BettingSystem'

interface WouldYouRatherGameProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function WouldYouRatherGame({ onComplete, onExit }: WouldYouRatherGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [betData, setBetData] = useState<any>(null)
  const [showBetting, setShowBetting] = useState(false)
  const [bettingEnabled, setBettingEnabled] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const wouldYouRatherQuestions = [
    { option1: "Have the ability to fly", option2: "Be invisible" },
    { option1: "Always be 10 minutes late", option2: "Always be 20 minutes early" },
    { option1: "Live without music", option2: "Live without TV" },
    { option1: "Have a rewind button for life", option2: "Have a pause button for life" },
    { option1: "Be able to speak all languages", option2: "Be able to talk to animals" },
    { option1: "Have unlimited money", option2: "Have unlimited time" },
    { option1: "Always know when someone is lying", option2: "Always get away with lying" },
    { option1: "Be famous but poor", option2: "Be rich but unknown" }
  ]

  const startGame = () => {
    setGameStarted(true)
    setCurrentQuestion(wouldYouRatherQuestions[0])
    setQuestionIndex(0)
    setAnswers([])
  }

  const handleAnswer = (choice: string) => {
    const newAnswers = [...answers, { question: currentQuestion, choice }]
    setAnswers(newAnswers)
    
    if (questionIndex < wouldYouRatherQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1)
      setCurrentQuestion(wouldYouRatherQuestions[questionIndex + 1])
    } else {
      completeGame(newAnswers)
    }
  }

  const completeGame = (finalAnswers = answers) => {
    onComplete({ 
      type: 'would_you_rather', 
      completed: true, 
      answers: finalAnswers,
      bet: betData 
    })
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shuffle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-green-500" />
            Would You Rather?
          </h2>
          <p className="text-gray-600 mb-8">Choose between challenging scenarios and see what your partner picks!</p>
          
          <div className="bg-green-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5" />
              How it works:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Choose between two difficult options</li>
              <li>• See your partner's choices</li>
              <li>• Discover surprising preferences!</li>
            </ul>
          </div>
          
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            Start Game
          </button>
        </div>
      </div>
    )
  }

  if (currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        {betData && questionIndex === wouldYouRatherQuestions.length - 1 && (
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
              <div className="text-sm text-gray-500">Question {questionIndex + 1}/{wouldYouRatherQuestions.length}</div>
              <div className="text-sm font-semibold text-green-600">Progress: {Math.round(((questionIndex + 1) / wouldYouRatherQuestions.length) * 100)}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / wouldYouRatherQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-green-500" />
              Would You Rather...
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(currentQuestion.option1)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="text-lg">{currentQuestion.option1}</div>
            </button>
            <button
              onClick={() => handleAnswer(currentQuestion.option2)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="text-lg">{currentQuestion.option2}</div>
            </button>
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