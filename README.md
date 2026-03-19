# AgendaPro

Base inicial da nova arquitetura do AgendaPro, preparada para remover dependencias do Base44 sem misturar regra de negocio com componentes.

## Estrutura

- `frontend/`: React 18 + Vite + React Router + Tailwind + React Query + Context API
- `backend/`: Node.js + Express
- `backend/db/migrations/001_init_multitenant_mysql.sql`: schema MySQL padrao para XAMPP/phpMyAdmin

## Principios

- componentes nao acessam banco
- integracoes passam por `services`
- autenticacao sai de `base44.auth` e vai para `AuthContext` + `auth.service`
- multiempresa sai de entidades acopladas e vai para `TenantContext` + `organizations.service`
- o layout mobile-first continua como prioridade

## Estado atual

- frontend separado por `pages`, `components`, `hooks`, `context` e `services`
- backend Express com `controllers`, `services` e `lib`
- persistencia MySQL ativa no backend com seed inicial para contas demo
- isolamento multiempresa por `organization_id` em todas as consultas operacionais

## Banco local

O projeto passa a usar MySQL como padrao.

1. Abra o phpMyAdmin do XAMPP
2. Cole o SQL de `backend/db/migrations/001_init_multitenant_mysql.sql`
3. O projeto ja inclui um `backend/.env` local com os valores padrao do XAMPP
4. Se precisar, ajuste esse arquivo com base em `backend/.env.example`

Valores locais recomendados:

- `DB_CLIENT=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_NAME=agendapro`
- `DB_USER=root`
- `DB_PASSWORD=`
- `PORT=3333`

## Layout responsivo

- celular: navegacao inferior fixa e cabecalhos compactos
- tablet: layout ainda prioriza toque, mas com mais respiro
- desktop: sidebar lateral + topo proprio para aproveitar melhor a largura

## Preparacao para app mobile

O frontend ja ficou preparado para Capacitor.

Arquivos principais:

- `frontend/capacitor.config.ts`
- `frontend/package.json`
- `frontend/.env.example`

Quando voce quiser conectar Android e iOS:

1. rode `npm install` na raiz
2. crie `frontend/.env` com `VITE_API_URL`
3. se a API estiver no seu computador, use algo como `http://192.168.11.4:3333/api`
4. se a API estiver online, use a URL publica dela
5. rode `npm run build --workspace frontend`
6. rode `npm run cap:add:android --workspace frontend`
7. rode `npm run cap:add:ios --workspace frontend`
8. rode `npm run cap:sync --workspace frontend`

Observacoes:

- Android pode ser gerado no Windows com Android Studio
- iOS exige Xcode e Mac para build final
- o backend continua separado; o app mobile consome a mesma API
- se a API estiver local no computador, celular e PC precisam estar na mesma rede
