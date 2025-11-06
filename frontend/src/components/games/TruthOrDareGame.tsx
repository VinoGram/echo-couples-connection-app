import { useState } from 'react'
import { toast } from 'sonner'
import { Heart, ArrowRight, RotateCcw, Dice1, HelpCircle, Target, MessageCircle } from 'lucide-react'
import { BettingSystem } from './BettingSystem'

interface TruthOrDareGameProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function TruthOrDareGame({ onComplete, onExit }: TruthOrDareGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [gameType, setGameType] = useState<'truth' | 'dare' | null>(null)
  const [betData, setBetData] = useState<any>(null)
  const [showBetting, setShowBetting] = useState(false)
  const [bettingEnabled, setBettingEnabled] = useState(false)

  const truthQuestions = [
    "What's your biggest fear about our relationship?",
    "What's the most romantic thing I've ever done for you?",
    "What's one thing you've never told me?",
    "What's your favorite memory of us together?",
    "What do you find most attractive about me?",
    "What's something you want to try together?",
    "What's your love language and how can I show it better?",
    "What's one thing you'd change about our relationship?",
    "What's your biggest dream for our future?",
    "What made you fall in love with me?"
  ]

  const dareQuestions = [
    "Give your partner a 30-second massage",
    "Tell your partner 3 things you love about them",
    "Do your best impression of your partner",
    "Share a childhood photo with your partner",
    "Write a short love note to your partner",
    "Dance together for 1 minute without music",
    "Give your partner 5 compliments",
    "Share your most embarrassing moment",
    "Sing your partner's favorite song",
    "Plan a surprise date idea right now"
  ]

  const selectTruthOrDare = (type: 'truth' | 'dare') => {
    setGameType(type)
    const questions = type === 'truth' ? truthQuestions : dareQuestions
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    setCurrentQuestion({ type, text: randomQuestion })
  }

  const getNewQuestion = () => {
    if (gameType) {
      selectTruthOrDare(gameType)
    }
  }

  const completeGame = () => {
    onComplete({ type: 'truth_or_dare', completed: true, bet: betData })
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

  if (currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        {betData && (
          <BettingSystem
            onBetPlaced={handleBetPlaced}
            onWinnerSelected={handleWinnerSelected}
            gameActive={true}
            isEnabled={bettingEnabled}
          />
        )}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              currentQuestion.type === 'truth' ? 'bg-blue-500' : 'bg-red-500'
            }`}>
              {currentQuestion.type === 'truth' ? 
                <MessageCircle className="w-8 h-8 text-white" /> : 
                <Target className="w-8 h-8 text-white" />
              }
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              {currentQuestion.type === 'truth' ? (
                <><HelpCircle className="w-6 h-6 text-blue-500" /> Truth</>
              ) : (
                <><Target className="w-6 h-6 text-red-500" /> Dare</>
              )}
            </h2>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <p className="text-lg font-medium text-gray-800 text-center">
              {currentQuestion.text}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={getNewQuestion}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              New {currentQuestion.type}
            </button>
            <button
              onClick={completeGame}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Complete
            </button>
            <button
              onClick={onExit}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    )
  }

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
        <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
          <HelpCircle className="w-8 h-8 text-purple-500" />
          Truth or Dare?
        </h2>
        <p className="text-gray-600 mb-8">Choose your challenge!</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => selectTruthOrDare('truth')}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-8 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="flex justify-center mb-4">
              <HelpCircle className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Truth</h3>
            <p className="text-blue-100">Answer honestly</p>
          </button>
          
          <button
            onClick={() => selectTruthOrDare('dare')}
            className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-8 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="flex justify-center mb-4">
              <Target className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Dare</h3>
            <p className="text-red-100">Take the challenge</p>
          </button>
        </div>
      </div>
    </div>
  )
}