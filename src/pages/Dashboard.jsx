import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'

const rows = [
  ['CRM Migration', 'Oracle', 'PostgreSQL', 'Concluído', 'success', '08/10/2026'],
  ['Financeiro', 'MySQL', 'Oracle', 'Executando', 'info', '07/10/2026'],
  ['Recursos Humanos', 'SQL Server', 'PostgreSQL', 'Falhou', 'danger', '06/10/2026'],
  ['Comercial', 'PostgreSQL', 'Oracle', 'Em preparação', 'warning', '05/10/2026'],
]

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, Marcelo 👋</h1><p>Acompanhe suas migrações e os principais indicadores da plataforma.</p></div><Link className="btn btn--primary" to="/app/migration/new">+ Nova migração</Link></div>
      <div className="metrics-grid"><MetricCard icon="▦" value="8" label="Projetos" helper="2 criados este mês"/><MetricCard icon="⇄" value="3" label="Em execução" helper="Processamento ativo" tone="purple"/><MetricCard icon="✓" value="12" label="Concluídos" helper="Sem erros críticos" tone="green"/><MetricCard icon="↗" value="98%" label="Taxa de sucesso" helper="Últimos 30 dias" tone="orange"/></div>
      <div className="dashboard-grid">
        <section className="panel panel--wide"><div className="panel__header"><div><h2>Migrações recentes</h2><p>Últimas atividades dos seus projetos.</p></div><Link to="/app/projects">Ver todos</Link></div><div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Origem</th><th>Destino</th><th>Status</th><th>Data</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}>{r.slice(0,3).map(c => <td key={c}>{c}</td>)}<td><StatusBadge tone={r[4]}>{r[3]}</StatusBadge></td><td>{r[5]}</td></tr>)}</tbody></table></div></section>
        <section className="panel"><div className="panel__header"><div><h2>Proteção de dados</h2><p>Resumo das últimas análises.</p></div></div><div className="donut"><div className="donut__circle"><strong>247</strong><span>campos</span></div></div><div className="legend-list"><span><i className="dot dot--red"/>12 sensíveis</span><span><i className="dot dot--green"/>235 não sensíveis</span></div></section>
      </div>
      <section className="panel"><div className="panel__header"><div><h2>Atividade rápida</h2><p>Ações mais comuns no Placeholder.</p></div></div><div className="quick-grid"><Link to="/app/migration/new">⇄<strong>Nova migração</strong><small>Inicie um novo fluxo</small></Link><Link to="/app/connections">⌁<strong>Nova conexão</strong><small>Cadastre um banco</small></Link><Link to="/app/reports">▤<strong>Relatórios</strong><small>Consulte resultados</small></Link><Link to="/app/audit">◉<strong>Auditoria</strong><small>Veja o histórico</small></Link></div></section>
    </div>
  )
}
