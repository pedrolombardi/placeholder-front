import StatusBadge from './StatusBadge'
import { api, isMissingRoute } from '../api'
import { actorLabel, DECIDED_BY, eventLabel, formatDateTime, oneRowPerTransition, statusLabel } from '../labels'

/** Todas as colunas da proposta, com quem decidiu cada uma. */
export function ConflictTable({ conflicts }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Coluna</th><th>Origem</th><th>Destino</th><th>Quem</th><th>Resolução</th></tr></thead>
        <tbody>
          {conflicts.map((c) => {
            const [label, tone] = c.status === 'DEFERRED' ? ['Pendente', 'danger'] : DECIDED_BY[c.decidedBy] ?? ['—', 'neutral']
            return (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.sourceType}</td>
                <td>{c.targetType}</td>
                <td><StatusBadge tone={tone}>{c.decidedByUser ? `${label} (${c.decidedByUser})` : label}</StatusBadge></td>
                <td>{c.resolution ?? c.deferReason}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ValidationChecks({ checks }) {
  if (!checks?.length) return null
  const passed = checks.filter((c) => c.passed).length
  return (
    <div className="summary-card">
      <h3>Verificações no sandbox ({passed}/{checks.length} aprovadas)</h3>
      <ul className="event-list">
        {checks.map((c) => (
          <li key={c.name}>
            <StatusBadge tone={c.passed ? 'success' : 'danger'}>{c.passed ? 'OK' : 'FALHOU'}</StatusBadge> <strong>{c.name}</strong>
            {c.detail && <small className="evidence">{c.detail}</small>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SandboxSummary({ sandbox }) {
  if (!sandbox?.tables) return null
  return (
    <div className="summary-card">
      <h3>Sandbox anonimizado</h3>
      <p className="muted">Dataset {sandbox.datasetId} · fidelidade {sandbox.fidelity}{sandbox.verdict ? ` · veredito ${sandbox.verdict}` : ''}</p>
      <ul className="event-list">
        {sandbox.tables.map((t) => (
          <li key={t.name}><strong>{t.name}</strong>: {t.rows} linhas · anonimizadas: {t.anonymizedColumns.join(', ') || 'nenhuma'}</li>
        ))}
      </ul>
    </div>
  )
}

export function downloadText(text, filename, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Script do Core (GET /migrations/:id/script); sem a rota, o script gravado no resultado. */
export async function downloadScript(migration) {
  let script = migration.result?.apply?.script
  try {
    script = await api.script(migration.id)
  } catch (e) {
    if (!isMissingRoute(e) || !script) throw e
  }
  downloadText(script, `migracao-${migration.id.slice(0, 8)}.sql`, 'application/sql')
}

/** Trilha de auditoria de uma migração: uma linha por transição, com autor e data. */
export function AuditTrail({ events }) {
  const rows = oneRowPerTransition(events)
  if (rows.length === 0) return <p className="muted">Nenhum evento registrado.</p>
  return (
    <div className="timeline">
      {rows.map((e) => (
        <div className="timeline__item" key={e.id}>
          <div className="timeline__marker" />
          <time>{formatDateTime(e.createdAt)}</time>
          <div>
            <strong>{eventLabel(e)}</strong>
            {e.toStatus && <p>{e.fromStatus ? `${statusLabel(e.fromStatus)} → ` : ''}{statusLabel(e.toStatus)}</p>}
          </div>
          <span>{actorLabel(e.actor)}</span>
        </div>
      ))}
    </div>
  )
}
