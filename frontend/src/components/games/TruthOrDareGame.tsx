import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Heart, ArrowRight, RotateCcw, Dice1, HelpCircle, Target, MessageCircle, Users, Eye, Flame, Clock } from 'lucide-react'
import { BettingSystem } from './BettingSystem'
import { api } from '../../lib/api'

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
  const [truthAnswer, setTruthAnswer] = useState('')
  const [partnerResponse, setPartnerResponse] = useState<any>(null)
  const [showPartnerResponse, setShowPartnerResponse] = useState(false)
  const [partnerName, setPartnerName] = useState('Partner')
  const [refreshCount, setRefreshCount] = useState(0)
  const [gameSession, setGameSession] = useState<any>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [mlQuestions, setMlQuestions] = useState<any>(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [matureUnlocked, setMatureUnlocked] = useState(false)

  const fallbackTruthQuestions = [
    "What's your biggest fear about our relationship?",
    "What's the most romantic thing I've ever done for you?",
    "What's one thing you've never told me?",
    "What's your favorite memory of us together?",
    "What do you find most attractive about me?"
  ]

  const fallbackDareQuestions = [
    "Give your partner a 30-second massage",
    "Tell your partner 3 things you love about them",
    "Do your best impression of your partner",
    "Share a childhood photo with your partner",
    "Write a short love note to your partner"
  ]

  const selectTruthOrDare = async (type: 'truth' | 'dare') => {
    if (!mlQuestions) {
      await loadMlQuestions()
    }
    
    setGameType(type)
    const questions = type === 'truth' 
      ? (mlQuestions?.truth_questions || fallbackTruthQuestions)
      : (mlQuestions?.dare_questions || fallbackDareQuestions)
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    const newQuestion = { type, text: randomQuestion }
    setCurrentQuestion(newQuestion)
    setRefreshCount(0)
    
    // Save the new question selection
    try {
      await api.submitCoupleActivity('game', 'truth_or_dare', {
        question: randomQuestion,
        questionType: type,
        refreshCount: 0,
        maturityLevel: mlQuestions?.maturity_level || 'standard',
        sessionStartTime: sessionStartTime?.toISOString(),
        matureUnlocked,
        startedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save question selection:', error)
    }
  }

  const getNewQuestion = async () => {
    if (currentQuestion?.type === 'truth' && refreshCount >= 2) {
      toast.error('You can only refresh truth questions twice!')
      return
    }
    
    // Check if we need to refresh ML questions for maturity progression
    const sessionDuration = sessionStartTime ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60)) : 0
    if ((sessionDuration >= 60 || matureUnlocked) && mlQuestions?.maturity_level === 'standard') {
      await loadMlQuestions(true)
    }
    
    setTruthAnswer('')
    setRefreshCount(prev => prev + 1)
    if (gameType) {
      selectTruthOrDare(gameType)
    }
  }

  useEffect(() => {
    loadGameSession()
    loadMlQuestions()
  }, [])

  const loadMlQuestions = async (forceRefresh = false) => {
    if (loadingQuestions) return
    
    setLoadingQuestions(true)
    try {
      const sessionDuration = sessionStartTime ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60)) : 0
      // Use stored mature status or check session duration
      const effectiveDuration = matureUnlocked ? Math.max(sessionDuration, 60) : sessionDuration
      const response = await fetch(`${import.meta.env.VITE_ML_SERVICE_URL}/games/truth-or-dare?session_duration=${effectiveDuration}`)
      
      if (response.ok) {
        const data = await response.json()
        setMlQuestions(data)
        
        if (data.maturity_level === 'mature' && sessionDuration >= 60 && !matureUnlocked) {
          setMatureUnlocked(true)
          toast.success('Mature content unlocked! Questions are getting spicier...')
        }
      } else {
        throw new Error('ML service unavailable')
      }
    } catch (error) {
      console.error('Failed to load ML questions:', error)
      if (!mlQuestions) {
        setMlQuestions({
          truth_questions: fallbackTruthQuestions,
          dare_questions: fallbackDareQuestions,
          maturity_level: 'standard',
          generated_by: 'fallback'
        })
      }
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    if (currentQuestion) {
      checkPartnerResponse()
    }
  }, [currentQuestion])

  const loadGameSession = async () => {
    try {
      const results = await api.getCoupleActivityResults('game', 'truth_or_dare')
      if (results.results) {
        // Load user's current session
        if (results.results.user.response) {
          const userData = results.results.user.response
          setGameSession(userData)
          
          // Restore session timing and mature status from database
          if (userData.sessionStartTime) {
            const savedTime = new Date(userData.sessionStartTime)
            const timeDiff = new Date().getTime() - savedTime.getTime()
            if (timeDiff < 24 * 60 * 60 * 1000) {
              setSessionStartTime(savedTime)
              if (userData.matureUnlocked) {
                setMatureUnlocked(true)
              }
            } else {
              setSessionStartTime(new Date())
            }
          } else {
            setSessionStartTime(new Date())
          }
          
          if (userData.question && userData.questionType) {
            setCurrentQuestion({ type: userData.questionType, text: userData.question })
            setGameType(userData.questionType)
            if (userData.questionType === 'truth' && userData.answer) {
              setTruthAnswer(userData.answer)
            }
            setRefreshCount(userData.refreshCount || 0)
          }
        } else {
          setSessionStartTime(new Date())
        }
        
        // Load partner's response
        if (results.results.partner.response) {
          setPartnerResponse(results.results.partner.response)
        }
        setPartnerName(results.results.partner.name || 'Partner')
      } else {
        setSessionStartTime(new Date())
      }
    } catch (error) {
      console.log('No existing game session')
      setSessionStartTime(new Date())
    }
  }

  const checkPartnerResponse = async () => {
    if (!currentQuestion) return
    
    try {
      const results = await api.getCoupleActivityResults('game', 'truth_or_dare')
      if (results.results && results.results.partner.response) {
        const partnerData = results.results.partner.response
        setPartnerResponse(partnerData)
        setPartnerName(results.results.partner.name || 'Partner')
      }
    } catch (error) {
      console.log('No partner response yet')
    }
  }

  const completeGame = async () => {
    if (isSubmitting || hasSubmitted) {
      toast.error('Already submitted! Please wait.')
      return
    }
    
    setIsSubmitting(true)
    
    const gameData = { 
      gameType: 'truth_or_dare',
      question: currentQuestion?.text,
      questionType: currentQuestion?.type,
      answer: currentQuestion?.type === 'truth' ? truthAnswer : 'completed',
      refreshCount,
      completed: true,
      bet: betData,
      sessionStartTime: sessionStartTime?.toISOString(),
      matureUnlocked,
      completedAt: new Date().toISOString()
    }
    
    try {
      // Submit to couple activities system
      await api.submitCoupleActivity('game', 'truth_or_dare', gameData)
      
      setHasSubmitted(true)
      toast.success('Response saved! Your partner can now see it.')
      
      // Update local session
      setGameSession(gameData)
      
      // Load partner response once after submission
      checkPartnerResponse()
      
      onComplete(gameData)
    } catch (error) {
      toast.error('Failed to save response')
    } finally {
      setIsSubmitting(false)
    }
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
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                mlQuestions?.maturity_level === 'mature' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {mlQuestions?.maturity_level === 'mature' ? (
                  <><Flame className="w-3 h-3" /> Mature</>
                ) : (
                  <><Heart className="w-3 h-3" /> Standard</>
                )}
              </span>
              {sessionStartTime && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60))}min
                </span>
              )}
            </div>
            <p className="text-lg font-medium text-gray-800 text-center mb-4">
              {currentQuestion.text}
            </p>
            {currentQuestion.type === 'truth' && (
              <div className="mt-4">
                <textarea
                  value={truthAnswer}
                  onChange={(e) => setTruthAnswer(e.target.value)}
                  placeholder="Type your honest answer here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                  rows={3}
                />
              </div>
            )}
            
            {partnerResponse && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {partnerName}'s Response:
                  </span>
                  <button
                    onClick={() => setShowPartnerResponse(!showPartnerResponse)}
                    className="text-sm text-purple-500 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {showPartnerResponse ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showPartnerResponse && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-purple-700 mb-1">
                        {partnerResponse.questionType === 'truth' ? 'Truth Question:' : 'Dare Challenge:'}
                      </p>
                      <p className="text-gray-700 italic">"{partnerResponse.question}"</p>
                    </div>
                    {partnerResponse.questionType === 'truth' && (
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-1">Response:</p>
                        <p className="text-gray-700">{partnerResponse.answer}</p>
                      </div>
                    )}
                    {partnerResponse.questionType === 'dare' && (
                      <p className="text-green-600 font-medium">✓ Dare completed!</p>
                    )}
                    <p className="text-xs text-purple-500 mt-3">
                      Completed {new Date(partnerResponse.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={getNewQuestion}
              disabled={currentQuestion?.type === 'truth' && refreshCount >= 2}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
              New {currentQuestion.type} {currentQuestion?.type === 'truth' && `(${2 - refreshCount} left)`}
            </button>
            <button
              onClick={completeGame}
              disabled={currentQuestion?.type === 'truth' && !truthAnswer.trim() || isSubmitting || hasSubmitted}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Submitted!' : currentQuestion?.type === 'truth' ? 'Share Answer' : 'Mark Complete'}
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