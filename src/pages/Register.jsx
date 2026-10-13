import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import Logo from '../components/Logo'

export default function Register() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const score = useMemo(() => [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length, [password])
  const submit = (e) => { e.preventDefault(); navigate('/app/dashboard') }
  return (
    <div className="auth-page auth-page--register">
      <div className="auth-aside">
        <Logo />
        <div><span className="eyebrow">COMECE EM MINUTOS</span><h1>Crie seu espaço de migração.</h1><p>Organize projetos, conexões, regras de anonimização e relatórios em uma única plataforma.</p></div>
        <div className="auth-bullets"><span>✓ Fluxo guiado em 7 etapas</span><span>✓ Detecção visual de dados sensíveis</span><span>✓ Histórico e auditoria</span></div>
      </div>
      <div className="auth-panel">
        <form className="auth-card auth-card--wide" onSubmit={submit}>
          <Logo />
          <div className="auth-title"><h2>Crie sua conta</h2><p>Comece a migrar seus dados com segurança.</p></div>
          <div className="grid-2"><label>Nome<input placeholder="Marcelo" required/></label><label>Sobrenome<input placeholder="Tan" required/></label></div>
          <label>E-mail<input type="email" placeholder="marcelo@email.com" required/></label>
          <label>Empresa / Organização<input placeholder="Sua empresa"/></label>
          <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/></label>
          <div className="password-strength"><div>{[1,2,3,4].map(n => <span key={n} className={n <= score ? 'on' : ''}/>)}</div><strong>{score <= 1 ? 'Fraca' : score === 2 ? 'Média' : score === 3 ? 'Boa' : 'Forte'}</strong></div>
          <div className="password-rules"><span className={password.length >= 8 ? 'ok' : ''}>✓ 8 caracteres</span><span className={/[A-Z]/.test(password) ? 'ok' : ''}>✓ letra maiúscula</span><span className={/\d/.test(password) ? 'ok' : ''}>✓ número</span><span className={/[^A-Za-z0-9]/.test(password) ? 'ok' : ''}>✓ caractere especial</span></div>
          <label>Confirmar senha<input type="password" placeholder="••••••••" required/></label>
          <button className="btn btn--primary btn--block">Criar conta</button>
          <p className="auth-switch">Já possui uma conta? <Link to="/login">Entrar</Link></p>
        </form>
      </div>
    </div>
  )
}
