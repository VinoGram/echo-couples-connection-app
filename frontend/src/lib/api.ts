// Force production URL - no localhost fallback
const API_BASE_URL = 'https://echo-backend-pml9.onrender.com/api'

class ApiClient {
  private token: string | null = null

  constructor() {
    this.token = sessionStorage.getItem('auth_token')
  }

  setToken(token: string) {
    this.token = token
    sessionStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    sessionStorage.removeItem('auth_token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    console.log(`Making request to: ${url}`, { method: options.method || 'GET', body: options.body })

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`Response status: ${response.status}`, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error ${response.status}:`, errorText)
      
      // Try to parse error as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error || errorText)
      } catch {
        throw new Error(errorText || `${response.status} ${response.statusText}`)
      }
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(result.token)
    return result
  }

  async register(email: string, password: string, username: string) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    })
    this.setToken(result.token)
    return result
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // Couples
  async createCouple() {
    return this.request('/couples/create', { method: 'POST' })
  }

  async joinCouple(connectionCode: string) {
    return this.request('/couples/join', {
      method: 'POST',
      body: JSON.stringify({ connectionCode }),
    })
  }

  async sendConnectionCode(email: string, connectionCode: string) {
    return this.request('/couples/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, connectionCode }),
    })
  }

  async sendInvitation(email: string, senderName: string, connectionCode: string) {
    return this.request('/invitations/send', {
      method: 'POST',
      body: JSON.stringify({ email, senderName, connectionCode }),
    })
  }

  async sendWhatsAppInvite(partnerPhone: string) {
    return this.request('/users/invite-partner', {
      method: 'POST',
      body: JSON.stringify({ partnerPhone }),
    })
  }

  async getCurrentCouple() {
    return this.request('/couples/current')
  }

  // Questions
  async getTodaysQuestion() {
    return this.request('/questions/today')
  }

  async getTodayQuestion() {
    return this.request('/questions/today')
  }

  async submitAnswer(dailyQuestionId: string, answer: string) {
    return this.request('/questions/submit', {
      method: 'POST',
      body: JSON.stringify({ dailyQuestionId, answer }),
    })
  }

  async browseQuestions(category?: string, depth?: string) {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (depth) params.append('depth', depth)
    return this.request(`/questions/browse?${params}`)
  }

  // Games
  async submitGameResult(gameType: string, data: any) {
    return this.request('/games/submit', {
      method: 'POST',
      body: JSON.stringify({ gameType, data }),
    })
  }

  async getPartnerGameResults(gameType: string) {
    return this.request(`/games/partner-results/${gameType}`)
  }

  // Exercises
  async getExercise(type: string) {
    return this.request(`/exercises/${type}`)
  }

  async updateExercise(type: string, data: any) {
    return this.request(`/exercises/${type}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    })
  }

  async submitExerciseResult(exerciseType: string, data: any) {
    return this.request('/exercises/submit', {
      method: 'POST',
      body: JSON.stringify({ exerciseType, data }),
    })
  }

  async getPartnerExerciseResults(exerciseType: string) {
    return this.request(`/exercises/partner-results/${exerciseType}`)
  }

  // Quizzes
  async submitQuiz(quizType: string, results: any) {
    return this.request('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify({ quizType, results }),
    })
  }

  async getPartnerQuizResults(quizType: string) {
    return this.request(`/quizzes/partner-results/${quizType}`)
  }

  async getQuizzes() {
    return this.request('/quizzes')
  }

  // Chat
  async getMessages() {
    return this.request('/chat')
  }

  async sendMessage(content: string) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async markMessagesAsRead() {
    return this.request('/chat/read', {
      method: 'PUT',
    })
  }

  // Notifications
  async getNotificationSettings() {
    return this.request('/notifications/settings')
  }

  async updateNotificationSettings(preferences: any) {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    })
  }

  async unsubscribeAllNotifications() {
    return this.request('/notifications/settings', {
      method: 'DELETE',
    })
  }

  // Push Notifications
  async subscribeToPush(subscription: any) {
    return this.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  }

  async unsubscribeFromPush() {
    return this.request('/push/subscribe', {
      method: 'DELETE',
    })
  }

  // Awards
  async getLeaderboard() {
    return this.request('/awards/leaderboard')
  }

  // Partner name
  async updatePartnerName(partnerName: string) {
    return this.request('/users/partner-name', {
      method: 'PUT',
      body: JSON.stringify({ partnerName }),
    })
  }

  async getPartnerName() {
    return this.request('/users/partner-name')
  }

  async getUserStats() {
    // Refresh token from sessionStorage in case it was updated
    this.token = sessionStorage.getItem('auth_token')
    return this.request('/users/stats')
  }

  // Test endpoint
  async addTestXP() {
    this.token = sessionStorage.getItem('auth_token')
    return this.request('/users/test-xp', { method: 'POST' })
  }

  // Couple Activities
  async submitCoupleActivity(activityType: string, activityName: string, response: any, activityData?: any) {
    return this.request('/activities/submit', {
      method: 'POST',
      body: JSON.stringify({ activityType, activityName, response, activityData })
    })
  }

  async getCoupleActivityResults(activityType: string, activityName: string) {
    return this.request(`/activities/results/${activityType}/${activityName}`)
  }

  async getCoupleActivitiesHistory() {
    return this.request('/activities/history')
  }

  async testCoupleActivities() {
    return this.request('/activities/test', { method: 'POST' })
  }

  async createCoupleActivitiesTable() {
    return this.request('/activities/create-table', { method: 'POST' })
  }
}

export const api = new ApiClient()