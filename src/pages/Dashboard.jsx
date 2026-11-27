import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { api, isAbort } from '../api'
import { useAuth } from '../auth/AuthContext'
import { dbLabel, formatDateTime, formatDuration, formatPercent, sandboxTotals, statusLabel, statusTone } from '../labels'

const DECIDERS = [
  ['rule', 'Regra', 'var(--muted)'],
  ['ai', 'IA', 'var(--primary)'],
  ['human', 'Humano', 'var(--orange)'],
]

function conicGradient(parts) {
  const total = parts.reduce((n, [, v]) => n + v, 0)
  if (!total) return '#e7ecf4'
  let at = 0
  return `conic-gradient(${parts
    .map(([color, v]) => {
      const from = at
      at += (v / total) * 100
      return `${color} ${from}% ${at}%`
    })
    .join(', ')})`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [migrations, setMigrations] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    Promise.all([api.metrics(opts), api.listMigrations(opts)])
      .then(([m, list]) => {
        setMetrics(m)
        setMigrations(list)
      })
      .catch((e) => !isAbort(e) && setError(e.message))
    return () => controller.abort()
  }, [])

  const loaded = metrics && migrations
  const completed = migrations?.filter((m) => m.status === 'COMPLETED') ?? []
  const anonymized = completed.reduce((n, m) => n + sandboxTotals(m).anonymizedColumns, 0)
  const sandboxTables = completed.reduce((n, m) => n + sandboxTotals(m).tables, 0)
  const c = metrics?.conflicts

  return (
    <div className="page">
      <div className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, {user.username} 👋</h1><p>Indicadores calculados pelo Backend Core a partir das migrações e da trilha de auditoria.</p></div><Link className="btn btn--primary" to="/app/migration/new">+ Nova migração</Link></div>
      <ErrorNotice error={error && `Backend Core indisponível: ${error}`} />
      {!loaded && !error && <Loading>Carregando indicadores...</Loading>}
      {loaded && (
        <>
          <div className="metrics-grid" data-testid="metrics">
            <MetricCard icon="▦" value={metrics.migrations.total} label="Migrações" helper={`${metrics.migrations.waitingApproval} aguardando homologação`} />
            <MetricCard icon="⇄" value={metrics.migrations.inProgress} label="Em execução" helper="Análise, execução ou validação" tone="purple" />
            <MetricCard icon="✓" value={metrics.migrations.byStatus.COMPLETED} label="Concluídas" helper={`${metrics.migrations.byStatus.FAILED} falha(s) · ${metrics.migrations.byStatus.REJECTED} rejeitada(s)`} tone="green" />
            <MetricCard icon="↗" value={formatPercent(metrics.migrations.successRate)} label="Taxa de sucesso" helper={`Tempo médio total: ${formatDuration(metrics.stageDurations.total.avgMs)}`} tone="orange" />
          </div>
          <div className="dashboard-grid">
            <section className="panel panel--wide">
              <div className="panel__header"><div><h2>Migrações recentes</h2><p>As últimas registradas no Core.</p></div><Link to="/app/projects">Ver todas</Link></div>
              {migrations.length === 0 ? (
                <div className="notice notice--info">Nenhuma migração ainda. <Link to="/app/migration/new">Crie a primeira</Link>.</div>
              ) : (
                <div className="table-wrap"><table><thead><tr><th>Migração</th><th>Origem</th><th>Destino</th><th>Status</th><th>Criada em</th></tr></thead><tbody>
                  {migrations.slice(0, 5).map((m) => (
                    <tr key={m.id}>
                      <td><Link to={`/app/migrations/${m.id}`}><strong>{m.name}</strong></Link></td>
                      <td>{dbLabel(m.source?.type)}</td>
                      <td>{dbLabel(m.target?.type)}</td>
                      <td><StatusBadge tone={statusTone(m.status)}>{statusLabel(m.status)}</StatusBadge></td>
                      <td>{formatDateTime(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </section>
            <section className="panel">
              <div className="panel__header"><div><h2>Conflitos de tipo</h2><p>Quem decidiu cada conflito das propostas.</p></div></div>
              <div className="donut"><div className="donut__circle" style={{ background: conicGradient([...DECIDERS.map(([k, , color]) => [color, c.byDecidedBy[k]]), ['#dfe5ef', c.pendingHuman]]) }}><strong>{c.total}</strong><span>conflitos</span></div></div>
              <div className="legend-list">
                {DECIDERS.map(([k, label, color]) => <span key={k}><i className="dot" style={{ background: color }} />{c.byDecidedBy[k]} por {(label === 'IA' ? label : label.toLowerCase())}</span>)}
                <span><i className="dot dot--green" />{c.pendingHuman} aguardando decisão humana</span>
                <span className="muted">{c.deferredByAi} deferidos pela IA para o DBA</span>
              </div>
            </section>
          </div>
          <section className="panel">
            <div className="panel__header"><div><h2>Proteção de dados</h2><p>Colunas anonimizadas pelo Data Layer nos sandboxes das migrações concluídas.</p></div></div>
            <div className="metrics-grid">
              <MetricCard icon="🛡" value={anonymized} label="Colunas anonimizadas" helper={`em ${sandboxTables} tabela(s) de sandbox`} tone="green" />
              <MetricCard icon="✓" value={completed.length} label="Sandboxes validados" helper="Migrações concluídas" />
              <MetricCard icon="⏱" value={formatDuration(metrics.stageDurations.analysis.avgMs)} label="Análise (média)" helper={`${metrics.stageDurations.analysis.count} amostra(s)`} tone="purple" />
              <MetricCard icon="⏱" value={formatDuration(metrics.stageDurations.validation.avgMs)} label="Validação (média)" helper={`${metrics.stageDurations.validation.count} amostra(s)`} tone="orange" />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
