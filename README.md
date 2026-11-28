# Placeholder — Front-end

Interface da plataforma de migração MySQL → Oracle (React 18 + Vite, React Router). Conversa só
com o **Backend Core**, via `/api`.

## Telas

Todas as telas mostram dados do Backend Core; nada é fixo no front.

| Tela | Fonte no Core |
|---|---|
| **Login** (`/login`) | `POST /auth/login`; a sessão (token + usuário) fica no `localStorage` e é conferida em `GET /auth/me` ao abrir. Não há cadastro nem recuperação de senha: os usuários são criados pelo administrador (`AUTH_SEED_USERS`) |
| **Dashboard** | `GET /metrics` (contagens, taxa de sucesso, tempos, conflitos por quem decidiu) e `GET /migrations` (recentes, colunas anonimizadas dos sandboxes) |
| **Projetos** | `GET /migrations`, com filtros e a busca da barra superior (`?q=`); cada card abre o detalhe |
| **Nova migração** (`/app/migration/new`) | Origem → destino → análise → proposta → homologação dos DEFER → execução → resultado. Retoma pelo status (repetir um passo não cria outra migração); `?id=` abre uma migração existente |
| **Detalhe** (`/app/migrations/:id`) | `GET /migrations/:id` e `/events`: resumo, conflitos, verificações, sandbox, script e auditoria |
| **Relatórios** | Migrações concluídas e falhas, com exportação CSV no navegador |
| **Auditoria** | Eventos das migrações recentes: uma linha por transição, com o autor (`actor`) |
| **Conexões**, **Configurações** | `GET /connections` e `GET /settings`; num Core sem essas rotas, a tela avisa que estão indisponíveis |
| **Perfil** | Usuário e perfil da sessão |

Perfis: **DBA** homologa (aprova/rejeita) e executa; **Dev/QA** cria e analisa migrações e consulta
tudo, mas não vê as ações de homologação e execução (o Core também as recusa com 403).

No MVP, a origem é o banco de demonstração configurado no DB Layer (MySQL `vendas`); o assistente
não mostra credenciais.

## Rodando

**Na plataforma completa** (recomendado): repositório
[`placeholder-platform`](https://github.com/pedrolombardi/placeholder-platform) com
`docker compose up --build`, e depois abrir http://localhost:8080.

**Em desenvolvimento** (Node 18+, com o Backend Core em `localhost:3000`):

```bash
npm install
npm run dev          # http://localhost:5173; /api vai para o Core por proxy
```

Para outro endereço do Core: `CORE_URL=http://host:porta npm run dev`.

**Build e container:**

```bash
npm run build                         # gera dist/
docker build -t placeholder-front .   # nginx: serve dist/ e faz proxy de /api para backend:3000
```

## Código

| Arquivo | Papel |
|---|---|
| `src/api.js` | cliente do Backend Core (`/api`, ou `VITE_API_URL`), token Bearer, 401 → login, espera de status com timeout e cancelamento |
| `src/auth/` | sessão (`session.js`), `AuthProvider`, `useAuth` e `RequireAuth` |
| `src/labels.js` | rótulos em português de status, eventos e perfis; formatação de datas |
| `src/pages/MigrationWizard.jsx` | assistente de migração ligado ao Core |
| `src/pages/` | uma página por rota |
| `src/components/MigrationParts.jsx` | conflitos, verificações, sandbox, script e auditoria, usados no assistente e no detalhe |
| `src/components/` | layout, `Stepper`, `StatusBadge` e demais componentes visuais |
| `nginx.conf` | SPA + proxy `/api` → `http://backend:3000/` (rede do compose) |
| `vite.config.js` | proxy `/api` → `CORE_URL` (padrão `http://localhost:3000`) em desenvolvimento |
