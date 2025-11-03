import { prisma } from './db'

export interface NotificationPreferences {
  dailyQuestion: boolean
  partnerAnswered: boolean
  streakMilestones: boolean
  newUnlocks: boolean
  preferredTime: 'morning' | 'afternoon' | 'evening'
  enabled: boolean
}

export async function sendCoordinatedNotification(coupleId: string, type: string, message: string) {
  try {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    })

    if (!couple) return

    const user1Prefs = JSON.parse(couple.user1.profile?.notificationPreferences || '{}') as NotificationPreferences
    const user2Prefs = JSON.parse(couple.user2.profile?.notificationPreferences || '{}') as NotificationPreferences

    // Send to both partners if they have notifications enabled for this type
    const notifications = []
    
    if (user1Prefs.enabled && user1Prefs[type as keyof NotificationPreferences]) {
      notifications.push(sendPushNotification(couple.user1.id, message))
    }
    
    if (user2Prefs.enabled && user2Prefs[type as keyof NotificationPreferences]) {
      notifications.push(sendPushNotification(couple.user2.id, message))
    }

    await Promise.all(notifications)
  } catch (error) {
    console.error('Failed to send coordinated notification:', error)
  }
}

async function sendPushNotification(userId: string, message: string) {
  // Placeholder for actual push notification implementation
  console.log(`Sending notification to user ${userId}: ${message}`)
  // In production, integrate with Firebase, OneSignal, or similar service
}

export async function scheduleCoordinatedNotifications() {
  try {
    const couples = await prisma.couple.findMany({
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    })

    for (const couple of couples) {
      const user1Prefs = JSON.parse(couple.user1.profile?.notificationPreferences || '{}') as NotificationPreferences
      const user2Prefs = JSON.parse(couple.user2.profile?.notificationPreferences || '{}') as NotificationPreferences

      // Find common preferred time or default to evening
      const commonTime = user1Prefs.preferredTime === user2Prefs.preferredTime 
        ? user1Prefs.preferredTime 
        : 'evening'

      // Schedule daily question notification
      if ((user1Prefs.enabled && user1Prefs.dailyQuestion) || 
          (user2Prefs.enabled && user2Prefs.dailyQuestion)) {
        await scheduleNotification(couple.id, 'dailyQuestion', commonTime)
      }
    }
  } catch (error) {
    console.error('Failed to schedule notifications:', error)
  }
}

async function scheduleNotification(coupleId: string, type: string, time: string) {
  // Placeholder for scheduling logic
  console.log(`Scheduled ${type} notification for couple ${coupleId} at ${time}`)
}