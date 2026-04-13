# AgendaPro - Documentacao Completa do Sistema

## 1. Visao Geral

AgendaPro e uma plataforma SaaS de agenda, operacao e cobranca para negocios que trabalham com atendimentos agendados.

O sistema atende dois niveis de operacao:

- a operacao diaria de cada empresa cliente
- a administracao central da plataforma SaaS

O produto combina agenda, cadastro, atendimento, lembretes, orcamentos, configuracoes, assinatura, cobranca e administracao multi-tenant em um unico sistema.

Tambem existe suporte a uso web e a app Android empacotado com Capacitor.

## 2. Objetivo do Produto

O objetivo do AgendaPro e permitir que uma empresa cliente:

- cadastre sua conta
- configure sua empresa
- mantenha clientes, servicos e profissionais
- registre e acompanhe atendimentos
- bloqueie horarios indisponiveis
- acompanhe cobranca e assinatura
- envie e monitore lembretes
- gere orcamentos e converta propostas em operacao

Ao mesmo tempo, o sistema oferece para o super admin da plataforma:

- cadastro e acompanhamento das organizacoes SaaS
- parametrizacao financeira global
- controle manual da assinatura
- registro administrativo de pagamentos
- liberacao ou bloqueio operacional conforme assinatura e inadimplencia

## 3. Perfis de Usuario

### 3.1 Usuario da Organizacao

E o usuario autenticado dentro de uma empresa cliente.

O modelo de sessao suporta perfis como:

- `owner`
- `admin`
- `manager`
- `staff`
- `viewer`

Na implementacao atual, o uso operacional principal gira em torno do owner e dos membros da organizacao autenticados no contexto do tenant.

Esse usuario pode acessar:

- painel
- agenda
- clientes
- servicos
- profissionais
- bloqueios
- lembretes
- configuracoes
- orcamentos
- pagamento e historico da assinatura

### 3.2 Super Admin da Plataforma

E o operador central do SaaS.

Esse perfil acessa a area administrativa da plataforma e pode:

- listar organizacoes
- criar novas organizacoes manualmente
- definir plano, status e vencimento de assinatura
- registrar pagamentos
- configurar chave Pix global da plataforma
- configurar dias de alerta e dias de folga apos vencimento
- acompanhar quais clientes estao bloqueados ou liberados
- ver quando um cliente informou que ja fez o pagamento

## 4. Escopo Funcional Atual

O sistema hoje cobre os seguintes dominios:

- autenticacao por email e senha
- autenticacao social com Google
- autenticacao social com Apple
- criacao de conta autoatendida
- onboarding de primeiro acesso
- sessao autenticada com contexto de tenant
- dashboard com indicadores operacionais e financeiros
- agenda com visoes diaria, semanal e mensal
- cadastro e manutencao de agendamentos
- atualizacao de status do atendimento
- atualizacao de status de pagamento do atendimento
- recorrencia de agendamentos
- bloqueios de horario gerais ou por profissional
- gestao de clientes
- gestao de servicos
- gestao de profissionais
- configuracoes operacionais da empresa
- configuracoes de WhatsApp para lembretes
- configuracoes de orcamentos
- listagem e operacao de lembretes
- criacao e manutencao de orcamentos
- aprovacao e recusa de orcamentos
- conversao de orcamento em rascunho de agendamento
- conversao de orcamento em ordem de servico
- fluxo de pagamento por Pix
- historico de cobranca da organizacao
- notificacao do cliente informando que ja pagou
- bloqueio de acesso por assinatura
- administracao central da plataforma
- notificacoes locais no Android

## 5. Jornada do Usuario da Organizacao

## 5.1 Login

O acesso pode ocorrer por:

- email e senha
- Google
- Apple

Depois da autenticacao, a sessao devolve:

- token
- escopo da sessao
- dados do usuario
- dados da organizacao
- status de acesso
- necessidade de onboarding
- bloqueio ou liberacao de uso

O redirecionamento pos-login depende do estado da conta:

- se precisa onboarding, vai para `/onboarding`
- se a assinatura estiver bloqueada, vai para `/assinatura-bloqueada`
- se estiver tudo regular, vai para a area principal

## 5.2 Criacao de Conta

Existe uma tela publica de criacao de conta em `/criar-conta`.

O fluxo coleta:

- email
- nome do usuario
- nome da empresa
- telefone
- senha
- confirmacao de senha

Ao finalizar:

- o sistema inicia o fluxo de onboarding
- cria a organizacao
- cria o usuario owner inicial
- autentica o usuario
- libera o acesso inicial conforme a politica de assinatura

Se o email ja existir, o sistema orienta o usuario a voltar para o login.

## 5.3 Onboarding

O onboarding de primeiro acesso existe para completar contas que ainda nao finalizaram a criacao da organizacao.

O fluxo suporta:

- onboarding tradicional com senha local
- onboarding de conta social com Google ou Apple

Campos tratados:

- nome do usuario
- nome da empresa
- telefone
- senha, quando aplicavel

No onboarding social, a senha local nao e obrigatoria.

## 5.4 Logout e Encerramento de Conta

O sistema permite:

- logout da sessao atual
- exclusao da conta do usuario atual

A exclusao da conta:

- encerra o acesso do usuario
- limpa a sessao local
- nao apaga automaticamente os dados da empresa nessa etapa

## 6. Multi-tenancy e Isolamento

AgendaPro e multi-tenant.

Cada operacao operacional ocorre no contexto de uma `organization`.

Principios aplicados:

- dados operacionais sao segregados por `organization_id`
- o backend resolve o tenant a partir da sessao autenticada
- um usuario de uma empresa nao deve acessar dados de outra
- o banco pode ser compartilhado, mas o recorte logico e obrigatorio
- as rotas de administracao da plataforma ficam separadas das rotas operacionais

Tabelas tenant-scoped incluem:

- `users`
- `clients`
- `services`
- `appointments`
- `blocked_slots`
- `app_settings`

## 7. Regras de Assinatura e Acesso

O sistema possui controle de assinatura por organizacao.

Estados suportados:

- `active`
- `overdue`
- `blocked`
- `trial`
- `canceled`

Campos e conceitos centrais:

- plano da assinatura
- valor mensal
- vencimento
- fim do trial
- dias de alerta antes do vencimento
- dias de folga apos vencimento
- ultimo pagamento conhecido
- sinalizacao de pagamento feita pelo cliente

### 7.1 Trial

Quando a organizacao esta em `trial`:

- o acesso depende da data de `trial_end`
- se o trial ainda estiver valido, o uso segue liberado
- se o trial vencer, o acesso operacional e bloqueado

### 7.2 Atraso e Bloqueio

Quando existe vencimento:

- se a data atual ainda nao passou do vencimento, a organizacao pode continuar ativa
- se a data passou do vencimento, a organizacao entra em atraso
- enquanto estiver dentro da janela de folga, o sistema pode manter acesso com status `overdue`
- apos a folga, o acesso passa para bloqueado

### 7.3 Sinalizacao de Cobranca

O sistema calcula quando exibir aviso de pagamento considerando:

- pagamento pendente
- pagamento em atraso
- proximidade do vencimento dentro da janela de alerta

### 7.4 Bloqueio de Acesso

O bloqueio nao e apenas visual.

Ele afeta:

- navegacao do usuario
- liberacao de operacoes operacionais
- tela dedicada de assinatura bloqueada

## 8. Modulos Funcionais

## 8.1 Dashboard

Tela principal: `/`

O painel exibe:

- filtro por data inicial e final
- valor recebido
- valor a receber
- total de atendimentos
- ticket medio
- financeiro por servico
- servico mais realizado
- cliente mais frequente ou cliente em destaque no servico filtrado

O grafico financeiro por servico mostra:

- total de atendimentos por servico
- receita recebida por servico
- receita pendente por servico
- comparacao visual por barras

O usuario pode selecionar um servico para refinar a leitura do painel.

## 8.2 Agenda

Tela principal: `/agenda`

A agenda suporta:

- visualizacao por dia
- visualizacao por semana
- visualizacao por mes
- troca rapida de data
- retorno para hoje
- filtro por profissional
- pull-to-refresh
- destaque visual de atendimentos vindos de notificacoes locais

Tambem exibe bloqueios do dia no contexto selecionado.

### 8.2.1 Cadastro de Agendamentos

Tela: `/agenda/novo`

Um agendamento pode conter:

- cliente
- servico
- profissional opcional
- data
- horario inicial
- horario final
- valor
- status do atendimento
- status de pagamento
- observacoes
- vinculacao com orcamento
- vinculacao com ordem de servico

O sistema suporta recorrencia no cadastro com opcoes como:

- sem recorrencia
- recorrencia semanal
- recorrencia mensal

O retorno da criacao informa quantos agendamentos foram criados quando a recorrencia gera mais de um registro.

### 8.2.2 Detalhe do Agendamento

Tela: `/agenda/:appointmentId`

Permite:

- revisar os dados do atendimento
- editar o agendamento
- excluir o agendamento
- atualizar status do atendimento
- atualizar status de pagamento

Status operacionais do atendimento:

- `pendente`
- `confirmado`
- `concluido`
- `cancelado`

Status de pagamento do atendimento:

- `pendente`
- `pago`

Campos adicionais de acompanhamento:

- confirmacao do cliente
- lembrete enviado
- lembrete confirmado
- lembrete cancelado
- data de envio do lembrete
- resposta de WhatsApp

### 8.2.3 Integracao com Orcamento

Ao transformar um orcamento em rascunho de agendamento:

- o sistema abre `/agenda/novo`
- preenche cliente
- preenche servico
- preenche observacoes
- grava referencia ao `quoteId`

## 8.3 Bloqueios de Horario

Tela: `/bloqueios`

Permite criar indisponibilidades:

- gerais da agenda
- especificas por profissional

Campos:

- data
- profissional opcional
- horario inicial
- horario final
- motivo

Tambem permite:

- listar bloqueios do dia selecionado
- remover bloqueios existentes

Objetivo funcional:

- impedir agendamentos em horarios indisponiveis
- registrar almoco, folga, reuniao, ausencia ou qualquer indisponibilidade operacional

## 8.4 Clientes

Telas:

- `/clientes`
- `/clientes/novo`
- `/clientes/:clientId/editar`

Campos tratados:

- nome
- telefone
- email
- observacoes
- ativo

Funcoes disponiveis:

- listar clientes
- buscar clientes
- cadastrar cliente
- editar cliente
- ativar cliente
- inativar cliente
- excluir cliente

## 8.5 Servicos

Telas:

- `/servicos`
- `/servicos/novo`
- `/servicos/:serviceId/editar`

Campos tratados:

- nome
- descricao
- duracao em minutos
- valor padrao
- cor
- ativo

Funcoes disponiveis:

- listar servicos
- buscar servicos
- cadastrar servico
- editar servico
- ativar servico
- inativar servico
- excluir servico

Esses servicos alimentam:

- agenda
- dashboard
- orcamentos
- vinculacao com profissionais

## 8.6 Profissionais

Tela: `/funcionarios`

Campos tratados:

- nome
- atividade
- ativo
- lista de servicos atendidos

Funcoes disponiveis:

- listar profissionais da organizacao
- cadastrar profissional
- editar profissional
- vincular profissional a um ou mais servicos

Os profissionais podem ser usados em:

- filtro da agenda
- bloqueios por profissional
- atribuicao do agendamento

## 8.7 Lembretes

Tela: `/lembretes`

O modulo lista lembretes relacionados aos atendimentos.

Cada lembrete pode expor:

- identificador
- agendamento relacionado
- titulo
- canal
- horario agendado
- cliente
- telefone
- email
- servico
- status do lembrete
- status de confirmacao do cliente
- texto da resposta recebida
- data de envio
- permissao de envio manual

Canais suportados pelo modelo:

- `whatsapp`
- `sms`
- `manual`

Status de confirmacao do cliente:

- `pendente`
- `confirmado`
- `cancelado`
- `sem_resposta`

Funcoes disponiveis:

- listar lembretes
- disparar lembrete manual
- registrar resposta do cliente como confirmado
- registrar resposta do cliente como cancelado

## 8.8 Configuracoes Gerais da Empresa

Tela: `/configuracoes`

Essa tela concentra configuracoes da organizacao, do app e da conta.

### 8.8.1 Dados da Organizacao

Permite editar:

- nome da empresa
- email responsavel
- telefone

### 8.8.2 Configuracoes Operacionais do App

Permite editar:

- nome do negocio
- subtitulo
- hora inicial da agenda
- hora final da agenda
- permitir conflito de horario

Tambem oferece atalhos para:

- configuracoes de WhatsApp
- configuracoes de orcamentos
- tela de profissionais
- tela de bloqueios

### 8.8.3 Historico de Cobranca

Exibe:

- pagamentos da organizacao
- status de cada cobranca
- vencimento
- pagamento realizado
- sinalizacao feita pelo cliente
- botao para abrir pagamento Pix
- botao para avisar o administrador que ja pagou

### 8.8.4 Preferencias de Notificacao do App Android

Permite configurar notificacoes locais do aplicativo:

- ativar ou desativar lembretes locais
- ativar ou desativar som
- definir antecedencia em minutos

Observacao funcional:

- na web, o sistema nao agenda notificacoes nativas
- no Android, o app agenda notificacoes locais com base nos proximos atendimentos

### 8.8.5 Conta

Permite:

- sair da conta
- excluir a conta atual

## 8.9 WhatsApp

Tela: `/configuracoes/whatsapp`

O sistema possui configuracao de lembretes por WhatsApp focada em operacao simples.

Campos e controles:

- ativar lembretes
- ativar ou pausar WhatsApp automatico
- definir antecedencia do envio em minutos
- visualizar o usuario logado
- visualizar o nome do negocio
- visualizar previa da mensagem

Configuracoes persistidas relacionadas:

- `lembretesAtivos`
- `lembreteHorasAntes`
- `whatsappAtivo`
- `whatsappTempoLembreteMinutos`
- `lembreteMensagem`

O template de lembrete trabalha com placeholders como:

- `{{cliente_nome}}`
- `{{nome_organizacao}}`
- `{{servico_nome}}`
- `{{data}}`
- `{{horario}}`

O backend tambem possui endpoints para:

- consultar status do WhatsApp
- enviar mensagem de teste
- receber webhook

## 8.10 Orcamentos

Telas:

- `/orcamentos`
- `/orcamentos/novo`
- `/orcamentos/:quoteId`
- `/configuracoes/orcamentos`

O modulo de orcamentos permite montar propostas comerciais antes da execucao do servico.

### 8.10.1 Estrutura do Orcamento

Cada orcamento possui:

- cliente
- status
- subtotal
- desconto
- total
- observacoes
- itens
- data de criacao
- data de atualizacao
- data de aprovacao
- data de recusa
- referencia para agendamento
- referencia para ordem de servico

Cada item pode possuir:

- servico vinculado opcional
- nome do servico
- descricao livre
- quantidade
- valor unitario
- valor total
- observacoes

### 8.10.2 Status do Orcamento

Estados suportados:

- `pendente`
- `aprovado`
- `recusado`

### 8.10.3 Operacoes do Orcamento

Funcoes disponiveis:

- listar orcamentos
- criar orcamento
- editar orcamento
- aprovar orcamento
- recusar orcamento
- abrir conversa no WhatsApp com mensagem pronta
- transformar o orcamento em rascunho de agendamento
- transformar o orcamento em ordem de servico

Quando o orcamento ja estiver aprovado ou recusado, o formulario fica bloqueado para edicao.

### 8.10.4 Envio de Orcamento por WhatsApp

Ao usar a acao de WhatsApp:

- o sistema monta uma mensagem pronta
- inclui empresa, cliente, itens e total
- abre a conversa no WhatsApp com o telefone do cliente

## 8.11 Gestao e Pagamento da Organizacao

Tela: `/gestao`

Essa tela atua como hub gerencial da empresa.

Ela exibe:

- dados da empresa
- email responsavel
- telefone
- plano
- status da assinatura
- vencimento
- data de bloqueio apos folga
- ultimo status de pagamento
- ultimo valor cobrado
- historico de cobranca
- lista de profissionais

Tambem oferece:

- acesso rapido a configuracoes
- acesso rapido a funcionarios
- acesso rapido a bloqueios
- botao para abrir a tela de pagamento Pix
- botao para avisar o admin que o pagamento foi feito

## 8.12 Pagamento por Pix

Tela: `/pagamento`

Essa tela apresenta a cobranca da organizacao.

Funcoes disponiveis:

- mostrar resumo da empresa
- mostrar status atual da assinatura
- mostrar trial ate, quando existir
- mostrar vencimento
- mostrar valor da ultima cobranca
- gerar exibicao do QR Code Pix a partir da chave Pix
- exibir a chave Pix textual
- copiar a chave Pix
- avisar o administrador que o cliente ja pagou

Titulos dinamicos da tela:

- comprar sistema, quando a assinatura esta em trial
- regularizar assinatura, quando esta em atraso ou bloqueada
- pagamento do sistema, nos demais casos

## 8.13 Tela de Assinatura Bloqueada

Tela: `/assinatura-bloqueada`

Essa tela existe para:

- informar o bloqueio da assinatura
- impedir continuidade do uso operacional
- direcionar o usuario para regularizacao

## 9. Administracao da Plataforma

## 9.1 Area Administrativa

Rotas:

- `/admin`
- `/admin/organizacoes/:organizationId`

Essa area e protegida por validacao especifica de super admin no backend.

## 9.2 Configuracoes Financeiras Globais

Na tela `/admin`, o super admin pode configurar:

- chave Pix global da plataforma
- dias de folga apos vencimento
- dias para antecipar alerta de pagamento

Esses dados afetam:

- calculo de bloqueio
- janela de aviso ao cliente
- pagamento Pix mostrado para as organizacoes

## 9.3 Cadastro Manual de Organizacoes

O super admin pode criar uma empresa SaaS manualmente informando:

- nome da empresa
- nome do responsavel
- email de acesso
- senha inicial
- telefone
- valor da mensalidade
- plano
- dias de trial

No cadastro manual:

- o plano pode nascer como `trial` ou `pro`
- se for `trial`, o sistema registra duracao do teste
- se for `pro`, a empresa nasce liberada conforme o status definido

## 9.4 Lista de Organizacoes

A listagem administrativa mostra para cada organizacao:

- nome
- email responsavel
- se esta liberada ou bloqueada
- status da assinatura
- status do ultimo pagamento
- plano
- mensalidade

## 9.5 Detalhe Administrativo da Organizacao

Tela: `/admin/organizacoes/:organizationId`

Permite:

- revisar dados da empresa
- atualizar status da assinatura
- atualizar plano
- atualizar mensalidade
- atualizar vencimento
- atualizar fim do trial
- consultar historico de pagamentos
- registrar novo pagamento

Status administrativos de assinatura aceitos:

- `active`
- `overdue`
- `blocked`
- `trial`
- `canceled`

Status administrativos de pagamento aceitos:

- `pending`
- `paid`
- `overdue`
- `canceled`

Ao registrar pagamento, o admin informa:

- mes de referencia
- valor
- status
- metodo de pagamento
- data e hora do pagamento
- observacoes

Tambem e exibido quando:

- o cliente informou que ja pagou
- a confirmacao administrativa ainda esta pendente

## 10. Mobile e Notificacoes Locais

O frontend principal possui suporte a build Android via Capacitor.

Funcionalidades mobile implementadas:

- empacotamento Android
- icones e splash screen
- configuracao de rede nativa
- notificacoes locais com Capacitor

### 10.1 Sincronizacao de Lembretes Locais

O app Android agenda notificacoes com base nos proximos atendimentos.

Comportamentos implementados:

- leitura das preferencias locais do usuario
- busca de proximos agendamentos
- cancelamento de notificacoes antigas do tenant
- reagendamento automatico ao mudar agenda ou preferencias
- suporte a notificacao individual por atendimento
- agrupamento de varios atendimentos no mesmo horario
- navegacao para o detalhe do agendamento ao tocar na notificacao
- navegacao para a agenda destacando um grupo de atendimentos ao tocar em notificacao agrupada

### 10.2 Regras das Notificacoes Locais

O sistema considera:

- notificacoes apenas em plataforma nativa
- necessidade de permissao de notificacao
- necessidade de permissao de alarme exato no Android
- canal com som
- canal silencioso
- exclusao de notificacoes de atendimentos concluidos ou cancelados
- exclusao de lembretes cujo horario ja passou

## 11. Rotas de API

Principais rotas expostas pelo backend:

- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/onboarding`
- `POST /auth/logout`
- `DELETE /auth/account`
- `GET /dashboard/summary`
- `GET /organizations/current`
- `PATCH /organizations/current`
- `GET /organizations/current/users`
- `GET /organizations/current/payments`
- `POST /organizations/current/payments/:paymentId/notify-paid`
- `GET /organizations/current/professionals`
- `GET /organizations/current/professionals/:professionalId`
- `POST /organizations/current/professionals`
- `PUT /organizations/current/professionals/:professionalId`
- `GET /settings`
- `PATCH /settings`
- `GET /whatsapp/status`
- `POST /whatsapp/test-message`
- `POST /whatsapp/webhook`
- `GET /blocked-slots`
- `POST /blocked-slots`
- `DELETE /blocked-slots/:blockedSlotId`
- `GET /agenda`
- `GET /agenda/upcoming`
- `GET /agenda/:appointmentId`
- `POST /agenda`
- `PUT /agenda/:appointmentId`
- `PATCH /agenda/:appointmentId/status`
- `PATCH /agenda/:appointmentId/payment-status`
- `DELETE /agenda/:appointmentId`
- `GET /clients`
- `GET /clients/:clientId`
- `POST /clients`
- `PUT /clients/:clientId`
- `PATCH /clients/:clientId/status`
- `DELETE /clients/:clientId`
- `GET /services`
- `GET /services/:serviceId`
- `POST /services`
- `PUT /services/:serviceId`
- `PATCH /services/:serviceId/status`
- `DELETE /services/:serviceId`
- `GET /quotes`
- `GET /quotes/:quoteId`
- `POST /quotes`
- `PUT /quotes/:quoteId`
- `POST /quotes/:quoteId/approve`
- `POST /quotes/:quoteId/reject`
- `POST /quotes/:quoteId/schedule-draft`
- `POST /quotes/:quoteId/service-order`
- `GET /reminders`
- `POST /reminders/manual-send`
- `PATCH /reminders/:appointmentId/reply`
- `GET /admin/platform-settings`
- `PATCH /admin/platform-settings`
- `GET /admin/organizations`
- `POST /admin/organizations`
- `GET /admin/organizations/:organizationId`
- `PATCH /admin/organizations/:organizationId/subscription`
- `GET /admin/organizations/:organizationId/payments`
- `POST /admin/organizations/:organizationId/payments`
- `GET /health`

## 12. Estrutura de Dados Principal

Entidades centrais identificadas no sistema:

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
- `quotes`
- `quote_items`
- `service_orders`

### 12.1 Organizations

Campos funcionais relevantes:

- nome da empresa
- email responsavel
- telefone
- status da assinatura
- plano
- vencimento
- fim do trial

### 12.2 Users

Campos funcionais relevantes:

- nome
- email
- provedor de autenticacao
- senha local opcional
- role
- ativo

### 12.3 Clients

Campos funcionais relevantes:

- nome
- telefone
- email
- observacoes
- ativo

### 12.4 Services

Campos funcionais relevantes:

- nome
- descricao
- duracao
- valor padrao
- cor
- ativo

### 12.5 Appointments

Campos funcionais relevantes:

- cliente
- servico
- profissional
- data
- hora inicial
- hora final
- valor
- status
- status de pagamento
- observacoes
- confirmacao do cliente
- flags de lembrete
- resposta de WhatsApp
- vinculo com orcamento
- vinculo com ordem de servico

### 12.6 Blocked Slots

Campos funcionais relevantes:

- data
- profissional opcional
- hora inicial
- hora final
- motivo

### 12.7 App Settings

Campos funcionais relevantes:

- nome do negocio
- subtitulo
- logo
- cor primaria
- hora inicial
- hora final
- duracao padrao
- moeda
- timezone
- criar orcamentos
- permitir conflito
- lembretes ativos
- horas antes do lembrete
- mensagem de lembrete
- WhatsApp ativo
- provider de WhatsApp
- instance id
- tempo do lembrete por WhatsApp

## 13. Arquitetura Tecnica

### Frontend

- React 18
- Vite
- TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Capacitor

### Backend

- Node.js
- Express

### Banco de Dados

- MySQL

### Aplicacoes do Repositorio

Estruturas encontradas:

- `frontend` - aplicacao principal web/mobile
- `backend` - API principal
- `portfolio-frontend` - variante de frontend presente no repositorio

## 14. Ambientes e Operacao

### Desenvolvimento Local

Fluxo geral:

1. configurar variaveis do backend
2. configurar variaveis do frontend
3. instalar dependencias
4. subir o backend
5. subir o frontend
6. se necessario, gerar build mobile

### Web em Producao

Arquitetura documentada no repositorio:

- frontend web em Vercel
- backend em Render

### Android

Fluxo operacional:

1. gerar build do frontend
2. executar sincronizacao do Capacitor
3. abrir o projeto Android nativo
4. compilar e instalar no dispositivo

## 15. Seguranca e Controles

Controles tecnicos e funcionais identificados:

- autenticacao centralizada pela API
- token de sessao armazenado no cliente
- isolamento multi-tenant
- area administrativa separada
- validacao especifica para super admin
- segredos e chaves em variaveis de ambiente
- API como unica camada de regra e persistencia
- exclusao de sessao no logout
- limpeza local da sessao ao excluir conta

## 16. Observacoes Importantes sobre o Estado Atual

O arquivo original estava correto como resumo de alto nivel, mas nao estava completo.

Itens relevantes que existiam no codigo e nao estavam suficientemente descritos:

- login com Google e Apple
- fluxo publico completo de criacao de conta
- onboarding social e onboarding por senha
- exclusao de conta
- orcamentos
- conversao de orcamento em agendamento
- conversao de orcamento em ordem de servico
- envio de orcamento por WhatsApp
- proximos agendamentos para notificacoes locais
- notificacoes locais Android
- historico detalhado de pagamento
- sinalizacao do cliente informando pagamento realizado
- profissionais com servicos vinculados
- bloqueios por profissional
- status de pagamento do atendimento
- detalhe do agendamento
- usuarios da organizacao
- configuracoes detalhadas de WhatsApp
- webhooks e teste de WhatsApp
- regras reais de trial, atraso, folga e bloqueio

## 17. Conclusao

Sim, o `SYSTEM_DOCUMENTATION.md` e um descritivo do aplicativo, mas antes estava resumido demais para representar tudo o que o sistema realmente faz.

Agora este documento passa a funcionar como referencia funcional detalhada do AgendaPro, cobrindo:

- modulos
- fluxos
- perfis
- regras de negocio
- telas
- rotas
- entidades
- assinatura e cobranca
- mobile
- integracoes

