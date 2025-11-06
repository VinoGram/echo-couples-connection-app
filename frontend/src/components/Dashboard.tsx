import { useState, useEffect } from "react";
import { DailyQuestion } from "./DailyQuestion";
import { Chat } from "./Chat";
import { QuestionsBank } from "./QuestionsBank";
import { GameHub } from "./GameHub";
import { ExerciseHub } from "./ExerciseHub";
import { QuizHub } from "./QuizHub";
import { NotificationSettings } from "./NotificationSettings";
import { api } from "../lib/api";
import { MessageCircle, MessageSquare, BookOpen, Gamepad2, Heart, BarChart3, Flame, Star, Zap, Users, Settings, Trophy, Award, Crown } from "lucide-react";

interface DashboardProps {
  couple: any;
  onCoupleSetup: () => void;
}

export function Dashboard({ couple, onCoupleSetup }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "chat" | "questions" | "games" | "exercises" | "quizzes" | "settings">("daily");
  const [todaysQuestion, setTodaysQuestion] = useState(null);

  useEffect(() => {
    loadTodaysQuestion();
  }, []);

  const loadTodaysQuestion = async () => {
    try {
      const question = await api.getTodaysQuestion();
      setTodaysQuestion(question);
    } catch (error) {
      console.error('Failed to load today\'s question:', error);
    }
  };

  const tabs = [
    { id: "daily", label: "Daily Core", icon: MessageCircle },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "questions", label: "Questions Bank", icon: BookOpen },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "exercises", label: "Exercises", icon: Heart },
    { id: "quizzes", label: "Quizzes", icon: BarChart3 },
    { id: "awards", label: "Awards", icon: Star },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function AwardsSection() {
    const [topCouples, setTopCouples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadLeaderboard = async () => {
        try {
          const data = await api.getLeaderboard();
          setTopCouples(data);
          localStorage.setItem('leaderboard_cache', JSON.stringify(data));
        } catch (error) {
          const cached = localStorage.getItem('leaderboard_cache');
          if (cached) {
            setTopCouples(JSON.parse(cached));
          }
        } finally {
          setLoading(false);
        }
      };
      
      // Load cached data first
      const cached = localStorage.getItem('leaderboard_cache');
      if (cached) {
        setTopCouples(JSON.parse(cached));
        setLoading(false);
      }
      
      loadLeaderboard();
    }, []);

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            🏆 Top Couples Leaderboard
          </h2>
          <p className="text-gray-600">Best couples based on daily question engagement</p>
        </div>

        {loading && topCouples.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {topCouples.map((couple, index) => (
              <div
                key={couple.rank}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl ${
                  couple.rank === 1 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' :
                  couple.rank === 2 ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50' :
                  couple.rank === 3 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      couple.rank === 1 ? 'bg-yellow-200' :
                      couple.rank === 2 ? 'bg-gray-200' :
                      couple.rank === 3 ? 'bg-orange-200' :
                      'bg-blue-100'
                    }`}>
                      {couple.badge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-700">#{couple.rank}</span>
                        <h3 className="text-xl font-bold text-gray-800">{couple.names}</h3>
                      </div>
                      <p className="text-gray-600">🔥 {couple.streak} day streak</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{couple.score}</div>
                    <div className="text-sm text-gray-500">Total Points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h3 className="font-bold text-gray-800">How Rankings Work</h3>
          </div>
          <p className="text-gray-700 text-sm">
            Rankings are based on daily question participation, streak length, and engagement quality. Keep answering questions together to climb the leaderboard!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome back!
        </h1>
        {couple && couple.isComplete ? (
          <p className="text-xl text-gray-600">
            Connected with <span className="font-semibold text-pink-600">{couple.partnerName}</span>
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xl text-gray-600">Ready to connect with your partner?</p>
            <button
              onClick={onCoupleSetup}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
            >
              Invite Partner
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {couple && couple.isComplete && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{couple.streak || 0}</div>
                <div className="text-pink-100 text-sm">Day Streak</div>
              </div>
            </div>
            <div className="w-full bg-pink-400/30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{width: `${Math.min((couple.streak || 0) * 10, 100)}%`}}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{couple.level || 1}</div>
                <div className="text-purple-100 text-sm">Level</div>
              </div>
            </div>
            <div className="w-full bg-purple-400/30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{width: `${((couple.totalXP || 0) % 1000) / 10}%`}}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{couple.totalXP || 0}</div>
                <div className="text-indigo-100 text-sm">Total XP</div>
              </div>
            </div>
            <div className="text-indigo-100 text-xs">Keep growing together!</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-emerald-100 text-sm">Connection</div>
              </div>
            </div>
            <div className="text-emerald-100 text-xs">Infinite bond</div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-4 font-medium transition-all rounded-2xl ${
                activeTab === tab.id
                  ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeTab === tab.id ? "bg-white/20" : "bg-gray-200"
              }`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-gray-600"}`} />
              </div>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="min-h-[400px]">
            {activeTab === "daily" && (
              couple && couple.isComplete ? (
                <DailyQuestion question={todaysQuestion} couple={couple} onAnswerSubmitted={loadTodaysQuestion} />
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect with your partner</h3>
                  <p className="text-gray-500 mb-6">Daily questions are more fun when shared together!</p>
                  <button
                    onClick={onCoupleSetup}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
                  >
                    Invite Partner
                  </button>
                </div>
              )
            )}
            {activeTab === "chat" && <Chat couple={couple} />}
            {activeTab === "questions" && <QuestionsBank />}
            {activeTab === "games" && (
              couple && couple.isComplete ? (
                <GameHub />
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect with your partner</h3>
                  <p className="text-gray-500 mb-6">Games are more fun when played together!</p>
                  <button
                    onClick={onCoupleSetup}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
                  >
                    Invite Partner
                  </button>
                </div>
              )
            )}
            {activeTab === "exercises" && <ExerciseHub />}
            {activeTab === "quizzes" && <QuizHub />}
            {activeTab === "awards" && <AwardsSection />}
            {activeTab === "settings" && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
