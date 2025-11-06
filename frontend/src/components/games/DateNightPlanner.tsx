import { useState } from 'react'
import { Calendar, ArrowLeft, MapPin, Clock, DollarSign, Shuffle } from 'lucide-react'

interface DateNightPlannerProps {
  onComplete: (data: any) => void
  onExit: () => void
}

export function DateNightPlanner({ onComplete, onExit }: DateNightPlannerProps) {
  const [preferences, setPreferences] = useState({
    budget: '',
    time: '',
    location: '',
    mood: ''
  })
  const [generatedDate, setGeneratedDate] = useState<any>(null)

  const budgetOptions = [
    { id: 'free', label: 'Free ($0)', icon: '🆓' },
    { id: 'low', label: 'Budget ($1-25)', icon: '💰' },
    { id: 'medium', label: 'Moderate ($25-75)', icon: '💳' },
    { id: 'high', label: 'Splurge ($75+)', icon: '💎' }
  ]

  const timeOptions = [
    { id: 'morning', label: 'Morning (9AM-12PM)', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon (12PM-5PM)', icon: '☀️' },
    { id: 'evening', label: 'Evening (5PM-9PM)', icon: '🌆' },
    { id: 'night', label: 'Night (9PM+)', icon: '🌙' }
  ]

  const locationOptions = [
    { id: 'home', label: 'At Home', icon: '🏠' },
    { id: 'outdoor', label: 'Outdoors', icon: '🌳' },
    { id: 'city', label: 'In the City', icon: '🏙️' },
    { id: 'adventure', label: 'Adventure', icon: '🗺️' }
  ]

  const moodOptions = [
    { id: 'romantic', label: 'Romantic', icon: '💕' },
    { id: 'fun', label: 'Fun & Playful', icon: '🎉' },
    { id: 'relaxing', label: 'Relaxing', icon: '😌' },
    { id: 'adventurous', label: 'Adventurous', icon: '🚀' }
  ]

  const dateIdeas = {
    'free-morning-home-romantic': {
      title: 'Sunrise Coffee Date',
      activities: ['Watch sunrise together', 'Make breakfast in bed', 'Share morning coffee'],
      duration: '2 hours'
    },
    'low-evening-outdoor-fun': {
      title: 'Picnic & Stargazing',
      activities: ['Pack homemade dinner', 'Find a scenic spot', 'Stargaze and share stories'],
      duration: '3 hours'
    },
    'medium-afternoon-city-adventurous': {
      title: 'City Explorer Date',
      activities: ['Try a new restaurant', 'Visit a museum', 'Walk through local markets'],
      duration: '4 hours'
    }
  }

  const generateDate = () => {
    const key = `${preferences.budget}-${preferences.time}-${preferences.location}-${preferences.mood}`
    const fallbackDate = {
      title: 'Custom Date Night',
      activities: ['Plan something special together', 'Focus on quality time', 'Create new memories'],
      duration: '2-3 hours'
    }
    
    setGeneratedDate(dateIdeas[key as keyof typeof dateIdeas] || fallbackDate)
  }

  const handleComplete = () => {
    onComplete({
      gameType: 'date_night_planner',
      preferences,
      generatedDate,
      completed: true
    })
  }

  if (generatedDate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setGeneratedDate(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2 text-purple-500">
              <Calendar className="w-6 h-6" />
              <span className="font-bold">Your Date Night</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{generatedDate.title}</h2>
            <p className="text-gray-600">Perfect for your preferences!</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activities ({generatedDate.duration})
            </h3>
            <ul className="space-y-2">
              {generatedDate.activities.map((activity: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  {activity}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGeneratedDate(null)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Shuffle className="w-5 h-5" />
              Generate New
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Save Date Plan
            </button>
          </div>
        </div>
      </div>
    )
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
            <Calendar className="w-6 h-6" />
            <span className="font-bold">Date Night Planner</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan Your Perfect Date</h2>
          <p className="text-gray-600">Tell us your preferences and we'll create the perfect date night!</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferences({...preferences, budget: option.id})}
                  className={`p-3 rounded-xl border transition-all ${
                    preferences.budget === option.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-lg mr-2">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time of Day
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {timeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferences({...preferences, time: option.id})}
                  className={`p-3 rounded-xl border transition-all ${
                    preferences.time === option.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-lg mr-2">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {locationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferences({...preferences, location: option.id})}
                  className={`p-3 rounded-xl border transition-all ${
                    preferences.location === option.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-lg mr-2">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3">Mood</h3>
            <div className="grid grid-cols-2 gap-3">
              {moodOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPreferences({...preferences, mood: option.id})}
                  className={`p-3 rounded-xl border transition-all ${
                    preferences.mood === option.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-lg mr-2">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateDate}
          disabled={!preferences.budget || !preferences.time || !preferences.location || !preferences.mood}
          className="w-full mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Perfect Date Night
        </button>
      </div>
    </div>
  )
}