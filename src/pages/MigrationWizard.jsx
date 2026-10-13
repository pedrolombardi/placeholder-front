import { useState } from 'react'
import Stepper from '../components/Stepper'
import StatusBadge from '../components/StatusBadge'
import { api, waitWhile } from '../api'

/**
 * Fluxo real da plataforma, ligado ao Backend Core:
 * origem/destino -> analise (DB Layer classifica, IA decide PROPOSE/DEFER) ->
 * proposta -> homologacao humana -> execucao (sandbox anonimizado + validacao)
 * -> resultado (verificacoes + script de migracao).
 */

const WHO = { rule: ['Regra', 'neutral'], ai: ['IA', 'info'], human: ['Humano', 'warning'] }
const STATUS_TEXT = {
  CREATED: 'Migração criada',
  ANALYZING: 'Analisando: DB Layer lê os catálogos e classifica; a IA julga os conflitos ambíguos',
  WAITING_APPROVAL: 'Aguardando homologação humana',
  APPROVED: 'Aprovada',
  EXECUTING: 'Gerando o sandbox: DB Layer extrai a amostra e o Data Layer anonimiza',
  VALIDATING: 'Validando o plano no sandbox Oracle (5 verificações determinísticas)',
  COMPLETED: 'Concluída: plano validado e script de migração gerado',
  REJECTED: 'Rejeitada na homologação',
  FAILED: 'Falhou',
}
const SUGGESTED = 'Converter para NULL e registrar no relatório (decisão do DBA)'

export default function MigrationWizard() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: 'Vendas MySQL → Oracle',
    source: { type: 'mysql', host: 'mysql', database: 'vendas', user: 'readonly', password: 'readonly' },
    target: { type: 'oracle' },
  })
  const [migration, setMigration] = useState(null)
  const [events, setEvents] = useState([])
  const [decisions, setDecisions] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const conflicts = migration?.proposal?.conflicts ?? []
  const deferred = conflicts.filter((c) => c.status === 'DEFERRED')

  const track = async (m) => {
    setMigration(m)
    setEvents(await api.events(m.id).catch(() => []))
  }

  const guard = (fn) => async () => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const analyze = guard(async () => {
    const created = await api.createMigration(form)
    await api.analyze(created.id)
    const m = await waitWhile(created.id, ['CREATED', 'ANALYZING'], track)
    await track(m)
    if (m.status === 'FAILED') throw new Error(m.error ?? 'Análise falhou')
    setDecisions(Object.fromEntries(m.proposal.conflicts.filter((c) => c.status === 'DEFERRED').map((c) => [c.id, SUGGESTED])))
    setStep(3)
  })

  const approveAndExecute = guard(async () => {
    const list = deferred.map((c) => ({ conflictId: c.id, resolution: decisions[c.id]?.trim() || SUGGESTED }))
    await api.approve(migration.id, list)
    await api.execute(migration.id)
    setStep(6)
    const m = await waitWhile(migration.id, ['APPROVED', 'EXECUTING', 'VALIDATING'], track)
    await track(m)
    setStep(7)
  })

  const reject = guard(async () => {
    const m = await api.reject(migration.id, 'Rejeitada no assistente')
    await track(m)
    setStep(7)
  })

  const restart = () => {
    setStep(1)
    setMigration(null)
    setEvents([])
    setError(null)
  }

  return (
    <div className="page migration-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NOVA MIGRAÇÃO</span>
          <h1>Assistente de migração</h1>
          <p>Origem e destino reais: o código resolve o mecânico, a IA julga o ambíguo e você homologa.</p>
        </div>
        <StatusBadge tone={migration ? 'info' : 'neutral'}>{migration ? migration.status : 'Rascunho'}</StatusBadge>
      </div>
      <section className="panel migration-shell">
        <Stepper current={step} />
        <div className="migration-body">
          {error && <div className="notice notice--danger">✕ {error}</div>}
          {step === 1 && <SourceStep form={form} setForm={setForm} />}
          {step === 2 && <TargetStep form={form} setForm={setForm} busy={busy} />}
          {step === 3 && <AnalysisStep migration={migration} />}
          {step === 4 && <ProposalStep conflicts={conflicts} />}
          {step === 5 && <ApprovalStep deferred={deferred} decisions={decisions} setDecisions={setDecisions} />}
          {step === 6 && <ExecutionStep migration={migration} events={events} />}
          {step === 7 && <ResultStep migration={migration} events={events} />}
        </div>
        <div className="wizard-footer">
          <button className="btn btn--secondary" onClick={() => setStep((s) => s - 1)} disabled={busy || step === 1 || step >= 5 || step === 3}>
            ← Voltar
          </button>
          {step === 1 && <button className="btn btn--primary" onClick={() => setStep(2)}>Continuar →</button>}
          {step === 2 && <button className="btn btn--primary" onClick={analyze} disabled={busy}>{busy ? 'Analisando...' : 'Analisar migração →'}</button>}
          {(step === 3 || step === 4) && <button className="btn btn--primary" onClick={() => setStep(step + 1)}>Continuar →</button>}
          {step === 5 && (
            <span>
              <button className="btn btn--secondary" onClick={reject} disabled={busy}>Rejeitar</button>{' '}
              <button className="btn btn--primary" onClick={approveAndExecute} disabled={busy}>{busy ? 'Executando...' : 'Aprovar e executar →'}</button>
            </span>
          )}
          {step === 6 && <button className="btn btn--primary" disabled>Executando...</button>}
          {step === 7 && <button className="btn btn--primary" onClick={restart}>Nova migração</button>}
        </div>
      </section>
    </div>
  )
}

function Title({ icon, title, subtitle }) {
  return (
    <div className="wizard-title">
      <span className="wizard-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function SourceStep({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, source: { ...form.source, [k]: e.target.value } })
  return (
    <div className="wizard-section">
      <Title icon="⌁" title="Banco de origem" subtitle="Somente leitura: a origem nunca é alterada." />
      <div className="form-card">
        <label>Nome da migração<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <div className="grid-3">
          <label>Tipo de banco<select value={form.source.type} onChange={set('type')}><option value="mysql">MySQL</option></select></label>
          <label>Host<input value={form.source.host} onChange={set('host')} /></label>
          <label>Database<input value={form.source.database} onChange={set('database')} /></label>
        </div>
        <div className="grid-2">
          <label>Usuário (somente leitura)<input value={form.source.user} onChange={set('user')} /></label>
          <label>Senha<input type="password" value={form.source.password} onChange={set('password')} /></label>
        </div>
        <div className="notice notice--info">No MVP, o DB Layer usa a origem configurada nele (<strong>vendas</strong>) e recusa outro banco.</div>
      </div>
    </div>
  )
}

function TargetStep({ form, setForm, busy }) {
  return (
    <div className="wizard-section">
      <Title icon="⌁" title="Banco de destino" subtitle="Oracle Database 23ai. Nada é escrito no destino sem homologação." />
      <div className="form-card">
        <label>Tipo de banco<select value={form.target.type} onChange={(e) => setForm({ ...form, target: { type: e.target.value } })}><option value="oracle">Oracle</option></select></label>
        <div className="notice notice--info">
          {busy ? STATUS_TEXT.ANALYZING : 'Ao analisar, o DB Layer testa as conexões, lê os dois catálogos e classifica cada coluna; os conflitos de julgamento vão para a IA.'}
        </div>
      </div>
    </div>
  )
}

function AnalysisStep({ migration }) {
  const p = migration.proposal
  const count = (by) => p.conflicts.filter((c) => c.decidedBy === by).length
  const columns = p.tables.reduce((n, t) => n + t.columns.length, 0)
  const judgement = p.conflicts.filter((c) => c.kind === 'judgement')
  return (
    <div className="wizard-section">
      <Title icon="✦" title="Análise" subtitle={p.summary} />
      <div className="analysis-metrics">
        <div><span>▦</span><strong>{p.tables.length}</strong><small>Tabelas</small></div>
        <div><span>⌗</span><strong>{columns}</strong><small>Colunas</small></div>
        <div><span>⚙</span><strong>{count('rule')}</strong><small>Resolvidas por regra</small></div>
        <div><span>✦</span><strong>{count('ai')}</strong><small>Propostas pela IA</small></div>
        <div className="danger"><span>⚠</span><strong>{p.pendingDecisions}</strong><small>Aguardando humano</small></div>
      </div>
      <h3>Conflitos de julgamento</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Coluna</th><th>Origem → destino</th><th>Decisão</th><th>Proposta / motivo</th></tr></thead>
          <tbody>
            {judgement.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.sourceType} → {c.targetType}</td>
                <td>{c.status === 'DEFERRED' ? <StatusBadge tone="danger">DEFER</StatusBadge> : <StatusBadge tone="info">PROPOSE</StatusBadge>}</td>
                <td>
                  {c.resolution ?? c.deferReason}
                  {c.evidence?.length > 0 && <small className="evidence">Evidência: {c.evidence.join(' · ')}</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProposalStep({ conflicts }) {
  return (
    <div className="wizard-section">
      <Title icon="⇄" title="Proposta de mapeamento" subtitle="Todas as colunas, com quem decidiu cada uma." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Coluna</th><th>Origem</th><th>Destino</th><th>Quem</th><th>Resolução</th></tr></thead>
          <tbody>
            {conflicts.map((c) => {
              const [label, tone] = c.status === 'DEFERRED' ? ['Pendente', 'danger'] : WHO[c.decidedBy] ?? ['—', 'neutral']
              return (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>{c.sourceType}</td>
                  <td>{c.targetType}</td>
                  <td><StatusBadge tone={tone}>{label}</StatusBadge></td>
                  <td>{c.resolution ?? c.deferReason}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ApprovalStep({ deferred, decisions, setDecisions }) {
  return (
    <div className="wizard-section">
      <Title icon="✓" title="Homologação" subtitle="A IA não resolve sozinha o que é ambíguo: cada DEFER precisa de uma decisão humana." />
      {deferred.length === 0 && <div className="notice notice--success">Nenhum conflito pendente: a proposta pode ser aprovada.</div>}
      {deferred.map((c) => (
        <div className="form-card decision-card" key={c.id}>
          <strong>{c.id}</strong> <small>{c.sourceType} → {c.targetType}</small>
          <p>{c.deferReason}</p>
          <label>
            Decisão do DBA
            <textarea rows={2} value={decisions[c.id] ?? ''} onChange={(e) => setDecisions({ ...decisions, [c.id]: e.target.value })} />
          </label>
        </div>
      ))}
    </div>
  )
}

function EventList({ events }) {
  return (
    <ul className="event-list">
      {events.map((e, i) => (
        <li key={i}>
          <code>{new Date(e.createdAt).toLocaleTimeString()}</code> <strong>{e.type}</strong>
          {e.toStatus && <span> → {e.toStatus}</span>}
        </li>
      ))}
    </ul>
  )
}

function ExecutionStep({ migration, events }) {
  return (
    <div className="wizard-section">
      <Title icon="⇄" title="Execução" subtitle={STATUS_TEXT[migration?.status] ?? ''} />
      <div className="notice notice--info">⏳ {STATUS_TEXT[migration?.status]}</div>
      <EventList events={events} />
    </div>
  )
}

function ResultStep({ migration, events }) {
  const r = migration.result ?? {}
  const checks = r.validation?.checks ?? []
  const script = r.apply?.script
  const download = () => {
    const url = URL.createObjectURL(new Blob([script], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `migracao-${migration.id.slice(0, 8)}.sql` })
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="wizard-section">
      <Title icon="✓" title="Resultado" subtitle={STATUS_TEXT[migration.status]} />
      {migration.status === 'COMPLETED' && (
        <div className="success-hero">
          <div className="success-hero__icon">✓</div>
          <div>
            <h3>Plano validado no sandbox</h3>
            <p>{r.sandbox?.tables?.map((t) => `${t.name}: ${t.rows} linhas`).join(' · ')} · fidelidade {r.sandbox?.fidelity}</p>
          </div>
          {script && <button className="btn btn--secondary" onClick={download}>Baixar script .sql</button>}
        </div>
      )}
      {migration.status === 'FAILED' && <div className="notice notice--danger">✕ {migration.error}</div>}
      {migration.status === 'REJECTED' && <div className="notice notice--info">Proposta rejeitada: nada foi executado.</div>}
      {checks.length > 0 && (
        <div className="summary-card">
          <h3>Verificações no sandbox</h3>
          <ul className="event-list">
            {checks.map((c) => (
              <li key={c.name}>
                <StatusBadge tone={c.passed ? 'success' : 'danger'}>{c.passed ? 'OK' : 'FALHOU'}</StatusBadge> <strong>{c.name}</strong>
                {c.detail && <small className="evidence">{c.detail}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.sandbox?.tables && (
        <div className="summary-card">
          <h3>Sandbox anonimizado ({r.sandbox.datasetId})</h3>
          <ul className="event-list">
            {r.sandbox.tables.map((t) => (
              <li key={t.name}><strong>{t.name}</strong>: {t.rows} linhas · anonimizadas: {t.anonymizedColumns.join(', ') || 'nenhuma'}</li>
            ))}
          </ul>
        </div>
      )}
      {script && <pre className="script-box">{script}</pre>}
      <h3>Trilha de auditoria</h3>
      <EventList events={events} />
    </div>
  )
}
