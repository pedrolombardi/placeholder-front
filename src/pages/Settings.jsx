import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { api, isAbort, isMissingRoute } from '../api'

const LAYERS = [
  ['db', 'DB Layer', 'Catálogos, extração da amostra e validação no sandbox'],
  ['ai', 'AI Layer', 'Julgamento dos conflitos ambíguos'],
  ['data', 'Data Layer', 'Anonimização do sandbox'],
]

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    api
      .settings({ signal: controller.signal })
      .then(setSettings)
      .catch((e) => {
        if (isAbort(e)) return
        if (isMissingRoute(e)) setMissing(true)
        else setError(e.message)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="page">
      <div className="page-heading"><div><span className="eyebrow">CONFIGURAÇÕES</span><h1>Configurações da plataforma</h1><p>Configuração em vigor no Backend Core e estado das camadas. Alterações são feitas pelo administrador no ambiente do Core.</p></div></div>
      {missing && <div className="notice notice--info">Configurações indisponíveis nesta versão do Core.</div>}
      <ErrorNotice error={error && `Backend Core indisponível: ${error}`} />
      {!settings && !missing && !error && <Loading>Consultando configurações...</Loading>}
      {settings && (
        <div className="settings-grid">
          <section className="panel">
            <h2>Segurança</h2>
            <div className="summary-card">
              <dl>
                <div><dt>Autenticação</dt><dd><StatusBadge tone={settings.authEnabled ? 'success' : 'warning'}>{settings.authEnabled ? 'Ativa' : 'Desligada'}</StatusBadge></dd></div>
                <div><dt>Validade do token</dt><dd>{settings.tokenTtl}</dd></div>
              </dl>
            </div>
          </section>
          <section className="panel">
            <h2>Camadas</h2>
            {LAYERS.map(([key, label, role]) => {
              const layer = settings.layers?.[key]
              return (
                <div className="summary-card" key={key} style={{ marginBottom: 12 }}>
                  <h3>{label} <StatusBadge tone={layer?.healthy ? 'success' : 'danger'}>{layer?.healthy ? 'Saudável' : 'Indisponível'}</StatusBadge></h3>
                  <p className="muted">{role}</p>
                  <dl>
                    <div><dt>Endereço</dt><dd>{layer?.url ?? '—'}</dd></div>
                    <div><dt>Latência</dt><dd>{layer?.latencyMs != null ? `${layer.latencyMs} ms` : '—'}</dd></div>
                    {layer?.detail && <div><dt>Detalhe</dt><dd>{layer.detail}</dd></div>}
                  </dl>
                </div>
              )
            })}
          </section>
        </div>
      )}
    </div>
  )
}
