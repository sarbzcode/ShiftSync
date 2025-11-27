import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as loginService, logout as logoutService, loadSession } from '../services/auth'
import { User } from '../types/api'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      const session = await loadSession()
      setUser(session.user)
      setToken(session.token)
      setLoading(false)
    }
    bootstrap()
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const session = await loginService(username, password)
      setUser(session.user)
      setToken(session.token)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await logoutService()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
