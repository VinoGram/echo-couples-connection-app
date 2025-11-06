import { useState } from 'react'
import { Trophy, Coins, Heart, Target, Star, Award } from 'lucide-react'

interface BettingSystemProps {
  onBetPlaced: (bet: { player1: string, player2: string, stakes: string }) => void
  onWinnerSelected: (winner: 'player1' | 'player2') => void
  gameActive: boolean
  isEnabled?: boolean
}

export function BettingSystem({ onBetPlaced, onWinnerSelected, gameActive, isEnabled = true }: BettingSystemProps) {
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [stakes, setStakes] = useState('')
  const [betPlaced, setBetPlaced] = useState(false)
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null)

  const placeBet = () => {
    if (player1Name && player2Name && stakes) {
      onBetPlaced({ player1: player1Name, player2: player2Name, stakes })
      setBetPlaced(true)
    }
  }

  const selectWinner = (selectedWinner: 'player1' | 'player2') => {
    setWinner(selectedWinner)
    onWinnerSelected(selectedWinner)
  }

  if (!isEnabled) {
    return null
  }

  if (winner) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 animate-bounce relative overflow-hidden">
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
          
          {/* Winner Animation */}
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <Star className="w-16 h-16 text-yellow-500 animate-bounce" />
            </div>
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping" />
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2 animate-pulse flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              {winner === 'player1' ? player1Name : player2Name} Wins!
              <Trophy className="w-8 h-8 text-yellow-500" />
            </h2>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mb-4 border-2 border-yellow-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-gray-800" />
                <p className="text-lg font-semibold text-gray-800">Stakes Won:</p>
              </div>
              <p className="text-gray-700">{stakes}</p>
            </div>
            
            {/* Animated Hearts */}
            <div className="flex gap-2 justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Heart 
                  key={i} 
                  className="w-6 h-6 text-red-500 animate-bounce" 
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }} 
                />
              ))}
            </div>
            
            {/* Celebration Message */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-gray-600" />
                <p className="text-sm text-gray-600 animate-pulse">Time to claim your prize!</p>
                <Star className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            
            <button
              onClick={() => setWinner(null)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              Awesome!
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!betPlaced) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-200 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-6 h-6 text-purple-500 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Place Your Bet
          </h3>
          <div className="ml-auto">
            <Coins className="w-6 h-6 text-purple-500 animate-pulse" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Player 1 name"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Player 2 name"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <input
          type="text"
          placeholder="What's at stake? (e.g., 'Loser does dishes', 'Winner picks movie')"
          value={stakes}
          onChange={(e) => setStakes(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
        />
        <button
          onClick={placeBet}
          disabled={!player1Name || !player2Name || !stakes}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Target className="w-5 h-5" />
          Place Bet & Start Game!
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border border-green-200 animate-pulse">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Bet
          </h3>
          <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <div className="bg-white rounded-xl p-3 mb-3 shadow-sm">
          <p className="text-gray-800 font-semibold flex items-center justify-center gap-2">
            {player1Name}
            <Award className="w-4 h-4 text-gray-600" />
            {player2Name}
          </p>
          <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-2">
            <Coins className="w-4 h-4" />
            Stakes: {stakes}
          </p>
        </div>
      </div>
      {gameActive && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" />
            Who won this round?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => selectWinner('player1')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              {player1Name}
            </button>
            <button
              onClick={() => selectWinner('player2')}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              {player2Name}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}