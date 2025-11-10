import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { User, Heart, Calendar, Trophy, ArrowLeft } from 'lucide-react'

interface CoupleResultsProps {
  activityType: string
  activityName: string
  onBack?: () => void
}

export function CoupleResults({ activityType, activityName, onBack }: CoupleResultsProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [activityType, activityName])

  const loadResults = async () => {
    try {
      const data = await api.getCoupleActivityResults(activityType, activityName)
      setResults(data)
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  const activityLabel = activityType === 'game' ? 'Games' : activityType === 'exercise' ? 'Exercises' : 'Activities'
  const activitySingular = activityType === 'game' ? 'game' : activityType === 'exercise' ? 'exercise' : 'activity'

  if (!results?.hasPartner) {
    return (
      <div className="text-center py-8 space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mx-auto">
            <ArrowLeft className="w-5 h-5" />
            Back to {activityLabel}
          </button>
        )}
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
          <p className="text-gray-700">You need to be connected with a partner to view results.</p>
        </div>
      </div>
    )
  }

  if (!results?.results) {
    return (
      <div className="text-center py-8 space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mx-auto">
            <ArrowLeft className="w-5 h-5" />
            Back to {activityLabel}
          </button>
        )}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results Yet</h3>
          <p className="text-gray-700 mb-4">
            You and your partner haven't completed this {activitySingular} together yet.
          </p>
          <p className="text-sm text-gray-600">
            Complete the {activitySingular} first, then come back to see your results!
          </p>
        </div>
      </div>
    )
  }

  if (!results?.bothCompleted) {
    return (
      <div className="text-center py-8 space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mx-auto">
            <ArrowLeft className="w-5 h-5" />
            Back to {activityLabel}
          </button>
        )}
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Waiting for Partner</h3>
          <p className="text-gray-700">
            You've completed this {activitySingular}, but waiting for your partner to finish.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Activity Results</h2>
          <p className="text-gray-600 capitalize">{activityType.replace('_', ' ')} - {activityName}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">{results.results.user.name}</h3>
            </div>
            <div className="bg-white rounded-xl p-4">
              {typeof results.results.user.response === 'object' ? (
                <div className="space-y-2">
                  {Object.entries(results.results.user.response).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="ml-2 text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">{results.results.user.response}</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">{results.results.partner.name}</h3>
            </div>
            <div className="bg-white rounded-xl p-4">
              {typeof results.results.partner.response === 'object' ? (
                <div className="space-y-2">
                  {Object.entries(results.results.partner.response).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="ml-2 text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">{results.results.partner.response}</p>
              )}
            </div>
          </div>
        </div>

        {results.results.completedAt && (
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Completed on {new Date(results.results.completedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}