import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../components/Logo'

export default function Login() {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const submit = (e) => { e.preventDefault(); navigate('/app/dashboard') }
  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo />
        <div><span className="eyebrow">PLACEHOLDER</span><h1>Conecte. Analise. Proteja. Migre.</h1><p>Uma experiência guiada para modernização de dados com apoio de IA.</p></div>
        <div className="auth-aside__card"><span>✦</span><div><strong>IA com supervisão humana</strong><small>Sugestões transparentes e editáveis em cada etapa.</small></div></div>
      </div>
      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <Logo />
          <div className="auth-title"><h2>Bem-vindo novamente</h2><p>Acesse sua conta para continuar.</p></div>
          <label>E-mail<input type="email" placeholder="seu@email.com" required /></label>
          <label>Senha<div className="password-field"><input type={show ? 'text' : 'password'} placeholder="••••••••" required/><button type="button" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button></div></label>
          <div className="form-row"><label className="checkbox"><input type="checkbox"/> Lembrar de mim</label><Link to="/forgot-password">Esqueceu sua senha?</Link></div>
          <button className="btn btn--primary btn--block">Entrar</button>
          <div className="auth-divider"><span>ou continue com</span></div>
          <div className="social-row"><button type="button" className="btn btn--secondary">G Google</button><button type="button" className="btn btn--secondary">▦ Microsoft</button></div>
          <p className="auth-switch">Não possui conta? <Link to="/register">Criar conta</Link></p>
        </form>
      </div>
    </div>
  )
}
