import { useEffect, useMemo, useState } from 'react'
import Stepper from '../components/Stepper'
import StatusBadge from '../components/StatusBadge'

const sensitiveRows = [
  ['id','NUMBER','Não','—','—'],
  ['nome','VARCHAR','Sim','98%','Substituição'],
  ['email','VARCHAR','Sim','96%','Hash'],
  ['cpf','VARCHAR','Sim','99%','Máscara'],
  ['telefone','VARCHAR','Sim','95%','Máscara'],
  ['data_nascimento','DATE','Sim','97%','Generalização'],
  ['cidade','VARCHAR','Não','—','—'],
]

const mappings = [
  ['id','customer_id','94%'],
  ['nome','name','92%'],
  ['email','email','96%'],
  ['cpf','document','98%'],
  ['data_nascimento','birth_date','90%'],
]

const anonymization = [
  ['nome','Sim','Substituição','Marcelo Tan','Cliente_4821'],
  ['cpf','Sim','Máscara','123.456.789-10','***.***.789-**'],
  ['email','Sim','Hash','marcelo@email.com','a91bc23...'],
  ['telefone','Sim','Máscara','(11) 91234-5678','(**) *****-5678'],
  ['cidade','Não','Nenhuma','São Paulo','São Paulo'],
]

export default function MigrationWizard() {
  const [step, setStep] = useState(1)
  const [connectionTest, setConnectionTest] = useState(null)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    if (progress >= 100) { setRunning(false); return }
    const id = setTimeout(() => setProgress(p => Math.min(100, p + 7)), 300)
    return () => clearTimeout(id)
  }, [running, progress])

  const stageStatus = useMemo(() => {
    if (progress < 20) return ['CLIENTES','Executando']
    if (progress < 45) return ['PEDIDOS','Executando']
    if (progress < 70) return ['PRODUTOS','Executando']
    if (progress < 90) return ['ENDERECOS','Executando']
    if (progress < 100) return ['PAGAMENTOS','Executando']
    return ['Finalizado','Concluído']
  }, [progress])

  const testConnection = () => {
    setConnectionTest('loading')
    setTimeout(() => setConnectionTest('success'), 650)
  }

  const next = () => setStep(s => Math.min(7, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))

  return (
    <div className="page migration-page">
      <div className="page-heading"><div><span className="eyebrow">NOVO PROJETO</span><h1>Assistente de migração</h1><p>Configure a migração passo a passo e revise tudo antes de executar.</p></div><StatusBadge tone="info">Rascunho salvo</StatusBadge></div>
      <section className="panel migration-shell">
        <Stepper current={step} />
        <div className="migration-body">
          {step === 1 && <ConnectionStep title="Banco de origem" subtitle="Conecte-se ao banco de dados de origem." defaultDb="Oracle" defaultPort="1521" service="ORCL" connectionTest={connectionTest} onTest={testConnection} />}
          {step === 2 && <ConnectionStep title="Banco de destino" subtitle="Defina para onde os dados serão migrados." defaultDb="PostgreSQL" defaultPort="5432" service="placeholder_prod" connectionTest={connectionTest} onTest={testConnection} />}
          {step === 3 && <AnalysisStep />}
          {step === 4 && <MappingStep />}
          {step === 5 && <AnonymizationStep />}
          {step === 6 && <ValidationStep />}
          {step === 7 && <ExecutionStep progress={progress} running={running} setRunning={setRunning} stageStatus={stageStatus} />}
        </div>
        <div className="wizard-footer">
          <button className="btn btn--secondary" onClick={back} disabled={step === 1}>← Voltar</button>
          {step < 7 ? <button className="btn btn--primary" onClick={() => { setConnectionTest(null); next() }}>Continuar →</button> : progress < 100 ? <button className="btn btn--primary" onClick={() => setRunning(true)} disabled={running}>{running ? 'Migrando...' : progress > 0 ? 'Continuar migração' : 'Iniciar migração'}</button> : <button className="btn btn--primary" onClick={() => { setStep(1); setProgress(0) }}>Nova migração</button>}
        </div>
      </section>
    </div>
  )
}

function ConnectionStep({ title, subtitle, defaultDb, defaultPort, service, connectionTest, onTest }) {
  return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">⌁</span><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="form-card"><label>Tipo de banco<select defaultValue={defaultDb}><option>Oracle</option><option>PostgreSQL</option><option>MySQL</option><option>SQL Server</option><option>MongoDB</option></select></label><div className="grid-3"><label>Host<input defaultValue="localhost"/></label><label>Porta<input defaultValue={defaultPort}/></label><label>Database / Service<input defaultValue={service}/></label></div><div className="grid-2"><label>Usuário<input defaultValue="admin"/></label><label>Senha<input type="password" defaultValue="password123"/></label></div><button className="btn btn--test" onClick={onTest} type="button">{connectionTest === 'loading' ? 'Testando...' : 'Testar conexão'}</button>{connectionTest === 'success' && <div className="notice notice--success">✓ Conexão realizada com sucesso.</div>}<div className="connection-note"><strong>Dica de segurança</strong><p>Em produção, as credenciais devem ser enviadas ao backend por HTTPS e armazenadas em um cofre de segredos, nunca no navegador.</p></div></div></div>
}

function AnalysisStep() {
  return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">✦</span><div><h2>Análise do banco por IA</h2><p>A estrutura foi analisada e possíveis dados sensíveis foram identificados.</p></div></div><div className="analysis-metrics"><div><span>▦</span><strong>18</strong><small>Tabelas</small></div><div><span>⌗</span><strong>247</strong><small>Colunas</small></div><div><span>◉</span><strong>35.482</strong><small>Registros</small></div><div className="danger"><span>⚠</span><strong>12</strong><small>Campos sensíveis</small></div></div><div className="analysis-layout"><aside className="table-tabs"><strong>Tabelas</strong>{['CLIENTES','PEDIDOS','PRODUTOS','ENDERECOS','PAGAMENTOS'].map((t,i)=><button className={i===0?'active':''} key={t}>{t}</button>)}</aside><div className="analysis-table"><div className="panel__header"><div><h3>CLIENTES</h3><p>Sugestões da IA por coluna.</p></div><StatusBadge tone="info">IA analisada</StatusBadge></div><div className="table-wrap"><table><thead><tr><th>Coluna</th><th>Tipo</th><th>Sensível</th><th>Confiança</th><th>Sugestão</th></tr></thead><tbody>{sensitiveRows.map(r=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td><StatusBadge tone={r[2]==='Sim'?'danger':'success'}>{r[2]}</StatusBadge></td><td>{r[3]}</td><td>{r[4]}</td></tr>)}</tbody></table></div><div className="ai-suggestion"><div><span className="ai-badge">✦ IA</span><strong>Sugestão para CPF</strong><p>Classificação: dado pessoal identificável · Confiança: 99%</p></div><div className="ai-preview"><code>123.456.789-10</code><b>→</b><code>***.***.789-**</code></div><div className="ai-actions"><button className="btn btn--primary btn--sm">Aceitar sugestão</button><button className="btn btn--secondary btn--sm">Alterar</button><button className="btn btn--secondary btn--sm">Ignorar</button></div></div></div></div></div>
}

function MappingStep(){
 return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">⇄</span><div><h2>Mapeamento de tabelas e campos</h2><p>Revise as correspondências sugeridas entre origem e destino.</p></div></div><div className="mapping-head"><div><span>ORIGEM</span><strong>Oracle · CLIENTES</strong></div><div className="mapping-arrow">→</div><div><span>DESTINO</span><strong>PostgreSQL · CUSTOMERS</strong></div></div><div className="mapping-list">{mappings.map((m,i)=><div className="mapping-row" key={m[0]}><select defaultValue={m[0]}><option>{m[0]}</option></select><span>→</span><select defaultValue={m[1]}><option>{m[1]}</option><option>Ignorar campo</option></select><StatusBadge tone="info">IA {m[2]}</StatusBadge><button title="Editar">⚙</button></div>)}</div><div className="notice notice--info">✦ A IA sugeriu 42 correspondências automáticas. 39 possuem confiança acima de 90%.</div></div>
}

function AnonymizationStep(){
 return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">🛡</span><div><h2>Regras de anonimização</h2><p>Defina como os dados sensíveis serão tratados antes de chegar ao destino.</p></div></div><div className="table-wrap anonymization-table"><table><thead><tr><th>Campo</th><th>Sensível</th><th>Técnica</th><th>Antes</th><th>Depois</th></tr></thead><tbody>{anonymization.map(r=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td><StatusBadge tone={r[1]==='Sim'?'danger':'success'}>{r[1]}</StatusBadge></td><td><select defaultValue={r[2]}><option>Nenhuma</option><option>Máscara</option><option>Hash</option><option>Substituição</option><option>Remoção</option><option>Dados sintéticos</option><option>Generalização</option></select></td><td><code>{r[3]}</code></td><td><code>{r[4]}</code></td></tr>)}</tbody></table></div><div className="privacy-card"><span>🛡️</span><div><strong>Política de privacidade aplicada</strong><p>4 campos receberão transformação antes da escrita no banco de destino. O valor original não será exibido nos relatórios.</p></div></div></div>
}

function ValidationStep(){
 const checks=[['Conexão com banco de origem','Oracle ERP','success'],['Conexão com banco de destino','PostgreSQL Analytics','success'],['Mapeamento de campos','42 mapeamentos validados','success'],['Regras de anonimização','12 regras configuradas','success'],['Campos que exigem revisão','2 avisos não bloqueantes','warning']]
 return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">✓</span><div><h2>Validação antes da migração</h2><p>Confira o resumo antes de executar a operação.</p></div></div><div className="validation-grid"><div className="summary-card"><h3>Resumo</h3><dl><div><dt>Origem</dt><dd>Oracle</dd></div><div><dt>Destino</dt><dd>PostgreSQL</dd></div><div><dt>Tabelas</dt><dd>18</dd></div><div><dt>Registros estimados</dt><dd>35.482</dd></div><div><dt>Campos anonimizados</dt><dd>12</dd></div><div><dt>Mapeamentos IA</dt><dd>42</dd></div></dl></div><div className="check-list">{checks.map(c=><div key={c[0]}><span className={c[2]==='success'?'check-success':'check-warning'}>{c[2]==='success'?'✓':'!'}</span><div><strong>{c[0]}</strong><small>{c[1]}</small></div></div>)}</div></div><div className="warning-box"><strong>⚠ Operação demonstrativa</strong><p>Este front-end simula a validação. Em uma aplicação real, a checagem deve ser feita no backend antes do início da migração.</p></div></div>
}

function ExecutionStep({ progress, running, setRunning, stageStatus }){
 const tables=[['CLIENTES',20],['PEDIDOS',45],['PRODUTOS',70],['ENDERECOS',90],['PAGAMENTOS',100]]
 const done = progress >= 100
 return <div className="wizard-section"><div className="wizard-title"><span className="wizard-icon">⇄</span><div><h2>{done?'Migração concluída':'Migração em andamento'}</h2><p>{done?'Os dados foram processados com sucesso.':'Acompanhe a execução e os logs em tempo real.'}</p></div></div>{done && <div className="success-hero"><div className="success-hero__icon">✓</div><div><h3>Migração concluída!</h3><p>35.482 registros migrados · 18 tabelas · 12 campos anonimizados</p></div><button className="btn btn--secondary">Baixar relatório</button></div>}<div className="execution-grid"><div><div className="progress-header"><span>{Math.round(35482*progress/100).toLocaleString('pt-BR')} / 35.482 registros</span><strong>{progress}%</strong></div><div className="progress progress--large"><span style={{width:`${progress}%`}}/></div><div className="execution-list">{tables.map(([name,limit])=>{const status=progress>=limit?'Concluído':stageStatus[0]===name?'Executando':'Aguardando';return <div key={name}><strong>{name}</strong><StatusBadge tone={status==='Concluído'?'success':status==='Executando'?'info':'neutral'}>{status}</StatusBadge></div>})}</div>{!running && progress < 100 && <button className="btn btn--primary" onClick={()=>setRunning(true)}>{progress>0?'Retomar simulação':'Executar simulação'}</button>}</div><div className="console"><div className="console__header"><span/><span/><span/><strong>Logs em tempo real</strong></div><pre>{`18:55:01  Conectando ao Oracle...\n18:55:02  Conexão estabelecida\n18:55:04  Lendo tabela CLIENTES\n18:55:08  Aplicando anonimização\n18:55:13  Inserindo dados no PostgreSQL\n${progress>20?'18:55:19  CLIENTES concluída\n':''}${progress>45?'18:55:26  PEDIDOS concluída\n':''}${progress>70?'18:55:31  PRODUTOS concluída\n':''}${progress>90?'18:55:38  ENDERECOS concluída\n':''}${done?'18:55:44  MIGRAÇÃO CONCLUÍDA':''}`}</pre></div></div></div>
}
