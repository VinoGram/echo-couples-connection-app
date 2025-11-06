import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Appreciation {
  id: string;
  message: string;
  category: string;
  authorId: string;
  createdAt: number;
}

interface AppreciationWallProps {
  onBack: () => void;
}

export function AppreciationWall({ onBack }: AppreciationWallProps) {
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "general", label: "General", emoji: "💕" },
    { id: "support", label: "Support", emoji: "🤗" },
    { id: "fun", label: "Fun Times", emoji: "😄" },
    { id: "growth", label: "Growth", emoji: "🌱" },
    { id: "love", label: "Love", emoji: "❤️" },
  ];

  useEffect(() => {
    loadAppreciations();
  }, []);

  const loadAppreciations = async () => {
    try {
      // const data = await api.getExercise('appreciation_wall');
      // setAppreciations(data?.data?.appreciations || []);
      setAppreciations([
        {
          id: "1",
          message: "Thank you for always making me laugh, even on tough days",
          category: "fun",
          authorId: "user1",
          createdAt: Date.now() - 86400000
        },
        {
          id: "2", 
          message: "I appreciate how you listen to me without judgment",
          category: "support",
          authorId: "user2",
          createdAt: Date.now() - 43200000
        }
      ]);
    } catch (error) {
      toast.error("Failed to load appreciation wall");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error("Please write a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const newAppreciation: Appreciation = {
        id: Date.now().toString(),
        message: newMessage.trim(),
        category: selectedCategory,
        authorId: "currentUser",
        createdAt: Date.now()
      };

      // await api.updateExercise('appreciation_wall', {
      //   appreciations: [...appreciations, newAppreciation]
      // });

      setAppreciations([...appreciations, newAppreciation]);
      setNewMessage("");
      toast.success("Appreciation added! +5 XP earned");
    } catch (error) {
      toast.error("Failed to add appreciation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    return categories.find(c => c.id === category)?.emoji || "💕";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
        >
          ← Back to Exercises
        </button>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Appreciation Wall</h2>
        <p className="text-gray-600">
          Share what you appreciate about each other
        </p>
      </div>

      {/* Add New Appreciation */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Appreciation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.emoji} {category.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Appreciation
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="What do you appreciate about your partner?"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {newMessage.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newMessage.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Appreciation"}
          </button>
        </form>
      </div>

      {/* Appreciation Wall */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appreciations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">💕</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Start Your Appreciation Wall
            </h3>
            <p className="text-gray-600">
              Be the first to share what you appreciate about your partner
            </p>
          </div>
        ) : (
          appreciations.map((appreciation) => (
            <div
              key={appreciation.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">
                  {getCategoryEmoji(appreciation.category)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(appreciation.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <p className="text-gray-800 leading-relaxed mb-3">
                {appreciation.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 capitalize">
                  {categories.find(c => c.id === appreciation.category)?.label}
                </span>
                <div className="text-xs text-gray-400">
                  {appreciation.authorId === "currentUser" ? "You" : "Partner"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {appreciations.length > 0 && (
        <div className="text-center mt-8">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎉 {appreciations.length} Appreciations Shared
            </h3>
            <p className="text-gray-600">
              Keep building each other up with kind words!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}