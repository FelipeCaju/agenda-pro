# AgendaPro - Checklist de Prontidao para Venda

## Status Geral

- [ ] Pronto para venda ampla
- [x] Pronto para piloto controlado
- [x] Base funcional e arquitetural consistente
- [ ] Base validada por testes automatizados suficientes
- [ ] Base endurecida parcialmente para seguranca comercial

## Resumo Executivo

Hoje o sistema esta bem encaminhado como produto e MVP comercial, com boa base funcional, documentacao organizada e arquitetura coerente para SaaS multi-tenant. Ainda assim, ele nao deve ser tratado como pronto para venda ampla sem uma rodada final de endurecimento de seguranca, observabilidade e testes.

Recomendacao atual:

- [x] Liberar para piloto controlado com poucos clientes
- [ ] Liberar para venda ampla sem ajustes adicionais

## Atualizacoes Realizadas Nesta Rodada

- [x] Backend passou a emitir tokens assinados com expiracao real
- [x] Validacao de token centralizada e resistente a forja por texto simples
- [x] CORS passou a aceitar origens confiaveis configuradas por ambiente
- [x] Rate limit aplicado em login e operacoes sensiveis da API
- [x] Protecao adicional contra brute force no login por IP e email
- [x] Hardening basico de cabecalhos HTTP aplicado no backend
- [x] Android ajustado para `allowBackup=false`
- [x] Android ajustado para bloquear cleartext por padrao e liberar apenas hosts locais de desenvolvimento
- [x] Variaveis novas de seguranca documentadas em `backend/.env.example` e `README.md`
- [x] Documentacao operacional criada para deploy, backup/restore e incidentes
- [x] Arquitetura atualizada para refletir sessao assinada com expiracao
- [x] Validacao minima de imports do backend executada com sucesso

Arquivos principais alterados nesta rodada:

- `backend/src/lib/session-token.js`
- `backend/src/lib/security.js`
- `backend/src/app.js`
- `backend/src/services/auth.service.js`
- `backend/.env.example`
- `frontend/android/app/src/main/AndroidManifest.xml`
- `frontend/android/app/src/main/res/xml/network_security_config.xml`
- `README.md`
- `ARCHITECTURE.md`
- `docs/RUNBOOK_OPERACIONAL.md`
- `docs/PROCEDIMENTO_BACKUP_RESTORE.md`
- `docs/CHECKLIST_DEPLOY_PRODUCAO.md`

## O Que Esta Bom

- [x] Arquitetura clara com frontend React, backend Node/Express e MySQL
- [x] Separacao consistente entre interface, API e persistencia
- [x] Modelo multi-tenant com `organization_id`
- [x] Documentacao principal presente em `README.md`, `ARCHITECTURE.md` e `docs/SYSTEM_DOCUMENTATION.md`
- [x] Fluxos principais do produto implementados
- [x] Onboarding com trial automatico
- [x] Regras de assinatura, vencimento, folga e bloqueio implementadas
- [x] Estrutura de banco com indices relevantes para operacao
- [x] Senhas com hash usando `scrypt`
- [x] Web + Android compartilhando a mesma base funcional

## Bloqueios Antes de Venda Ampla

### Seguranca

- [x] Trocar o token atual por token assinado no backend
- [x] Adicionar expiracao real de sessao
- [x] Impedir tokens forjados baseados apenas em texto
- [x] Restringir CORS por dominio confiavel via ambiente
- [x] Adicionar rate limit nas rotas de login e operacoes sensiveis
- [x] Adicionar protecao contra brute force no login
- [ ] Revisar uso de `localStorage` para sessao
- [x] Revisar `allowBackup=true` no Android
- [x] Revisar `usesCleartextTraffic=true` no Android

### Testes

- [ ] Criar testes E2E dos fluxos criticos
- [ ] Criar testes de regressao para login e onboarding
- [ ] Criar testes de agenda, clientes e servicos
- [ ] Criar testes de orcamentos e pagamentos
- [ ] Validar cenarios de bloqueio por assinatura
- [ ] Incluir testes no processo de deploy

### Operacao e Confiabilidade

- [ ] Adicionar logs estruturados
- [ ] Adicionar monitoramento centralizado
- [ ] Adicionar alertas de erro em producao
- [ ] Definir politica de backup e restauracao do MySQL
- [ ] Validar tempo de resposta entre Render e MySQL do UOL
- [ ] Executar teste de carga com uso realista

## Checkup por Area

### Arquitetura

- [x] Estrutura geral simples e compreensivel
- [x] Backend centraliza regra de negocio
- [x] Frontend consome API de forma organizada
- [x] Rotas lazy-loaded no frontend
- [x] Uso de React Query para cache e sincronizacao
- [ ] Observabilidade centralizada
- [ ] Pipeline de deploy mais automatizado

### Documentacao

- [x] `README.md` com visao geral e deploy
- [x] `ARCHITECTURE.md` com desenho tecnico
- [x] `docs/SYSTEM_DOCUMENTATION.md` com regras funcionais
- [x] `backend/docs/multi-tenant-data-model.md` com modelagem multiempresa
- [x] Runbook operacional de incidentes
- [x] Procedimento formal de backup e restore
- [x] Checklist de deploy em producao

### Seguranca

- [x] Senha com hash `scrypt`
- [x] Segredos fora do codigo via variaveis de ambiente
- [x] Multi-tenancy aplicado no modelo
- [x] Sessao segura de verdade com token assinado e expiracao
- [x] Assinatura/validacao criptografica dos tokens
- [x] Rate limiting
- [x] Hardening de cabecalhos HTTP
- [ ] Politica de auditoria e rastreio

### Banco de Dados

- [x] MySQL com tabelas centrais do dominio
- [x] Indices relevantes para agenda e financeiro
- [x] Estrutura multi-tenant coerente
- [x] Tabelas para trial, assinatura e pagamento
- [x] Tabelas para orcamentos e ordens de servico
- [ ] Teste de carga real no banco
- [ ] Rotina de backup validada
- [ ] Monitoramento de conexoes e consultas lentas

### Frontend e Mobile

- [x] Experiencia web e Android unificada
- [x] Navegacao por rotas protegidas
- [x] Formularios e telas principais implementados
- [x] Build do frontend funcionando
- [x] Android via Capacitor funcionando
- [ ] Validacao de sessao mais segura no cliente
- [x] Revisao final de configuracoes nativas Android

## Prontidao Comercial

### Pode fazer agora

- [x] Demonstracao
- [x] Uso interno
- [x] Piloto com poucos clientes reais
- [x] Validacao comercial inicial

### Nao recomendo fazer ainda

- [ ] Venda ampla com anuncio de sistema pronto e escalado
- [ ] Campanha agressiva de aquisicao
- [ ] Entrada de muitos clientes sem monitoramento
- [ ] Promessa de alta confiabilidade sem testes de carga

## Capacidade Atual Estimada

Esta estimativa e conservadora e nao substitui teste de carga.

- [x] Faixa confortavel para piloto: `5 a 20` empresas com uso baixo ou medio
- [x] Faixa provavelmente suportada com algum cuidado: `20 a 50` empresas pequenas
- [ ] Faixa validada para escalar com seguranca acima disso

## Principais Gargalos Provaveis

- [ ] Uso de `localStorage` para persistir sessao no cliente
- [ ] Ausencia de monitoramento
- [ ] Pool de conexao pequeno no backend
- [ ] Latencia entre Render e MySQL externo
- [ ] Falta de testes sob concorrencia real

## Prioridade Imediata

### Obrigatorio antes de venda ampla

- [x] Implementar autenticacao segura de verdade
- [x] Restringir CORS
- [x] Adicionar rate limit
- [ ] Criar suite minima de testes E2E
- [ ] Definir backup e monitoramento

### Recomendado logo depois

- [ ] Teste de carga com cenarios reais
- [ ] Telemetria e logs estruturados
- [ ] Checklist operacional de deploy e incidente

## Veredito Final

- [x] Sistema com boa base
- [x] Sistema com potencial comercial real
- [x] Sistema apto para piloto controlado
- [ ] Sistema pronto para venda ampla hoje

Conclusao:

O AgendaPro esta solido como base de produto e MVP SaaS, e agora ja recebeu uma rodada pratica de endurecimento em autenticacao, CORS, limitacao de abuso, headers HTTP e configuracao Android. Ainda assim, antes da venda ampla, os principais pontos pendentes continuam sendo testes automatizados, monitoramento operacional e a troca do armazenamento da sessao no cliente por uma abordagem mais robusta.
