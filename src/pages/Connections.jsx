import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { api, isAbort, isMissingRoute } from '../api'
import { useAuth } from '../auth/AuthContext'
import { dbLabel, formatDateTime } from '../labels'

const ROLE = { source: 'Origem', target: 'Destino' }
const ENGINE_FOR_ROLE = { source: 'mysql', target: 'oracle' }
const EMPTY_FORM = { name: '', role: 'source', host: '', port: '', database: '', username: '' }

function LiveCard({ title, side }) {
  if (!side) {
    return (
      <section className="summary-card">
        <h3>{title}</h3>
        <StatusBadge tone="danger">Sem conexão</StatusBadge>
      </section>
    )
  }
  return (
    <section className="summary-card">
      <h3>{title} <StatusBadge tone={side.connected ? 'success' : 'danger'}>{side.connected ? 'Conectado' : 'Desconectado'}</StatusBadge></h3>
      <dl>
        <div><dt>Banco</dt><dd>{dbLabel(side.engine)} {side.version ?? ''}</dd></div>
        <div><dt>Schema</dt><dd>{side.schema ?? '—'}</dd></div>
        <div><dt>Charset</dt><dd>{side.charset ?? '—'}</dd></div>
        <div><dt>Acesso</dt><dd>{side.readOnly ? 'Somente leitura' : 'Leitura e escrita'}</dd></div>
        <div><dt>Latência</dt><dd>{side.latencyMs != null ? `${side.latencyMs} ms` : '—'}</dd></div>
      </dl>
    </section>
  )
}

export default function Connections() {
  const { isDba } = useAuth()
  const [data, setData] = useState(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tests, setTests] = useState({})

  const load = useCallback((signal) => {
    setError(null)
    return api
      .connections({ signal })
      .then(setData)
      .catch((e) => {
        if (isAbort(e)) return
        if (isMissingRoute(e)) setMissing(true)
        else setError(e.message)
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.createConnection({
        name: form.name.trim(),
        role: form.role,
        engine: ENGINE_FOR_ROLE[form.role],
        host: form.host.trim(),
        ...(form.port ? { port: Number(form.port) } : {}),
        database: form.database.trim(),
        ...(form.username.trim() ? { username: form.username.trim() } : {}),
      })
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`Excluir a conexão "${c.name}"?`)) return
    setError(null)
    try {
      await api.deleteConnection(c.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const test = async (c) => {
    setTests((t) => ({ ...t, [c.id]: { running: true } }))
    try {
      const r = await api.testConnection(c.id)
      setTests((t) => ({ ...t, [c.id]: r }))
    } catch (err) {
      setTests((t) => ({ ...t, [c.id]: { ok: false, detail: err.message } }))
    }
  }

  const heading = (
    <div className="page-heading">
      <div><span className="eyebrow">CONEXÕES</span><h1>Bancos conectados</h1><p>Estado ao vivo da origem e do destino no DB Layer e conexões cadastradas.</p></div>
      {data && <button className="btn btn--secondary" onClick={() => load()}>Atualizar</button>}
    </div>
  )

  if (missing) {
    return <div className="page">{heading}<div className="notice notice--info">Conexões indisponíveis nesta versão do Core.</div></div>
  }

  const live = data?.live
  return (
    <div className="page stack">
      {heading}
      <ErrorNotice error={error} />
      {!data && !error && <Loading>Consultando conexões...</Loading>}
      {data && (
        <>
          {live?.status === 'error' && <ErrorNotice error={`DB Layer: ${live.error ?? 'falha ao consultar as conexões'}`} />}
          <div className="detail-grid">
            <LiveCard title="Origem" side={live?.source} />
            <LiveCard title="Destino" side={live?.target} />
          </div>
          <section className="panel">
            <div className="panel__header"><div><h2>Conexões cadastradas</h2><p>Sem senhas: as credenciais ficam no DB Layer.</p></div></div>
            {data.saved.length === 0 ? (
              <div className="notice notice--info">Nenhuma conexão cadastrada.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nome</th><th>Papel</th><th>Banco</th><th>Host</th><th>Database</th><th>Usuário</th><th>Criada por</th><th></th></tr></thead>
                  <tbody>
                    {data.saved.map((c) => {
                      const t = tests[c.id]
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong></td>
                          <td>{ROLE[c.role] ?? c.role}</td>
                          <td>{dbLabel(c.engine)}</td>
                          <td>{c.host}{c.port ? `:${c.port}` : ''}</td>
                          <td>{c.database}</td>
                          <td>{c.username ?? '—'}</td>
                          <td>{c.createdBy}<small className="evidence">{formatDateTime(c.createdAt)}</small></td>
                          <td>
                            <button className="text-button" onClick={() => test(c)} disabled={t?.running}>{t?.running ? 'Testando...' : 'Testar'}</button>
                            {isDba && <button className="text-button" onClick={() => remove(c)}>Excluir</button>}
                            {t && !t.running && (
                              <small className="evidence">
                                <StatusBadge tone={t.ok ? 'success' : 'danger'}>{t.ok ? 'OK' : 'FALHOU'}</StatusBadge> {t.detail}{t.latencyMs != null ? ` · ${t.latencyMs} ms` : ''}
                              </small>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {isDba ? (
            <section className="panel">
              <div className="panel__header"><div><h2>Nova conexão</h2><p>Origem sempre MySQL, destino sempre Oracle. A senha não é cadastrada aqui.</p></div></div>
              <form onSubmit={create}>
                <div className="grid-3">
                  <label>Nome<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
                  <label>Papel<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="source">Origem (MySQL)</option><option value="target">Destino (Oracle)</option></select></label>
                  <label>Host<input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required /></label>
                </div>
                <div className="grid-3">
                  <label>Database / serviço<input value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} required /></label>
                  <label>Porta<input type="number" min="1" max="65535" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></label>
                  <label>Usuário<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
                </div>
                <button className="btn btn--primary" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar conexão'}</button>
              </form>
            </section>
          ) : (
            <div className="notice notice--info">Cadastrar e excluir conexões é restrito ao perfil DBA.</div>
          )}
        </>
      )}
    </div>
  )
}
