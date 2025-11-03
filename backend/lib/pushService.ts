import webpush from 'web-push'
import { prisma } from './db'

// Configure VAPID keys (generate these for production)
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export interface PushNotification {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export async function sendPushToUser(userId: string, notification: PushNotification) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (!profile) return false

    const prefs = JSON.parse(profile.notificationPreferences)
    if (!prefs.pushEnabled || !prefs.pushEndpoint) return false

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      tag: notification.tag || 'echo-notification',
      data: notification.data || {},
      actions: notification.actions || []
    })

    // In a real implementation, you'd use the stored subscription
    // For now, just log the notification
    console.log(`Push notification for user ${userId}:`, payload)
    
    return true
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return false
  }
}

export async function sendCoordinatedPush(coupleId: string, notification: PushNotification) {
  try {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    })

    if (!couple) return false

    const results = await Promise.all([
      sendPushToUser(couple.user1Id, notification),
      sendPushToUser(couple.user2Id, notification)
    ])

    return results.some(result => result)
  } catch (error) {
    console.error('Failed to send coordinated push:', error)
    return false
  }
}

// Notification templates with icons instead of emojis
export const NotificationTemplates = {
  dailyQuestion: {
    title: 'Your Daily Question is ready!',
    body: 'Start a meaningful conversation with your partner',
    icon: '/icons/heart.png',
    tag: 'daily-question'
  },
  
  partnerAnswered: (partnerName: string) => ({
    title: `${partnerName} answered today's question!`,
    body: 'Tap to see and discuss their response',
    icon: '/icons/message.png',
    tag: 'partner-answered'
  }),

  streakMilestone: (days: number) => ({
    title: 'Congratulations!',
    body: `${days}-day streak achieved! Keep it going!`,
    icon: '/icons/fire.png',
    tag: 'streak-milestone'
  }),

  newUnlock: (feature: string) => ({
    title: 'New feature unlocked!',
    body: `You've unlocked ${feature}! Check it out now`,
    icon: '/icons/star.png',
    tag: 'new-unlock'
  }),

  gameInvite: (partnerName: string, game: string) => ({
    title: `${partnerName} started a new game!`,
    body: `Join them in '${game}'`,
    icon: '/icons/gamepad.png',
    tag: 'game-invite'
  }),

  loveNote: {
    title: 'You\'ve got a new love note!',
    body: 'Your partner left you a sweet message',
    icon: '/icons/heart.png',
    tag: 'love-note'
  }
}