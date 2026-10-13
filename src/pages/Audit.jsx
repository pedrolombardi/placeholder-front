const events=[
 ['18:44','Marcelo Tan','Migração iniciada','CRM Migration'],
 ['18:42','Placeholder IA','Regra sugerida','CPF → mascaramento parcial'],
 ['18:41','Marcelo Tan','Sugestão aprovada','Campo CPF'],
 ['18:38','Placeholder IA','Análise concluída','12 campos sensíveis identificados'],
 ['18:35','Marcelo Tan','Conexão testada','Oracle ERP'],
]
export default function Audit(){return <div className="page"><div className="page-heading"><div><span className="eyebrow">AUDITORIA</span><h1>Histórico de atividades</h1><p>Rastreabilidade das ações realizadas na plataforma.</p></div></div><section className="panel"><div className="timeline">{events.map((e,i)=><div className="timeline__item" key={i}><div className="timeline__marker"/><time>{e[0]}</time><div><strong>{e[2]}</strong><p>{e[3]}</p></div><span>{e[1]}</span></div>)}</div></section></div>}
