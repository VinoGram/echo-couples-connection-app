import { useState, useEffect } from 'react'
import { BookOpen, ArrowLeft, Plus, Heart, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface GratitudeEntry {
  id: string
  date: string
  entries: string[]
  mood: string
}

interface GratitudeJournalProps {
  onBack: () => void
}

export function GratitudeJournal({ onBack }: GratitudeJournalProps) {
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState('')
  const [currentMood, setCurrentMood] = useState('happy')
  const [todayEntries, setTodayEntries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const moods = [
    { id: 'grateful', emoji: '🙏', label: 'Grateful' },
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'loved', emoji: '🥰', label: 'Loved' },
    { id: 'peaceful', emoji: '😌', label: 'Peaceful' },
    { id: 'excited', emoji: '🤩', label: 'Excited' }
  ]

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const data = await api.getExercise('gratitude_journal')
      setEntries(data?.entries || [])
      
      const todayEntry = data?.entries?.find((entry: GratitudeEntry) => entry.date === today)
      if (todayEntry) {
        setTodayEntries(todayEntry.entries)
        setCurrentMood(todayEntry.mood)
      }
    } catch (error) {
      console.log('No existing entries')
    } finally {
      setLoading(false)
    }
  }

  const addEntry = async () => {
    if (!currentEntry.trim()) {
      toast.error('Please write something you\'re grateful for')
      return
    }

    setSaving(true)
    try {
      const newTodayEntries = [...todayEntries, currentEntry.trim()]
      setTodayEntries(newTodayEntries)
      setCurrentEntry('')

      // Update or create today's entry
      const updatedEntries = entries.filter(entry => entry.date !== today)
      updatedEntries.push({
        id: today,
        date: today,
        entries: newTodayEntries,
        mood: currentMood
      })

      setEntries(updatedEntries)
      
      await api.updateExercise('gratitude_journal', { entries: updatedEntries })
      toast.success('Gratitude entry added! +2 XP earned')
    } catch (error) {
      toast.error('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  const getStreakCount = () => {
    let streak = 0
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (entryDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-2 text-green-500">
          <BookOpen className="w-6 h-6" />
          <span className="font-bold">Gratitude Journal</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="text-2xl font-bold text-green-500">{getStreakCount()}</div>
          <div className="text-gray-600">Day Streak</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="text-2xl font-bold text-blue-500">{entries.length}</div>
          <div className="text-gray-600">Total Days</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="text-2xl font-bold text-purple-500">
            {entries.reduce((sum, entry) => sum + entry.entries.length, 0)}
          </div>
          <div className="text-gray-600">Total Entries</div>
        </div>
      </div>

      {/* Today's Entry */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-green-500" />
          Today's Gratitude
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setCurrentMood(mood.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentMood === mood.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What are you grateful for today?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="I'm grateful for..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addEntry()}
                maxLength={200}
              />
              <button
                onClick={addEntry}
                disabled={saving || !currentEntry.trim()}
                className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {todayEntries.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 mb-3">Today's Entries:</h4>
              <div className="space-y-2">
                {todayEntries.map((entry, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{entry}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previous Entries */}
      {entries.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Previous Entries</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {entries
              .filter(entry => entry.date !== today)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-800">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-2xl">
                      {moods.find(m => m.id === entry.mood)?.emoji || '😊'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {entry.entries.map((entryText, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <Heart className="w-3 h-3 text-green-400" />
                        <span className="text-sm">{entryText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Start Your Gratitude Journey</h3>
          <p className="text-gray-600">
            Research shows that practicing gratitude can improve relationship satisfaction and overall well-being.
          </p>
        </div>
      )}
    </div>
  )
}