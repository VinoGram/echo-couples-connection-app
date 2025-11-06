import { useState } from 'react'
import { Target, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react'

interface RelationshipGoalsProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function RelationshipGoals({ onComplete, onExit }: RelationshipGoalsProps) {
  const [goals, setGoals] = useState<string[]>([])
  const [newGoal, setNewGoal] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    { id: 'communication', label: 'Communication', icon: '💬', color: 'blue' },
    { id: 'intimacy', label: 'Intimacy', icon: '💕', color: 'pink' },
    { id: 'adventure', label: 'Adventures', icon: '🗺️', color: 'green' },
    { id: 'growth', label: 'Personal Growth', icon: '🌱', color: 'purple' },
    { id: 'future', label: 'Future Plans', icon: '🔮', color: 'indigo' },
    { id: 'fun', label: 'Fun & Recreation', icon: '🎉', color: 'yellow' }
  ]

  const goalSuggestions = {
    communication: [
      'Have a weekly check-in conversation',
      'Practice active listening',
      'Share one appreciation daily'
    ],
    intimacy: [
      'Plan monthly date nights',
      'Express physical affection daily',
      'Share deeper thoughts and feelings'
    ],
    adventure: [
      'Try a new activity together monthly',
      'Plan a weekend getaway',
      'Explore a new place in our city'
    ],
    growth: [
      'Read a relationship book together',
      'Support each other\'s individual goals',
      'Practice gratitude together'
    ],
    future: [
      'Discuss our 5-year vision',
      'Plan a major trip together',
      'Set financial goals as a couple'
    ],
    fun: [
      'Have a game night weekly',
      'Learn something new together',
      'Create silly traditions'
    ]
  }

  const addGoal = (goal: string) => {
    if (goal.trim() && !goals.includes(goal)) {
      setGoals([...goals, goal])
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    onComplete({
      gameType: 'relationship_goals',
      goals,
      category: selectedCategory,
      completed: true
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-purple-500">
            <Target className="w-6 h-6" />
            <span className="font-bold">Relationship Goals</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your Relationship Goals</h2>
          <p className="text-gray-600">Choose a category and create goals to strengthen your bond</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Choose a Category</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-xl border transition-all ${
                  selectedCategory === category.id
                    ? `border-${category.color}-500 bg-${category.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg mr-2">{category.icon}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Suggested Goals</h3>
            <div className="space-y-2">
              {goalSuggestions[selectedCategory as keyof typeof goalSuggestions]?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => addGoal(suggestion)}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-purple-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{suggestion}</span>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Add Custom Goal</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Enter your own relationship goal..."
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addGoal(newGoal)}
            />
            <button
              onClick={() => addGoal(newGoal)}
              className="bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Your Goals ({goals.length})
            </h3>
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200"
                >
                  <span className="text-gray-700">{goal}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={goals.length === 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Relationship Goals ({goals.length})
        </button>
      </div>
    </div>
  )
}