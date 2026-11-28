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
          <Link className="btn btn--primary" to="/app/dashboard">Acessar plataforma</Link>
        </div>
      </header>

      <main>
        <section className="hero container" id="produto">
          <div className="hero__copy">
            <span className="eyebrow">DADOS EM UM NOVO AMANHÃ</span>
            <h1>Migre seus dados com <span>inteligência</span> e segurança.</h1>
            <p>Migração de MySQL para Oracle: o código resolve as conversões mecânicas, a IA propõe as ambíguas e o DBA homologa antes de qualquer execução.</p>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/login">Entrar</Link>
              <a className="btn btn--secondary btn--lg" href="#como-funciona">Saiba mais</a>
            </div>
            <div className="trust-row">
              <span>✓ Mapeamento assistido por IA</span>
              <span>✓ Sandbox com dados anonimizados</span>
              <span>✓ Trilha de auditoria por usuário</span>
            </div>
          </div>
          <div className="hero__visual" aria-label="Ilustração de migração de banco de dados">
            <div className="db-card db-card--source">
              <div className="database-illustration"><i/><i/><i/></div>
              <strong>Origem</strong><small>MySQL (somente leitura)</small>
            </div>
            <div className="migration-beam"><span>IA</span><b>→</b></div>
            <div className="db-card db-card--target">
              <div className="database-illustration"><i/><i/><i/></div>
              <strong>Destino</strong><small>Oracle Database</small>
            </div>
          </div>
        </section>

        <section className="feature-section container" id="como-funciona">
          <div className="section-heading"><span className="eyebrow">PLATAFORMA COMPLETA</span><h2>Da análise ao resultado, em um único fluxo</h2></div>
          <div className="feature-grid">
            <article><span className="feature-icon">✦</span><h3>Migração Inteligente</h3><p>Cada coluna é classificada: conversões mecânicas são resolvidas por regra e os conflitos de julgamento vão para a IA, que propõe ou defere ao DBA.</p></article>
            <article><span className="feature-icon">🛡</span><h3>Sandbox anonimizado</h3><p>Uma amostra da origem é anonimizada pelo Data Layer antes de validar o plano, sem expor os dados reais.</p></article>
            <article><span className="feature-icon">✓</span><h3>Validação de Dados</h3><p>O plano aprovado passa por verificações determinísticas no sandbox Oracle e gera um script de migração para revisão do DBA.</p></article>
          </div>
        </section>

        <section className="security-band" id="seguranca">
          <div className="container security-band__inner">
            <div><span className="eyebrow">SEGURANÇA POR PADRÃO</span><h2>Seus dados continuam sob controle.</h2><p>A origem é lida em modo somente leitura, nada é escrito no destino sem homologação e cada ação fica registrada com o seu autor.</p></div>
            <div className="security-list"><span>🔐 Acesso por perfil (DBA e Dev/QA)</span><span>🧾 Trilha de auditoria</span><span>👁 Homologação antes da execução</span></div>
          </div>
        </section>

        <section className="cta container" id="sobre">
          <h2>Pronto para criar sua primeira migração?</h2>
          <p>O acesso é criado pelo administrador da plataforma.</p>
          <Link className="btn btn--primary btn--lg" to="/login">Entrar</Link>
        </section>
      </main>
      <footer className="landing__footer container"><Logo /><span>Placeholder © 2026 · Migração MySQL → Oracle</span></footer>
    </div>
  )
}
