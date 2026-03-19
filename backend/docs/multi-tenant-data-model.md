# AgendaPro SaaS multiempresa

## Validacao da modelagem

A modelagem proposta esta boa para um SaaS com banco unico e isolamento logico por `organization_id`. O ponto mais importante para evitar vazamento entre empresas nao e apenas ter a coluna nas tabelas: e garantir que os relacionamentos tambem respeitem o mesmo `organization_id`.

## Ajustes recomendados

### 1. `app_settings` deve ser 1:1 com `organizations`

Manter `id` e valido, mas `organization_id` precisa ser `UNIQUE` para garantir apenas uma configuracao por empresa.

### 2. `appointments` deve validar cliente e servico no mesmo tenant

Nao basta ter `cliente_id` e `servico_id`. No MySQL, o banco precisa de chaves estrangeiras compostas:

- `(organization_id, cliente_id)` -> `clients (organization_id, id)`
- `(organization_id, servico_id)` -> `services (organization_id, id)`

Isso impede que um agendamento de uma empresa aponte para cliente ou servico de outra.

### 3. `users` deve ter unicidade por tenant

Recomendado:

- `UNIQUE (organization_id, email)`
- `UNIQUE (organization_id, google_id)` quando `google_id` existir

Se no futuro um mesmo usuario puder pertencer a varias empresas, o modelo ideal muda para `users` global + tabela `organization_users`. Como o escopo pedido hoje e um usuario por empresa, o modelo atual continua valido.

### 4. `appointments` com denormalizacao util

Os campos `cliente_nome`, `cliente_email`, `servico_nome` e `servico_cor` fazem sentido para preservar historico, mesmo que o cadastro mude depois.

### 5. `horario_inicial` e `horario_final`

O formato separado por `data` + horario funciona bem para agenda comercial. Ainda assim, o backend deve tratar tudo com timezone da empresa definido em `app_settings.timezone`.

### 6. dados sensiveis do WhatsApp

`whatsapp_api_token` e `whatsapp_instance_id` podem ficar em `app_settings` nesta fase, mas o ideal e criptografar esses campos em repouso ou migrar depois para secret manager.

## Regras operacionais

- toda tabela operacional usa `organization_id`
- toda query de leitura e escrita filtra por `organization_id`
- toda atualizacao por id deve usar `WHERE id = ? AND organization_id = ?`
- nenhuma foreign key operacional pode ignorar o tenant
- denormalizacao em `appointments` deve ser preenchida no momento da criacao

## Relacionamentos

- `organizations` 1:N `users`
- `organizations` 1:N `clients`
- `organizations` 1:N `services`
- `organizations` 1:N `appointments`
- `organizations` 1:1 `app_settings`
- `clients` 1:N `appointments`
- `services` 1:N `appointments`

## Estrategia de isolamento

1. o backend identifica a organizacao autenticada
2. o `organization_id` entra no contexto da requisicao
3. repositories/services sempre recebem `organizationId`
4. queries compostas validam o tenant em joins e foreign keys
5. logs e auditoria devem registrar `organization_id`

## Banco padrao

O projeto agora usa MySQL como caminho principal de implantacao local, inclusive para XAMPP/MariaDB.

- migration recomendada: `backend/db/migrations/001_init_multitenant_mysql.sql`
- database name recomendado: `agendapro`
