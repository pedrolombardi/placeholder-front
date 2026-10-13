import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../api'

// Migracoes reais do Backend Core, com o progresso derivado do status.
const STAGE = {
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
const FILTERS = {
  Todos: () => true,
  'Em andamento': (s) => !['COMPLETED', 'REJECTED', 'FAILED'].includes(s),
  Concluídos: (s) => s === 'COMPLETED',
  Falhos: (s) => s === 'FAILED' || s === 'REJECTED',
}

export default function Projects() {
  const [migrations, setMigrations] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Todos')

  useEffect(() => {
    api.listMigrations().then(setMigrations).catch((e) => setError(e.message))
  }, [])

  const shown = (migrations ?? []).filter((m) => FILTERS[filter](m.status))

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROJETOS</span>
          <h1>Migrações</h1>
          <p>Todas as migrações registradas no Backend Core.</p>
        </div>
        <Link className="btn btn--primary" to="/app/migration/new">+ Nova migração</Link>
      </div>
      <div className="filter-row">
        {Object.keys(FILTERS).map((f) => (
          <button key={f} className={f === filter ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {error && <div className="notice notice--danger">✕ Backend Core indisponível: {error}</div>}
      {migrations && shown.length === 0 && <div className="notice notice--info">Nenhuma migração aqui ainda.</div>}
      <div className="project-grid">
        {shown.map((m) => {
          const [label, tone, progress] = STAGE[m.status] ?? [m.status, 'neutral', 0]
          return (
            <article className="project-card" key={m.id}>
              <div className="project-card__top">
                <div className="project-icon">▦</div>
                <StatusBadge tone={tone}>{label}</StatusBadge>
              </div>
              <h3>{m.name}</h3>
              <p>{m.source?.type} <span>→</span> {m.target?.type}</p>
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
              <div className="project-card__footer">
                <small>{m.proposal?.summary ?? m.error ?? new Date(m.createdAt).toLocaleString()}</small>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
