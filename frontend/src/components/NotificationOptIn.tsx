import { useState } from 'react'
import { toast } from 'sonner'
import { pushManager } from '../lib/pushNotifications'
import { Bell, X, Heart, MessageCircle, Zap, Trophy } from 'lucide-react'

interface NotificationOptInProps {
  onComplete: (enabled: boolean) => void
}

export function NotificationOptIn({ onComplete }: NotificationOptInProps) {
  const [loading, setLoading] = useState(false)

  const handleEnable = async () => {
    setLoading(true)
    try {
      const initialized = await pushManager.initialize()
      if (!initialized) {
        toast.error('Push notifications not supported')
        onComplete(false)
        return
      }

      const hasPermission = await pushManager.requestPermission()
      if (!hasPermission) {
        toast.error('Notification permission denied')
        onComplete(false)
        return
      }

      const subscription = await pushManager.subscribe()
      if (subscription) {
        toast.success('Notifications enabled!')
        onComplete(true)
      } else {
        toast.error('Failed to enable notifications')
        onComplete(false)
      }
    } catch (error) {
      toast.error('Failed to enable notifications')
      onComplete(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Stay Connected Together
          </h2>
          <p className="text-gray-600">
            Get notified when your partner engages and never miss a moment to connect
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <p className="font-medium text-gray-800">Daily Questions</p>
              <p className="text-sm text-gray-600">Your Daily Question is ready!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-800">Partner Activity</p>
              <p className="text-sm text-gray-600">Sam answered today's question! Tap to see and discuss.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
            <Zap className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium text-gray-800">Streak Milestones</p>
              <p className="text-sm text-gray-600">Congratulations! 7-day streak!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <Trophy className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-800">New Unlocks</p>
              <p className="text-sm text-gray-600">You've unlocked the Finance topic!</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enabling...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Bell className="w-5 h-5" />
                <span>Enable Notifications</span>
              </div>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 px-6 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change notification settings anytime in your profile
        </p>
      </div>
    </div>
  )
}