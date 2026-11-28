// Sessão guardada no navegador. O localStorage pode estar bloqueado (aba
// anônima, política do navegador): nesse caso a sessão vive só na memória.
const KEY = 'placeholder.session'
let memory = null

export function readSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* armazenamento indisponível ou conteúdo corrompido */
  }
  return memory
}

export function writeSession(session) {
  memory = session
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* segue só em memória */
  }
}

export function clearSession() {
  memory = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nada a limpar */
  }
}

/** Disparado pelo cliente da API quando o Core responde 401. */
export const SESSION_EXPIRED = 'placeholder:session-expired'
