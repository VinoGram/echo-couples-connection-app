import { useState, useEffect } from "react";
import { DailyQuestion } from "./DailyQuestion";
import { Chat } from "./Chat";
import { QuestionsBank } from "./QuestionsBank";
import { GameHub } from "./GameHub";
import { ExerciseHub } from "./ExerciseHub";
import { QuizHub } from "./QuizHub";
import { NotificationSettings } from "./NotificationSettings";
import { ActivityHistory } from "./ActivityHistory";
import { api } from "../lib/api";
import { socketManager } from "../lib/socket";
import { MessageCircle, MessageSquare, BookOpen, Gamepad2, Heart, BarChart3, Flame, Star, Zap, Users, Settings, Trophy, Award, Crown, History } from "lucide-react";

interface DashboardProps {
  couple: any;
  onCoupleSetup: () => void;
  setCouple?: (couple: any) => void;
}

export function Dashboard({ couple, onCoupleSetup, setCouple }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "chat" | "questions" | "games" | "exercises" | "quizzes" | "awards" | "history" | "settings">("daily");
  const [todaysQuestion, setTodaysQuestion] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userStats, setUserStats] = useState({
    streak: 0,
    level: 1,
    totalXP: 0,
    gamesPlayed: 0,
    exercisesCompleted: 0
  });
  const [bothOnline, setBothOnline] = useState(false);
  const [partnerDisplayName, setPartnerDisplayName] = useState('');

  useEffect(() => {
    loadTodaysQuestion();
    loadUserStats();
    loadPartnerDisplayName();
    
    // Set connection status based on couple completion and socket connection
    if (couple?.isComplete && socketManager.connected) {
      setBothOnline(true);
    } else {
      setBothOnline(false);
    }
    
    // Auto-refresh stats every 300 seconds
    const statsInterval = setInterval(() => {
      loadUserStats();
    }, 300000); // 300 seconds = 5 minutes
    
    return () => clearInterval(statsInterval);
  }, [couple, socketManager.connected]);

  const loadTodaysQuestion = async () => {
    try {
      const question = await api.getTodaysQuestion();
      setTodaysQuestion(question);
    } catch (error) {
      console.error('Failed to load today\'s question:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      console.log('Loading user stats...');
      const stats = await api.getUserStats();
      console.log('Received stats from API:', stats);
      
      // Calculate level from XP (every 200 XP = 1 level)
      const level = Math.floor((stats.totalXP || 0) / 200) + 1;
      
      const newStats = {
        streak: stats.currentStreak || 0,
        level,
        totalXP: stats.totalXP || 0,
        gamesPlayed: stats.gamesPlayed || 0,
        exercisesCompleted: stats.exercisesCompleted || 0
      };
      
      console.log('Setting user stats:', newStats);
      setUserStats(newStats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadPartnerDisplayName = async () => {
    try {
      const response = await api.getPartnerName();
      setPartnerDisplayName(response.partnerName || couple?.partner?.username || '');
    } catch (error) {
      console.error('Failed to load partner name:', error);
      setPartnerDisplayName(couple?.partner?.username || '');
    }
  };

  const updatePartnerDisplayName = async (newName: string) => {
    try {
      await api.updatePartnerName(newName);
      setPartnerDisplayName(newName);
      if (setCouple) {
        setCouple({ ...couple, partnerName: newName });
      }
    } catch (error) {
      console.error('Failed to update partner name:', error);
    }
  };

  // Refresh stats when activities are completed
  const refreshStats = () => {
    loadUserStats();
  };
  
  // Manual refresh with visual feedback
  const handleManualRefresh = async () => {
    try {
      await loadUserStats();
    } catch (error) {
      console.error('Manual refresh failed:', error);
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
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function AwardsSection() {
    const [topCouples, setTopCouples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadLeaderboard = async () => {
        try {
          // Get real leaderboard data from backend
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/leaderboard`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setTopCouples(data);
          } else {
            // Fallback to mock data if endpoint doesn't exist
            const mockData = await api.getLeaderboard();
            setTopCouples(mockData);
          }
        } catch (error) {
          console.error('Failed to load leaderboard:', error);
          // Use empty array as fallback
          setTopCouples([]);
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Top Couples Leaderboard
            </h2>
          </div>
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      couple.rank === 1 ? 'bg-yellow-200' :
                      couple.rank === 2 ? 'bg-gray-200' :
                      couple.rank === 3 ? 'bg-orange-200' :
                      'bg-blue-100'
                    }`}>
                      {couple.rank === 1 ? <Crown className="w-6 h-6 text-yellow-600" /> :
                       couple.rank === 2 ? <Award className="w-6 h-6 text-gray-600" /> :
                       couple.rank === 3 ? <Award className="w-6 h-6 text-orange-600" /> :
                       <Star className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-700">#{couple.rank}</span>
                        <h3 className="text-xl font-bold text-gray-800">{couple.names}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{couple.streak} day streak</span>
                      </div>
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
          <div className="space-y-2">
            <p className="text-xl text-gray-600">
              Connected with <span className="font-semibold text-pink-600">{partnerDisplayName || couple.partner?.username || 'Partner'}</span>
            </p>
            <button
              onClick={() => {
                const newName = prompt('Enter your partner\'s name:', partnerDisplayName || couple.partner?.username || '');
                if (newName && newName.trim()) {
                  updatePartnerDisplayName(newName.trim());
                }
              }}
              className="text-sm text-gray-500 hover:text-pink-600 underline"
            >
              Edit name
            </button>
          </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-3xl font-bold">{userStats.streak}</div>
                <div className="text-pink-100 text-xs sm:text-sm">Day Streak</div>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 mt-1 sm:mt-2">
              <button 
                onClick={handleManualRefresh}
                className="text-xs text-pink-200 hover:text-white px-1 sm:px-2 py-1 rounded"
              >
                Refresh
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.addTestXP();
                    loadUserStats();
                  } catch (error) {
                    console.error('Test XP failed:', error);
                  }
                }}
                className="text-xs text-pink-200 hover:text-white px-1 sm:px-2 py-1 rounded"
              >
                +XP
              </button>
            </div>
            <div className="w-full bg-pink-400/30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{width: `${Math.min(userStats.streak * 10, 100)}%`}}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-3xl font-bold">{userStats.level}</div>
                <div className="text-purple-100 text-xs sm:text-sm">Level</div>
              </div>
            </div>
            <div className="w-full bg-purple-400/30 rounded-full h-1.5 sm:h-2">
              <div className="bg-white h-1.5 sm:h-2 rounded-full" style={{width: `${(userStats.totalXP % 200) / 2}%`}}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-3xl font-bold">{userStats.totalXP}</div>
                <div className="text-indigo-100 text-xs sm:text-sm">Total XP</div>
              </div>
            </div>
            <div className="text-indigo-100 text-xs hidden sm:block">Keep growing together!</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-3xl font-bold">{bothOnline ? '∞' : '~'}</div>
                <div className="text-emerald-100 text-xs sm:text-sm">Connection</div>
              </div>
            </div>
            <div className="text-emerald-100 text-xs hidden sm:block">
              {bothOnline ? 'Infinite bond' : 'Hearts connected'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1 sm:gap-2 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id === 'chat') setUnreadMessages(0)
              }}
              className={`flex flex-col items-center justify-center gap-1 sm:gap-2 py-2 sm:py-4 px-1 sm:px-4 font-medium transition-all rounded-xl sm:rounded-2xl relative ${
                activeTab === tab.id
                  ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center relative ${
                activeTab === tab.id ? "bg-white/20" : "bg-gray-200"
              }`}>
                <tab.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${activeTab === tab.id ? "text-white" : "text-gray-600"}`} />
                {tab.id === 'chat' && unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold hidden sm:block">{tab.label}</span>
              <span className="text-xs font-semibold sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-8">
          <div className="min-h-[300px] sm:min-h-[400px]">
            {activeTab === "daily" && (
              couple && couple.isComplete ? (
                <DailyQuestion question={todaysQuestion} couple={couple} onAnswerSubmitted={() => { loadTodaysQuestion(); refreshStats(); }} />
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
            {activeTab === "chat" && <Chat couple={couple} selectedQuestion={selectedQuestion} onQuestionSent={() => setSelectedQuestion(null)} onNewMessage={() => activeTab !== 'chat' && setUnreadMessages(prev => prev + 1)} />}
            {activeTab === "questions" && <QuestionsBank onQuestionSelect={(question) => { setSelectedQuestion(question); setActiveTab("chat"); }} />}
            {activeTab === "games" && (
              couple && couple.isComplete ? (
                <GameHub onGameCompleted={refreshStats} />
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
            {activeTab === "exercises" && <ExerciseHub onExerciseCompleted={refreshStats} />}
            {activeTab === "quizzes" && <QuizHub onQuizCompleted={refreshStats} />}
            {activeTab === "awards" && <AwardsSection />}
            {activeTab === "history" && <ActivityHistory />}
            {activeTab === "settings" && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
