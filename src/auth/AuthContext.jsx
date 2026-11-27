import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { clearSession, readSession, SESSION_EXPIRED, writeSession } from './session'

const AuthContext = createContext(null)

/**
 * Sessão do usuário: token JWT do Core e { username, role }.
 * Ao carregar, a sessão guardada é conferida em GET /auth/me.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const [checking, setChecking] = useState(() => Boolean(readSession()))
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!readSession()) return
    const controller = new AbortController()
    api
      .me({ signal: controller.signal })
      .then(({ user }) => {
        const current = readSession()
        if (current && user) {
          const next = { ...current, user }
          writeSession(next)
          setSession(next)
        }
      })
      .catch(() => {
        /* 401 já limpa a sessão via SESSION_EXPIRED; Core fora do ar mantém a sessão */
      })
      .finally(() => setChecking(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const expire = (e) => {
      setSession(null)
      setNotice(e.detail ?? 'Sessão expirada. Entre novamente.')
    }
    window.addEventListener(SESSION_EXPIRED, expire)
    return () => window.removeEventListener(SESSION_EXPIRED, expire)
  }, [])

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login(username, password)
    const next = { token, user }
    writeSession(next)
    setSession(next)
    setNotice(null)
    return user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    setNotice(null)
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isDba: session?.user?.role === 'DBA',
      checking,
      notice,
      login,
      logout,
    }),
    [session, checking, notice, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Protege as rotas da aplicação: sem sessão, volta para o login. */
export function RequireAuth({ children }) {
  const { user, checking } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (checking) return <div className="page"><div className="notice notice--info">Verificando sessão...</div></div>
  return children
}
