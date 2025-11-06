import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Heart, StickyNote, Map, Target, MessageSquare, Plus, Save, BookOpen, Shield, Users } from 'lucide-react'
import { LoveLanguageExercise } from './exercises/LoveLanguageExercise'
import { CommunicationExercise } from './exercises/CommunicationExercise'
import { GratitudeJournal } from './exercises/GratitudeJournal'
import { ConflictResolution } from './exercises/ConflictResolution'

export function ExerciseHub() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [exerciseData, setExerciseData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const exercises = [
    {
      id: 'appreciation_wall',
      title: 'Appreciation Wall',
      description: 'A digital space to leave sticky notes of gratitude for each other',
      icon: StickyNote,
      color: 'from-yellow-500 to-amber-500',
      instructions: 'Write appreciation notes for your partner. They can see them anytime!'
    },
    {
      id: 'love_language',
      title: 'Love Language Assessment',
      description: 'Discover how you and your partner prefer to give and receive love',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      instructions: 'Take a guided assessment to understand your love languages'
    },
    {
      id: 'communication_exercise',
      title: 'Communication Practice',
      description: 'Structured exercises to improve how you express feelings and needs',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500',
      instructions: 'Practice healthy communication using "I feel" statements'
    },
    {
      id: 'gratitude_journal',
      title: 'Gratitude Journal',
      description: 'Daily practice of appreciating your partner and relationship',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      instructions: 'Write daily gratitude entries to strengthen your bond'
    },
    {
      id: 'conflict_resolution',
      title: 'Conflict Resolution',
      description: 'Structured approach to resolving disagreements constructively',
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      instructions: 'Work through conflicts using proven relationship techniques'
    },
    {
      id: 'dream_board',
      title: 'Dream Board',
      description: 'A shared space to pin ideas for future dates, vacations, and life goals',
      icon: Target,
      color: 'from-purple-500 to-violet-500',
      instructions: 'Add your dreams and goals for your relationship'
    }
  ]

  const loadExercise = async (exerciseId: string) => {
    setLoading(true)
    try {
      const data = await api.getExercise(exerciseId)
      setExerciseData(data)
      setActiveExercise(exerciseId)
    } catch (error) {
      // If exercise doesn't exist, create empty one
      setExerciseData({ items: [] })
      setActiveExercise(exerciseId)
    } finally {
      setLoading(false)
    }
  }

  const saveExercise = async () => {
    if (!activeExercise || !exerciseData) return
    
    setSaving(true)
    try {
      await api.updateExercise(activeExercise, exerciseData)
      toast.success('Exercise saved!')
    } catch (error) {
      toast.error('Failed to save exercise')
    } finally {
      setSaving(false)
    }
  }

  const renderExerciseContent = () => {
    if (!activeExercise) return null

    const exercise = exercises.find(e => e.id === activeExercise)
    if (!exercise) return null

    switch (activeExercise) {
      case 'love_language':
        return <LoveLanguageExercise onBack={() => setActiveExercise(null)} />
      
      case 'communication_exercise':
        return <CommunicationExercise onBack={() => setActiveExercise(null)} />
      
      case 'gratitude_journal':
        return <GratitudeJournal onBack={() => setActiveExercise(null)} />
      
      case 'conflict_resolution':
        return <ConflictResolution onBack={() => setActiveExercise(null)} />

      case 'appreciation_wall':
        if (!exerciseData) return null
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
              <h3 className="font-bold text-gray-800 mb-2">How it works:</h3>
              <p className="text-gray-700">{exercise.instructions}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exerciseData.items?.map((note: any, index: number) => (
                <div key={index} className="bg-yellow-200 rounded-xl p-4 shadow-md transform rotate-1 hover:rotate-0 transition-transform">
                  <p className="text-gray-800 font-medium">{note.text}</p>
                  <p className="text-xs text-gray-600 mt-2">- {note.author}</p>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const text = prompt('Write your appreciation note:')
                  if (text) {
                    const newItems = [...(exerciseData.items || []), { text, author: 'You', date: new Date().toISOString() }]
                    setExerciseData({ ...exerciseData, items: newItems })
                  }
                }}
                className="bg-yellow-300 rounded-xl p-4 border-2 border-dashed border-yellow-400 hover:bg-yellow-400 transition-colors flex items-center justify-center min-h-[100px]"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Add Note</p>
                </div>
              </button>
            </div>
          </div>
        )

      case 'dream_board':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <h3 className="font-bold text-gray-800 mb-2">How it works:</h3>
              <p className="text-gray-700">{exercise.instructions}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {exerciseData.items?.map((dream: any, index: number) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                  <h4 className="font-bold text-gray-800 mb-2">{dream.title}</h4>
                  <p className="text-gray-700 mb-3">{dream.description}</p>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {dream.category}
                  </span>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const title = prompt('Dream title:')
                  const description = prompt('Description:')
                  const category = prompt('Category (date, vacation, goal):')
                  if (title && description) {
                    const newItems = [...(exerciseData.items || []), { title, description, category: category || 'goal' }]
                    setExerciseData({ ...exerciseData, items: newItems })
                  }
                }}
                className="bg-purple-50 rounded-2xl p-6 border-2 border-dashed border-purple-200 hover:bg-purple-100 transition-colors flex items-center justify-center min-h-[150px]"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-600 font-medium">Add Dream</p>
                </div>
              </button>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">This exercise is coming soon!</p>
          </div>
        )
    }
  }

  if (activeExercise) {
    const exercise = exercises.find(e => e.id === activeExercise)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveExercise(null)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{exercise?.title}</h2>
              <p className="text-gray-600">{exercise?.description}</p>
            </div>
          </div>
          <button
            onClick={saveExercise}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 px-4 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {renderExerciseContent()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Interactive Exercises
        </h2>
        <p className="text-gray-600">Guided activities to deepen your connection and understanding</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => {
          const IconComponent = exercise.icon
          return (
            <div
              key={exercise.id}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${exercise.color} rounded-2xl flex items-center justify-center`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{exercise.title}</h3>
                  <p className="text-gray-600 text-sm">{exercise.description}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Instructions:</p>
                <p className="font-medium text-gray-800">{exercise.instructions}</p>
              </div>

              <button
                onClick={() => loadExercise(exercise.id)}
                disabled={loading}
                className={`w-full bg-gradient-to-r ${exercise.color} text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    <span>Start Exercise</span>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="w-6 h-6 text-pink-500" />
          <h3 className="font-bold text-gray-800">Building Connection</h3>
        </div>
        <p className="text-gray-700">
          These exercises are based on relationship research and are designed to help you understand each other better. Take your time and be honest in your responses.
        </p>
      </div>
    </div>
  )
}