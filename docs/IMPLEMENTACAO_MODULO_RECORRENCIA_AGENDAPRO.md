# IMPLEMENTACAO MODULO RECORRENCIA - AGENDAPRO

## Objetivo
Implementar no sistema atual AgendaPro um módulo novo chamado **Recorrência**, voltado para cobranças recorrentes de clientes/alunos em negócios como ballet, academia, boxe, cursos e similares, reaproveitando ao máximo a arquitetura, componentes, serviços e padrões já existentes.

---

# Regras Gerais do Projeto

- [ ] Analisar a estrutura atual do projeto antes de implementar qualquer coisa
- [ ] Identificar padrões já existentes de backend, frontend, menu, autenticação, multi-tenant, permissões e WhatsApp
- [ ] Reaproveitar o máximo possível do que já existe
- [ ] Não refatorar módulos estáveis sem necessidade
- [ ] Não usar a agenda tradicional para representar mensalidades
- [ ] Não criar eventos na agenda para cobranças recorrentes
- [ ] Manter o módulo separado da agenda tradicional
- [ ] Garantir compatibilidade com multi-tenant
- [ ] Garantir que nenhuma consulta acesse dados de outra empresa
- [ ] Seguir o padrão visual já existente no frontend
- [ ] Seguir o padrão arquitetural já existente no backend
- [ ] Registrar progresso neste arquivo conforme cada etapa for concluída

---

# Etapa 1 - Analise Inicial do Projeto

## 1.1 Estrutura geral
- [ ] Mapear estrutura do backend atual
- [ ] Mapear estrutura do frontend atual
- [ ] Identificar padrão de rotas
- [ ] Identificar padrão de controllers
- [ ] Identificar padrão de services
- [ ] Identificar padrão de repositories/models
- [ ] Identificar padrão de middleware/auth
- [ ] Identificar padrão de tratamento de erros
- [ ] Identificar padrão de logs
- [ ] Identificar padrão de menu/navegação
- [ ] Identificar padrão de permissões/RBAC, se existir
- [ ] Identificar padrão de cron/scheduler, se existir
- [ ] Identificar serviço atual de envio automático de WhatsApp
- [ ] Identificar componentes reutilizáveis do frontend (tabelas, filtros, forms, modais, badges, toasts)

## 1.2 Estrutura do banco atual
- [ ] Identificar nome real da tabela de empresas/tenant
- [ ] Identificar nome real da tabela de clientes
- [ ] Identificar nome real da tabela de serviços
- [ ] Identificar nome real da tabela de usuários
- [ ] Identificar convenção de nomes do banco
- [ ] Identificar se o projeto usa foreign keys ou integridade lógica sem FK
- [ ] Identificar se o projeto usa soft delete
- [ ] Identificar se o projeto já possui migrations
- [ ] Identificar como o projeto versiona mudanças de banco

## 1.3 Conclusão da análise
- [ ] Documentar mentalmente o padrão encontrado
- [ ] Confirmar que a implementação seguirá o padrão do projeto existente

---

# Etapa 2 - Banco de Dados

## 2.1 Criar estrutura principal
- [ ] Criar tabela de recorrências (`recurring_profiles` ou nome equivalente ao padrão do projeto)
- [ ] Criar tabela de cobranças recorrentes (`recurring_charges` ou nome equivalente)
- [ ] Criar tabela de logs do módulo (`recurring_logs` ou nome equivalente)
- [ ] Criar tabela de configurações do módulo (`recurring_settings` ou nome equivalente)

## 2.2 Campos da tabela de recorrências
- [ ] Adicionar empresa_id
- [ ] Adicionar cliente_id
- [ ] Adicionar servico_id
- [ ] Adicionar descricao
- [ ] Adicionar valor
- [ ] Adicionar data_inicio
- [ ] Adicionar data_fim
- [ ] Adicionar dia_cobranca_1
- [ ] Adicionar dia_cobranca_2
- [ ] Adicionar dia_cobranca_3
- [ ] Adicionar dia_cobranca_4
- [ ] Adicionar chave_pix
- [ ] Adicionar mensagem_whatsapp_personalizada
- [ ] Adicionar observacoes
- [ ] Adicionar ativo
- [ ] Adicionar created_at / updated_at
- [ ] Adicionar criado_por / atualizado_por, se o padrão do projeto usar isso

## 2.3 Campos da tabela de cobranças recorrentes
- [ ] Adicionar empresa_id
- [ ] Adicionar recurring_profile_id
- [ ] Adicionar cliente_id
- [ ] Adicionar servico_id
- [ ] Adicionar descricao
- [ ] Adicionar valor
- [ ] Adicionar competencia
- [ ] Adicionar data_referencia
- [ ] Adicionar data_vencimento
- [ ] Adicionar status
- [ ] Adicionar data_pagamento
- [ ] Adicionar forma_pagamento
- [ ] Adicionar chave_pix_utilizada
- [ ] Adicionar mensagem_utilizada
- [ ] Adicionar whatsapp_enviado
- [ ] Adicionar whatsapp_status
- [ ] Adicionar whatsapp_tentativas
- [ ] Adicionar whatsapp_ultimo_envio_em
- [ ] Adicionar whatsapp_ultimo_erro
- [ ] Adicionar observacoes
- [ ] Adicionar criado_automaticamente
- [ ] Adicionar created_at / updated_at
- [ ] Adicionar criado_por / atualizado_por, se necessário

## 2.4 Integridade e performance
- [ ] Criar índices por empresa
- [ ] Criar índices por cliente
- [ ] Criar índices por serviço
- [ ] Criar índices por status
- [ ] Criar índices por data_vencimento
- [ ] Criar índice por recorrência origem
- [ ] Criar unique key para impedir duplicidade de cobrança por recorrência e data
- [ ] Adicionar validação de valor > 0
- [ ] Adicionar validação de dias de cobrança entre 1 e 31
- [ ] Adicionar validação de data_fim >= data_inicio
- [ ] Ajustar SQL ao padrão real do banco atual

## 2.5 Finalização da etapa de banco
- [ ] Criar migration/script SQL final
- [ ] Validar execução do SQL sem erros
- [ ] Validar compatibilidade com banco atual
- [ ] Marcar etapa de banco como concluída

---

# Etapa 3 - Backend do Modulo

## 3.1 Estrutura backend
- [ ] Criar pasta/módulo seguindo o padrão atual do projeto
- [ ] Criar rotas do módulo
- [ ] Criar controller de recorrências
- [ ] Criar service de recorrências
- [ ] Criar repository/model de recorrências
- [ ] Criar controller de cobranças recorrentes
- [ ] Criar service de cobranças recorrentes
- [ ] Criar repository/model de cobranças recorrentes
- [ ] Criar service de logs/configurações se necessário

## 3.2 Endpoints de recorrência
- [ ] Criar endpoint para listar recorrências
- [ ] Criar endpoint para obter recorrência por id
- [ ] Criar endpoint para criar recorrência
- [ ] Criar endpoint para editar recorrência
- [ ] Criar endpoint para ativar recorrência
- [ ] Criar endpoint para inativar recorrência
- [ ] Criar endpoint para excluir recorrência
- [ ] Criar endpoint para visualizar cobranças de uma recorrência

## 3.3 Endpoints de cobranças recorrentes
- [ ] Criar endpoint para listar cobranças recorrentes
- [ ] Criar endpoint para obter cobrança por id
- [ ] Criar endpoint para marcar cobrança como paga
- [ ] Criar endpoint para cancelar cobrança
- [ ] Criar endpoint para reenviar WhatsApp
- [ ] Criar endpoint administrativo/manual para executar geração do dia
- [ ] Criar endpoint administrativo/manual para testar envio do WhatsApp do módulo

## 3.4 Validações backend
- [ ] Validar tenant/empresa em todos os endpoints
- [ ] Validar cliente obrigatório
- [ ] Validar serviço obrigatório
- [ ] Validar valor > 0
- [ ] Validar pelo menos um dia de cobrança informado
- [ ] Validar dias entre 1 e 31
- [ ] Validar data_fim >= data_inicio
- [ ] Validar se recorrência pertence à empresa logada
- [ ] Validar se cobrança pertence à empresa logada
- [ ] Validar transições de status permitidas

## 3.5 Regras de negócio
- [ ] Criar lógica para recorrência ativa/inativa
- [ ] Criar lógica para vigência por data_inicio/data_fim
- [ ] Criar lógica para geração da cobrança conforme dia atual
- [ ] Criar lógica de idempotência para impedir cobrança duplicada
- [ ] Criar lógica de baixa manual
- [ ] Criar lógica de cancelamento
- [ ] Criar lógica para marcar vencido quando aplicável
- [ ] Criar lógica de reenvio de mensagem WhatsApp
- [ ] Criar lógica para usar mensagem personalizada da recorrência
- [ ] Criar lógica para usar template padrão do módulo quando não houver personalizada
- [ ] Criar substituição de placeholders na mensagem

## 3.6 Logs e auditoria
- [ ] Registrar criação de recorrência
- [ ] Registrar edição de recorrência
- [ ] Registrar ativação/inativação
- [ ] Registrar geração de cobrança
- [ ] Registrar baixa manual
- [ ] Registrar cancelamento
- [ ] Registrar envio de WhatsApp
- [ ] Registrar falhas de envio
- [ ] Seguir padrão de logs já existente no projeto

## 3.7 Finalização da etapa backend
- [ ] Validar rotas funcionando
- [ ] Validar regras multi-tenant
- [ ] Validar respostas padronizadas
- [ ] Validar tratamento de erros
- [ ] Marcar etapa backend como concluída

---

# Etapa 4 - Integracao com WhatsApp Existente

## 4.1 Reaproveitamento
- [ ] Localizar serviço atual de WhatsApp do sistema
- [ ] Reutilizar o serviço existente
- [ ] Não duplicar infraestrutura de envio
- [ ] Não criar integração paralela desnecessária

## 4.2 Template do módulo
- [ ] Criar template padrão para cobrança recorrente
- [ ] Permitir template por empresa nas configurações do módulo
- [ ] Permitir mensagem personalizada por recorrência
- [ ] Implementar placeholders:
  - [ ] {NOME_CLIENTE}
  - [ ] {NOME_SERVICO}
  - [ ] {VALOR}
  - [ ] {DATA_VENCIMENTO}
  - [ ] {CHAVE_PIX}
  - [ ] {EMPRESA_NOME}

## 4.3 Regras de envio
- [ ] Enviar WhatsApp ao gerar cobrança do dia
- [ ] Registrar sucesso do envio
- [ ] Registrar falha do envio
- [ ] Registrar quantidade de tentativas
- [ ] Registrar data/hora do último envio
- [ ] Permitir reenvio manual na tela de cobranças

## 4.4 Finalização da integração
- [ ] Validar mensagem padrão funcionando
- [ ] Validar mensagem personalizada funcionando
- [ ] Validar placeholders substituídos corretamente
- [ ] Marcar integração com WhatsApp como concluída

---

# Etapa 5 - Cron / Automacao Diaria

## 5.1 Infraestrutura
- [ ] Identificar scheduler/cron atual do sistema
- [ ] Reutilizar estrutura existente
- [ ] Se não existir, implementar cron simples seguindo padrão seguro

## 5.2 Processo diário
- [ ] Criar job para gerar cobranças do dia
- [ ] Criar job para enviar lembretes do dia
- [ ] Criar job para marcar cobranças vencidas, se aplicável
- [ ] Garantir execução idempotente
- [ ] Garantir logs do processo
- [ ] Garantir que não gere duplicidade

## 5.3 Execução manual
- [ ] Criar forma de executar manualmente em ambiente de teste
- [ ] Validar que a execução manual gera o mesmo resultado esperado
- [ ] Validar que segunda execução não gera duplicidade

## 5.4 Finalização do cron
- [ ] Validar cron diário funcionando
- [ ] Validar logs do cron
- [ ] Marcar etapa de automação como concluída

---

# Etapa 6 - Frontend do Modulo

## 6.1 Menu
- [ ] Criar item de menu "Recorrência"
- [ ] Criar submenu "Recorrências"
- [ ] Criar submenu "Cobranças Recorrentes"
- [ ] Integrar com menu atual sem quebrar navegação
- [ ] Respeitar permissões, se o sistema já tiver isso
- [ ] Esconder menu para quem não tiver acesso, se aplicável

## 6.2 Tela de listagem de recorrências
- [ ] Criar tela de listagem
- [ ] Adicionar filtro por cliente
- [ ] Adicionar filtro por serviço
- [ ] Adicionar filtro por status
- [ ] Adicionar busca textual
- [ ] Adicionar paginação, se padrão do sistema usar
- [ ] Adicionar ação visualizar
- [ ] Adicionar ação editar
- [ ] Adicionar ação ativar/inativar
- [ ] Adicionar ação excluir
- [ ] Adicionar ação ver cobranças da recorrência

## 6.3 Tela/formulário de recorrência
- [ ] Criar formulário de cadastro
- [ ] Criar formulário de edição
- [ ] Reutilizar componentes já existentes do projeto
- [ ] Campo cliente vindo do cadastro existente
- [ ] Campo serviço vindo do cadastro existente
- [ ] Sugerir valor automaticamente ao selecionar serviço, se esse padrão existir
- [ ] Sugerir descrição automaticamente ao selecionar serviço, se esse padrão existir
- [ ] Permitir edição manual do valor
- [ ] Permitir até 4 dias de cobrança
- [ ] Exibir status ativo/inativo claramente
- [ ] Campo chave Pix
- [ ] Campo mensagem personalizada
- [ ] Campo observações
- [ ] Validar formulário no frontend
- [ ] Exibir feedback visual de sucesso/erro

## 6.4 Tela de cobranças recorrentes
- [ ] Criar listagem de cobranças
- [ ] Exibir cliente
- [ ] Exibir serviço
- [ ] Exibir valor
- [ ] Exibir vencimento
- [ ] Exibir status
- [ ] Exibir recorrência origem
- [ ] Criar badges visuais por status
- [ ] Filtro por período
- [ ] Filtro por cliente
- [ ] Filtro por serviço
- [ ] Filtro por status
- [ ] Ação marcar como pago
- [ ] Ação cancelar cobrança
- [ ] Ação reenviar WhatsApp
- [ ] Ação visualizar origem da recorrência

## 6.5 Dashboard/resumo do módulo
- [ ] Criar cards de resumo no topo da tela
- [ ] Card de recorrências ativas
- [ ] Card de cobranças pendentes do mês
- [ ] Card de cobranças pagas do mês
- [ ] Card de cobranças vencidas do mês
- [ ] Card de valor pendente do mês
- [ ] Reutilizar componente visual já existente, se houver

## 6.6 UX e consistência visual
- [ ] Seguir layout atual do sistema
- [ ] Reutilizar tabelas existentes
- [ ] Reutilizar filtros existentes
- [ ] Reutilizar modais existentes
- [ ] Reutilizar badges e status existentes
- [ ] Reutilizar toasts existentes
- [ ] Reutilizar loaders existentes
- [ ] Garantir responsividade compatível com o restante do projeto

## 6.7 Finalização da etapa frontend
- [ ] Validar navegação
- [ ] Validar telas funcionando
- [ ] Validar integração com backend
- [ ] Validar experiência do usuário
- [ ] Marcar etapa frontend como concluída

---

# Etapa 7 - Permissoes, Seguranca e Multi-tenant

## 7.1 Segurança
- [ ] Garantir autenticação em todas as rotas do módulo
- [ ] Garantir filtro por empresa/tenant em todas as consultas
- [ ] Impedir leitura de registros de outra empresa
- [ ] Impedir edição de registros de outra empresa
- [ ] Impedir baixa/cancelamento em cobranças de outra empresa

## 7.2 Permissões
- [ ] Integrar módulo ao sistema atual de permissões, se existir
- [ ] Criar permissões mínimas para:
  - [ ] visualizar recorrências
  - [ ] criar recorrências
  - [ ] editar recorrências
  - [ ] excluir/inativar recorrências
  - [ ] visualizar cobranças
  - [ ] marcar como pago
  - [ ] cancelar cobrança
  - [ ] reenviar WhatsApp
- [ ] Esconder menu conforme permissão, se aplicável

## 7.3 Finalização da segurança
- [ ] Validar isolamento multi-tenant
- [ ] Validar regras de permissão
- [ ] Marcar etapa de segurança como concluída

---

# Etapa 8 - Testes

## 8.1 Testes backend
- [ ] Testar criação de recorrência
- [ ] Testar edição de recorrência
- [ ] Testar ativação/inativação
- [ ] Testar geração de cobrança no dia correto
- [ ] Testar proteção contra duplicidade
- [ ] Testar baixa manual
- [ ] Testar cancelamento
- [ ] Testar reenvio de WhatsApp
- [ ] Testar isolamento por tenant

## 8.2 Testes frontend
- [ ] Testar listagem de recorrências
- [ ] Testar cadastro de recorrência
- [ ] Testar edição de recorrência
- [ ] Testar listagem de cobranças
- [ ] Testar ação marcar como pago
- [ ] Testar ação cancelar
- [ ] Testar ação reenviar WhatsApp
- [ ] Testar filtros
- [ ] Testar responsividade mínima

## 8.3 Testes do cron
- [ ] Testar geração diária manual
- [ ] Testar ausência de duplicidade em segunda execução
- [ ] Testar envio de mensagem
- [ ] Testar log de falha de envio
- [ ] Testar marcação de vencido

## 8.4 Finalização dos testes
- [ ] Corrigir bugs encontrados
- [ ] Validar estabilidade do módulo
- [ ] Marcar etapa de testes como concluída

---

# Etapa 9 - Revisao Final

## 9.1 Revisão técnica
- [ ] Revisar consistência do backend
- [ ] Revisar consistência do frontend
- [ ] Revisar SQL/migration
- [ ] Revisar logs
- [ ] Revisar cron
- [ ] Revisar integração com WhatsApp
- [ ] Revisar multi-tenant
- [ ] Revisar permissões
- [ ] Revisar nomenclaturas
- [ ] Revisar duplicidade de código
- [ ] Revisar aderência ao padrão do projeto

## 9.2 Revisão funcional
- [ ] Confirmar que o módulo serve para ballet
- [ ] Confirmar que o módulo serve para academia
- [ ] Confirmar que o módulo serve para boxe
- [ ] Confirmar que o módulo serve para cursos
- [ ] Confirmar que o módulo é genérico para cobrança recorrente

## 9.3 Critérios finais de aceite
- [ ] O módulo não usa a agenda tradicional
- [ ] O módulo não polui o calendário do sistema
- [ ] O módulo reaproveita a infraestrutura existente de WhatsApp
- [ ] O módulo respeita multi-tenant
- [ ] O módulo evita duplicidade de cobrança
- [ ] O módulo permite baixa manual
- [ ] O módulo permite cancelamento
- [ ] O módulo permite reenvio de mensagem
- [ ] O módulo está pronto para uso real
- [ ] O módulo ficou consistente com o sistema atual

---

# Etapa 10 - Entrega Final

- [ ] Entregar backend completo do módulo
- [ ] Entregar frontend completo do módulo
- [ ] Entregar SQL/migration
- [ ] Entregar cron diário
- [ ] Entregar integração com WhatsApp
- [ ] Entregar validações
- [ ] Entregar logs
- [ ] Entregar telas funcionais
- [ ] Entregar módulo integrado ao sistema atual
- [ ] Atualizar este arquivo com tudo que foi concluído

---

# Observacoes Finais para o Codex

- Implementar com o mínimo de alteração estrutural possível
- Reaproveitar o máximo do que já existe
- Não transformar recorrência em agenda
- Não criar atalhos técnicos que prejudiquem multi-tenant
- Não quebrar fluxo atual do sistema
- Ajustar nomes de tabelas e relacionamentos conforme o banco real do projeto
- Seguir o padrão já existente de código, nomenclatura, organização e UI
- Ao concluir cada item, marcar neste arquivo como OK

---

# Atualizacao Tecnica - 2026-04-13

## Analise consolidada do projeto atual

- [OK] O sistema usa `organization_id` como identificador de tenant
- [OK] O sistema usa IDs `CHAR(36)` com UUID nas tabelas principais
- [OK] As tabelas-base do modulo sao `organizations`, `clients`, `services`, `users` e `app_settings`
- [OK] O backend atual segue majoritariamente `routes -> controllers -> services -> lib/data`
- [OK] Ja existe scheduler simples com `setInterval` no backend
- [OK] Ja existe servico central de WhatsApp reaproveitavel
- [OK] O modulo deve ser isolado da agenda tradicional para nao quebrar o fluxo existente

## Ajustes necessarios ao plano original

- [OK] Trocar `empresa_id` por `organization_id`
- [OK] Trocar `cliente_id` por `client_id` no banco novo
- [OK] Trocar `servico_id` por `service_id` no banco novo
- [OK] Usar UUID `CHAR(36)` em vez de `BIGINT`
- [OK] Reaproveitar `app_settings` para configuracoes globais do modulo
- [OK] Manter tabelas novas separadas: `recurring_profiles`, `recurring_charges`, `recurring_logs`
- [OK] Proteger idempotencia com chave unica por `organization_id + recurring_profile_id + referencia_data_cobranca`

## Arquivos ajustados nesta etapa

- [OK] `backend/db/migrations/016_recurring_module_mysql.sql`
- [OK] `backend/db/schema_current_mysql.sql`
- [OK] `backend/src/models/schema-definitions.js`
- [OK] `backend/src/lib/data.js`
- [OK] `backend/src/services/recurrence.service.js`
- [OK] `backend/src/controllers/recurrence.controller.js`
- [OK] `backend/src/routes/index.js`
- [OK] `backend/src/server.js`
- [OK] `backend/src/services/settings.service.js`
- [OK] `frontend/src/services/settingsService.ts`
- [OK] `frontend/src/services/recurrenceService.ts`
- [OK] `frontend/src/hooks/use-recurrence-query.ts`
- [OK] `frontend/src/hooks/use-recurrence-mutations.ts`
- [OK] `frontend/src/components/recurrence/recurrence-form.tsx`
- [OK] `frontend/src/components/recurrence/recurrence-profile-list.tsx`
- [OK] `frontend/src/components/recurrence/recurring-charge-list.tsx`
- [OK] `frontend/src/pages/recurrence-page.tsx`
- [OK] `frontend/src/pages/recurrence-form-page.tsx`
- [OK] `frontend/src/pages/recurring-charges-page.tsx`
- [OK] `frontend/src/routes/app-router.tsx`
- [OK] `frontend/src/components/layout/desktop-sidebar.tsx`
- [OK] `frontend/src/components/layout/mobile-nav.tsx`

## Observacao

- [ ] Ainda falta executar a migration em um banco de teste e validar o SQL em runtime
- [OK] O frontend do modulo compilou com `npm.cmd run build --workspace frontend`
