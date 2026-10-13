# Placeholder — Front-end

Interface da plataforma de migração MySQL → Oracle (React 18 + Vite, React Router). Conversa só
com o **Backend Core**, via `/api`.

## O que é real e o que é protótipo

| Tela | Situação |
|---|---|
| **Nova migração** (`/app/migration/new`) | **Real.** Origem → destino → análise (DB Layer + AI Layer) → proposta → homologação dos DEFER → execução (sandbox anonimizado + validação) → resultado, com as verificações, o script `.sql` para baixar e a trilha de auditoria |
| **Projetos** (`/app/projects`) | **Real.** Migrações do Core, com status e filtros |
| **Auditoria** (`/app/audit`) | **Real.** Eventos das migrações mais recentes |
| Dashboard, Relatórios, Conexões, Configurações, Perfil | Protótipo navegável, com dados de exemplo |
| Login, cadastro, recuperar senha | Protótipo navegável: não há autenticação no MVP (Fase 7) |

No MVP, a origem é o banco de demonstração configurado no DB Layer (MySQL `vendas`); os campos de
conexão aparecem fixos no assistente.

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
| `src/api.js` | cliente do Backend Core (`/api`, ou `VITE_API_URL`) e espera de status |
| `src/pages/MigrationWizard.jsx` | assistente de migração ligado ao Core |
| `src/pages/Projects.jsx`, `src/pages/Audit.jsx` | listas reais do Core |
| `src/components/` | layout, `Stepper`, `StatusBadge` e demais componentes visuais |
| `nginx.conf` | SPA + proxy `/api` → `http://backend:3000/` (rede do compose) |
| `vite.config.js` | proxy `/api` → `CORE_URL` (padrão `http://localhost:3000`) em desenvolvimento |
