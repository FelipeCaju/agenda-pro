# AgendaPro

AgendaPro e uma plataforma SaaS para agenda, atendimento e operacao de negocios de servico. O sistema foi construido para operar em modelo multi-tenant, com varias empresas compartilhando o mesmo banco de dados e isolamento logico por organizacao.

## Resumo Executivo

- frontend web em React + Vite
- app Android via Capacitor
- backend REST em Node.js + Express
- persistencia em MySQL
- controle de trial, assinatura, cobranca e bloqueio por inadimplencia
- administracao centralizada por acesso master da plataforma

## Arquitetura

```text
Web / Android
     |
     v
Frontend React + Vite + Capacitor
     |
     v
API REST Node.js + Express
     |
     v
MySQL
```

O frontend nunca acessa o banco diretamente. Toda autenticacao, segregacao multi-tenant, regra de negocio e cobranca passam pelo backend.

## Principais Funcionalidades

- login por email e senha
- criacao de conta com onboarding e trial
- gestao de clientes
- gestao de servicos
- gestao de funcionarios
- agenda de atendimentos
- bloqueio de horarios
- lembretes e integracao com WhatsApp
- configuracoes da empresa
- painel com indicadores operacionais e financeiros
- area master para administracao de clientes SaaS
- cobranca com Pix, alerta de vencimento, folga configuravel e bloqueio de acesso

## Perfis de Acesso

### Cliente SaaS

Cada empresa cliente acessa somente os seus dados e pode operar:

- clientes
- servicos
- agenda
- funcionarios
- bloqueios
- configuracoes
- pagamentos e assinatura

### Super Admin

O acesso master da plataforma permite:

- cadastrar e acompanhar organizacoes
- configurar status de assinatura
- registrar pagamentos
- definir chave Pix da plataforma
- configurar dias de alerta e dias de folga
- acompanhar clientes bloqueados
- visualizar quando um cliente sinaliza que ja realizou o pagamento

## Estrutura do Repositorio

```text
agenda-pro/
  backend/
    db/
      migrations/
    docs/
    src/
      controllers/
      lib/
      routes/
      services/
  frontend/
    android/
    src/
      components/
      context/
      hooks/
      pages/
      routes/
      services/
      utils/
  docs/
```

## Tecnologias

### Frontend

- React 18
- Vite
- React Router
- React Query
- Tailwind CSS
- Capacitor

### Backend

- Node.js
- Express
- MySQL

### Deploy

- backend: Render
- frontend web: Vercel
- app Android: Android Studio / Capacitor

## Variaveis de Ambiente

### Backend

Arquivo de referencia: `backend/.env.example`

Variaveis principais:

- `PORT`
- `DB_CLIENT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_CONNECTION_LIMIT`
- `SESSION_SECRET`
- `SESSION_TTL_HOURS`
- `PENDING_SESSION_TTL_MINUTES`
- `CORS_ALLOWED_ORIGINS`
- `LOGIN_RATE_LIMIT_WINDOW_MS`
- `LOGIN_RATE_LIMIT_MAX_REQUESTS`
- `LOGIN_MAX_FAILURES`
- `LOGIN_BLOCK_WINDOW_MS`
- `SENSITIVE_RATE_LIMIT_WINDOW_MS`
- `SENSITIVE_RATE_LIMIT_MAX_REQUESTS`
- `PLATFORM_ADMIN_EMAILS`
- `PLATFORM_ADMIN_PASSWORD`
- `Z_API_BASE_URL`
- `Z_API_INSTANCE_ID`
- `Z_API_TOKEN`
- `Z_API_CLIENT_TOKEN`

### Frontend

Arquivo de referencia: `frontend/.env.example`

Variavel principal:

- `VITE_API_URL`

Exemplos:

- local web: `http://127.0.0.1:3333/api`
- emulador Android: `http://10.0.2.2:3333/api`
- celular na rede local: `http://SEU_IP:3333/api`
- producao: `https://SUA_API_PUBLICA/api`

## Execucao Local

Na raiz do projeto:

```powershell
npm install
```

Subir backend:

```powershell
npm.cmd run start --workspace backend
```

Subir frontend web:

```powershell
npm.cmd run dev --workspace frontend
```

Gerar build do frontend:

```powershell
npm.cmd run build --workspace frontend
```

## Android

Sincronizar assets do app:

```powershell
npm.cmd run build --workspace frontend
npm.cmd run cap:sync --workspace frontend
```

Abrir no Android Studio:

```powershell
npm.cmd run cap:open:android --workspace frontend
```

Projeto Android:

- [frontend/android](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/frontend/android)

## Deploy

### Backend no Render

Configuracao recomendada:

- `Root Directory`: `backend`
- `Build Command`: `npm install`
- `Start Command`: `npm run start`

### Frontend Web na Vercel

Configuracao recomendada:

- `Framework`: `Vite`
- `Root Directory`: `frontend`
- `Build Command`: `npm run build`
- `Output Directory`: `dist`
- `Install Command`: `npm install`

Variavel obrigatoria:

- `VITE_API_URL=https://SUA_API_PUBLICA/api`

## Status Atual do Produto

- multi-tenant ativo em MySQL
- onboarding com criacao de conta disponivel
- area web publicada
- backend publicado no Render
- Android operacional via Capacitor
- controle de trial, vencimento, Pix e bloqueio habilitado
- painel com filtros por periodo e indicadores financeiros por servico

## Documentacao Complementar

- [Arquitetura](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/ARCHITECTURE.md)
- [Documentacao do Sistema](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/docs/SYSTEM_DOCUMENTATION.md)
- [Modelo de Dados Multi-tenant](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/backend/docs/multi-tenant-data-model.md)
- [Runbook Operacional](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/docs/RUNBOOK_OPERACIONAL.md)
- [Procedimento de Backup e Restore](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/docs/PROCEDIMENTO_BACKUP_RESTORE.md)
- [Checklist de Deploy](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/docs/CHECKLIST_DEPLOY_PRODUCAO.md)
