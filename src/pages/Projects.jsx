import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { api, isAbort } from '../api'
import { dbLabel, formatDateTime, STATUS } from '../labels'

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
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim().toLowerCase()

  useEffect(() => {
    const controller = new AbortController()
    api.listMigrations({ signal: controller.signal }).then(setMigrations).catch((e) => !isAbort(e) && setError(e.message))
    return () => controller.abort()
  }, [])

  const shown = (migrations ?? []).filter((m) => FILTERS[filter](m.status) && (!query || m.name.toLowerCase().includes(query)))

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
      {query && (
        <div className="notice notice--info">
          Busca: <strong>{params.get('q')}</strong> · {shown.length} resultado(s){' '}
          <button className="text-button" onClick={() => setParams({})}>Limpar busca</button>
        </div>
      )}
      <ErrorNotice error={error && `Backend Core indisponível: ${error}`} />
      {!migrations && !error && <Loading>Carregando migrações...</Loading>}
      {migrations && shown.length === 0 && <div className="notice notice--info">Nenhuma migração encontrada.</div>}
      <div className="project-grid">
        {shown.map((m) => {
          const [label, tone, progress] = STATUS[m.status] ?? [m.status, 'neutral', 0]
          return (
            <Link className="project-card" key={m.id} to={`/app/migrations/${m.id}`}>
              <div className="project-card__top">
                <div className="project-icon">▦</div>
                <StatusBadge tone={tone}>{label}</StatusBadge>
              </div>
              <h3>{m.name}</h3>
              <p>{dbLabel(m.source?.type)} <span>→</span> {dbLabel(m.target?.type)}</p>
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
              <div className="project-card__footer">
                <small>{m.proposal?.summary ?? m.error ?? formatDateTime(m.createdAt)}</small>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
