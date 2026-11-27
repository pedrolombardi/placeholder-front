import { useAuth } from '../auth/AuthContext'
import { initials, ROLE_LABEL, ROLE_PERMISSIONS } from '../labels'

export default function Profile() {
  const { user, isDba } = useAuth()
  const permissions = ROLE_PERMISSIONS[user.role] ?? []
  return (
    <div className="page">
      <div className="page-heading"><div><span className="eyebrow">PERFIL</span><h1>Minha conta</h1><p>Dados da sessão autenticada no Backend Core.</p></div></div>
      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-avatar">{initials(user.username)}</div>
          <h2>{user.username}</h2>
          <p>Perfil {ROLE_LABEL[user.role] ?? user.role}</p>
        </section>
        <section className="panel">
          <h2>O que este perfil pode fazer</h2>
          <ul className="event-list">
            {permissions.map((p) => <li key={p}>✓ {p}</li>)}
          </ul>
          {!isDba && <div className="notice notice--info">Homologação e execução de migrações são restritas ao perfil DBA.</div>}
          <div className="notice notice--info">Os usuários são criados pelo administrador da plataforma. Alteração de senha ou de perfil é feita por ele.</div>
        </section>
      </div>
    </div>
  )
}
