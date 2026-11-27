import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { AuditTrail, ConflictTable, downloadScript, SandboxSummary, ValidationChecks } from '../components/MigrationParts'
import { api, isAbort } from '../api'
import { useAuth } from '../auth/AuthContext'
import { dbLabel, DECIDED_BY, formatDateTime, statusLabel, statusTone } from '../labels'

const RESUMABLE = ['CREATED', 'ANALYZING', 'WAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'VALIDATING']

export default function MigrationDetail() {
  const { id } = useParams()
  const { isDba } = useAuth()
  const [migration, setMigration] = useState(null)
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    setMigration(null)
    setError(null)
    Promise.all([api.getMigration(id, opts), api.events(id, opts)])
      .then(([m, e]) => {
        setMigration(m)
        setEvents(e)
      })
      .catch((e) => !isAbort(e) && setError(e.message))
    return () => controller.abort()
  }, [id])

  if (error) {
    return (
      <div className="page">
        <ErrorNotice error={error} />
        <p><Link className="text-button" to="/app/projects">← Voltar para Projetos</Link></p>
      </div>
    )
  }
  if (!migration) return <div className="page"><Loading>Carregando migração...</Loading></div>

  const p = migration.proposal
  const r = migration.result ?? {}
  const conflicts = p?.conflicts ?? []
  const count = (by) => conflicts.filter((c) => c.decidedBy === by).length
  const resumable = RESUMABLE.includes(migration.status)

  return (
    <div className="page stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MIGRAÇÃO</span>
          <h1>{migration.name}</h1>
          <p>{dbLabel(migration.source?.type)} ({migration.source?.database}) → {dbLabel(migration.target?.type)}</p>
        </div>
        <div className="detail-actions">
          <StatusBadge tone={statusTone(migration.status)}>{statusLabel(migration.status)}</StatusBadge>
          {r.apply?.script && <button className="btn btn--secondary" onClick={() => downloadScript(migration).catch((e) => setError(e.message))}>Baixar script .sql</button>}
          {resumable && (
            <Link className="btn btn--primary" to={`/app/migration/new?id=${migration.id}`}>
              {migration.status === 'WAITING_APPROVAL' && isDba ? 'Homologar no assistente' : 'Acompanhar no assistente'}
            </Link>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="summary-card">
          <h3>Resumo</h3>
          <dl>
            <div><dt>Identificador</dt><dd>{migration.id}</dd></div>
            <div><dt>Origem</dt><dd>{dbLabel(migration.source?.type)} · {migration.source?.host} / {migration.source?.database}</dd></div>
            <div><dt>Destino</dt><dd>{dbLabel(migration.target?.type)}</dd></div>
            <div><dt>Criada em</dt><dd>{formatDateTime(migration.createdAt)}</dd></div>
            <div><dt>Atualizada em</dt><dd>{formatDateTime(migration.updatedAt)}</dd></div>
            {r.apply && <div><dt>Script</dt><dd>{r.apply.statements ?? 0} comandos · {r.apply.tablesMigrated} tabelas{r.apply.applied ? ' · aplicado' : ' · para revisão do DBA'}</dd></div>}
          </dl>
          {p?.summary && <p className="muted">{p.summary}</p>}
          {migration.error && <ErrorNotice error={migration.error} />}
        </section>
        <section className="summary-card">
          <h3>Conflitos ({conflicts.length})</h3>
          {conflicts.length === 0 ? (
            <p className="muted">A análise ainda não gerou proposta.</p>
          ) : (
            <dl>
              {Object.entries(DECIDED_BY).map(([key, [label]]) => (
                <div key={key}><dt>Decididos por {label.toLowerCase()}</dt><dd>{count(key)}</dd></div>
              ))}
              <div><dt>Aguardando decisão humana</dt><dd>{conflicts.filter((c) => c.status === 'DEFERRED').length}</dd></div>
            </dl>
          )}
        </section>
      </div>

      {conflicts.length > 0 && (
        <section className="panel">
          <div className="panel__header"><div><h2>Proposta de mapeamento</h2><p>Cada coluna e quem decidiu a conversão.</p></div></div>
          <ConflictTable conflicts={conflicts} />
        </section>
      )}

      {(r.validation || r.sandbox) && (
        <div className="detail-grid">
          <ValidationChecks checks={r.validation?.checks} />
          <SandboxSummary sandbox={r.sandbox} />
        </div>
      )}

      {r.apply?.script && (
        <section className="panel">
          <div className="panel__header"><div><h2>Script de migração</h2><p>Gerado pelo DB Layer para revisão e aplicação pelo DBA.</p></div></div>
          <pre className="script-box">{r.apply.script}</pre>
        </section>
      )}

      <section className="panel">
        <div className="panel__header"><div><h2>Trilha de auditoria</h2><p>Uma linha por transição, com o autor de cada ação.</p></div></div>
        <AuditTrail events={events} />
      </section>
    </div>
  )
}
