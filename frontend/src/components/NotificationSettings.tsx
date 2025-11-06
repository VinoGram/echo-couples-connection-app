import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Bell, BellOff, Clock, Heart, Zap, Trophy, Settings } from 'lucide-react'

interface NotificationPreferences {
  dailyQuestion: boolean
  partnerAnswered: boolean
  streakMilestones: boolean
  newUnlocks: boolean
  preferredTime: 'morning' | 'afternoon' | 'evening'
  enabled: boolean
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyQuestion: true,
    partnerAnswered: true,
    streakMilestones: true,
    newUnlocks: true,
    preferredTime: 'evening',
    enabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const data = await api.getNotificationSettings()
      setPreferences(data.preferences)
    } catch (error) {
      toast.error('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true)
    try {
      await api.updateNotificationSettings(newPreferences)
      setPreferences(newPreferences)
      toast.success('Notification settings updated')
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    savePreferences(newPreferences)
  }

  const handleUnsubscribeAll = async () => {
    setSaving(true)
    try {
      await api.unsubscribeAllNotifications()
      setPreferences({
        dailyQuestion: false,
        partnerAnswered: false,
        streakMilestones: false,
        newUnlocks: false,
        preferredTime: 'evening',
        enabled: false
      })
      toast.success('Unsubscribed from all notifications')
    } catch (error) {
      toast.error('Failed to unsubscribe')
    } finally {
      setSaving(false)
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-pink-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notification Settings</h2>
            <p className="text-gray-600">Manage how and when you receive notifications</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              {preferences.enabled ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">All Notifications</h3>
                <p className="text-sm text-gray-600">Enable or disable all notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enabled', !preferences.enabled)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.enabled ? 'bg-pink-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Individual Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="font-semibold text-gray-800">Daily Questions</h3>
                  <p className="text-sm text-gray-600">Get notified about new daily questions</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('dailyQuestion', !preferences.dailyQuestion)}
                disabled={saving || !preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.dailyQuestion && preferences.enabled ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.dailyQuestion && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-800">Partner Answered</h3>
                  <p className="text-sm text-gray-600">When your partner answers a question</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('partnerAnswered', !preferences.partnerAnswered)}
                disabled={saving || !preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.partnerAnswered && preferences.enabled ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.partnerAnswered && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-gray-800">Streak Milestones</h3>
                  <p className="text-sm text-gray-600">Celebrate your relationship streaks</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('streakMilestones', !preferences.streakMilestones)}
                disabled={saving || !preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.streakMilestones && preferences.enabled ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.streakMilestones && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-gray-800">New Unlocks</h3>
                  <p className="text-sm text-gray-600">New features and achievements</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('newUnlocks', !preferences.newUnlocks)}
                disabled={saving || !preferences.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.newUnlocks && preferences.enabled ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.newUnlocks && preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preferred Time */}
          <div className="p-4 border border-gray-200 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-800">Preferred Time</h3>
                <p className="text-sm text-gray-600">When would you like to receive notifications?</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => handleToggle('preferredTime', time)}
                  disabled={saving || !preferences.enabled}
                  className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                    preferences.preferredTime === time && preferences.enabled
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* One-tap Unsubscribe */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleUnsubscribeAll}
              disabled={saving}
              className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {saving ? 'Unsubscribing...' : 'Unsubscribe from All Notifications'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              You can always re-enable notifications later
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}