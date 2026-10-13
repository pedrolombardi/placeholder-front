// Cliente do Backend Core. Em desenvolvimento o Vite faz proxy de /api para
// localhost:3000; no container o nginx faz o mesmo para o servico "backend".
const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export const api = {
  createMigration: (input) => call('POST', '/migrations', input),
  listMigrations: () => call('GET', '/migrations'),
  getMigration: (id) => call('GET', `/migrations/${id}`),
  events: (id) => call('GET', `/migrations/${id}/events`),
  analyze: (id) => call('POST', `/migrations/${id}/analyze`),
  approve: (id, decisions) => call('POST', `/migrations/${id}/approve`, { decisions }),
  reject: (id, reason) => call('POST', `/migrations/${id}/reject`, { reason }),
  execute: (id) => call('POST', `/migrations/${id}/execute`),
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Consulta a migracao ate sair dos status em andamento. */
export async function waitWhile(id, busy, onTick) {
  for (;;) {
    const m = await api.getMigration(id)
    onTick?.(m)
    if (!busy.includes(m.status)) return m
    await sleep(800)
  }
}
