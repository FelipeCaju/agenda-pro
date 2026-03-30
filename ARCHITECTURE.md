# AgendaPro - Arquitetura

## 1. Visao Geral

AgendaPro adota uma arquitetura em camadas, com separacao clara entre interface, servicos de negocio e persistencia. O objetivo e manter a aplicacao web, o app Android e o backend compartilhando a mesma base funcional sem duplicar regras.

```text
Cliente Web / Android
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

## 2. Principios Arquiteturais

- backend como fonte unica das regras de negocio
- frontend orientado a consumo de API
- multi-tenancy aplicado no backend e na persistencia
- autenticacao e autorizacao centralizadas
- modelo mobile-first na interface
- mesma base funcional para web e Android

## 3. Frontend

### Tecnologias

- React 18
- Vite
- React Router
- React Query
- Tailwind CSS
- Capacitor

### Estrutura

```text
frontend/src/
  components/
  context/
  hooks/
  pages/
  routes/
  services/
  utils/
```

### Responsabilidades

- renderizacao de interface
- navegacao e protecao de rotas
- formularios e validacao basica
- consumo e cache de dados via API
- experiencia web e mobile

### Organizacao Interna

- `pages`: telas da aplicacao
- `components`: blocos reutilizaveis
- `hooks`: integracao com React Query e estado derivado
- `services`: comunicacao com a API
- `context`: sessao e autenticacao
- `routes`: composicao e protecao de rotas

## 4. Backend

### Tecnologias

- Node.js
- Express
- MySQL

### Estrutura

```text
backend/src/
  controllers/
  lib/
  routes/
  services/
```

### Responsabilidades

- autenticacao e sessao
- onboarding
- regras de assinatura e cobranca
- segregacao multi-tenant
- persistencia e consultas
- exposicao da API REST

### Organizacao Interna

- `routes`: definicao dos endpoints
- `controllers`: adaptacao HTTP
- `services`: regras de negocio
- `lib`: acesso a dados, autenticacao por request, utilitarios e conexao com banco

## 5. Multi-tenancy

O sistema utiliza banco compartilhado com segregacao logica por `organization_id`.

### Fluxo

1. o usuario autentica
2. o backend identifica a organizacao associada
3. o contexto da request passa a carregar essa organizacao
4. consultas e mutacoes filtram pelo tenant correto

### Beneficios

- menor custo operacional
- modelo SaaS centralizado
- manutencao unica da plataforma
- escalabilidade com base compartilhada

## 6. Autenticacao e Onboarding

### Login existente

Usuarios cadastrados entram por email e senha. O backend devolve uma sessao assinada com expiracao, usada para carregar:

- usuario
- organizacao
- perfil de acesso
- status de bloqueio
- necessidade de onboarding

### Criacao de conta

Quando o email ainda nao existe, o fluxo de onboarding pode ser iniciado pela interface. O backend cria:

- organizacao
- usuario owner
- sessao autenticada

### Acesso master

O Super Admin e configurado por variaveis de ambiente e opera fora do fluxo de usuario comum.

## 7. Assinatura e Cobranca

O dominio de assinatura e tratado como parte central da arquitetura.

### Elementos

- status de assinatura
- trial
- vencimento
- dias de alerta
- dias de folga
- chave Pix
- notificacao de pagamento informado pelo cliente

### Aplicacao

- frontend exibe status, alerta e tela de bloqueio
- backend aplica bloqueio real nas rotas operacionais quando o acesso nao pode continuar

## 8. Mobile

O app Android utiliza Capacitor e compartilha o mesmo frontend React usado na web.

### Fluxo

1. o frontend gera `dist`
2. `cap sync` copia os assets para `frontend/android`
3. o projeto Android e executado no Android Studio

### Beneficio

- menor custo de manutencao
- mesma regra de negocio e mesma API
- consistencia entre navegador e app

## 9. Performance

Otimizacoes aplicadas no projeto:

- filtros do painel executados no backend
- indices automáticos nas tabelas de maior uso
- reducao de consultas repetidas
- cache via React Query
- lazy loading das rotas
- bundle inicial reduzido no frontend

## 10. Deploy

### Backend

- hospedado no Render
- API publica consumida por web e mobile

### Frontend Web

- hospedado na Vercel

### Android

- distribuido a partir do projeto Capacitor

## 11. Evolucao Recomendada

- observabilidade centralizada
- testes E2E para fluxos criticos
- pipeline de deploy mais automatizado
- metrics de uso por tenant
- evolucao do painel analitico
