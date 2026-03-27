# AgendaPro - Documentacao do Sistema

## 1. Objetivo do Produto

AgendaPro e uma plataforma SaaS para empresas que operam por agenda e atendimento. O sistema centraliza operacao, cadastro, agenda, cobranca e administracao de multiplos clientes dentro de um unico produto.

O objetivo do projeto e oferecer:

- operacao diaria para empresas cliente
- governanca central para o administrador da plataforma
- modelo de cobranca recorrente com trial e bloqueio por inadimplencia

## 2. Escopo Funcional

O sistema cobre os seguintes dominios:

- autenticacao
- criacao de conta e onboarding
- clientes
- servicos
- funcionarios
- agenda
- bloqueios de horario
- lembretes
- configuracoes da empresa
- painel de indicadores
- administracao da plataforma
- assinatura, cobranca e pagamento

## 3. Perfis de Usuario

### 3.1 Cliente SaaS

Representa a empresa contratante da AgendaPro.

Pode operar:

- clientes
- servicos
- funcionarios
- agenda
- configuracoes
- bloqueios
- lembretes
- assinatura e pagamentos

### 3.2 Super Admin

Representa o operador da plataforma.

Pode operar:

- cadastro de organizacoes
- visualizacao do parque de clientes
- definicao de status de assinatura
- registro de pagamentos
- configuracao financeira global
- acompanhamento de sinalizacao de pagamento

## 4. Fluxos Principais

### 4.1 Login

Usuarios existentes entram com email e senha. A API devolve sessao com:

- usuario
- organizacao
- perfil
- estado da assinatura
- bloqueio de acesso

### 4.2 Criacao de Conta

O sistema permite criacao de conta por email ainda nao cadastrado. O onboarding gera:

- nova organizacao
- usuario owner
- acesso inicial autenticado

Esse fluxo e a base para trial autoatendido.

### 4.3 Trial

Uma nova conta pode iniciar em periodo de teste. Ao final do trial:

- o acesso pode permanecer liberado dentro da folga configurada
- depois disso, o sistema bloqueia o uso operacional ate regularizacao

### 4.4 Pagamento e Continuacao

Quando ha cobranca pendente:

- o cliente visualiza status da assinatura
- a chave Pix fica disponivel
- o cliente pode informar que ja pagou
- o administrador pode registrar o pagamento e liberar o uso

## 5. Regras de Negocio Relevantes

### 5.1 Multi-tenancy

Todas as operacoes operacionais sao segregadas por `organization_id`.

Consequencias:

- clientes de uma empresa nao acessam dados de outra
- o banco e compartilhado, mas o contexto de tenant e obrigatorio
- a API resolve o tenant a partir da sessao autenticada

### 5.2 Assinatura

O sistema suporta:

- status de assinatura
- trial
- vencimento
- janela de alerta
- janela de folga
- bloqueio apos a folga

### 5.3 Bloqueio

O bloqueio nao e apenas visual. O backend tambem pode restringir operacoes operacionais quando a organizacao perde o direito de acesso.

### 5.4 Pagamento

Pagamentos podem ser:

- pendentes
- pagos

Esse estado impacta o painel financeiro, os avisos de cobranca e a liberacao da organizacao.

## 6. Modulos do Sistema

### 6.1 Painel

Responsavel por exibir:

- indicadores operacionais
- recorte por periodo
- financeiro por servico
- valores recebidos e a receber
- destaques de servicos e clientes

### 6.2 Agenda

Permite:

- cadastrar atendimentos
- editar atendimentos
- atualizar status do atendimento
- atualizar status de pagamento
- visualizar compromissos por periodo

### 6.3 Clientes

Permite:

- cadastrar clientes
- editar clientes
- ativar ou desativar clientes

### 6.4 Servicos

Permite:

- cadastrar servicos
- editar servicos
- ativar ou desativar servicos

### 6.5 Funcionarios

Permite:

- cadastrar profissionais
- vincular profissionais ao contexto operacional da empresa

### 6.6 Lembretes

Permite:

- acompanhamento de lembretes
- operacao manual
- integracao com WhatsApp quando configurada

### 6.7 Gestao de Assinatura

Permite:

- exibir situacao da assinatura
- mostrar vencimento
- mostrar chave Pix
- informar pagamento realizado

### 6.8 Administracao da Plataforma

Permite:

- listar organizacoes
- criar organizacoes
- registrar pagamentos
- configurar parametros financeiros da plataforma

## 7. Arquitetura Tecnica

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

### Banco de Dados

- MySQL

### Hospedagem

- backend em Render
- frontend web em Vercel

## 8. Estrutura de Dados

Tabelas centrais do dominio:

- `organizations`
- `users`
- `clients`
- `services`
- `professionals`
- `professional_services`
- `appointments`
- `blocked_slots`
- `app_settings`
- `organization_payments`
- `platform_settings`

## 9. Operacao por Ambiente

### Desenvolvimento Local

1. configurar `backend/.env`
2. configurar `frontend/.env`
3. instalar dependencias
4. subir backend
5. subir frontend ou executar build mobile

### Web em Producao

- frontend servido pela Vercel
- frontend apontando para a API publica do Render

### Android

1. gerar build do frontend
2. executar `cap sync`
3. abrir `frontend/android`
4. instalar no dispositivo pelo Android Studio

## 10. Seguranca

- segredos fora do codigo e em variaveis de ambiente
- API como unica porta de entrada para regra e persistencia
- autenticacao centralizada
- isolamento multi-tenant
- recomendada rotacao de credenciais compartilhadas em ambiente de teste

## 11. Performance

Melhorias relevantes ja aplicadas:

- filtros do painel processados no backend
- cache de queries no frontend
- lazy loading de rotas
- indices nas tabelas mais consultadas
- reducao de consultas repetidas

## 12. Limites e Evolucoes Recomendadas

Itens recomendados para proximas iteracoes:

- monitoramento centralizado
- suite E2E dos fluxos principais
- analytics mais completos no painel
- automacao de deploy entre GitHub, Render e Vercel
- ampliacao do suporte a iOS nativo, se necessario
