import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { initials, ROLE_LABEL } from '../labels'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')

  const search = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/app/projects?q=${encodeURIComponent(q)}` : '/app/projects')
  }

  return (
    <header className="topbar">
      <form onSubmit={search} role="search">
        <div className="topbar__search">⌕ <input aria-label="Buscar migrações" placeholder="Buscar migrações por nome..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </form>
      <div className="topbar__actions">
        <Link className="user-chip" to="/app/profile">
          <span className="avatar">{initials(user?.username)}</span>
          <span><strong>{user?.username}</strong><small>{ROLE_LABEL[user?.role] ?? user?.role}</small></span>
        </Link>
        <button className="btn btn--secondary btn--sm" onClick={logout}>Sair</button>
      </div>
    </header>
  )
}
