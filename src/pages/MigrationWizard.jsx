import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Stepper from '../components/Stepper'
import StatusBadge from '../components/StatusBadge'
import { AuditTrail, ConflictTable, downloadScript, SandboxSummary, ValidationChecks } from '../components/MigrationParts'
import { api, isAbort, isMissingRoute, waitWhile } from '../api'
import { useAuth } from '../auth/AuthContext'
import { dbLabel, statusLabel, statusTone } from '../labels'

/**
 * Fluxo real da plataforma, ligado ao Backend Core:
 * origem/destino -> analise (DB Layer classifica, IA decide PROPOSE/DEFER) ->
 * proposta -> homologacao humana -> execucao (sandbox anonimizado + validacao)
 * -> resultado (verificacoes + script de migracao).
 *
 * Cada passo retoma a migracao pelo status atual no Core, entao repetir um passo
 * depois de um erro continua a mesma migracao em vez de criar outra.
 * `?id=` abre uma migracao existente no passo correspondente ao seu status.
 */

const STATUS_TEXT = {
  CREATED: 'Migração criada',
  ANALYZING: 'Analisando: DB Layer lê os catálogos e classifica; a IA julga os conflitos ambíguos',
  WAITING_APPROVAL: 'Aguardando homologação humana',
  APPROVED: 'Aprovada',
  EXECUTING: 'Gerando o sandbox: DB Layer extrai a amostra e o Data Layer anonimiza',
  VALIDATING: 'Validando o plano no sandbox Oracle com verificações determinísticas',
  COMPLETED: 'Concluída: plano validado e script de migração gerado',
  REJECTED: 'Rejeitada na homologação',
  FAILED: 'Falhou',
}
const SUGGESTED = 'Converter para NULL e registrar no relatório (decisão do DBA)'

const ANALYSIS_BUSY = ['CREATED', 'ANALYZING']
const EXECUTION_BUSY = ['APPROVED', 'EXECUTING', 'VALIDATING']
const TERMINAL = ['COMPLETED', 'REJECTED', 'FAILED']

/** Banco de demonstração configurado no DB Layer: a origem do MVP. */
const DEMO_SOURCE = { type: 'mysql', host: 'mysql', database: 'vendas' }
// Cores sem GET /connections ainda exigem as credenciais da origem no corpo do POST /migrations.
const LEGACY_SOURCE_CREDENTIALS = { user: 'readonly', password: 'readonly' }

function stepFor(status) {
  if (ANALYSIS_BUSY.includes(status)) return 2
  if (status === 'WAITING_APPROVAL') return 3
  if (EXECUTION_BUSY.includes(status)) return 6
  return 7
}

const deferredOf = (m) => (m?.proposal?.conflicts ?? []).filter((c) => c.status === 'DEFERRED')
const sourceDatabase = (connections) => connections.live?.source?.schema?.toLowerCase() ?? DEMO_SOURCE.database
const ignoreConflict = (e) => {
  // 409: outra aba ou outro usuário já fez a transição; o status é relido em seguida.
  if (e.status !== 409) throw e
}
const issueText = (i) => (typeof i === 'string' ? i : i?.message ? `${i.path?.length ? `${i.path.join('.')}: ` : ''}${i.message}` : JSON.stringify(i))

export default function MigrationWizard() {
  const { isDba } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const resumeId = params.get('id')

  const [step, setStep] = useState(resumeId ? 0 : 1)
  const [name, setName] = useState('Vendas MySQL → Oracle')
  const [connections, setConnections] = useState({ state: 'loading' })
  const [migration, setMigration] = useState(null)
  const [events, setEvents] = useState([])
  const [decisions, setDecisions] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  const signal = () => controllerRef.current?.signal

  const track = useCallback((m) => {
    setMigration(m)
    api.events(m.id, { signal: controllerRef.current?.signal }).then(setEvents).catch(() => {})
  }, [])

  const guard = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      if (!isAbort(e)) setError({ message: e.message, issues: e.issues })
    } finally {
      setBusy(false)
    }
  }, [])

  const enterApproval = (m) => {
    setDecisions(Object.fromEntries(deferredOf(m).map((c) => [c.id, SUGGESTED])))
    setStep(m.status === 'WAITING_APPROVAL' ? 3 : 7)
  }

  const runAnalysis = (existingId) =>
    guard(async () => {
      let id = existingId
      if (!id) {
        const source = { ...DEMO_SOURCE, database: sourceDatabase(connections) }
        if (connections.state === 'missing') Object.assign(source, LEGACY_SOURCE_CREDENTIALS)
        const created = await api.createMigration({ name: name.trim(), source, target: { type: 'oracle' } })
        id = created.id
        track(created)
      }
      let m = await api.getMigration(id, { signal: signal() })
      if (m.status === 'CREATED') await api.analyze(id).catch(ignoreConflict)
      m = await waitWhile(id, ANALYSIS_BUSY, track, { signal: signal() })
      track(m)
      enterApproval(m)
    })

  const runExecution = (id, list) =>
    guard(async () => {
      let m = await api.getMigration(id, { signal: signal() })
      if (m.status === 'WAITING_APPROVAL') {
        await api.approve(id, list).catch(ignoreConflict)
        m = await api.getMigration(id, { signal: signal() })
      }
      if (m.status === 'APPROVED') await api.execute(id).catch(ignoreConflict)
      if (!TERMINAL.includes(m.status)) {
        setStep(6)
        m = await waitWhile(id, EXECUTION_BUSY, track, { signal: signal() })
      }
      track(m)
      setStep(7)
    })

  // Um AbortController por montagem: sair da página cancela a espera e as consultas.
  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller
    api
      .connections({ signal: controller.signal })
      .then((data) => setConnections({ state: 'ok', live: data.live }))
      .catch((e) => !isAbort(e) && setConnections({ state: isMissingRoute(e) ? 'missing' : 'error' }))

    if (resumeId) {
      api
        .getMigration(resumeId, { signal: controller.signal })
        .then((m) => {
          track(m)
          setName(m.name)
          const next = stepFor(m.status)
          if (next === 3) enterApproval(m)
          else setStep(next)
          if (next === 2) runAnalysis(m.id)
          if (next === 6) runExecution(m.id, [])
        })
        .catch((e) => {
          if (isAbort(e)) return
          setError({ message: e.message })
          setStep(1)
        })
    }
    return () => {
      controller.abort()
      controllerRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  const deferred = deferredOf(migration)
  const decisionList = () => deferred.map((c) => ({ conflictId: c.id, resolution: decisions[c.id]?.trim() || SUGGESTED }))
  const analyze = () => runAnalysis(migration?.id)
  const approveAndExecute = () => runExecution(migration.id, decisionList())
  const reject = () =>
    guard(async () => {
      const m = await api.reject(migration.id, 'Rejeitada no assistente')
      track(m)
      setStep(7)
    })

  const restart = () => {
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()
    setStep(1)
    setMigration(null)
    setEvents([])
    setDecisions({})
    setError(null)
    if (resumeId) navigate('/app/migration/new', { replace: true })
  }

  const backDisabled = busy || step <= 1 || step === 3 || step >= 5 || (step === 2 && Boolean(migration))

  return (
    <div className="page migration-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NOVA MIGRAÇÃO</span>
          <h1>Assistente de migração</h1>
          <p>Origem e destino reais: o código resolve o mecânico, a IA julga o ambíguo e o DBA homologa.</p>
        </div>
        <StatusBadge tone={migration ? statusTone(migration.status) : 'neutral'}>{migration ? statusLabel(migration.status) : 'Rascunho'}</StatusBadge>
      </div>
      <section className="panel migration-shell">
        <Stepper current={Math.max(step, 1)} />
        <div className="migration-body">
          {error && (
            <div className="notice notice--danger" role="alert">
              ✕ {error.message}
              {error.issues?.length > 0 && <ul>{error.issues.map((i) => <li key={issueText(i)}>{issueText(i)}</li>)}</ul>}
            </div>
          )}
          {step === 0 && <div className="notice notice--info">⏳ Carregando migração...</div>}
          {step === 1 && <SourceStep name={name} setName={setName} connections={connections} />}
          {step === 2 && <TargetStep busy={busy} migration={migration} />}
          {step === 3 && <AnalysisStep migration={migration} />}
          {step === 4 && <ProposalStep conflicts={migration.proposal?.conflicts ?? []} />}
          {step === 5 && <ApprovalStep deferred={deferred} decisions={decisions} setDecisions={setDecisions} canApprove={isDba} migration={migration} />}
          {step === 6 && <ExecutionStep migration={migration} events={events} />}
          {step === 7 && <ResultStep migration={migration} events={events} onError={(e) => setError({ message: e.message })} />}
        </div>
        <div className="wizard-footer">
          <button className="btn btn--secondary" onClick={() => setStep((s) => s - 1)} disabled={backDisabled}>
            ← Voltar
          </button>
          {step === 1 && <button className="btn btn--primary" onClick={() => setStep(2)} disabled={!name.trim()}>Continuar →</button>}
          {step === 2 && <button className="btn btn--primary" onClick={analyze} disabled={busy}>{busy ? 'Analisando...' : migration ? 'Tentar análise novamente →' : 'Analisar migração →'}</button>}
          {(step === 3 || step === 4) && <button className="btn btn--primary" onClick={() => setStep(step + 1)}>Continuar →</button>}
          {step === 5 && isDba && (
            <span>
              <button className="btn btn--secondary" onClick={reject} disabled={busy}>Rejeitar</button>{' '}
              <button className="btn btn--primary" onClick={approveAndExecute} disabled={busy}>{busy ? 'Executando...' : 'Aprovar e executar →'}</button>
            </span>
          )}
          {step === 5 && !isDba && <Link className="btn btn--primary" to={`/app/migrations/${migration.id}`}>Ver migração</Link>}
          {step === 6 && (busy || !error
            ? <button className="btn btn--primary" disabled>Executando...</button>
            : <button className="btn btn--primary" onClick={() => runExecution(migration.id, [])}>Continuar acompanhando</button>)}
          {step === 7 && (
            <span>
              <Link className="btn btn--secondary" to={`/app/migrations/${migration.id}`}>Ver detalhes</Link>{' '}
              <button className="btn btn--primary" onClick={restart}>Nova migração</button>
            </span>
          )}
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

function LiveSource({ connections }) {
  if (connections.state === 'loading') return <div className="notice notice--info">⏳ Consultando a origem no DB Layer...</div>
  const live = connections.live?.source
  if (connections.state === 'ok' && live) {
    return (
      <div className={`notice ${live.connected ? 'notice--success' : 'notice--danger'}`}>
        {live.connected ? '✓ Origem conectada' : '✕ Origem indisponível'}: {dbLabel(live.engine)} {live.version} · schema <strong>{live.schema}</strong>
        {live.readOnly ? ' · somente leitura' : ''}{live.latencyMs != null ? ` · ${live.latencyMs} ms` : ''}
      </div>
    )
  }
  return (
    <div className="notice notice--info">
      A origem é o banco de demonstração configurado no DB Layer (MySQL <strong>{DEMO_SOURCE.database}</strong>, usuário somente leitura),
      com as cargas de conflito reais. As credenciais ficam no DB Layer, não nesta tela.
    </div>
  )
}

function SourceStep({ name, setName, connections }) {
  const locked = { readOnly: true, className: 'input--locked' }
  return (
    <div className="wizard-section">
      <Title icon="⌁" title="Banco de origem" subtitle="Somente leitura: a origem nunca é alterada." />
      <div className="form-card">
        <label>Nome da migração<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="grid-3">
          <label>Tipo de banco<select value="mysql" disabled><option value="mysql">MySQL</option></select></label>
          <label>Host<input value={DEMO_SOURCE.host} {...locked} /></label>
          <label>Database<input value={sourceDatabase(connections)} {...locked} /></label>
        </div>
        <LiveSource connections={connections} />
      </div>
    </div>
  )
}

function TargetStep({ busy, migration }) {
  return (
    <div className="wizard-section">
      <Title icon="⌁" title="Banco de destino" subtitle="Oracle Database 23ai. Nada é escrito no destino sem homologação." />
      <div className="form-card">
        <label>Tipo de banco<select value="oracle" disabled><option value="oracle">Oracle</option></select></label>
        <div className="notice notice--info">
          {busy
            ? STATUS_TEXT[migration?.status === 'CREATED' ? 'CREATED' : 'ANALYZING']
            : 'Ao analisar, o DB Layer testa as conexões, lê os dois catálogos e classifica cada coluna; os conflitos de julgamento vão para a IA.'}
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
          <thead><tr><th>Coluna</th><th>Origem → destino</th><th>Decisão da IA</th><th>Proposta / motivo</th></tr></thead>
          <tbody>
            {judgement.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.id}</strong></td>
                <td>{c.sourceType} → {c.targetType}</td>
                <td>{c.status === 'DEFERRED' ? <StatusBadge tone="danger">Deferido ao DBA</StatusBadge> : <StatusBadge tone="info">Proposta</StatusBadge>}</td>
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
      <ConflictTable conflicts={conflicts} />
    </div>
  )
}

function ApprovalStep({ deferred, decisions, setDecisions, canApprove, migration }) {
  return (
    <div className="wizard-section">
      <Title icon="✓" title="Homologação" subtitle="A IA não resolve sozinha o que é ambíguo: cada conflito deferido precisa de uma decisão humana." />
      {!canApprove && (
        <div className="notice notice--info" data-testid="role-restricted">
          Homologação e execução são restritas ao perfil DBA. A migração <strong>{migration.name}</strong> fica aguardando homologação;
          um DBA pode concluí-la pela página da migração.
        </div>
      )}
      {deferred.length === 0 && <div className="notice notice--success">Nenhum conflito pendente: a proposta pode ser aprovada.</div>}
      {deferred.map((c) => (
        <div className="form-card decision-card" key={c.id}>
          <strong>{c.id}</strong> <small>{c.sourceType} → {c.targetType}</small>
          <p>{c.deferReason}</p>
          <label>
            Decisão do DBA
            <textarea rows={2} name={`decision-${c.id}`} disabled={!canApprove} value={decisions[c.id] ?? ''} onChange={(e) => setDecisions({ ...decisions, [c.id]: e.target.value })} />
          </label>
        </div>
      ))}
    </div>
  )
}

function ExecutionStep({ migration, events }) {
  return (
    <div className="wizard-section">
      <Title icon="⇄" title="Execução" subtitle={STATUS_TEXT[migration?.status] ?? ''} />
      <div className="notice notice--info">⏳ {STATUS_TEXT[migration?.status]}</div>
      <AuditTrail events={events} />
    </div>
  )
}

function ResultStep({ migration, events, onError }) {
  const r = migration.result ?? {}
  const script = r.apply?.script
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
          {script && <button className="btn btn--secondary" onClick={() => downloadScript(migration).catch(onError)}>Baixar script .sql</button>}
        </div>
      )}
      {migration.status === 'FAILED' && <div className="notice notice--danger">✕ {migration.error}</div>}
      {migration.status === 'REJECTED' && <div className="notice notice--info">Proposta rejeitada: nada foi executado.</div>}
      <ValidationChecks checks={r.validation?.checks} />
      <SandboxSummary sandbox={r.sandbox} />
      {script && <pre className="script-box">{script}</pre>}
      <h3>Trilha de auditoria</h3>
      <AuditTrail events={events} />
    </div>
  )
}
