# AgendaPro

AgendaPro e uma plataforma SaaS de agenda e gestao operacional para negocios de atendimento, com frontend web/mobile em React + Capacitor e backend Node.js + Express com persistencia em MySQL.

## Visao Geral

- multiempresa com isolamento por `organization_id`
- autenticacao de clientes e acesso administrativo de plataforma
- agenda, clientes, servicos, funcionarios, bloqueios e lembretes
- controle de assinatura, cobranca, Pix e bloqueio por inadimplencia
- app Android via Capacitor consumindo a mesma API do ambiente web

## Stack

- `frontend/`: React 18, Vite, React Router, React Query, Tailwind CSS, Capacitor
- `backend/`: Node.js, Express
- `database`: MySQL
- `deploy`: Render para API e Android Studio para app mobile

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
  docs/
```

## Ambientes

### Backend

Arquivo base: `backend/.env.example`

Variaveis mais importantes:

- `PORT`
- `DB_CLIENT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `PLATFORM_ADMIN_EMAILS`
- `PLATFORM_ADMIN_PASSWORD`

### Frontend

Arquivo base: `frontend/.env.example`

Variavel principal:

- `VITE_API_URL`

Exemplos:

- web local: `http://127.0.0.1:3333/api`
- emulador Android: `http://10.0.2.2:3333/api`
- celular na rede local: `http://SEU_IP:3333/api`
- producao: `https://SEU_BACKEND/api`

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

Build do frontend:

```powershell
npm.cmd run build --workspace frontend
```

## Android

Gerar e sincronizar assets:

```powershell
npm.cmd run build --workspace frontend
npm.cmd run cap:sync --workspace frontend
```

Abrir no Android Studio:

```powershell
npm.cmd run cap:open:android --workspace frontend
```

Abra a pasta `frontend/android` no Android Studio.

## Deploy

### Backend no Render

Configuracao recomendada:

- `Root Directory`: `backend`
- `Build Command`: `npm install`
- `Start Command`: `npm run start`

Depois do deploy, atualize o frontend para apontar `VITE_API_URL` para a URL publica da API.

## Documentacao

- [Documentacao do Sistema](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/docs/SYSTEM_DOCUMENTATION.md)
- [Arquitetura](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/ARCHITECTURE.md)
- [Modelo de Dados Multi-tenant](/c:/Users/leole/Documents/projetos-pessoais/agenda-pro/agenda-pro/backend/docs/multi-tenant-data-model.md)

## Status Atual

- multi-tenant ativo no MySQL
- autenticacao e onboarding em producao
- modulo administrativo de plataforma
- cobranca com Pix, aviso de pagamento e bloqueio por assinatura
- frontend otimizado com cache de queries, filtros reais no painel e lazy loading de rotas

