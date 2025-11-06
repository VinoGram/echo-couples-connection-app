const API_BASE_URL = 'http://localhost:3000/api'

class ApiClient {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
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

  async register(email: string, password: string, gender: string) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, gender }),
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

  // Quizzes
  async submitQuiz(quizType: string, results: any) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify({ quizType, results }),
    })
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
}

export const api = new ApiClient()