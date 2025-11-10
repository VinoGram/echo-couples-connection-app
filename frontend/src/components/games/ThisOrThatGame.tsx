import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Trophy, Target, HelpCircle, CheckCircle, Lightbulb, Dice1, Settings } from "lucide-react";
import { BettingSystem } from './BettingSystem';

interface ThisOrThatGameProps {
  onBack: () => void;
}

export function ThisOrThatGame({ onBack }: ThisOrThatGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<any[]>([]);
  const [gamePhase, setGamePhase] = useState<"answering" | "results">("answering");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bothCompleted, setBothCompleted] = useState(false);
  const [betData, setBetData] = useState<any>(null);
  const [showBetting, setShowBetting] = useState(false);
  const [bettingEnabled, setBettingEnabled] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    loadQuestions();
    loadGameSession();
    const interval = setInterval(loadGameSession, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ML_SERVICE_URL}/games/this-or-that`);
      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          // Fallback questions if ML service fails
          setQuestions([
            { option1: "Coffee", option2: "Tea" },
            { option1: "Beach vacation", option2: "Mountain vacation" },
            { option1: "Movie night at home", option2: "Night out on the town" },
            { option1: "Early bird", option2: "Night owl" },
            { option1: "Cooking together", option2: "Ordering takeout" }
          ]);
        }
      } else {
        throw new Error('ML service unavailable');
      }
    } catch (error) {
      console.error('Failed to load questions from ML service:', error);
      // Fallback questions
      setQuestions([
        { option1: "Coffee", option2: "Tea" },
        { option1: "Beach vacation", option2: "Mountain vacation" },
        { option1: "Movie night at home", option2: "Night out on the town" },
        { option1: "Early bird", option2: "Night owl" },
        { option1: "Cooking together", option2: "Ordering takeout" }
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadGameSession = async () => {
    try {
      const results = await api.getCoupleActivityResults('game', 'this_or_that');
      if (results.results) {
        if (results.results.user.response) {
          setAnswers(results.results.user.response.answers || []);
          setCurrentQuestionIndex(results.results.user.response.currentQuestion || 0);
        }
        if (results.results.partner.response) {
          setPartnerAnswers(results.results.partner.response.answers || []);
        }
        setBothCompleted(results.bothCompleted);
        
        // If user completed all questions, show results
        if (results.results.user.response?.answers?.length === questions.length) {
          setGamePhase('results');
        }
      }
    } catch (error) {
      console.log('No existing game session');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (loadingQuestions) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading personalized questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600 mb-4">Unable to load questions. Please try again.</p>
        <button
          onClick={loadQuestions}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleAnswer = async (choice: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      question: currentQuestion,
      userChoice: choice,
    };
    setAnswers(newAnswers);

    // Save answer immediately
    try {
      await api.submitCoupleActivity('game', 'this_or_that', {
        answers: newAnswers,
        currentQuestion: currentQuestionIndex + 1,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }

    // Wait a moment to show the selection, then advance
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleSubmitResults(newAnswers);
      }
    }, 1000);
  };



  const handleSubmitResults = async (finalAnswers: any[]) => {
    setIsSubmitting(true);
    try {
      await api.submitCoupleActivity('game', 'this_or_that', {
        answers: finalAnswers,
        completed: true,
        completedAt: new Date().toISOString()
      });
      
      setGamePhase("results");
      toast.success('Game completed! Check how your answers compare.');
    } catch (error) {
      toast.error("Failed to submit game results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkForPartnerResults = async () => {
    try {
      const coupleResults = await api.getCoupleActivityResults('game', 'this_or_that');
      if (coupleResults.bothCompleted) {
        setPartnerAnswers(coupleResults.results.partner.response.answers || []);
        setBothCompleted(true);
        toast.success('Your partner has completed the game too!');
      }
    } catch (error) {
      console.error('Failed to check partner results:', error);
    }
  };

  const handleBetPlaced = (bet: any) => {
    setBetData(bet);
    setShowBetting(false);
  };

  const toggleBetting = () => {
    setBettingEnabled(!bettingEnabled);
    if (!bettingEnabled) {
      setShowBetting(true);
    } else {
      setShowBetting(false);
      setBetData(null);
    }
  };

  const handleWinnerSelected = (winner: 'player1' | 'player2') => {
    const results = calculateResults();
    const actualWinner = results.percentage >= 70 ? 'player1' : 'player2';
    if (winner === actualWinner) {
      toast.success(`Correct! ${winner === 'player1' ? betData.player1 : betData.player2} wins the bet!`);
    } else {
      toast.success(`${winner === 'player1' ? betData.player1 : betData.player2} wins the bet!`);
    }
  };

  const calculateResults = () => {
    let matches = 0;
    answers.forEach((answer, index) => {
      const partnerAnswer = partnerAnswers[index];
      if (partnerAnswer && answer.userChoice === partnerAnswer.userChoice) {
        matches++;
      }
    });
    return {
      matches,
      total: answers.length,
      percentage: bothCompleted ? Math.round((matches / answers.length) * 100) : 0,
    };
  };

  if (gamePhase === "results") {
    const results = calculateResults();
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
          >
            ← Back to Games
          </button>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Game Results!
          </h2>
          <div className="mb-4 flex justify-center">
            {results.percentage >= 80 ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
            ) : results.percentage >= 60 ? (
              <Target className="w-16 h-16 text-blue-500" />
            ) : (
              <HelpCircle className="w-16 h-16 text-gray-500" />
            )}
          </div>
          <div className="text-4xl font-bold text-pink-600 mb-2 flex items-center justify-center gap-2">
            <Target className="w-10 h-10 text-pink-600" />
            {results.percentage}%
          </div>
          <p className="text-gray-600">
            {bothCompleted 
              ? `You matched ${results.matches} out of ${results.total} choices with your partner!`
              : 'Waiting for your partner to complete the game...'
            }
          </p>
        </div>

        <div className="space-y-4">
          {answers.map((answer, index) => {
            const partnerAnswer = partnerAnswers[index];
            const match = bothCompleted && partnerAnswer && answer.userChoice === partnerAnswer.userChoice;
            
            return (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="font-medium text-gray-800 mb-3">
                  {answer.question.option1} vs {answer.question.option2}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Your choice:</span>
                    <span className={`px-2 py-1 rounded ${
                      match ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {answer.userChoice}
                    </span>
                    {match && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Partner's choice:</span>
                    <span className={`px-2 py-1 rounded ${
                      bothCompleted ? (match ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800") : "bg-gray-100 text-gray-600"
                    }`}>
                      {bothCompleted ? (partnerAnswer?.userChoice || 'Not answered') : 'Waiting...'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {!bothCompleted && (
          <div className="text-center mt-4 p-4 bg-yellow-50 rounded-xl">
            <p className="text-yellow-800">Waiting for your partner to complete the game...</p>
            <button 
              onClick={checkForPartnerResults}
              className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
            >
              Check again
            </button>
          </div>
        )}

        <div className="text-center mt-6 space-y-3">
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setAnswers([]);
              setPartnerAnswers([]);
              setGamePhase('answering');
              setBothCompleted(false);
              loadQuestions();
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
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
      {betData && gamePhase === "results" && (
        <BettingSystem
          onBetPlaced={handleBetPlaced}
          onWinnerSelected={handleWinnerSelected}
          gameActive={true}
          isEnabled={bettingEnabled}
        />
      )}
      <div className="text-center mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Games
          </button>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <Target className="w-6 h-6 text-purple-500" />
          This or That
        </h2>
        <p className="text-gray-600">Choose your preferences and see how they compare with your partner's</p>
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            Which do you prefer?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(currentQuestion.option1)}
            disabled={isSubmitting || answers[currentQuestionIndex]?.userChoice}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-lg disabled:opacity-50"
          >
            {currentQuestion.option1}
          </button>
          <button
            onClick={() => handleAnswer(currentQuestion.option2)}
            disabled={isSubmitting || answers[currentQuestionIndex]?.userChoice}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-lg disabled:opacity-50"
          >
            {currentQuestion.option2}
          </button>
        </div>

        {answers[currentQuestionIndex]?.userChoice && (
          <div className="mt-6 text-center">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-800 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                You chose: <strong>{answers[currentQuestionIndex].userChoice}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
