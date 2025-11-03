import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  email: string
  password: string
  createdAt: Date
}

export interface UserProfile {
  _id?: ObjectId
  userId: ObjectId
  displayName: string
  avatar?: string
  gender?: string
  birthday?: Date
  religion?: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  achievements: string[]
  notificationPreferences: {
    dailyQuestion: boolean
    partnerAnswered: boolean
    streakMilestones: boolean
    newUnlocks: boolean
    preferredTime: 'morning' | 'afternoon' | 'evening'
    enabled: boolean
    pushEnabled?: boolean
    pushEndpoint?: string
  }
}

export interface Couple {
  _id?: ObjectId
  user1Id: ObjectId
  user2Id: ObjectId
  connectionCode: string
  anniversaryDate?: Date
  createdAt: Date
  streak: number
  totalXP: number
  level: number
}

export interface Question {
  _id?: ObjectId
  text: string
  category: string
  depth: string
  module: string
  occasion?: string
  isActive: boolean
}

export interface DailyQuestion {
  _id?: ObjectId
  coupleId: ObjectId
  questionId: ObjectId
  date: string
  isCompleted: boolean
  xpAwarded: number
  createdAt: Date
}

export interface Response {
  _id?: ObjectId
  userId: ObjectId
  coupleId: ObjectId
  dailyQuestionId: ObjectId
  answer: string
  isPrivate: boolean
  createdAt: Date
}

export interface GameResult {
  _id?: ObjectId
  coupleId: ObjectId
  gameType: string
  player1Id: ObjectId
  player2Id: ObjectId
  score: number
  data: any
  completedAt: Date
}

export interface Exercise {
  _id?: ObjectId
  coupleId: ObjectId
  type: string
  data: any
  lastUpdated: Date
}

export interface Quiz {
  _id?: ObjectId
  userId: ObjectId
  coupleId: ObjectId
  quizType: string
  results: any
  completedAt: Date
}

export interface Message {
  _id?: ObjectId
  coupleId: ObjectId
  senderId: ObjectId
  content: string
  createdAt: Date
}