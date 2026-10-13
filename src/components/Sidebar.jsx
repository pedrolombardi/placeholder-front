import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const items = [
  ['▦', 'Dashboard', '/app/dashboard'],
  ['◫', 'Projetos', '/app/projects'],
  ['⇄', 'Migrações', '/app/migration/new'],
  ['⌁', 'Conexões', '/app/connections'],
  ['▤', 'Relatórios', '/app/reports'],
  ['◉', 'Auditoria', '/app/audit'],
  ['⚙', 'Configurações', '/app/settings'],
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar__nav">
        {items.map(([icon, label, path]) => (
          <NavLink key={path} to={path} className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}>
            <span>{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__security">🛡️ <span>Ambiente protegido<br/><small>Criptografia ativa</small></span></div>
      </div>
    </aside>
  )
}
