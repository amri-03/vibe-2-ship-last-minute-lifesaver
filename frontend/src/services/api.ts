import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach bearer token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bearer_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response.data?.error || ''
      if (errorMsg === 'GOOGLE_AUTH_REQUIRED' || errorMsg === 'SESSION_EXPIRED') {
        localStorage.removeItem('bearer_token')
        window.dispatchEvent(
          new CustomEvent('auth:unauthorized', { detail: { reason: errorMsg } })
        )
      }
    }
    return Promise.reject(error)
  }
)

export default api
