const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Users
  async createUser(telegramId, username, firstName) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: telegramId,
        username,
        first_name: firstName,
      }),
    });
  }

  async getUser(telegramId) {
    return this.request(`/users/${telegramId}`);
  }

  // Exercises
  async getExercises() {
    return this.request('/exercises');
  }

  async createExercise(name, category, photoPath) {
    return this.request('/exercises', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category,
        photo_path: photoPath,
      }),
    });
  }

  // Workout Logs
  async getWorkoutLogs(userId, limit = 20) {
    return this.request(`/workout-logs/${userId}?limit=${limit}`);
  }

  async createWorkoutLog(userId, exerciseId, setNumber, weight, reps) {
    return this.request('/workout-logs', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight,
        reps,
      }),
    });
  }

  // Statistics
  async getStats(userId) {
    return this.request(`/stats/${userId}`);
  }
}

export const apiService = new ApiService();
