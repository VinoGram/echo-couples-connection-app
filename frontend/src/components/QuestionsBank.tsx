import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Heart, Clock, Calendar, DollarSign, Users, Compass, Smile, Filter } from 'lucide-react'

interface Question {
  id: string
  text: string
  category: string
  depth: string
}

const categoryIcons = {
  love: Heart,
  memories: Clock,
  desires: Compass,
  dates: Calendar,
  finance: DollarSign,
  family: Users,
  future: Compass,
  fun: Smile
}

const categoryColors = {
  love: 'from-pink-500 to-rose-500',
  memories: 'from-amber-500 to-orange-500',
  desires: 'from-purple-500 to-violet-500',
  dates: 'from-blue-500 to-indigo-500',
  finance: 'from-green-500 to-emerald-500',
  family: 'from-teal-500 to-cyan-500',
  future: 'from-indigo-500 to-purple-500',
  fun: 'from-yellow-500 to-amber-500'
}

export function QuestionsBank() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDepth, setSelectedDepth] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestions()
  }, [selectedCategory, selectedDepth])

  const loadQuestions = async () => {
    try {
      const data = await api.browseQuestions(
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedDepth === 'all' ? undefined : selectedDepth
      )
      setQuestions(data.questions || [])
    } catch (error) {
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', label: 'All Topics', icon: Filter },
    { id: 'love', label: 'Love', icon: Heart },
    { id: 'memories', label: 'Memories', icon: Clock },
    { id: 'desires', label: 'Desires', icon: Compass },
    { id: 'dates', label: 'Dates', icon: Calendar },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'future', label: 'Future', icon: Compass },
    { id: 'fun', label: 'Fun', icon: Smile }
  ]

  const depths = [
    { id: 'all', label: 'All Depths' },
    { id: 'light', label: 'Light & Fun' },
    { id: 'deep', label: 'Deep & Meaningful' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Questions Bank
        </h2>
        <p className="text-gray-600">Browse questions by topic and depth to spark meaningful conversations</p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Topics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Depth Filter */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Depth Level</h3>
          <div className="flex gap-2">
            {depths.map((depth) => (
              <button
                key={depth.id}
                onClick={() => setSelectedDepth(depth.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedDepth === depth.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {depth.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4">
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No questions found for the selected filters</p>
          </div>
        ) : (
          questions.map((question) => {
            const IconComponent = categoryIcons[question.category as keyof typeof categoryIcons] || Heart
            const colorClass = categoryColors[question.category as keyof typeof categoryColors] || 'from-gray-500 to-gray-600'
            
            return (
              <div
                key={question.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                        {question.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        question.depth === 'light' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {question.depth === 'light' ? 'Light & Fun' : 'Deep & Meaningful'}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {question.text}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}