import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../components/Logo'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { user, login, notice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const target = location.state?.from ?? '/app/dashboard'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) return <Navigate to={target} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo />
        <div><span className="eyebrow">PLACEHOLDER</span><h1>Conecte. Analise. Proteja. Migre.</h1><p>Migração assistida de MySQL para Oracle, com análise por IA e homologação humana.</p></div>
        <div className="auth-aside__card"><span>✦</span><div><strong>IA com supervisão humana</strong><small>Conflitos ambíguos ficam para a decisão do DBA.</small></div></div>
      </div>
      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <Logo />
          <div className="auth-title"><h2>Bem-vindo novamente</h2><p>Acesse sua conta para continuar.</p></div>
          {notice && !error && <div className="notice notice--info">{notice}</div>}
          {error && <div className="notice notice--danger" role="alert">✕ {error}</div>}
          <label>Usuário<input name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>Senha<div className="password-field"><input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button></div></label>
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
          <p className="auth-switch">Acesso criado pelo administrador. Para obter um usuário ou redefinir a senha, fale com o administrador da plataforma.</p>
        </form>
      </div>
    </div>
  )
}
