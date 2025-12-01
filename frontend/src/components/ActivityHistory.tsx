import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Calendar, MessageCircle, Gamepad2, Heart, BarChart3, User, Clock, ChevronDown, ChevronRight } from 'lucide-react'

export function ActivityHistory() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await api.getCoupleActivitiesHistory()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }



  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'daily_question': return MessageCircle
      case 'game': return Gamepad2
      case 'exercise': return Heart
      case 'quiz': return BarChart3
      default: return Calendar
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'daily_question': return 'from-pink-500 to-rose-500'
      case 'game': return 'from-blue-500 to-indigo-500'
      case 'exercise': return 'from-green-500 to-emerald-500'
      case 'quiz': return 'from-purple-500 to-violet-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

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
          Activity History
        </h2>
        <p className="text-gray-600">Your shared journey together</p>

      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No activities yet</h3>
          <p className="text-gray-500">Start completing activities together to see your history!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)
            const isExpanded = expandedActivity === activity.id
            
            return (
              <div key={activity.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800 capitalize">
                          {activity.type.replace('_', ' ')} - {activity.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Clock className="w-4 h-4" />
                            {new Date(activity.completedAt).toLocaleDateString()}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Click to view both responses
                      </p>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-pink-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-pink-600" />
                          <span className="font-medium text-pink-800">{activity.user.name}</span>
                        </div>
                        <div className="text-gray-700">
                          {activity.user.answers ? (
                            <div className="space-y-2">
                              {activity.user.answers.map((answer: any, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3">
                                  <span className="font-medium text-pink-700">Q{index + 1}:</span>
                                  <p className="mt-1">{answer.question || 'Question'}</p>
                                  <p className="text-pink-600 font-medium">Choice: {answer.choice || answer.answer || JSON.stringify(answer)}</p>
                                </div>
                              ))}
                            </div>
                          ) : activity.user.response ? (
                            typeof activity.user.response === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(activity.user.response).map(([key, value]) => (
                                  <div key={key} className="bg-white rounded-lg p-3">
                                    <span className="font-medium text-pink-700 capitalize">{key}:</span>
                                    <p className="mt-1">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-3">
                                {activity.user.response}
                              </div>
                            )
                          ) : (
                            <div className="bg-white rounded-lg p-3 text-gray-500">
                              No response data
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-purple-800">{activity.partner.name}</span>
                        </div>
                        <div className="text-gray-700">
                          {activity.partner.answers ? (
                            <div className="space-y-2">
                              {activity.partner.answers.map((answer: any, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3">
                                  <span className="font-medium text-purple-700">Q{index + 1}:</span>
                                  <p className="mt-1">{answer.question || 'Question'}</p>
                                  <p className="text-purple-600 font-medium">Choice: {answer.choice || answer.answer || JSON.stringify(answer)}</p>
                                </div>
                              ))}
                            </div>
                          ) : activity.partner.response ? (
                            typeof activity.partner.response === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(activity.partner.response).map(([key, value]) => (
                                  <div key={key} className="bg-white rounded-lg p-3">
                                    <span className="font-medium text-purple-700 capitalize">{key}:</span>
                                    <p className="mt-1">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-3">
                                {activity.partner.response}
                              </div>
                            )
                          ) : (
                            <div className="bg-white rounded-lg p-3 text-gray-500">
                              No response data
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}