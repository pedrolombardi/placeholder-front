import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'

const projects = [
  {name:'Migração CRM', source:'Oracle', target:'PostgreSQL', status:'Em preparação', tone:'warning', progress:35},
  {name:'Financeiro 2026', source:'MySQL', target:'Oracle', status:'Executando', tone:'info', progress:72},
  {name:'Legado RH', source:'SQL Server', target:'PostgreSQL', status:'Concluído', tone:'success', progress:100},
]

export default function Projects(){
 return <div className="page"><div className="page-heading"><div><span className="eyebrow">PROJETOS</span><h1>Projetos de migração</h1><p>Organize e acompanhe suas migrações de dados.</p></div><Link className="btn btn--primary" to="/app/migration/new">+ Novo projeto</Link></div><div className="filter-row"><button className="active">Todos</button><button>Em preparação</button><button>Executando</button><button>Concluídos</button><button>Falhos</button></div><div className="project-grid">{projects.map(p => <article className="project-card" key={p.name}><div className="project-card__top"><div className="project-icon">▦</div><StatusBadge tone={p.tone}>{p.status}</StatusBadge></div><h3>{p.name}</h3><p>{p.source} <span>→</span> {p.target}</p><div className="progress"><span style={{width:`${p.progress}%`}}/></div><div className="project-card__footer"><small>{p.progress}% concluído</small><button>•••</button></div></article>)}</div></div>
}
