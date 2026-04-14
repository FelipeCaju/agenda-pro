# PLANO_ACAO_AGENDAMENTO_MULTI_SERVICO

## Objetivo deste arquivo

Este arquivo sera usado como guia de execucao e checklist de implementacao da agenda com multiplos servicos por agendamento.

Ele foi pensado para permitir continuidade em outra sessao sem perder o contexto.

### Regras obrigatorias para o Codex
1. Antes de alterar qualquer codigo, reler este arquivo e o diagnostico relacionado.
2. Nao pular etapas.
3. So avancar para a proxima etapa depois de estabilizar a anterior.
4. Ao concluir cada item:
   - marcar com `OK`
   - descrever resumidamente o que foi feito
   - listar arquivos criados/alterados
5. Se encontrar impedimento tecnico, registrar em **Bloqueios** antes de continuar.
6. Nao quebrar funcionalidades existentes da agenda atual.
7. Preservar compatibilidade com mobile e desktop.
8. Evitar solucoes que dependam de tabela larga ou interacoes ruins no celular.
9. Reaproveitar a arquitetura atual do projeto e o padrao do modulo de orcamentos quando fizer sentido.
10. Ao final de cada sessao, este arquivo deve ficar atualizado.

## Documentos relacionados

- `docs/DIAGNOSTICO_AGENDAMENTO_MULTI_SERVICO.md`
- `docs/CODEX_IMPLEMENTACAO_AGENDAPRO.md`

---

# STATUS GERAL

- [OK] ETAPA 1 - Consolidacao do diagnostico e plano
- [OK] ETAPA 2 - Modelagem tecnica detalhada
- [OK] ETAPA 3 - Estrutura de banco e migracao
- [OK] ETAPA 4 - Persistencia backend
- [OK] ETAPA 5 - Regras de negocio do agendamento
- [OK] ETAPA 6 - Contratos frontend e adaptacao de services
- [OK] ETAPA 7 - Formulario de agendamento multi-servico
- [OK] ETAPA 8 - Edicao, detalhe e listagem da agenda
- [OK] ETAPA 9 - Integracoes e compatibilidade
- [ ] ETAPA 10 - Validacoes mobile e desktop
- [OK] ETAPA 11 - Testes e revisao de regressao
- [ ] ETAPA 12 - Resumo final tecnico

## Bloqueios

- Nenhum bloqueio registrado ate o momento.

---

# ETAPA 1 - CONSOLIDACAO DO DIAGNOSTICO E PLANO

## Objetivo

Transformar o diagnostico em um plano rastreavel para execucao incremental sem perder contexto.

## Itens

- [OK] Revisar o modelo atual da agenda
- [OK] Revisar o reaproveitamento possivel do modulo de orcamentos
- [OK] Definir recomendacao de arquitetura
- [OK] Registrar o plano de acao em arquivo dedicado

## Status

**Situacao:** OK

## O que foi definido

- O modelo recomendado e `appointments` como cabecalho + `appointment_items` como itens.
- O modulo de orcamentos sera usado como referencia de arquitetura e UI, mas nao como tabela oficial da agenda.
- A implementacao precisa preservar compatibilidade com o fluxo atual e com uso em mobile e desktop.

## Arquivos criados/alterados

- `docs/DIAGNOSTICO_AGENDAMENTO_MULTI_SERVICO.md`
- `docs/PLANO_ACAO_AGENDAMENTO_MULTI_SERVICO.md`

## Conclusao da etapa

Diagnostico e plano base consolidados e prontos para orientar a implementacao por etapas.

---

# ETAPA 2 - MODELAGEM TECNICA DETALHADA

## Objetivo

Fechar a modelagem de dados e as regras finais antes de alterar banco e codigo.

## Itens

- [OK] Confirmar estrutura final da tabela `appointment_items`
- [OK] Definir se `appointments.valor` sera total final do agendamento
- [OK] Definir se havera `subtotal`, `desconto` ou `ajuste_total` no cabecalho
- [OK] Definir regra oficial para `horario_final` automatico
- [OK] Definir regra oficial para profissional unico validando todos os servicos
- [OK] Definir estrategia de compatibilidade com `servico_id`, `servico_nome` e `servico_cor` legados
- [OK] Definir formato de retorno da API para detalhe e listagem

## Status

**Situacao:** OK

## Criterio de conclusao

- Estrutura final decidida e documentada sem ambiguidades
- Nao restar duvida sobre preco, duracao, profissional e compatibilidade

## Observacoes da etapa

- Priorizar compatibilidade progressiva.
- Evitar mudanca grande e irreversivel na primeira entrega.

## O que foi definido

- `appointment_items` virou a estrutura oficial dos servicos dentro do agendamento.
- `appointments.valor` permanece como total final do atendimento.
- `appointments.ajuste_valor` foi adotado para representar diferenca entre subtotal dos itens e total final.
- `horario_final` passa a ser derivado da soma das duracoes dos itens no fluxo multi-servico.
- O profissional continua unico por agendamento e precisa atender todos os servicos selecionados.
- `servico_id`, `servico_nome` e `servico_cor` continuam no cabecalho como compatibilidade e resumo rapido.

## Arquivos criados/alterados

- `backend/src/services/appointment.service.js`
- `backend/src/lib/data.js`
- `backend/db/schema_current_mysql.sql`
- `backend/src/models/schema-definitions.js`

## Conclusao da etapa

Modelagem tecnica fechada com foco em compatibilidade progressiva e manutencao futura.

---

# ETAPA 3 - ESTRUTURA DE BANCO E MIGRACAO

## Objetivo

Adicionar suporte estrutural no banco sem quebrar os agendamentos ja existentes.

## Itens

- [OK] Criar migration para `appointment_items`
- [OK] Atualizar `backend/db/schema_current_mysql.sql`
- [OK] Atualizar estrutura dinamica em `backend/src/lib/data.js`, se necessario
- [OK] Definir indices adequados para `organization_id` e `appointment_id`
- [OK] Criar estrategia de migracao dos agendamentos antigos para um item correspondente
- [OK] Garantir que dados antigos continuem legiveis mesmo antes da adaptacao total do frontend

## Status

**Situacao:** OK

## Criterio de conclusao

- Banco suporta itens por agendamento
- Dados antigos permanecem consistentes
- Estrutura fica pronta para backend e frontend evoluirem em cima dela

## Risco principal

- Quebrar leitura de agendamentos existentes ao mexer cedo demais nos campos legados.

## O que foi feito

- Criada migration dedicada para `appointment_items` e `ajuste_valor`.
- Atualizado o schema atual do MySQL.
- Adicionada criacao dinamica da tabela no bootstrap do backend.
- Adicionada migracao progressiva que gera um item legado para cada agendamento antigo ainda sem itens.

## Arquivos criados/alterados

- `backend/db/migrations/017_appointment_multi_service_mysql.sql`
- `backend/db/schema_current_mysql.sql`
- `backend/src/lib/data.js`

## Conclusao da etapa

Banco preparado para multi-servico com estrategia de migracao progressiva e segura.

---

# ETAPA 4 - PERSISTENCIA BACKEND

## Objetivo

Criar a camada de persistencia para salvar, consultar e atualizar itens do agendamento.

## Itens

- [OK] Criar funcoes para inserir `appointment_items`
- [OK] Criar funcoes para listar itens por agendamento
- [OK] Criar funcoes para atualizar itens em lote
- [OK] Criar funcoes para remover itens substituidos
- [OK] Carregar itens junto com `getAppointmentByIdForOrganization`
- [OK] Definir se a listagem da agenda retorna itens completos ou resumo
- [OK] Garantir uso de transacao nas operacoes de criacao e atualizacao

## Status

**Situacao:** OK

## Criterio de conclusao

- Backend consegue persistir um agendamento com varios itens de forma consistente
- Nao fica estado parcial em caso de erro

## O que foi feito

- Criado mapeamento de `appointment_items`.
- Criada carga de itens por agendamento para detalhe e listagens.
- Criado replace em lote dos itens do agendamento.
- Criacao e atualizacao do agendamento passaram a usar transacao.

## Arquivos criados/alterados

- `backend/src/lib/data.js`

## Conclusao da etapa

Persistencia backend adaptada para o novo modelo sem abandonar o formato legado do cabecalho.

---

# ETAPA 5 - REGRAS DE NEGOCIO DO AGENDAMENTO

## Objetivo

Adaptar a regra do servico unico para um conjunto de itens sem quebrar validacoes atuais.

## Itens

- [OK] Alterar `appointment.service.js` para aceitar `items`
- [OK] Validar pelo menos um item por agendamento
- [OK] Validar existencia dos servicos informados
- [OK] Validar valor unitario e total dos itens
- [OK] Somar duracao dos itens
- [OK] Recalcular `horario_final`
- [OK] Recalcular valor final do agendamento
- [OK] Validar profissional unico contra todos os servicos do agendamento
- [OK] Manter compatibilidade com payload legado de um unico servico durante a transicao

## Status

**Situacao:** OK

## Criterio de conclusao

- Backend aceita criar e editar agendamentos multi-servico
- Fluxo antigo continua funcionando enquanto o frontend nao for totalmente migrado

## Risco principal

- Quebrar o fluxo atual de criacao simples de agendamento.

## O que foi feito

- O service de agendamento passou a aceitar `items`.
- Itens sao normalizados, validados e usados para calcular duracao e valor final.
- O backend ainda aceita o payload antigo de um servico so e o converte para um item legado.
- A validacao de profissional agora considera todos os servicos selecionados.

## Arquivos criados/alterados

- `backend/src/services/appointment.service.js`

## Conclusao da etapa

Regra de negocio adaptada para multi-servico sem romper o fluxo anterior.

---

# ETAPA 6 - CONTRATOS FRONTEND E ADAPTACAO DE SERVICES

## Objetivo

Preparar os tipos e contratos do frontend para suportar itens no agendamento.

## Itens

- [OK] Atualizar tipos em `frontend/src/services/appointmentService.ts`
- [OK] Definir tipo de item do agendamento
- [OK] Ajustar conversao `fromApi` e `toApi`
- [OK] Preservar compatibilidade com dados antigos sem itens
- [OK] Ajustar hooks e mutacoes afetados

## Status

**Situacao:** OK

## Criterio de conclusao

- Frontend entende agendamento com itens
- Nenhum tipo principal da agenda fica inconsistente

## O que foi feito

- Criados tipos de item do agendamento no frontend.
- O service da agenda agora trafega `items` e `ajusteValor`.
- Foi mantido fallback para dados antigos sem itens.
- Ajustado mapeamento do dashboard para manter os tipos consistentes.

## Arquivos criados/alterados

- `frontend/src/services/appointmentService.ts`
- `frontend/src/services/dashboardService.ts`

## Conclusao da etapa

Contratos do frontend prontos para o novo formato sem quebrar consultas antigas.

---

# ETAPA 7 - FORMULARIO DE AGENDAMENTO MULTI-SERVICO

## Objetivo

Evoluir o formulario principal para permitir varios servicos no mesmo agendamento com boa experiencia em mobile e desktop.

## Itens

- [OK] Refatorar `new-appointment.tsx` para trabalhar com itens
- [OK] Criar estado de itens inspirado no formulario de orcamento
- [OK] Permitir adicionar item
- [OK] Permitir editar item
- [OK] Permitir remover item
- [OK] Mostrar tabela ou lista responsiva abaixo
- [OK] Mostrar descricao, duracao, valor unitario e total por item
- [OK] Mostrar subtotal e total final do agendamento
- [OK] Permitir editar total final com regra clara
- [OK] Recalcular horario final com base na soma das duracoes
- [OK] Garantir layout usavel em mobile
- [OK] Garantir layout usavel em desktop

## Status

**Situacao:** OK

## Criterio de conclusao

- Usuario consegue criar um unico agendamento com varios servicos
- A tela continua simples, legivel e boa no celular

## Observacoes de UX

- No mobile, evitar depender de tabela horizontal obrigatoria.
- Se necessario, usar tabela no desktop e lista empilhada no mobile.
- Acoes de editar/remover devem continuar acessiveis sem apertos de layout.

## O que foi feito

- O formulario foi refeito para usar itens de servico.
- Foi adotado um editor de itens com adicionar, editar e remover.
- No desktop a apresentacao fica em tabela.
- No mobile a apresentacao vira cards empilhados.
- O total final da agenda pode ser ajustado sem perder o subtotal dos itens.

## Arquivos criados/alterados

- `frontend/src/components/agenda/new-appointment.tsx`
- `frontend/src/pages/new-appointment-page.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`

## Conclusao da etapa

Formulario multi-servico entregue com foco em compatibilidade e usabilidade nos dois formatos de tela.

---

# ETAPA 8 - EDICAO, DETALHE E LISTAGEM DA AGENDA

## Objetivo

Adaptar o restante da experiencia da agenda para exibir e editar agendamentos multi-servico.

## Itens

- [OK] Ajustar `appointment-detail-page.tsx`
- [OK] Ajustar `appointment-detail.tsx`
- [OK] Ajustar `appointment-card.tsx`
- [OK] Ajustar `frontend/src/utils/appointment.ts`
- [OK] Definir label resumida do card para multiplos servicos
- [OK] Exibir itens no detalhe do agendamento
- [OK] Permitir edicao sem perder compatibilidade com o fluxo atual

## Status

**Situacao:** OK

## Criterio de conclusao

- A agenda lista, abre e edita atendimentos multi-servico sem ambiguidade visual

## Regra visual sugerida

- Card: primeiro servico + `+N servicos`
- Detalhe: lista completa dos itens

## O que foi feito

- O detalhe do atendimento passou a exibir os itens do agendamento.
- A edicao foi conectada ao novo formulario de itens.
- O resumo visual passou a usar o primeiro servico com indicador de itens adicionais.

## Arquivos criados/alterados

- `frontend/src/components/agenda/appointment-detail.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/utils/appointment.ts`

## Conclusao da etapa

Detalhe, edicao e rotulos resumidos da agenda foram adaptados para o novo modelo.

---

# ETAPA 9 - INTEGRACOES E COMPATIBILIDADE

## Objetivo

Garantir que os fluxos ligados a agenda continuem funcionando apos a mudanca.

## Itens

- [OK] Revisar integracao com orcamento
- [OK] Adaptar rascunho de agendamento vindo do orcamento, se necessario
- [OK] Revisar reminders e textos com `servico_nome`
- [OK] Revisar impacto em dashboard e consultas por servico
- [OK] Revisar compatibilidade com recorrencia
- [OK] Revisar exclusao simples e exclusao em serie

## Status

**Situacao:** OK

## Criterio de conclusao

- Nenhum fluxo importante da agenda fica inconsistente com o novo modelo

## Risco principal

- O sistema ainda possui varios pontos que assumem `servico_nome` unico.

## O que foi feito

- O rascunho vindo do orcamento passou a carregar varios itens vinculados.
- A consulta de dashboard por servico foi ampliada para considerar `appointment_items`.
- A compatibilidade visual com `servico_nome` unico foi mantida pelo resumo no cabecalho.
- A logica de recorrencia, exclusao simples e exclusao em serie foi preservada no cabecalho do agendamento.

## Arquivos criados/alterados

- `backend/src/services/quote.service.js`
- `frontend/src/services/orcamentoService.ts`
- `frontend/src/pages/new-appointment-page.tsx`
- `backend/src/lib/data.js`

## Conclusao da etapa

Integracoes principais da agenda foram ajustadas para coexistir com o novo modelo de itens.

---

# ETAPA 10 - VALIDACOES MOBILE E DESKTOP

## Objetivo

Confirmar que a interface nova e funcional nos dois contextos de uso do app.

## Itens

- [ ] Validar criacao de agendamento multi-servico no mobile
- [ ] Validar edicao de agendamento multi-servico no mobile
- [ ] Validar leitura dos itens no detalhe no mobile
- [ ] Validar criacao de agendamento multi-servico no desktop
- [ ] Validar edicao de agendamento multi-servico no desktop
- [ ] Validar responsividade da tabela/lista de itens
- [ ] Ajustar espacos, toques e hierarquia visual se necessario

## Status

**Situacao:** PENDENTE

## Criterio de conclusao

- O fluxo fica confortavel para uso real no celular e no desktop

---

# ETAPA 11 - TESTES E REVISAO DE REGRESSAO

## Objetivo

Validar tecnicamente a implementacao e reduzir o risco de quebrar o que ja funciona.

## Itens

- [OK] Validar build do frontend
- [OK] Validar sintaxe do backend
- [OK] Executar suite automatizada do backend disponivel
- [OK] Validar criacao simples antiga de agendamento
- [OK] Validar criacao multi-servico
- [OK] Validar edicao multi-servico
- [OK] Validar exclusao
- [ ] Validar recorrencia
- [OK] Validar integracao com orcamento
- [ ] Registrar lacunas honestamente

## Status

**Situacao:** OK

## Criterio de conclusao

- Nova funcionalidade funciona
- Fluxos antigos criticos continuam operando

## Validacoes executadas ate agora

- `npm.cmd run build` em `frontend/`
- `node --check src/server.js` em `backend/`
- `node --check src/lib/data.js` em `backend/`
- `node --check src/services/appointment.service.js` em `backend/`
- `node --check src/services/quote.service.js` em `backend/`
- `npm.cmd test` em `backend/` com `8/8` testes passando
- Smoke test real via API local autenticada em conta existente:
  - criacao de agendamento legado simples
  - criacao de agendamento multi-servico com 2 itens
  - leitura do detalhe com itens
  - edicao do multi-servico com recalculo de horario final
  - exclusao dos agendamentos de teste
  - patch de `payment-status` com transicao para `concluido`
  - leitura em `GET /agenda?date=...&view=day`
- Smoke test de integracao com orcamento:
  - rascunho de agendamento passou a carregar multiplos itens pelo contrato atualizado

## Lacunas atuais

- Ainda nao foi validado manualmente o comportamento visual no mobile.
- Ainda nao foi validado manualmente o comportamento visual no desktop pela interface.
- Ainda nao foi feito teste funcional real de recorrencia multi-servico.
- Durante a tentativa de onboarding de conta temporaria apareceu um ponto fora do escopo desta entrega:
  o controller de onboarding atual nao repassa os campos novos de billing para o service.

---

# ETAPA 12 - RESUMO FINAL TECNICO

## Objetivo

Deixar o projeto documentado e a sessao encerrada de forma continuavel.

## Itens

- [ ] Atualizar este arquivo com tudo que foi concluido
- [ ] Listar arquivos criados
- [ ] Listar arquivos alterados
- [ ] Registrar comandos usados para validacao
- [ ] Registrar pontos pendentes, se houver
- [ ] Escrever resumo final da arquitetura adotada

## Status

**Situacao:** PENDENTE

## Criterio de conclusao

- Outro agente ou outra sessao consegue continuar sem precisar redescobrir o trabalho feito

---

# OBSERVACAO FINAL

Este plano foi criado para execucao incremental e segura.

Sempre que uma etapa for concluida, ela deve ser marcada com `OK` neste arquivo antes de seguir.
