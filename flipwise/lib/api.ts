// API client for interacting with the FastAPI backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Helper function for making API requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`

  // Add default headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies for auth
  })

  // Handle non-2xx responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API request failed with status ${response.status}`)
  }

  // Parse JSON response
  return response.json()
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  },

  register: async (email: string, password: string, username?: string) => {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    })
  },

  logout: async () => {
    return fetchAPI("/auth/logout", {
      method: "POST",
    })
  },
}

// Study Sets API
export const studySetsAPI = {
  getAll: async (userId?: string) => {
    const query = userId ? `?user_id=${userId}` : ""
    return fetchAPI(`/study-sets${query}`)
  },

  getById: async (id: string) => {
    return fetchAPI(`/study-sets/${id}`)
  },

  create: async (
    userId: string,
    data: {
      title: string
      description?: string
      flashcards: { front_text: string; back_text: string }[]
    },
  ) => {
    return fetchAPI(`/study-sets?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (
    id: string,
    userId: string,
    data: {
      title: string
      description?: string
      flashcards: { id?: string; front_text: string; back_text: string }[]
    },
  ) => {
    return fetchAPI(`/study-sets/${id}?user_id=${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string, userId: string) => {
    return fetchAPI(`/study-sets/${id}?user_id=${userId}`, {
      method: "DELETE",
    })
  },
}

// Profile API
export const profileAPI = {
  get: async (userId: string) => {
    return fetchAPI(`/profile/${userId}`)
  },

  update: async (userId: string, username: string) => {
    return fetchAPI(`/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ username }),
    })
  },
}

// Study Sessions API
export const studySessionsAPI = {
  create: async (userId: string, studySetId: string, mode: string) => {
    return fetchAPI("/study-sessions", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, study_set_id: studySetId, mode }),
    })
  },

  complete: async (sessionId: string) => {
    return fetchAPI(`/study-sessions/${sessionId}/complete`, {
      method: "PUT",
    })
  },
}

