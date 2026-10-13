import { Link } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../components/Logo'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  return (
    <div className="auth-page auth-page--center">
      <form className="auth-card" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <Logo />
        <Link className="back-link" to="/login">← Voltar</Link>
        <div className="auth-title"><h2>Recuperar senha</h2><p>Enviaremos um link para você criar uma nova senha.</p></div>
        <div className="recovery-steps"><span className="active">1<small>E-mail</small></span><span>2<small>Código</small></span><span>3<small>Nova senha</small></span><span>4<small>Concluído</small></span></div>
        <div className="recovery-icon">✉</div>
        <label>E-mail<input type="email" placeholder="marcelo@email.com" required/></label>
        <button className="btn btn--primary btn--block">Enviar código</button>
        {sent && <div className="notice notice--success">✓ Link de recuperação enviado. Esta é uma simulação do front-end.</div>}
      </form>
    </div>
  )
}
