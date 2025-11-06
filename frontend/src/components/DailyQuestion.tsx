import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { QuestionsBank } from "./QuestionsBank";
import { MessageCircle, HelpCircle, CheckCircle, Clock, Send, User, Heart, Info } from "lucide-react";

interface DailyQuestionProps {
  question: any;
  couple: any;
  onAnswerSubmitted: () => void;
}

export function DailyQuestion({ question, couple, onAnswerSubmitted }: DailyQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Please write an answer first");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.submitAnswer(question.id, answer.trim());
      
      if (result.bothAnswered) {
        toast.success("Both answers revealed! 🎉");
      } else {
        toast.success("Answer submitted! Waiting for your partner...");
      }
      setAnswer("");
      onAnswerSubmitted();
    } catch (error) {
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) {
    return <QuestionsBank />;
  }

  return (
    <div className="space-y-8">
      {/* Today's Question */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-rose-100/50 to-purple-100/50 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">!</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Today's Question
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium capitalize">
                  {question.question?.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium capitalize">
                  {question.question?.depth}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-white to-pink-50/50 rounded-2xl p-8 mb-8 shadow-lg border border-pink-100/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-xl text-gray-800 font-medium leading-relaxed">
                {question.question?.text}
              </p>
            </div>
          </div>

          {question.bothAnswered ? (
            /* Both answered - show results */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                  <span className="font-bold">Both answered! +10 XP earned</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800">Your Answer</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed bg-white rounded-xl p-4">{question.userAnswer}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800">{couple.partnerName}'s Answer</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed bg-white rounded-xl p-4">{question.partnerAnswer}</p>
                </div>
              </div>
            </div>
          ) : question.userHasAnswered ? (
            /* User answered, waiting for partner */
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center animate-bounce">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Answer submitted!
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Waiting for <span className="font-semibold text-pink-600">{couple.partnerName}</span> to answer...
              </p>
              <div className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 justify-center">
                  <Info className="w-6 h-6 text-blue-500" />
                  <p className="text-blue-800 font-medium">
                    Answers will be revealed once both of you respond
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* User hasn't answered yet */
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Share your thoughts and feelings..."
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all resize-none text-lg shadow-lg"
                  rows={5}
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                  {answer.length}/500
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  {question.partnerHasAnswered ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-emerald-700 font-medium">{couple.partnerName} has answered</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-gray-600">{couple.partnerName} hasn't answered yet</span>
                    </>
                  )}
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !answer.trim()}
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white font-bold py-3 px-8 rounded-2xl hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-white" />
                      <span>Submit Answer</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
