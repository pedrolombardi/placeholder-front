import { Link } from 'react-router-dom'

export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <div className="topbar__search">⌕ <input placeholder="Buscar projetos, migrações..." /></div>
      </div>
      <div className="topbar__actions">
        <button className="icon-button" aria-label="Notificações">🔔</button>
        <Link className="user-chip" to="/app/profile">
          <span className="avatar">MT</span>
          <span><strong>Marcelo Tan</strong><small>Administrador</small></span>
        </Link>
      </div>
    </header>
  )
}
