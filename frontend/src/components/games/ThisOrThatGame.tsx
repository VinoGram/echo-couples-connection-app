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
  const [gamePhase, setGamePhase] = useState<"answering" | "guessing" | "results">("answering");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [betData, setBetData] = useState<any>(null);
  const [showBetting, setShowBetting] = useState(false);
  const [bettingEnabled, setBettingEnabled] = useState(false);

  const [questions, setQuestions] = useState([
    { option1: "Coffee", option2: "Tea" },
    { option1: "Beach vacation", option2: "Mountain vacation" },
    { option1: "Movie night at home", option2: "Night out on the town" },
    { option1: "Early bird", option2: "Night owl" },
    { option1: "Cooking together", option2: "Ordering takeout" }
  ]);

  useEffect(() => {
    // Load questions from API if needed
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (choice: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      question: currentQuestion,
      userChoice: choice,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGamePhase("guessing");
      setCurrentQuestionIndex(0);
    }
  };

  const handleGuess = (guess: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      partnerGuess: guess,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitResults(newAnswers);
    }
  };

  const handleSubmitResults = async (finalAnswers: any[]) => {
    setIsSubmitting(true);
    try {
      // await api.submitGameResult('this_or_that', { answers: finalAnswers });
      setGamePhase("results");
      const results = calculateResults();
      toast.success(`Game complete! You scored ${results.percentage}%`);
    } catch (error) {
      toast.error("Failed to submit game results");
    } finally {
      setIsSubmitting(false);
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
    let correct = 0;
    answers.forEach((answer) => {
      if (answer.userChoice === answer.partnerGuess) {
        correct++;
      }
    });
    return {
      correct,
      total: answers.length,
      percentage: Math.round((correct / answers.length) * 100),
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
            You guessed {results.correct} out of {results.total} correctly!
          </p>
        </div>

        <div className="space-y-4">
          {answers.map((answer, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="font-medium text-gray-800 mb-3">
                {answer.question.option1} vs {answer.question.option2}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Your choice:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {answer.userChoice}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Your guess:</span>
                  <span className={`px-2 py-1 rounded ${
                    answer.userChoice === answer.partnerGuess
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {answer.partnerGuess}
                  </span>
                  {answer.userChoice === answer.partnerGuess && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
          >
            Play Again
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
        <p className="text-gray-600">
          {gamePhase === "answering" 
            ? "Choose your preferences" 
            : "Guess what your partner chose"
          }
        </p>
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
            {gamePhase === "answering" 
              ? "Which do you prefer?" 
              : "Which do you think your partner prefers?"
            }
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => gamePhase === "answering" 
              ? handleAnswer(currentQuestion.option1)
              : handleGuess(currentQuestion.option1)
            }
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-lg disabled:opacity-50"
          >
            {currentQuestion.option1}
          </button>
          <button
            onClick={() => gamePhase === "answering" 
              ? handleAnswer(currentQuestion.option2)
              : handleGuess(currentQuestion.option2)
            }
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-8 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-lg disabled:opacity-50"
          >
            {currentQuestion.option2}
          </button>
        </div>

        {gamePhase === "guessing" && (
          <div className="mt-6 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800 flex items-center justify-center gap-2">
                <Lightbulb className="w-4 h-4" />
                You chose: <strong>{answers[currentQuestionIndex]?.userChoice}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
