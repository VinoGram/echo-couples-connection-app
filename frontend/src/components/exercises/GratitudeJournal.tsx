import { useState, useEffect } from 'react'
import { BookOpen, ArrowLeft, Plus, Heart, Calendar, Smile, Star, Zap, Sun } from 'lucide-react'
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
  const [partnerEntries, setPartnerEntries] = useState<GratitudeEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState('')
  const [currentMood, setCurrentMood] = useState('happy')
  const [todayEntries, setTodayEntries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bothCompleted, setBothCompleted] = useState(false)

  const moods = [
    { id: 'grateful', icon: Heart, label: 'Grateful' },
    { id: 'happy', icon: Smile, label: 'Happy' },
    { id: 'loved', icon: Heart, label: 'Loved' },
    { id: 'peaceful', icon: Sun, label: 'Peaceful' },
    { id: 'excited', icon: Star, label: 'Excited' }
  ]

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      // Load from couple activities system
      const coupleResults = await api.getCoupleActivityResults('exercise', 'gratitude_journal')
      console.log('Couple results:', coupleResults)
      
      if (coupleResults.results) {
        // Load user's entries
        const userEntries = coupleResults.results.user.response?.entries || []
        setEntries(userEntries)
        
        const todayEntry = userEntries.find((entry: GratitudeEntry) => entry.date === today)
        if (todayEntry) {
          setTodayEntries(todayEntry.entries)
          setCurrentMood(todayEntry.mood)
        }
        
        // Load partner's entries if both completed
        console.log('Both completed:', coupleResults.bothCompleted)
        console.log('Partner response:', coupleResults.results.partner.response)
        
        if (coupleResults.bothCompleted) {
          setPartnerEntries(coupleResults.results.partner.response?.entries || [])
          setBothCompleted(true)
        }
      } else {
        // Fallback to old exercise system for existing data
        const data = await api.getExercise('gratitude_journal')
        const userEntries = data?.entries || []
        setEntries(userEntries)
        
        const todayEntry = userEntries.find((entry: GratitudeEntry) => entry.date === today)
        if (todayEntry) {
          setTodayEntries(todayEntry.entries)
          setCurrentMood(todayEntry.mood)
        }
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
      
      // Submit to couple activities system
      await api.submitCoupleActivity('exercise', 'gratitude_journal', { entries: updatedEntries })
      
      // Also save to old system for backward compatibility
      await api.updateExercise('gratitude_journal', { entries: updatedEntries })
      
      // Check for partner's entries
      const coupleResults = await api.getCoupleActivityResults('exercise', 'gratitude_journal')
      console.log('After submission - couple results:', coupleResults)
      
      if (coupleResults.bothCompleted && coupleResults.results) {
        setPartnerEntries(coupleResults.results.partner.response?.entries || [])
        setBothCompleted(true)
        toast.success('Entry added! Your partner has entries too! +2 XP earned')
      } else {
        toast.success('Gratitude entry added! +2 XP earned')
      }
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
          <div className="text-gray-600">Your Streak</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="text-2xl font-bold text-blue-500">{entries.length}</div>
          <div className="text-gray-600">Your Days</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="text-2xl font-bold text-purple-500">
            {bothCompleted ? 
              entries.reduce((sum, entry) => sum + entry.entries.length, 0) + partnerEntries.reduce((sum, entry) => sum + entry.entries.length, 0)
              : entries.reduce((sum, entry) => sum + entry.entries.length, 0)
            }
          </div>
          <div className="text-gray-600">{bothCompleted ? 'Together' : 'Your Entries'}</div>
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
              {moods.map((mood) => {
                const IconComponent = mood.icon;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setCurrentMood(mood.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      currentMood === mood.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" /> {mood.label}
                  </button>
                );
              })}
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

      {/* Previous Entries - Both Partners */}
      {(entries.length > 0 || partnerEntries.length > 0) && (
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Gratitude Journey Together</h3>
          
          {bothCompleted ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-blue-600 mb-4">Your Entries</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {entries
                    .filter(entry => entry.date !== today)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                          <div className="text-blue-500">
                            {(() => {
                              const mood = moods.find(m => m.id === entry.mood);
                              const IconComponent = mood?.icon || Smile;
                              return <IconComponent className="w-4 h-4" />;
                            })()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {entry.entries.map((entryText, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-600">
                              <Heart className="w-2 h-2 text-blue-400" />
                              <span className="text-xs">{entryText}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-purple-600 mb-4">Partner's Entries</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {partnerEntries
                    .filter(entry => entry.date !== today)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="border border-purple-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                          <div className="text-purple-500">
                            {(() => {
                              const mood = moods.find(m => m.id === entry.mood);
                              const IconComponent = mood?.icon || Smile;
                              return <IconComponent className="w-4 h-4" />;
                            })()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {entry.entries.map((entryText, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-600">
                              <Heart className="w-2 h-2 text-purple-400" />
                              <span className="text-xs">{entryText}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
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
                        <div className="text-green-500">
                          {(() => {
                            const mood = moods.find(m => m.id === entry.mood);
                            const IconComponent = mood?.icon || Smile;
                            return <IconComponent className="w-6 h-6" />;
                          })()}
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
              
              {!bothCompleted && (
                <div className="text-center mt-4 p-4 bg-yellow-50 rounded-xl">
                  <p className="text-yellow-800">Invite your partner to share their gratitude too!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {entries.length === 0 && partnerEntries.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Start Your Gratitude Journey Together</h3>
          <p className="text-gray-600">
            Research shows that practicing gratitude as a couple can improve relationship satisfaction and overall well-being.
          </p>
        </div>
      )}
    </div>
  )
}