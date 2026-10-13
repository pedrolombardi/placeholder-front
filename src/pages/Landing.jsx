import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__nav container">
        <Logo />
        <nav>
          <a href="#produto">Produto</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#seguranca">Segurança</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="landing__nav-actions">
          <Link className="btn btn--ghost" to="/login">Entrar</Link>
          <Link className="btn btn--primary" to="/register">Começar agora</Link>
        </div>
      </header>

      <main>
        <section className="hero container" id="produto">
          <div className="hero__copy">
            <span className="eyebrow">DADOS EM UM NOVO AMANHÃ</span>
            <h1>Migre seus dados com <span>inteligência</span> e segurança.</h1>
            <p>Automatize mapeamentos, identifique dados sensíveis e aplique anonimização inteligente durante toda a migração.</p>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/register">Começar agora</Link>
              <a className="btn btn--secondary btn--lg" href="#como-funciona">Saiba mais</a>
            </div>
            <div className="trust-row">
              <span>✓ Mapeamento assistido por IA</span>
              <span>✓ Anonimização inteligente</span>
              <span>✓ Auditoria completa</span>
            </div>
          </div>
          <div className="hero__visual" aria-label="Ilustração de migração de banco de dados">
            <div className="db-card db-card--source">
              <div className="database-illustration"><i/><i/><i/></div>
              <strong>Banco atual</strong><small>Oracle / MySQL / SQL Server</small>
            </div>
            <div className="migration-beam"><span>IA</span><b>→</b></div>
            <div className="db-card db-card--target">
              <div className="database-illustration"><i/><i/><i/></div>
              <strong>Banco destino</strong><small>Seguro e anonimizado</small>
            </div>
          </div>
        </section>

        <section className="feature-section container" id="como-funciona">
          <div className="section-heading"><span className="eyebrow">PLATAFORMA COMPLETA</span><h2>Da análise ao resultado, em um único fluxo</h2></div>
          <div className="feature-grid">
            <article><span className="feature-icon">✦</span><h3>Migração Inteligente</h3><p>A IA sugere correspondências entre tabelas e colunas para acelerar o mapeamento.</p></article>
            <article><span className="feature-icon">🛡</span><h3>Anonimização Automática</h3><p>Detecte CPF, e-mail, telefone e outros dados sensíveis e aplique regras de proteção.</p></article>
            <article><span className="feature-icon">✓</span><h3>Validação de Dados</h3><p>Compare origem e destino antes da execução e acompanhe os resultados da migração.</p></article>
          </div>
        </section>

        <section className="security-band" id="seguranca">
          <div className="container security-band__inner">
            <div><span className="eyebrow">SEGURANÇA POR PADRÃO</span><h2>Seus dados continuam sob controle.</h2><p>O Placeholder foi pensado para manter credenciais, regras de anonimização e histórico de ações organizados em um fluxo auditável.</p></div>
            <div className="security-list"><span>🔐 Credenciais protegidas</span><span>🧾 Logs de auditoria</span><span>👁 Prévia antes da execução</span></div>
          </div>
        </section>

        <section className="cta container" id="sobre">
          <h2>Pronto para criar sua primeira migração?</h2>
          <p>Este protótipo demonstra o fluxo visual completo do Placeholder.</p>
          <Link className="btn btn--primary btn--lg" to="/register">Criar minha conta</Link>
        </section>
      </main>
      <footer className="landing__footer container"><Logo /><span>Placeholder © 2026 · Protótipo acadêmico</span></footer>
    </div>
  )
}
