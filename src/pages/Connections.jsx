import StatusBadge from '../components/StatusBadge'
export default function Connections(){
 const list=[['Oracle ERP','Oracle','10.0.0.12:1521','Ativa','success'],['PostgreSQL Analytics','PostgreSQL','10.0.0.21:5432','Ativa','success'],['MySQL Legacy','MySQL','10.0.0.34:3306','Atenção','warning']]
 return <div className="page"><div className="page-heading"><div><span className="eyebrow">CONEXÕES</span><h1>Bancos conectados</h1><p>Gerencie conexões salvas para origem e destino.</p></div><button className="btn btn--primary">+ Nova conexão</button></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Banco</th><th>Host</th><th>Status</th><th></th></tr></thead><tbody>{list.map(x=><tr key={x[0]}><td><strong>{x[0]}</strong></td><td>{x[1]}</td><td>{x[2]}</td><td><StatusBadge tone={x[4]}>{x[3]}</StatusBadge></td><td><button className="text-button">Testar conexão</button></td></tr>)}</tbody></table></div></section></div>
}
