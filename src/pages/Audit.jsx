import { useEffect, useState } from 'react'
import { api } from '../api'

// Trilha de auditoria real: eventos das migracoes mais recentes do Backend Core.
export default function Audit() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      const migrations = (await api.listMigrations()).slice(0, 10)
      const all = await Promise.all(
        migrations.map(async (m) => (await api.events(m.id)).map((e) => ({ ...e, migration: m.name }))),
      )
      setEvents(all.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50))
    })().catch((e) => setError(e.message))
  }, [])

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUDITORIA</span>
          <h1>Histórico de atividades</h1>
          <p>Cada mudança de status, proposta, decisão humana e validação, registrada pelo Backend Core.</p>
        </div>
      </div>
      <section className="panel">
        {error && <div className="notice notice--danger">✕ Backend Core indisponível: {error}</div>}
        {events && events.length === 0 && <div className="notice notice--info">Nenhum evento ainda.</div>}
        <div className="timeline">
          {(events ?? []).map((e, i) => (
            <div className="timeline__item" key={i}>
              <div className="timeline__marker" />
              <time>{new Date(e.createdAt).toLocaleTimeString()}</time>
              <div>
                <strong>{e.type}</strong>
                <p>{e.migration}{e.toStatus ? ` → ${e.toStatus}` : ''}</p>
              </div>
              <span>{e.type.startsWith('PROPOSAL_APPROVED') ? 'DBA' : 'Plataforma'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
