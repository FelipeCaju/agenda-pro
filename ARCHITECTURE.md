# AgendaPro - Arquitetura

## 1. Visao Arquitetural

AgendaPro segue uma arquitetura em camadas, separando interface, regras de negocio e persistencia.

```text
Cliente Web / Android
        |
        v
Frontend React + Capacitor
        |
        v
API REST Node.js + Express
        |
        v
MySQL
```

## 2. Principios

- interface nao acessa banco diretamente
- regras de negocio ficam no backend
- acesso ao banco concentrado na camada `lib/data`
- autenticacao e autorizacao centralizadas
- multi-tenancy aplicado em todas as operacoes de negocio
- frontend orientado a mobile first

## 3. Frontend

Estrutura principal:

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

Camadas:

- `pages`: composicao das telas
- `components`: blocos reutilizaveis de UI
- `hooks`: acesso e cache de dados
- `services`: comunicacao com a API
- `context`: sessao/autenticacao
- `routes`: protecao e organizacao de navegacao

## 4. Backend

Estrutura principal:

```text
backend/src/
  controllers/
  lib/
  routes/
  services/
```

Camadas:

- `routes`: declaracao de endpoints
- `controllers`: traducao HTTP para caso de uso
- `services`: regras de negocio
- `lib`: acesso a dados, autenticacao por request, utilitarios e conexao com banco

## 5. Multi-tenancy

Modelo adotado:

- banco compartilhado
- segregacao logica por `organization_id`

Fluxo:

1. o usuario autentica
2. o backend resolve sua organizacao
3. as operacoes passam a usar esse contexto
4. consultas e mutacoes sao filtradas pela empresa

## 6. Modulos Principais

- autenticacao e onboarding
- agenda
- clientes
- servicos
- funcionarios
- bloqueios de horario
- configuracoes
- lembretes
- administracao de plataforma
- assinatura e pagamentos

## 7. Mobile

O app Android usa Capacitor:

- frontend buildado em `dist`
- assets sincronizados em `frontend/android`
- mesma API do ambiente web

## 8. Performance

Diretrizes aplicadas:

- queries com filtro no backend
- reducao de consultas repetidas
- indices no MySQL
- cache via React Query
- lazy loading das rotas

## 9. Deploy

Deploy recomendado:

- backend: Render
- banco: MySQL remoto
- Android: Android Studio / build mobile

