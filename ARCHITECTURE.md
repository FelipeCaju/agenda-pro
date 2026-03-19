# Nova arquitetura proposta

## Frontend

```text
frontend/
  src/
    components/
      ui/
      layout/
      agenda/
      clients/
      services/
      reminders/
      whatsapp/
    pages/
    hooks/
    services/
      api/
    context/
    utils/
    lib/
    routes/
```

### Substituicoes do Base44

- `base44.entities` -> `services/*` + rotas REST do backend
- `base44.auth` -> `context/auth-context.tsx` + `services/auth.service.ts`
- integracoes acopladas -> `services/api/client.ts`
- estado espalhado em componentes -> `context/*` e hooks com React Query

## Backend

```text
backend/
  src/
    routes/
    controllers/
    services/
    lib/
```

## Banco

MySQL passa a ser o banco padrao do projeto, pensando em uso com XAMPP/MariaDB no ambiente local.

- migration principal: `backend/db/migrations/001_init_multitenant_mysql.sql`
- configuracao-base do backend: `backend/src/lib/database.js`
- variaveis de ambiente: `backend/.env.example`

A camada de acesso ao banco deve ficar no backend, nunca em componentes React.
