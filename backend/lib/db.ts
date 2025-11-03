import { getDb } from './mongodb'
import { ObjectId } from 'mongodb'
import * as Models from './models'

export class Database {
  static async getUsers() {
    const db = await getDb()
    return db.collection<Models.User>('users')
  }

  static async getUserProfiles() {
    const db = await getDb()
    return db.collection<Models.UserProfile>('userProfiles')
  }

  static async getCouples() {
    const db = await getDb()
    return db.collection<Models.Couple>('couples')
  }

  static async getQuestions() {
    const db = await getDb()
    return db.collection<Models.Question>('questions')
  }

  static async getDailyQuestions() {
    const db = await getDb()
    return db.collection<Models.DailyQuestion>('dailyQuestions')
  }

  static async getResponses() {
    const db = await getDb()
    return db.collection<Models.Response>('responses')
  }

  static async getGameResults() {
    const db = await getDb()
    return db.collection<Models.GameResult>('gameResults')
  }

  static async getExercises() {
    const db = await getDb()
    return db.collection<Models.Exercise>('exercises')
  }

  static async getQuizzes() {
    const db = await getDb()
    return db.collection<Models.Quiz>('quizzes')
  }

  static async getMessages() {
    const db = await getDb()
    return db.collection<Models.Message>('messages')
  }
}

export const db = Database