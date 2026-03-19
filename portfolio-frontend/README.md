# AgendaPro Frontend

Recorte do frontend do AgendaPro para uso como repositorio de portfolio.

## O que esta incluido

- React 18 + Vite
- Tailwind CSS
- React Router
- TanStack React Query
- preparo para Capacitor

## O que nao esta incluido

- backend
- banco de dados
- credenciais
- logica sensivel de integracoes

## Como rodar

1. Instale as dependencias:
   - `npm install`
2. Crie um arquivo `.env` com base em `.env.example`
3. Defina a API:
   - `VITE_API_URL=http://localhost:3333/api`
4. Rode o projeto:
   - `npm run dev`

## Build

- `npm run build`

## Capacitor

Quando quiser testar como app:

- `npm run cap:add:android`
- `npm run cap:sync`
- `npm run cap:open:android`

## Observacao

Este repositorio foi separado para apresentacao de interface e arquitetura do frontend. Algumas funcionalidades dependem de uma API compativel rodando externamente.
