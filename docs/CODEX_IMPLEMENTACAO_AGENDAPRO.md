# CODEX_IMPLEMENTACAO_AGENDAPRO

## Objetivo deste arquivo

Este arquivo foi usado como guia de execucao e checklist de implementacao.

### Regras obrigatorias para o Codex
1. Antes de alterar qualquer codigo, analisar a estrutura real do projeto.
2. Nao pular etapas.
3. So avancar para a proxima atividade depois de concluir a anterior.
4. Ao concluir cada item:
   - marcar com `OK`
   - descrever resumidamente o que foi feito
   - listar arquivos criados/alterados
5. Se encontrar impedimento tecnico, registrar em **Bloqueios** antes de continuar.
6. Nao reescrever o sistema inteiro.
7. Nao quebrar funcionalidades existentes.
8. Reaproveitar a arquitetura atual do projeto.
9. Preservar a essencia do AgendaPro:
   - simples
   - rapido
   - pratico
   - util para agenda e servicos
10. Ao final, este arquivo deve estar totalmente atualizado.

---
# STATUS GERAL

- [OK] ETAPA 1 - Diagnostico do projeto
- [OK] ETAPA 2 - Planejamento tecnico
- [OK] ETAPA 3 - Implementacao das notificacoes
- [OK] ETAPA 4 - Implementacao do agrupamento de notificacoes
- [OK] ETAPA 5 - Configuracoes de notificacoes
- [OK] ETAPA 6 - Navegacao ao tocar na notificacao
- [OK] ETAPA 7 - Implementacao do modulo de orcamentos
- [OK] ETAPA 8 - Integracao orcamento + agenda
- [OK] ETAPA 9 - Integracao orcamento + notificacoes
- [OK] ETAPA 10 - Ajustes Android/Capacitor
- [OK] ETAPA 11 - Testes e validacoes
- [OK] ETAPA 12 - Resumo final tecnico

## Bloqueios
- Nenhum bloqueio impeditivo. Houve apenas ajuste de versao do plugin `@capacitor/local-notifications` para a linha compativel com Capacitor 6.

---

# ETAPA 1 - DIAGNOSTICO DO PROJETO

## Objetivo
Mapear a estrutura real do projeto antes de implementar qualquer coisa.

## Itens
- [OK] Identificar estrutura principal de pastas
- [OK] Identificar rotas
- [OK] Identificar tela da agenda
- [OK] Identificar tela de detalhe do atendimento
- [OK] Identificar criacao/edicao/exclusao de agendamentos
- [OK] Identificar tela ou area de configuracoes
- [OK] Identificar services/hooks/stores existentes
- [OK] Identificar integracao com backend/API
- [OK] Identificar estrutura atual de clientes e servicos
- [OK] Identificar melhor ponto para encaixar o modulo de orcamentos

## Status
**Situacao:** OK

## Observacoes da etapa
- Estrutura ativa confirmada: `frontend/` com React + Vite + Capacitor, `backend/` com Express + MySQL e `docs/` para apoio.
- Rotas do app centralizadas em `frontend/src/routes/app-router.tsx`.
- Agenda atual localizada em `frontend/src/pages/agenda-page.tsx`.
- Criacao de agendamento em `frontend/src/pages/new-appointment-page.tsx`.
- Detalhe/edicao do atendimento em `frontend/src/pages/appointment-detail-page.tsx`.
- Configuracoes em `frontend/src/pages/settings-page.tsx`.
- Hooks e services seguem padrao React Query + API REST.
- Clientes e servicos ja existem como dominios maduros, ideais para reuso no modulo de orcamentos.

## Arquivos analisados
- `ARCHITECTURE.md`
- `frontend/package.json`
- `backend/package.json`
- `frontend/src/routes/app-router.tsx`
- `frontend/src/pages/agenda-page.tsx`
- `frontend/src/pages/new-appointment-page.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/pages/settings-page.tsx`
- `frontend/src/components/layout/mobile-nav.tsx`
- `frontend/src/components/layout/desktop-sidebar.tsx`
- `frontend/src/components/agenda/new-appointment.tsx`
- `frontend/src/hooks/use-appointment-mutations.ts`
- `frontend/src/services/appointmentService.ts`
- `frontend/src/services/settingsService.ts`
- `frontend/src/services/reminderService.ts`
- `backend/src/routes/index.js`
- `backend/src/services/appointment.service.js`
- `backend/src/services/settings.service.js`
- `backend/db/schema_current_mysql.sql`

## Conclusao da etapa
Diagnostico concluido com base no codigo real do projeto. A evolucao seria incremental, aproveitando AppShell, pages, hooks, services e o backend REST existente.

---

# ETAPA 2 - PLANEJAMENTO TECNICO

## Objetivo
Definir o plano de implementacao antes de codar.

## Itens
- [OK] Definir arquitetura da solucao de notificacoes
- [OK] Definir arquitetura do modulo de orcamentos
- [OK] Definir arquivos que serao criados
- [OK] Definir arquivos que serao alterados
- [OK] Definir estrategia de integracao com agenda
- [OK] Definir estrategia de integracao com notificacoes
- [OK] Definir modelo de agrupamento por horario
- [OK] Definir navegacao ao tocar em notificacao individual
- [OK] Definir navegacao ao tocar em notificacao agrupada
- [OK] Definir se orcamento pode virar agendamento e/ou OS

## Status
**Situacao:** OK

## Plano resumido
- Criar servico local de notificacoes no frontend com fallback seguro para web.
- Sincronizar lembretes a partir de proximos agendamentos da API.
- Persistir preferencias locais separadas do modulo atual de WhatsApp.
- Implementar agrupamento por slot de horario do lembrete.
- Navegar para detalhe no caso individual e para agenda focada no caso agrupado.
- Criar modulo de orcamentos com servico, hooks, paginas e formulario multi-itens.
- Reutilizar clientes, servicos e o formulario atual de agendamento.
- Permitir conversao de orcamento em rascunho de agendamento e em ordem de servico.
- Vincular o agendamento criado ao orcamento para manter rastreabilidade.

## Arquivos previstos
- `frontend/src/services/localNotificationService.ts`
- `frontend/src/services/notificationPreferencesService.ts`
- `frontend/src/hooks/use-local-notification-sync.ts`
- `frontend/src/hooks/use-upcoming-appointments-query.ts`
- `frontend/src/services/orcamentoService.ts`
- `frontend/src/hooks/use-orcamentos-query.ts`
- `frontend/src/hooks/use-orcamento-query.ts`
- `frontend/src/hooks/use-orcamento-mutations.ts`
- `frontend/src/pages/orcamentos-page.tsx`
- `frontend/src/pages/orcamento-form-page.tsx`
- `frontend/src/components/orcamentos/orcamento-form.tsx`
- `backend/src/services/quote.service.js`
- `backend/src/controllers/quotes.controller.js`
- `backend/db/migrations/008_quotes_notifications_mysql.sql`

## Conclusao da etapa
Planejamento concluido com estrategia modular e incremental, sem reescrever agenda, sem duplicar logica de clientes/servicos e mantendo a experiencia simples do produto.

---

# ETAPA 3 - IMPLEMENTACAO DAS NOTIFICACOES

## Objetivo
Implementar lembretes locais para atendimentos futuros.

## Itens
- [OK] Instalar dependencias necessarias
- [OK] Criar servico central de notificacoes
- [OK] Implementar inicializacao do sistema de notificacoes
- [OK] Implementar solicitacao de permissoes
- [OK] Implementar agendamento de lembrete individual
- [OK] Implementar cancelamento de lembrete individual
- [OK] Implementar reagendamento de lembrete
- [OK] Garantir compatibilidade sem quebrar versao web

## Status
**Situacao:** OK

## Dependencias instaladas
- `@capacitor/local-notifications@6.1.2`

## Arquivos criados
- `frontend/src/services/localNotificationService.ts`
- `frontend/src/services/notificationPreferencesService.ts`
- `frontend/src/hooks/use-local-notification-sync.ts`
- `frontend/src/hooks/use-upcoming-appointments-query.ts`

## Arquivos alterados
- `frontend/package.json`
- `frontend/src/lib/storage.ts`
- `frontend/src/components/layout/app-shell.tsx`
- `frontend/src/services/appointmentService.ts`
- `frontend/src/services/index.ts`
- `backend/src/lib/data.js`
- `backend/src/services/appointment.service.js`
- `backend/src/controllers/agenda.controller.js`
- `backend/src/routes/index.js`
- `package-lock.json`

## O que foi feito
- Plugin local do Capacitor instalado na versao compativel com a stack atual.
- Criado endpoint `/agenda/upcoming` para buscar proximos atendimentos.
- Implementado servico central de notificacoes com inicializacao, checagem de permissao, request de permissao, agendamento, cancelamento e sincronizacao.
- Sincronizacao conectada ao `AppShell`, para reagir automaticamente a alteracoes da agenda.
- Na web o servico entra em modo seguro e nao agenda notificacoes.

## Conclusao da etapa
Base de notificacoes locais concluida e integrada de forma segura com o app compartilhado entre web e Android.

---

# ETAPA 4 - IMPLEMENTACAO DO AGRUPAMENTO DE NOTIFICACOES

## Objetivo
Agrupar lembretes quando houver multiplos atendimentos no mesmo horario.

## Itens
- [OK] Criar logica de agrupamento por slotKey
- [OK] Definir chave unica do grupo
- [OK] Tratar grupo com 1 item como notificacao individual
- [OK] Tratar grupo com multiplos itens como notificacao agrupada
- [OK] Montar resumo principal do grupo
- [OK] Montar lista de clientes/servicos do grupo
- [OK] Implementar reagendamento do grupo ao alterar agendamentos
- [OK] Evitar duplicidade de notificacoes

## Status
**Situacao:** OK

## Regras aplicadas
- `slotKey = organizationId + reminderDate(YYYY-MM-DDTHH:mm)`
- Grupo com 1 item gera notificacao individual
- Grupo com 2 ou mais itens gera uma unica notificacao agrupada
- O reagendamento cancela IDs rastreados antes de agendar novamente

## Arquivos criados
- `frontend/src/services/localNotificationService.ts`

## Arquivos alterados
- `frontend/src/hooks/use-local-notification-sync.ts`

## O que foi feito
- Agrupamento por horario do lembrete implementado dentro do servico central.
- Titulo e corpo da notificacao agrupada seguem o estilo resumido pedido.
- `largeBody` e `inboxList` passaram a listar cliente e servico de cada atendimento.
- O sistema evita duplicidade cancelando o lote anterior antes de criar o novo.

## Conclusao da etapa
Agrupamento concluido com comportamento individual para 1 atendimento e agrupado para multiplos atendimentos no mesmo slot.

---

# ETAPA 5 - CONFIGURACOES DE NOTIFICACOES

## Objetivo
Permitir que o usuario controle lembretes e som.

## Itens
- [OK] Criar persistencia local das configuracoes
- [OK] Implementar opcao ativar/desativar lembretes
- [OK] Implementar opcao ativar/desativar som
- [OK] Implementar opcao de antecedencia
- [OK] Integrar configuracoes com reagendamento automatico
- [OK] Criar ou adaptar tela/secao de configuracoes

## Status
**Situacao:** OK

## Estrutura salva
```json
{
  "enabled": true,
  "soundEnabled": true,
  "reminderMinutes": 10
}
```

## Arquivos criados
- `frontend/src/hooks/use-notification-preferences.ts`
- `frontend/src/services/notificationPreferencesService.ts`

## Arquivos alterados
- `frontend/src/pages/settings-page.tsx`
- `frontend/src/hooks/use-local-notification-sync.ts`

## O que foi feito
- Criado storage local dedicado para as preferencias de notificacao.
- Adicionada nova secao em `settings-page` para ligar/desligar lembretes, controlar som e antecedencia.
- Alteracoes nessas preferencias disparam ressincronizacao automatica dos lembretes.
- A configuracao ficou separada da logica ja existente de WhatsApp para nao poluir o fluxo atual.

## Conclusao da etapa
Configuracoes locais de notificacao concluidas, mantendo a UI simples e sem misturar responsabilidades com o modulo de WhatsApp.

---

# ETAPA 6 - NAVEGACAO AO TOCAR NA NOTIFICACAO

## Objetivo
Definir a experiencia ao abrir o app por uma notificacao.

## Itens
- [OK] Navegar para detalhe do atendimento ao tocar em notificacao individual
- [OK] Navegar para agenda/lista ao tocar em notificacao agrupada
- [OK] Garantir envio de parametros necessarios na notificacao
- [OK] Implementar leitura desses parametros ao abrir o app
- [OK] Garantir comportamento sem quebrar navegacao atual

## Status
**Situacao:** OK

## Navegacao definida
- Notificacao individual envia `appointmentId`
- Notificacao agrupada envia `date`, `slotKey` e `appointmentIds`
- O clique individual abre `/agenda/:appointmentId`
- O clique agrupado abre `/agenda` ja focada no dia do grupo e destaca os cards do slot

## Arquivos criados
- Nenhum

## Arquivos alterados
- `frontend/src/hooks/use-local-notification-sync.ts`
- `frontend/src/pages/agenda-page.tsx`
- `frontend/src/components/agenda/day-view.tsx`
- `frontend/src/components/agenda/week-view.tsx`
- `frontend/src/components/agenda/appointment-card.tsx`
- `frontend/src/services/localNotificationService.ts`

## O que foi feito
- Listener do plugin configurado para ler `extra` da notificacao.
- Notificacoes individuais navegam direto para o detalhe do atendimento.
- Notificacoes agrupadas navegam para a agenda, forcam visualizacao diaria e destacam os atendimentos daquele horario.
- O estado temporario de destaque e limpo apos a leitura para nao interferir na navegacao normal.

## Conclusao da etapa
Navegacao por notificacao concluida sem quebrar o fluxo atual de agenda.

---

# ETAPA 7 - IMPLEMENTACAO DO MODULO DE ORCAMENTOS

## Objetivo
Adicionar o novo modulo de orcamentos reaproveitando clientes e servicos existentes.

## Itens
- [OK] Criar entidades de orcamento
- [OK] Criar entidades de itens do orcamento
- [OK] Criar estrutura de ordem de servico
- [OK] Criar service `orcamentoService`
- [OK] Criar hooks `useOrcamentos`, `useOrcamento` e mutacoes
- [OK] Criar telas de listagem e formulario
- [OK] Permitir multi-itens, desconto, subtotal e total
- [OK] Permitir status `PENDENTE`, `APROVADO`, `RECUSADO`
- [OK] Permitir conversao para ordem de servico

## Status
**Situacao:** OK

## Arquivos criados
- `backend/src/services/quote.service.js`
- `backend/src/controllers/quotes.controller.js`
- `backend/db/migrations/008_quotes_notifications_mysql.sql`
- `frontend/src/services/orcamentoService.ts`
- `frontend/src/hooks/use-orcamentos-query.ts`
- `frontend/src/hooks/use-orcamento-query.ts`
- `frontend/src/hooks/use-orcamento-mutations.ts`
- `frontend/src/pages/orcamentos-page.tsx`
- `frontend/src/pages/orcamento-form-page.tsx`
- `frontend/src/components/orcamentos/orcamento-form.tsx`

## Arquivos alterados
- `backend/src/routes/index.js`
- `backend/src/lib/data.js`
- `backend/db/schema_current_mysql.sql`
- `frontend/src/routes/app-router.tsx`
- `frontend/src/components/layout/mobile-nav.tsx`
- `frontend/src/components/layout/desktop-sidebar.tsx`
- `frontend/src/services/index.ts`

## O que foi feito
- Criadas tabelas `quotes`, `quote_items`, `service_orders` e `service_order_items`.
- Novo backend de orcamentos com listagem, detalhe, criacao, atualizacao, aprovacao, recusa, rascunho de agendamento e conversao para OS.
- Novo menu `Orcamentos` no app.
- Nova tela de listagem e novo formulario multi-itens com calculo automatico de subtotal, desconto e total.
- Orcamentos aprovados ou recusados passam a ficar bloqueados para edicao.

## Conclusao da etapa
Modulo de orcamentos concluido como extensao do sistema, sem tornar a agenda obrigatoria e sem descaracterizar a proposta simples do AgendaPro.

---

# ETAPA 8 - INTEGRACAO ORCAMENTO + AGENDA

## Objetivo
Permitir que o orcamento alimente o fluxo de agendamento sem quebrar a agenda atual.

## Itens
- [OK] Adicionar botao "Transformar em agendamento"
- [OK] Abrir tela de agendamento com dados pre-preenchidos
- [OK] Reaproveitar formulario atual de agendamento
- [OK] Vincular o novo agendamento ao orcamento
- [OK] Manter agenda opcional dentro do modulo

## Status
**Situacao:** OK

## Arquivos criados
- Nenhum

## Arquivos alterados
- `frontend/src/pages/orcamento-form-page.tsx`
- `frontend/src/pages/new-appointment-page.tsx`
- `frontend/src/components/agenda/new-appointment.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/services/appointmentService.ts`
- `backend/src/services/appointment.service.js`
- `backend/src/lib/data.js`

## O que foi feito
- O orcamento agora pode gerar um rascunho de agendamento via endpoint backend.
- O formulario atual de agendamento recebe `quoteId`, cliente, servico principal e observacoes pre-preenchidas.
- O agendamento criado passa a armazenar `quote_id` e `service_order_id` quando aplicavel.
- O backend faz o vinculo do agendamento ao orcamento apos a criacao.

## Conclusao da etapa
Integracao com agenda concluida. O fluxo atual continua intacto, mas agora um orcamento pode alimentar a criacao de agendamento de forma simples e reaproveitando o formulario existente.

---

# ETAPA 9 - INTEGRACAO ORCAMENTO + NOTIFICACOES

## Objetivo
Garantir que orcamentos convertidos em agendamento entrem no fluxo normal de lembretes.

## Itens
- [OK] Fazer o agendamento criado a partir do orcamento entrar no fluxo normal
- [OK] Preservar agrupamento para orcamentos agendados
- [OK] Nao gerar lembrete quando o orcamento nao virar agendamento
- [OK] Manter rastreabilidade quote -> appointment

## Status
**Situacao:** OK

## Arquivos criados
- Nenhum

## Arquivos alterados
- `frontend/src/hooks/use-local-notification-sync.ts`
- `frontend/src/services/appointmentService.ts`
- `backend/src/services/appointment.service.js`
- `backend/src/lib/data.js`
- `frontend/src/pages/new-appointment-page.tsx`

## O que foi feito
- Agendamentos criados a partir de orcamento passam a trafegar no mesmo endpoint e no mesmo mecanismo de sincronizacao das notificacoes.
- Como o lembrete se baseia nos agendamentos futuros, o agrupamento ja respeita naturalmente agendamentos originados de orcamentos.
- Orcamentos sem agendamento nao entram em nenhuma rotina de notificacao.

## Conclusao da etapa
Integracao orcamento + notificacoes concluida sem duplicar regras e sem criar um segundo fluxo paralelo de lembretes.

---

# ETAPA 10 - AJUSTES ANDROID/CAPACITOR

## Objetivo
Garantir suporte real no projeto Android via Capacitor.

## Itens
- [OK] Ajustar configuracao do Capacitor
- [OK] Declarar permissoes Android necessarias
- [OK] Sincronizar plugins e assets com o projeto Android
- [OK] Confirmar plugin `@capacitor/local-notifications` no Android

## Status
**Situacao:** OK

## Arquivos criados
- Nenhum

## Arquivos alterados
- `frontend/capacitor.config.ts`
- `frontend/android/app/src/main/AndroidManifest.xml`
- `frontend/android/app/capacitor.build.gradle`
- `frontend/android/capacitor.settings.gradle`

## O que foi feito
- Configurado `LocalNotifications` no `capacitor.config.ts`.
- Adicionadas permissoes Android para notificacoes, alarme exato e boot completed.
- Executado `npm.cmd run cap:sync --workspace frontend`.
- O sync confirmou a presenca dos plugins `@capacitor/app`, `@capacitor/local-notifications`, `@capacitor/splash-screen` e `@capacitor/status-bar`.

## Conclusao da etapa
Ajustes Android/Capacitor concluidos e sincronizados com o projeto nativo.

---

# ETAPA 11 - TESTES E VALIDACOES

## Objetivo
Validar se a implementacao segue funcionando sem quebrar o sistema atual.

## Itens
- [OK] Validar build do frontend
- [OK] Validar sintaxe do backend principal
- [OK] Validar sintaxe dos novos arquivos backend
- [OK] Validar sync do Capacitor
- [OK] Registrar roteiro manual de testes
- [OK] Registrar lacunas honestamente

## Status
**Situacao:** OK

## Validacoes executadas
- `npm.cmd run build` em `frontend/`
- `node --check src/server.js` em `backend/`
- `node --check src/services/quote.service.js` em `backend/`
- `node --check src/controllers/quotes.controller.js` em `backend/`
- `npm.cmd run cap:sync --workspace frontend`

## Roteiro manual recomendado
1. Criar um novo orcamento em `Orcamentos`.
2. Selecionar cliente, adicionar dois ou mais itens, desconto e observacoes.
3. Salvar o orcamento e conferir subtotal/total.
4. Aprovar o orcamento.
5. Clicar em `Transformar em agendamento`.
6. Conferir se cliente, servico principal e observacoes do orcamento chegaram preenchidos na tela de agendamento.
7. Salvar o agendamento com horario futuro.
8. Configurar lembrete local em `Configuracoes > Notificacoes`.
9. Testar um agendamento unico e confirmar a abertura do detalhe ao tocar no lembrete.
10. Criar mais de um agendamento para o mesmo horario de lembrete e confirmar o agrupamento.
11. Tocar na notificacao agrupada e validar a agenda focada no dia com destaque dos atendimentos.
12. Voltar ao orcamento e testar `Transformar em OS`.

## Lacunas registradas
- Nao foi executado teste manual em dispositivo Android fisico dentro desta sessao.
- Nao foi executado fluxo E2E automatizado completo porque o repositorio nao traz suite pronta para esse novo modulo.

## Conclusao da etapa
Validacoes automatizadas e estruturais concluidas. Os testes manuais em aparelho Android ficaram documentados e ainda sao recomendados antes de publicacao.

---

# ETAPA 12 - RESUMO FINAL TECNICO

## Status
**Situacao:** OK

## Modulo de notificacoes
- Implementado com `@capacitor/local-notifications`.
- Funciona somente em ambiente nativo, com fallback seguro na web.
- Suporta permissao, agendamento, cancelamento e reagendamento.
- Permite ativar/desativar lembretes, controlar som e definir antecedencia.
- Agrupa multiplos atendimentos no mesmo horario em uma notificacao unica.

## Modulo de orcamentos
- Novo menu `Orcamentos`.
- Novo backend REST em `/quotes`.
- Suporta cliente, multi-itens, desconto, observacoes e status.
- Permite aprovar, recusar, converter para ordem de servico e abrir rascunho de agendamento.
- Reaproveita clientes e servicos ja existentes no sistema.

## Como os dois se conectam
- O orcamento pode gerar um rascunho de agendamento usando o formulario ja existente da agenda.
- Quando o agendamento e salvo, ele fica vinculado ao `quote_id`.
- Como os lembretes sao sincronizados a partir da agenda, esse agendamento entra automaticamente no fluxo de notificacoes.
- Orcamentos que nao viram agendamento nao geram notificacoes.

## Comandos necessarios
- Instalar dependencia: `npm.cmd install @capacitor/local-notifications@6.1.2`
- Build do frontend: `npm.cmd run build`
- Sincronizar Capacitor: `npm.cmd run cap:sync --workspace frontend`

## Arquivos criados
- `backend/db/migrations/008_quotes_notifications_mysql.sql`
- `backend/src/controllers/quotes.controller.js`
- `backend/src/services/quote.service.js`
- `frontend/src/components/orcamentos/orcamento-form.tsx`
- `frontend/src/hooks/use-local-notification-sync.ts`
- `frontend/src/hooks/use-notification-preferences.ts`
- `frontend/src/hooks/use-orcamento-mutations.ts`
- `frontend/src/hooks/use-orcamento-query.ts`
- `frontend/src/hooks/use-orcamentos-query.ts`
- `frontend/src/hooks/use-upcoming-appointments-query.ts`
- `frontend/src/pages/orcamento-form-page.tsx`
- `frontend/src/pages/orcamentos-page.tsx`
- `frontend/src/services/localNotificationService.ts`
- `frontend/src/services/notificationPreferencesService.ts`
- `frontend/src/services/orcamentoService.ts`

## Arquivos alterados
- `backend/db/schema_current_mysql.sql`
- `backend/src/controllers/agenda.controller.js`
- `backend/src/lib/data.js`
- `backend/src/routes/index.js`
- `backend/src/services/appointment.service.js`
- `frontend/android/app/capacitor.build.gradle`
- `frontend/android/app/src/main/AndroidManifest.xml`
- `frontend/android/capacitor.settings.gradle`
- `frontend/capacitor.config.ts`
- `frontend/package.json`
- `frontend/src/components/agenda/appointment-card.tsx`
- `frontend/src/components/agenda/day-view.tsx`
- `frontend/src/components/agenda/new-appointment.tsx`
- `frontend/src/components/agenda/week-view.tsx`
- `frontend/src/components/layout/app-shell.tsx`
- `frontend/src/components/layout/desktop-sidebar.tsx`
- `frontend/src/components/layout/mobile-nav.tsx`
- `frontend/src/lib/storage.ts`
- `frontend/src/pages/agenda-page.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/pages/new-appointment-page.tsx`
- `frontend/src/pages/settings-page.tsx`
- `frontend/src/routes/app-router.tsx`
- `frontend/src/services/appointmentService.ts`
- `frontend/src/services/dashboardService.ts`
- `frontend/src/services/index.ts`
- `package-lock.json`

## Conclusao final
O AgendaPro continua funcionando como agenda simples e pratica. Agora ele tambem suporta notificacoes locais no Android com agrupamento inteligente e um modulo de orcamentos que conversa com a agenda sem tornar o sistema pesado ou complexo.
