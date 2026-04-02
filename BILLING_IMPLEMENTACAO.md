# Billing AgendaPro

## Etapa 1. Analise da estrutura atual do projeto

### Checklist concluido
- [x] Backend atual analisado
- [x] Frontend atual analisado
- [x] Fluxo legado de assinatura e pagamento identificado
- [x] Pontos de bloqueio de acesso identificados

### Pendencias
- [ ] Implementar modulo novo sem quebrar fluxo legado
- [ ] Migrar telas antigas de pagamento manual para o billing novo

### Proximos passos
- Consolidar a arquitetura alvo do modulo de billing
- Definir estrategia de compatibilidade com `organizations` e `organization_payments`

### Decisoes tecnicas tomadas
- O projeto atual usa o padrao `controller -> service -> lib/data`.
- O modulo novo de billing vai introduzir `repository` proprio, sem reescrever o restante do sistema agora.
- As rotas de billing devem aceitar organizacoes bloqueadas para consulta e regularizacao.

### Riscos de compatibilidade identificados
- O sistema atual depende de `organizations.subscription_status`, `subscription_plan`, `due_date`, `trial_end` e `monthly_amount`.
- O sistema atual ainda usa `organization_payments` para historico e notificacao manual.
- O frontend atual conhece apenas os status legados `active`, `overdue`, `blocked`, `trial` e `canceled`.

## Etapa 2. Analise da estrutura atual do banco

### Checklist concluido
- [x] Schema atual revisado
- [x] Banco real consultado
- [x] Tabelas novas confirmadas no MySQL
- [x] Triggers e constraints confirmados

### Pendencias
- [ ] Ajustar indices complementares do billing novo
- [ ] Definir como o legado sera mantido durante a transicao

### Proximos passos
- Tratar `organizations` como cache/resumo temporario de compatibilidade
- Tratar `organization_payments` como legado, sem uso no novo fluxo principal

### Decisoes tecnicas tomadas
- As tabelas `subscription_plans`, `organization_subscriptions`, `billing_transactions`, `webhook_events` e `organization_access_locks` serao a base do billing novo.
- As chaves relacionadas a organizacao permanecem em `CHAR(36)` para compatibilidade com `organizations.id`.
- O banco deve continuar compativel com MySQL 5.6/5.7, sem JSON nativo.

### Riscos de compatibilidade identificados
- Existem duas fontes potenciais de verdade para billing: tabelas novas e colunas antigas em `organizations`.
- Os status canonicos novos nao batem 1:1 com os status legados.
- As telas atuais de pagamento ainda dependem da modelagem antiga.

## Etapa 3. Arquitetura proposta

### Checklist concluido
- [x] Estrategia de compatibilidade definida
- [x] Estrategia de seguranca definida
- [x] Fluxo de checkout e webhook definido

### Pendencias
- [ ] Implementar repositorio de billing
- [ ] Implementar service de integracao Asaas
- [ ] Implementar sincronizacao de resumo legado em `organizations`

### Proximos passos
- Criar infraestrutura de backend do billing
- Implementar endpoints, webhook e telas novas

### Decisoes tecnicas tomadas
- Fonte canonica do billing novo:
  - `organization_subscriptions`
  - `billing_transactions`
  - `organization_access_locks`
  - `webhook_events`
- Cache/resumo temporario de compatibilidade:
  - colunas antigas de `organizations`
- Tabela legada mantida sem quebrar o sistema:
  - `organization_payments`
- O fluxo inicial sera implementado com Asaas e cobranca recorrente segura sem armazenamento de cartao no backend.
- Confirmacao de pagamento sera sempre feita por webhook.
- O endpoint do webhook validara o header `asaas-access-token`.
- O payload bruto do webhook sera persistido em `webhook_events`.
- O processamento de eventos sera idempotente usando a constraint unica de evento por gateway.

### Riscos de compatibilidade identificados
- O novo fluxo precisa manter o frontend autenticado coerente mesmo enquanto o sistema ainda consome campos legados.
- O comportamento de bloqueio atual esta espalhado entre sessao, pagina de bloqueio e consultas da organizacao.
- Cartao recorrente sem tocar no backend exige fluxo hospedado ou evolucao posterior do checkout; a primeira entrega prioriza Pix recorrente e cobranca hospedada segura.

## Etapa 4. Criar ou ajustar banco de dados

### Checklist concluido
- [x] Migration SQL criada em `backend/db/migrations/012_billing_asaas_mysql.sql`
- [x] Infraestrutura de billing adicionada com garantia automatica no startup do backend
- [x] Seed do plano mensal padrao garantido
- [x] Triggers `updated_at` do billing automatizados no backend
- [x] Indices complementares planejados para `gateway_customer_id` e `external_reference`

### Pendencias
- [ ] Aplicar a migration explicitamente em todos os ambientes fora do startup automatico
- [ ] Confirmar privilegios de trigger e alter table no ambiente de producao

### Proximos passos
- Implementar a camada completa de backend e webhook usando o schema novo

### Decisoes tecnicas tomadas
- O backend garante a infraestrutura nova no startup para reduzir drift entre ambientes.
- O arquivo de migration continua versionado para rollout controlado em homologacao/producao.
- O cache legado em `organizations` continua sendo atualizado para preservar compatibilidade.

### Riscos de compatibilidade identificados
- Se o usuario do banco em producao nao tiver permissao para criar trigger/indice, o startup nao conseguira autoajustar o schema.
- A tabela legada `organization_payments` segue existindo e ainda pode aparecer em telas antigas ate a migracao total do frontend.

## Etapa 5. Implementar backend

### Checklist concluido
- [x] Service de integracao Asaas criado
- [x] Repository dedicado de billing criado
- [x] Endpoints novos de billing implementados
- [x] Resolver de acesso por billing integrado a autenticacao
- [x] Compatibilidade parcial com o modelo legado mantida via cache em `organizations`
- [x] Validacao de CPF/CNPJ da organizacao adicionada ao checkout e configuracoes

### Pendencias
- [ ] Ampliar suporte a cartao com checkout hospedado do Asaas
- [ ] Revisar listagens administrativas antigas para consumir o billing novo

### Proximos passos
- Finalizar webhook, bloqueio e sincronizacao completa de eventos

### Decisoes tecnicas tomadas
- O modulo novo usa `controller -> service -> repository -> integracao externa`.
- O checkout inicial foi implementado com recorrencia via Asaas e cobranca Pix.
- A assinatura local e as transacoes locais sao sincronizadas a partir do gateway.
- O endpoint manual legado de "ja paguei" foi bloqueado para evitar fluxo inseguro fora do webhook.
- O checkout passou a exigir `organizations.cpf_cnpj`, porque o Asaas sandbox recusou a criacao da cobranca sem documento fiscal do cliente.

### Riscos de compatibilidade identificados
- Algumas telas antigas ainda leem `organization_payments`.
- O status legado `subscription_status` em `organizations` continua como resumo e nao como fonte canonica.

## Etapa 6. Implementar webhook

### Checklist concluido
- [x] Endpoint `POST /api/webhooks/asaas` criado
- [x] Validacao do token do webhook implementada
- [x] Persistencia do payload bruto em `webhook_events` implementada
- [x] Idempotencia por `gateway + event_id` implementada
- [x] Atualizacao automatica de assinatura/transacao/bloqueio a partir de eventos de pagamento implementada

### Pendencias
- [ ] Cobrir mais eventos do Asaas alem do fluxo principal de pagamentos
- [ ] Adicionar observabilidade externa e alertas de falha de webhook

### Proximos passos
- Integrar completamente as telas do frontend ao billing novo

### Decisoes tecnicas tomadas
- A confirmacao de pagamento depende do webhook, nunca do frontend.
- Eventos duplicados nao reprocessam a mesma alteracao.
- O payload bruto fica armazenado para auditoria e diagnostico.

### Riscos de compatibilidade identificados
- O formato exato de alguns eventos do Asaas pode exigir ajustes finos apos homologacao real.
- Em producao, o token do webhook precisa estar alinhado com a configuracao do painel do Asaas.

## Etapa 7. Implementar frontend

### Checklist concluido
- [x] Service e hooks de billing criados no frontend
- [x] Tela `Meu Plano` criada
- [x] Tela `Pagamento` reescrita para o billing novo
- [x] Tela `Faturas` criada
- [x] Tela de bloqueio atualizada para regularizacao via billing
- [x] Banner global de inadimplencia/regularizacao adicionado no app shell
- [x] Campo de CPF/CNPJ exposto nas configuracoes da organizacao para viabilizar checkout real
- [x] Cadastro inicial e onboarding passaram a exigir CPF/CNPJ do assinante

### Pendencias
- [ ] Revisar e migrar totalmente telas antigas que ainda usam historico legado
- [ ] Refinar UX de estados de erro e loading do billing em navegacao mobile

### Proximos passos
- Revisar seguranca e validar o fluxo ponta a ponta com ambiente Asaas configurado

### Decisoes tecnicas tomadas
- As telas novas consomem os endpoints de billing dedicados.
- Organizacoes bloqueadas continuam acessando telas de billing em modo leitura/regularizacao.
- O banner global aponta rapidamente para regularizacao sem liberar operacoes sensiveis do sistema.

### Riscos de compatibilidade identificados
- Partes da gestao antiga ainda mostram dados de billing legado.
- O frontend novo esta pronto para Pix; checkout hospedado de cartao ainda e evolucao posterior.

## Etapa 8. Revisao de seguranca

### Checklist concluido
- [x] Nenhum dado sensivel de cartao foi adicionado ao banco
- [x] Chaves do Asaas foram isoladas em variaveis de ambiente
- [x] Confirmacao por webhook foi reforcada
- [x] Persistencia de log bruto do webhook foi adicionada
- [x] Idempotencia do webhook foi implementada
- [x] Fluxo manual inseguro de confirmacao foi bloqueado
- [x] Homologacao inicial do checkout sandbox executada com credenciais reais de teste

### Pendencias
- [ ] Configurar segredo real de producao para `ASAAS_API_KEY`
- [ ] Configurar segredo real de producao para `ASAAS_WEBHOOK_TOKEN`
- [ ] Colocar observabilidade/monitoramento de falhas de webhook
- [ ] Homologar o recebimento do webhook sandbox apos pagamento confirmado

### Proximos passos
- Documentar gaps finais para producao e rollout

### Decisoes tecnicas tomadas
- O backend nao recebe numero de cartao nem CVV.
- A autenticacao do webhook e validada por header.
- O backend faz a ponte com o gateway sem confiar em payloads de sucesso vindos do frontend.

### Riscos de compatibilidade identificados
- O Asaas pode exigir campos cadastrais adicionais por ambiente ou meio de pagamento.
- O startup automatico do billing depende de permissao suficiente no MySQL.

## Etapa 9. O que falta para producao

### Checklist concluido
- [x] Lista inicial de pendencias de producao consolidada

### Pendencias
- [ ] Preencher `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` em cada ambiente
- [ ] Configurar webhook do Asaas apontando para `/api/webhooks/asaas`
- [ ] Homologar pagamento sandbox completo com webhook confirmado
- [ ] Validar permissao do usuario MySQL para criar triggers e indices
- [ ] Decidir rollout final das telas legadas que ainda usam `organization_payments`
- [ ] Implementar checkout hospedado de cartao, se esse meio de pagamento for obrigatorio agora
- [ ] Adicionar monitoramento, alerta e replay operacional para falhas de webhook
- [ ] Validar se sera necessario job agendado adicional para reconciliacao periodica
- [ ] Versionar e aplicar a migration de `organizations.cpf_cnpj` em todos os ambientes

### Proximos passos
- Rodar homologacao ponta a ponta com o gateway configurado
- Ajustar o que aparecer do payload real do Asaas
- Planejar a retirada controlada do billing legado

### Decisoes tecnicas tomadas
- A entrega atual prioriza seguranca e fluxo real de webhook.
- O billing novo fica pronto para SaaS real, mas ainda precisa de homologacao operacional antes de chamar de producao plena.
- O documento fiscal da organizacao passa a ser obrigatorio para iniciar checkout no Asaas.

### Riscos de compatibilidade identificados
- Existe coexistencia temporaria entre billing novo e legado.
- A entrega atual esta mais madura para Pix do que para cartao hospedado.
