// Rótulos em português para os valores que o Backend Core devolve.

export const ROLE_LABEL = { DBA: 'DBA', DEV_QA: 'Dev/QA' }

export const initials = (username = '') => username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'

export const ROLE_PERMISSIONS = {
  DBA: [
    'Criar migrações e disparar a análise',
    'Consultar projetos, relatórios, métricas e auditoria',
    'Homologar (aprovar ou rejeitar) propostas e decidir os conflitos deferidos pela IA',
    'Executar migrações aprovadas',
  ],
  DEV_QA: [
    'Criar migrações e disparar a análise',
    'Consultar projetos, relatórios, métricas e auditoria',
  ],
}

/** status → [rótulo, tom do badge, progresso %] */
export const STATUS = {
  CREATED: ['Criada', 'neutral', 5],
  ANALYZING: ['Analisando', 'info', 20],
  WAITING_APPROVAL: ['Aguardando homologação', 'warning', 45],
  APPROVED: ['Aprovada', 'info', 55],
  EXECUTING: ['Gerando sandbox', 'info', 70],
  VALIDATING: ['Validando', 'info', 85],
  COMPLETED: ['Concluída', 'success', 100],
  REJECTED: ['Rejeitada', 'neutral', 100],
  FAILED: ['Falhou', 'danger', 100],
}
export const statusLabel = (s) => STATUS[s]?.[0] ?? s
export const statusTone = (s) => STATUS[s]?.[1] ?? 'neutral'

export const DB_LABEL = { mysql: 'MySQL', oracle: 'Oracle' }
export const dbLabel = (t) => DB_LABEL[t] ?? t ?? '—'

export const DECIDED_BY = { rule: ['Regra', 'neutral'], ai: ['IA', 'info'], human: ['Humano', 'warning'] }

/** estratégia de anonimização do Data Layer → rótulo */
const STRATEGY_LABEL = {
  redact: 'mascarado, mesmo tamanho',
  pseudonymize_local_part: 'e-mail pseudonimizado',
  preserve_prefix: 'prefixo preservado',
  regenerate_document: 'documento regenerado',
  resample_name: 'nome sorteado',
  jitter: 'valor com ruído',
  mint_key: 'nova chave, mantém as FKs',
  mint_uuid: 'novo UUID',
  mint_handle: 'novo identificador',
  shuffle: 'embaralhado entre linhas',
}
export const strategyLabel = (s) => STRATEGY_LABEL[s] ?? s

const EVENT_LABEL = {
  MIGRATION_CREATED: 'Migração criada',
  PROPOSAL_CREATED: 'Proposta gerada',
  PROPOSAL_APPROVED: 'Proposta aprovada',
  PROPOSAL_REJECTED: 'Proposta rejeitada',
  SANDBOX_READY: 'Sandbox anonimizado pronto',
  PLAN_VALIDATED: 'Plano validado no sandbox',
  PLAN_SCRIPT_READY: 'Script de migração gerado',
  PLAN_APPLIED: 'Plano aplicado no destino',
  MIGRATION_COMPLETED: 'Migração concluída',
  MIGRATION_FAILED: 'Migração falhou',
}
const STATUS_CHANGED_LABEL = {
  ANALYZING: 'Análise iniciada',
  EXECUTING: 'Execução iniciada',
  VALIDATING: 'Validação iniciada',
}

export function eventLabel(e) {
  if (e.type === 'STATUS_CHANGED') return STATUS_CHANGED_LABEL[e.toStatus] ?? `Status: ${statusLabel(e.toStatus)}`
  return EVENT_LABEL[e.type] ?? e.type
}

// O Core grava um STATUS_CHANGED e, para estas chegadas, também um evento de negócio
// com os mesmos status. A auditoria mostra uma linha por transição: a do evento de negócio.
const STATUS_WITH_BUSINESS_EVENT = new Set(['WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED'])

export const oneRowPerTransition = (events) =>
  events.filter((e) => !(e.type === 'STATUS_CHANGED' && STATUS_WITH_BUSINESS_EVENT.has(e.toStatus)))

export const actorLabel = (actor) => (actor === 'system' ? 'Plataforma' : actor ?? '—')

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }) : '—'

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : '—')

export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—'
  if (ms < 1000) return `${ms} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1).replace('.', ',')} s`
  return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`
}

export const formatPercent = (ratio) => (ratio == null ? '—' : `${(ratio * 100).toFixed(1).replace('.', ',').replace(',0', '')}%`)

/** Totais do sandbox anonimizado de uma migração concluída. */
export function sandboxTotals(m) {
  const tables = m?.result?.sandbox?.tables ?? []
  return {
    tables: tables.length,
    rows: tables.reduce((n, t) => n + (t.rows ?? 0), 0),
    anonymizedColumns: tables.reduce((n, t) => n + (t.anonymizedColumns?.length ?? 0), 0),
  }
}

export function checksSummary(m) {
  const checks = m?.result?.validation?.checks ?? []
  return { total: checks.length, passed: checks.filter((c) => c.passed).length }
}
