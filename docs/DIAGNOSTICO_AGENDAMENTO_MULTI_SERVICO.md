# Diagnostico: multiplos servicos no mesmo agendamento

## Resumo executivo

Sim, e possivel implementar.

Hoje o sistema foi construido com a premissa de `1 agendamento = 1 servico`. Isso aparece no banco, no backend e no frontend. Para atender o pedido do cliente de criar uma unica agenda para o mesmo cliente com dois ou mais servicos, a solucao tecnicamente correta e evoluir o modelo para:

- `1 agendamento` como cabecalho
- `N itens de servico` ligados a esse agendamento

O nivel de esforco nao e pequeno, mas tambem nao e um retrabalho do zero. A base de orcamento e ordem de servico ja usa exatamente o padrao de `cabecalho + itens`, entao existe bastante coisa para reaproveitar como referencia.

Minha avaliacao geral:

- Viabilidade: `alta`
- Risco tecnico: `medio`
- Esforco: `medio para alto`
- Complexidade principal: `refatorar a agenda sem quebrar o fluxo atual`

## Como o sistema funciona hoje

### Banco

A tabela `appointments` guarda apenas um servico por linha.

Evidencias:

- `backend/db/schema_current_mysql.sql`
- A tabela `appointments` possui `servico_id`, `servico_nome`, `servico_cor` e `valor`
- Nao existe uma tabela `appointment_items`

Trecho relevante do modelo atual:

- `appointments.servico_id`
- `appointments.servico_nome`
- `appointments.servico_cor`
- `appointments.valor`

Isso mostra que hoje o agendamento nao foi pensado para multiplos itens.

### Backend

O backend valida e monta o payload considerando apenas um `servico_id`.

Evidencias em `backend/src/services/appointment.service.js`:

- `validateAppointmentInput` le apenas `input.servico_id`
- `buildPayload` grava apenas um servico
- O valor do agendamento nasce de `service.valor_padrao` ou de um unico `input.valor`

Na pratica, a regra atual e:

1. escolher um cliente
2. escolher um servico
3. derivar duracao e valor desse unico servico
4. salvar um unico registro em `appointments`

### Frontend

O formulario de agendamento tambem foi feito para um unico servico.

Evidencias em `frontend/src/components/agenda/new-appointment.tsx`:

- estado com `servicoId`
- calculo de horario final baseado em `selectedService.duracaoMinutos`
- valor unico em `values.valor`
- select unico de servico
- resumo final com apenas um valor total

Ou seja: hoje a UI nao possui conceito de tabela de itens dentro do agendamento.

## O que o cliente quer

O pedido e coerente com a operacao:

- mesmo cliente
- mesmo atendimento/data
- mais de um servico dentro da mesma agenda
- soma automatica da duracao
- tabela abaixo com descricao e valor
- possibilidade de editar o valor unitario do item
- possibilidade de editar o valor total da agenda

Esse comportamento e muito parecido com o que o sistema ja faz em orcamento.

## Conclusao tecnica

### E possivel?

Sim.

### E simples?

Nao totalmente, porque o sistema atual depende fortemente de campos unicos de servico no agendamento.

### Vale a pena?

Sim, se esse cenario e recorrente no negocio.

E uma evolucao de produto valida, porque evita:

- criar duas agendas para o mesmo cliente
- duplicar observacoes
- duplicar confirmacao e pagamento
- poluir a agenda visual com atendimentos que na pratica sao um unico compromisso

## Nivel de esforco

### Estimativa realista

Se for feito com seguranca e sem gambiarra:

- Diagnostico e modelagem: `baixo`
- Banco e backend: `medio`
- Frontend do formulario e edicao: `medio`
- Ajustes em listagem, detalhe e compatibilidade: `medio`
- Testes e regressao: `medio`

Estimativa consolidada:

- `2 a 4 dias` para uma primeira versao bem feita
- `4 a 6 dias` se incluirmos migracao cuidadosa, compatibilidade com dados antigos e revisao completa de fluxos relacionados

Se for tentado um atalho mexendo so no frontend e concatenando servicos em texto, o esforco cai, mas a solucao fica fragil e errada para o banco. Eu nao recomendo.

## Mudancas no banco

### Recomendacao principal

Criar uma nova tabela de itens do agendamento, em vez de tentar enfiar multiplos servicos em JSON ou texto dentro de `appointments`.

### Da para usar a tabela de orcamento nesse contexto?

Da para reaproveitar o conceito, mas eu nao recomendo usar `quotes` e `quote_items` como armazenamento oficial do agendamento.

Hoje o papel dessas tabelas e outro:

- `quotes` representa proposta comercial
- `quote_items` representa itens do orcamento
- `appointments` representa execucao na agenda

No estado atual do sistema, essa separacao ja aparece no codigo:

- o orcamento suporta varios itens
- o agendamento ainda suporta um servico
- ao gerar um rascunho de agenda a partir do orcamento, o backend pega apenas o primeiro servico

Ou seja: o projeto ja trata orcamento e agenda como dominios diferentes.

### Comparacao de abordagens

#### Opcao 1: usar `quote_items` direto no agendamento

Vantagens:

- menos tabelas novas no banco
- parte da ideia de itens ja existe
- poderia parecer mais rapido em um primeiro olhar

Desvantagens:

- mistura proposta comercial com execucao operacional
- um orcamento pode existir sem virar agendamento
- um agendamento pode existir sem orcamento
- o valor negociado no orcamento pode ser diferente do valor final executado
- status de orcamento e status de atendimento sao independentes
- a agenda ficaria acoplada a um modulo que deveria continuar opcional
- aumentaria o risco de quebrar fluxos que hoje ja funcionam

Conclusao dessa opcao:

- tecnicamente possivel
- arquiteturalmente fraca
- nao recomendada

#### Opcao 2: criar `appointment_items`

Vantagens:

- respeita a separacao entre comercial e execucao
- permite agendamento com multiplos servicos mesmo sem orcamento
- facilita manter regras especificas de agenda
- reduz risco de regressao no modulo de orcamentos
- deixa mais claro o que pertence a cada dominio

Desvantagens:

- exige nova tabela
- exige migracao
- aumenta o trabalho inicial

Conclusao dessa opcao:

- tecnicamente correta
- melhor para manutencao
- recomendada

### Recomendacao final sobre esse ponto

Minha recomendacao e:

- reaproveitar o padrao de modelagem de `quotes` + `quote_items`
- reaproveitar referencias de UI do formulario de orcamento
- nao reutilizar `quote_items` como tabela oficial da agenda
- criar `appointment_items` como estrutura propria

Assim a gente aproveita o que o projeto ja tem de bom sem acoplar dois modulos com responsabilidades diferentes.

### Modelo sugerido

#### Manter `appointments` como cabecalho

Sugestao de manter em `appointments`:

- `id`
- `organization_id`
- `cliente_id`
- `cliente_nome`
- `cliente_email`
- `profissional_id`
- `profissional_nome`
- `data`
- `horario_inicial`
- `horario_final`
- `valor`
- `status`
- `payment_status`
- `observacoes`
- `confirmacao_cliente`
- `quote_id`
- `service_order_id`
- `recurrence_series_id`
- `recurrence_type`
- `recurrence_index`

#### Criar `appointment_items`

Estrutura sugerida:

- `id CHAR(36) PRIMARY KEY`
- `organization_id CHAR(36) NOT NULL`
- `appointment_id CHAR(36) NOT NULL`
- `servico_id CHAR(36) NULL`
- `servico_nome VARCHAR(160) NOT NULL`
- `descricao_livre VARCHAR(255) NULL`
- `ordem INT NOT NULL DEFAULT 0`
- `duracao_minutos INT NOT NULL`
- `valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00`
- `valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00`
- `observacoes VARCHAR(255) NULL`
- `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

Indices e relacoes:

- indice por `organization_id, appointment_id`
- foreign key de `appointment_id -> appointments(id)`
- idealmente foreign key composta de tenant quando aplicavel

### O que fazer com os campos antigos de servico em `appointments`

Aqui existem 2 caminhos.

#### Caminho recomendado

Manter temporariamente em `appointments`:

- `servico_id`
- `servico_nome`
- `servico_cor`

Mas usa-los apenas como:

- compatibilidade com dados antigos
- "servico principal" ou primeiro item
- fallback visual enquanto a UI inteira e adaptada

Isso reduz risco de quebra durante a migracao.

#### Caminho mais limpo, mas mais trabalhoso

Remover a dependencia desses campos e fazer tudo vir de `appointment_items`.

Isso e mais correto no longo prazo, mas exige refatoracao mais ampla em:

- listagem da agenda
- card do agendamento
- detalhes
- reminders
- integracoes com orcamento
- dashboard

### Migracao de dados

Sera necessario migrar os agendamentos antigos para a nova tabela.

Estrategia sugerida:

1. criar `appointment_items`
2. copiar cada `appointments` atual para um item correspondente
3. preencher:
   - `appointment_id = appointments.id`
   - `servico_id = appointments.servico_id`
   - `servico_nome = appointments.servico_nome`
   - `duracao_minutos = diferenca entre horario_final e horario_inicial` ou duracao do servico cadastrado
   - `valor_unitario = appointments.valor`
   - `valor_total = appointments.valor`
4. manter compatibilidade temporaria

## Mudancas no backend

### Service de agendamento

Arquivo impactado principal:

- `backend/src/services/appointment.service.js`

Mudancas necessarias:

- aceitar `items` no payload
- validar pelo menos um item
- validar cada `servico_id`
- somar duracao total dos itens
- recalcular `horario_final`
- calcular total do agendamento a partir dos itens
- permitir ajuste manual do total final da agenda

### Regras de preco

O pedido menciona dois tipos de edicao:

- editar valor unitario do item
- editar valor total da agenda

Isso exige definir regra clara. Minha recomendacao:

#### Regra sugerida

- Cada item tem `valor_unitario`
- Cada item calcula `valor_total`
- O agendamento tem `subtotal_itens`
- O agendamento pode ter `ajuste_total` ou `desconto`
- O campo final salvo em `appointments.valor` continua sendo o total final da agenda

Sem isso, editar o total da agenda fica ambiguo.

### Persistencia

Arquivos impactados:

- `backend/src/lib/data.js`
- possivelmente `backend/src/models/schema-definitions.js`

Mudancas necessarias:

- criar funcoes para inserir/listar/atualizar/remover `appointment_items`
- carregar itens junto com `getAppointmentByIdForOrganization`
- carregar itens nas listagens quando necessario
- decidir se listagem da agenda traz itens completos ou apenas um resumo

### Transacao

Criacao e atualizacao de agendamento passarao a precisar de transacao:

1. salvar cabecalho em `appointments`
2. salvar itens em `appointment_items`
3. se falhar qualquer parte, desfazer tudo

Hoje isso ainda e mais simples porque so existe um insert.

### Compatibilidade com profissionais

Hoje o profissional e escolhido com base em um unico servico.

Isso vira um ponto importante:

- se o agendamento tiver 2 servicos, o mesmo profissional precisa atender ambos?
- ou o profissional sera do agendamento inteiro?

Minha recomendacao para primeira versao:

- manter `1 profissional por agendamento`
- validar que ele atende todos os servicos selecionados

Isso simplifica bastante.

Se no futuro quiser "um item por profissional", a complexidade sobe muito.

## Mudancas no frontend

### Formulario de novo agendamento

Arquivo principal:

- `frontend/src/components/agenda/new-appointment.tsx`

Hoje o formulario usa:

- um select unico de servico
- um unico campo de valor
- calculo automatico do horario final a partir de um unico servico

Sera preciso transformar essa tela em algo mais proximo do formulario de orcamento.

### Oportunidade de reaproveitamento

O componente de orcamento ja tem um padrao muito parecido em:

- `frontend/src/components/orcamentos/orcamento-form.tsx`

Ele ja possui:

- estrutura de itens
- adicionar item
- editar item
- remover item
- tabela
- totalizacao

Isso reduz o risco, porque ja existe um fluxo semelhante no projeto.

### Mudancas visuais esperadas

No agendamento, a tela devera ter:

1. cabecalho do agendamento
   - cliente
   - profissional
   - data
   - horario inicial
2. formulario de item
   - servico
   - descricao
   - duracao
   - valor unitario
3. tabela de itens abaixo
   - descricao
   - duracao
   - valor unitario
   - valor total
   - acoes editar/remover
4. resumo financeiro
   - subtotal
   - ajuste/desconto opcional
   - total final
5. resumo operacional
   - horario inicial
   - duracao total
   - horario final calculado

### Edicao de agendamento

Tambem sera necessario adaptar:

- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/components/agenda/appointment-detail.tsx`

Porque hoje a edicao ainda parte do mesmo formulario simples de um unico servico.

### Cards e listagem da agenda

Arquivos impactados:

- `frontend/src/components/agenda/appointment-card.tsx`
- `frontend/src/utils/appointment.ts`

Hoje o card mostra um `servicoNome`.

Com multiplos servicos, sera preciso decidir como exibir:

- nome do primeiro servico + `+N`
- ou concatenacao resumida
- ou `Pacote de servicos`

Minha recomendacao:

- mostrar o primeiro item
- se houver mais, exibir `+1 servico` / `+2 servicos`

Exemplo:

- `Corte + 1 servico`
- `Corte + barba + 1 servico` nao recomendo, porque pode poluir o card

## Impactos indiretos

### Lembretes e WhatsApp

Hoje as mensagens usam `servico_nome`.

Com multiplos servicos, sera preciso decidir:

- usar o primeiro servico
- ou gerar uma descricao agregada

Sugestao:

- mensagem curta com resumo
- exemplo: `Seu atendimento inclui: Corte + Barba`

### Dashboard e relatorios

Se hoje algum resumo agrupa por `servico_id` do agendamento, esse conceito fica menos preciso.

Sera necessario decidir:

- dashboard financeiro por agendamento continua no cabecalho
- analises por servico devem passar a olhar `appointment_items`

### Rascunho vindo do orcamento

Hoje o orcamento ja suporta multiplos itens, mas ao gerar rascunho de agendamento ele pega apenas o primeiro servico.

Evidencia:

- `backend/src/services/quote.service.js`
- `createQuoteAppointmentDraft` usa `primaryServiceItem`

Isso teria de ser adaptado para preencher multiplos itens no agendamento.

## Riscos principais

### 1. Quebra de compatibilidade

Como o sistema inteiro hoje assume um unico servico, se a mudanca for feita sem camada de compatibilidade, e facil quebrar:

- listagem
- detalhe
- edicao
- lembretes
- integracoes com orcamento

### 2. Regra de preco mal definida

Editar item e tambem editar total geral pode gerar inconsistencias se nao houver regra clara para:

- subtotal
- desconto
- acrescimo
- total final

### 3. Regra de duracao

Se a duracao total vier da soma dos itens, o sistema deve decidir se:

- o usuario pode editar manualmente o horario final
- ou o horario final sempre sera recalculado automaticamente

Minha recomendacao:

- `horario inicial` manual
- `duracao total` derivada dos itens
- `horario final` automatico

Isso evita divergencia.

### 4. Regra de profissional

Se o profissional nao atender um dos servicos selecionados, o backend tera de bloquear o salvamento.

## Recomendacao de implementacao

### Melhor caminho

Implementar em 2 etapas.

#### Etapa 1

Adicionar suporte estrutural sem quebrar a agenda atual:

- criar `appointment_items`
- migrar dados antigos
- backend passa a ler/escrever itens
- manter campos legados em `appointments` como compatibilidade

#### Etapa 2

Evoluir frontend e regras de negocio:

- novo formulario com itens
- tabela editavel
- resumo de duracao e preco
- atualizacao dos cards, detalhe e lembretes

## Minha recomendacao final

Eu recomendo fazer.

Nao e uma mudanca "baratinha", mas e uma evolucao correta e alinhada ao uso real do sistema. O pedido faz sentido operacionalmente e o projeto ja tem um bom ponto de apoio no modulo de orcamento, o que reduz o risco de implementacao.

Se eu fosse conduzir essa evolucao, eu seguiria esta direcao:

1. criar `appointment_items`
2. migrar dados antigos
3. manter `appointments.valor` como total final do agendamento
4. manter `1 profissional por agendamento` na primeira versao
5. recalcular `horario_final` pela soma das duracoes dos itens
6. adaptar o formulario da agenda usando o padrao de itens do orcamento
7. manter a futura interface pensada para mobile e desktop desde o inicio, sem depender de tabela larga obrigatoria ou interacoes que so funcionem bem no desktop

## Resposta curta para decisao

- E possivel? `Sim`
- E trabalhoso? `Sim, esforco medio/alto`
- Precisa mudar banco? `Sim`
- Mudanca principal no banco? `Criar appointment_items`
- Vale a pena? `Sim, se esse fluxo e recorrente`

## Arquivos mais impactados

- `backend/db/schema_current_mysql.sql`
- `backend/src/lib/data.js`
- `backend/src/services/appointment.service.js`
- `backend/src/services/quote.service.js`
- `backend/src/models/schema-definitions.js`
- `frontend/src/services/appointmentService.ts`
- `frontend/src/components/agenda/new-appointment.tsx`
- `frontend/src/components/agenda/appointment-card.tsx`
- `frontend/src/components/agenda/appointment-detail.tsx`
- `frontend/src/pages/appointment-detail-page.tsx`
- `frontend/src/pages/new-appointment-page.tsx`
- `frontend/src/utils/appointment.ts`
- `frontend/src/components/orcamentos/orcamento-form.tsx` como referencia de reaproveitamento

## Arquivo gerado

Este diagnostico foi registrado em:

- `docs/DIAGNOSTICO_AGENDAMENTO_MULTI_SERVICO.md`
