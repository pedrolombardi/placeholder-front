// Cliente do Backend Core. Em desenvolvimento o Vite faz proxy de /api para
// localhost:3000; no container o nginx faz o mesmo para o servico "backend".
import { clearSession, readSession, SESSION_EXPIRED } from './auth/session'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(status, message, issues) {
    super(message)
    this.status = status
    this.issues = issues
  }
}

async function call(method, path, body, { signal, anonymous = false, text = false } = {}) {
  const headers = {}
  if (body) headers['content-type'] = 'application/json'
  const token = anonymous ? null : readSession()?.token
  if (token) headers.authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError(0, 'Backend Core indisponível')
  }
  if (text && res.ok) return res.text()
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !anonymous) {
    clearSession()
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED, { detail: data.error }))
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `HTTP ${res.status}`, data.issues)
  return data
}

export const api = {
  login: (username, password) => call('POST', '/auth/login', { username, password }, { anonymous: true }),
  me: (opts) => call('GET', '/auth/me', undefined, opts),
  metrics: (opts) => call('GET', '/metrics', undefined, opts),
  createMigration: (input) => call('POST', '/migrations', input),
  listMigrations: (opts) => call('GET', '/migrations', undefined, opts),
  getMigration: (id, opts) => call('GET', `/migrations/${id}`, undefined, opts),
  events: (id, opts) => call('GET', `/migrations/${id}/events`, undefined, opts),
  analyze: (id) => call('POST', `/migrations/${id}/analyze`),
  approve: (id, decisions) => call('POST', `/migrations/${id}/approve`, { decisions }),
  reject: (id, reason) => call('POST', `/migrations/${id}/reject`, { reason }),
  execute: (id) => call('POST', `/migrations/${id}/execute`),
  script: (id) => call('GET', `/migrations/${id}/script`, undefined, { text: true }),
  connections: (opts) => call('GET', '/connections', undefined, opts),
  createConnection: (input) => call('POST', '/connections', input),
  deleteConnection: (id) => call('DELETE', `/connections/${id}`),
  testConnection: (id) => call('POST', `/connections/${id}/test`),
  settings: (opts) => call('GET', '/settings', undefined, opts),
}

/** Rota que não existe nesta versão do Core. */
export const isMissingRoute = (e) => e?.status === 404

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Consulta a migração enquanto ela estiver num dos status `busy`.
 * Para quando o `signal` é abortado (AbortError) ou quando passa de `timeoutMs`.
 */
export async function waitWhile(id, busy, onTick, { signal, timeoutMs = 180_000, intervalMs = 800 } = {}) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const m = await api.getMigration(id, { signal })
    onTick?.(m)
    if (!busy.includes(m.status)) return m
    if (Date.now() > deadline) {
      throw new ApiError(0, `Tempo de espera esgotado com a migração em ${m.status}. Tente novamente para continuar acompanhando.`)
    }
    await sleep(intervalMs, signal)
  }
}

export const isAbort = (e) => e?.name === 'AbortError'
