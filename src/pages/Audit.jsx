import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorNotice, Loading } from '../components/Loading'
import { api, isAbort } from '../api'
import { actorLabel, eventLabel, formatDateTime, oneRowPerTransition, statusLabel } from '../labels'

const RECENT_MIGRATIONS = 10
const MAX_ROWS = 60

// Trilha de auditoria real: eventos das migrações mais recentes do Backend Core.
export default function Audit() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    ;(async () => {
      const migrations = (await api.listMigrations(opts)).slice(0, RECENT_MIGRATIONS)
      const all = await Promise.all(
        migrations.map(async (m) => (await api.events(m.id, opts)).map((e) => ({ ...e, migrationName: m.name }))),
      )
      const rows = oneRowPerTransition(all.flat()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
      setEvents(rows.slice(0, MAX_ROWS))
    })().catch((e) => !isAbort(e) && setError(e.message))
    return () => controller.abort()
  }, [])

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUDITORIA</span>
          <h1>Histórico de atividades</h1>
          <p>Uma linha por transição das {RECENT_MIGRATIONS} migrações mais recentes, com o autor de cada ação.</p>
        </div>
      </div>
      <section className="panel">
        <ErrorNotice error={error && `Backend Core indisponível: ${error}`} />
        {!events && !error && <Loading>Carregando eventos...</Loading>}
        {events && events.length === 0 && <div className="notice notice--info">Nenhum evento ainda.</div>}
        <div className="timeline">
          {(events ?? []).map((e) => (
            <div className="timeline__item" key={e.id}>
              <div className="timeline__marker" />
              <time>{formatDateTime(e.createdAt)}</time>
              <div>
                <strong>{eventLabel(e)}</strong>
                <p>
                  <Link to={`/app/migrations/${e.migrationId}`}>{e.migrationName}</Link>
                  {e.toStatus ? ` · ${e.fromStatus ? `${statusLabel(e.fromStatus)} → ` : ''}${statusLabel(e.toStatus)}` : ''}
                </p>
              </div>
              <span data-testid="actor">{actorLabel(e.actor)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
