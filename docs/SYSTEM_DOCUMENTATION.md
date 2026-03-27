# AgendaPro - Documentacao do Sistema

## 1. Objetivo

AgendaPro e um sistema SaaS para gestao de agenda e operacao de negocios de atendimento. A plataforma foi desenhada para atender multiplos clientes no mesmo banco de dados, com separacao logica por empresa e administracao centralizada da operacao.

## 2. Escopo Funcional

O sistema cobre:

- autenticacao de usuarios clientes
- onboarding de novas empresas
- cadastro e manutencao de clientes
- cadastro e manutencao de servicos
- cadastro de funcionarios e vinculo com servicos
- agenda de atendimentos
- bloqueio de horarios
- lembretes e integracao com WhatsApp
- configuracoes da empresa e da aplicacao
- gestao administrativa da plataforma
- controle de assinatura, pagamentos e bloqueio de acesso

## 3. Perfis de Acesso

### 3.1 Cliente SaaS

Cada empresa cliente acessa sua propria area e gerencia:

- clientes
- servicos
- funcionarios
- agenda
- configuracoes
- pagamentos e assinatura

### 3.2 Administrador da Plataforma

O acesso master da plataforma permite:

- listar empresas
- cadastrar novas empresas
- editar assinatura e plano
- registrar pagamentos
- configurar chave Pix
- configurar janela de alerta e folga de pagamento
- identificar clientes bloqueados ou liberados
- receber sinalizacao quando o cliente informar que ja pagou

## 4. Arquitetura

## 4.1 Frontend

Tecnologias:

- React 18
- Vite
- React Router
- React Query
- Tailwind CSS
- Capacitor para Android

Responsabilidades:

- renderizacao da interface
- navegacao
- formularios
- consumo da API
- cache de dados no cliente
- experiencia mobile-first

## 4.2 Backend

Tecnologias:

- Node.js
- Express
- MySQL

Responsabilidades:

- autenticacao
- regras de negocio
- multi-tenancy
- persistencia
- controle de assinatura
- integracoes
- exposicao das rotas REST

## 4.3 Banco de Dados

Modelo:

- banco compartilhado entre varias empresas
- isolamento por `organization_id`

Caracteristicas:

- modelo multi-tenant
- seeds iniciais para ambiente de desenvolvimento
- migrations SQL versionadas
- indices para consultas mais frequentes

## 5. Multi-tenancy

O sistema utiliza compartilhamento de banco com segregacao logica. Cada registro operacional relevante pertence a uma organizacao.

Tabelas com segregacao por empresa:

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

Regras:

- o backend identifica a organizacao do usuario autenticado
- consultas operacionais filtram por `organization_id`
- o app nunca acessa o banco diretamente

## 6. Fluxo de Autenticacao

### 6.1 Login do cliente

- o usuario entra com email e senha
- o backend valida credenciais e monta o contexto da organizacao
- a sessao devolve usuario, organizacao e estado de acesso

### 6.2 Primeiro acesso

- se o email ainda nao estiver cadastrado, o sistema pode encaminhar para onboarding
- o onboarding cria estrutura inicial da empresa e do usuario

### 6.3 Login master

- o acesso administrativo da plataforma e configurado por variaveis de ambiente
- esse acesso nao depende de existir como usuario normal da base

## 7. Assinatura e Cobranca

O sistema possui uma camada de cobranca integrada ao uso do aplicativo.

Recursos:

- status de assinatura
- plano
- mensalidade
- vencimento
- dias de alerta antes do bloqueio
- dias de folga apos o vencimento
- chave Pix configurada pelo administrador
- notificacao persistente para o cliente ate confirmacao do pagamento
- acao "Ja paguei, avisar administrador"

Comportamento:

- o frontend exibe aviso e estado de cobranca
- o backend tambem aplica bloqueio de acesso operacional quando a empresa ultrapassa a folga configurada

## 8. Aplicacao Mobile

O app Android utiliza o frontend React empacotado com Capacitor.

Caracteristicas:

- mesma base de interface usada no navegador
- consumo da mesma API do backend
- suporte a emulador Android e dispositivo fisico

URLs comuns:

- emulador Android: `http://10.0.2.2:3333/api`
- dispositivo na rede local: `http://IP_DO_PC:3333/api`
- producao: `https://URL_PUBLICA/api`

## 9. Deploy

## 9.1 Backend

Hospedagem atual recomendada:

- Render

Configuracao:

- diretório raiz do servico: `backend`
- build: `npm install`
- start: `npm run start`

## 9.2 Frontend Web

Pode ser hospedado separadamente se necessario, mas nao e obrigatorio para o app Android.

## 9.3 Android

- build do frontend
- `cap sync`
- execucao via Android Studio

## 10. Performance

Otimizacoes ja aplicadas:

- filtros do painel executados no backend com query direcionada
- carga de lembretes com menos consultas repetidas
- indices automaticos para tabelas principais
- cache e reaproveitamento de queries no frontend
- lazy loading das rotas do frontend
- reducao do bundle inicial do app

Impactos esperados:

- abertura inicial mais leve
- melhor navegacao entre telas
- menos recarregamentos desnecessarios
- consultas mais rapidas no MySQL

## 11. Seguranca e Boas Praticas

- segredos ficam em variaveis de ambiente
- o app cliente nao acessa MySQL diretamente
- controle de acesso concentrado no backend
- multi-tenancy aplicado nas consultas operacionais
- recomendada rotacao de credenciais compartilhadas em ambiente de teste

## 12. Estrutura Tecnica do Repositorio

```text
backend/
  db/
    migrations/
  docs/
  src/
    controllers/
    lib/
    routes/
    services/

frontend/
  android/
  src/
    components/
    context/
    hooks/
    pages/
    routes/
    services/
    utils/
```

## 13. Operacao Recomendada

### Desenvolvimento local

1. configurar `backend/.env`
2. configurar `frontend/.env`
3. instalar dependencias
4. subir backend
5. subir frontend ou sincronizar Capacitor

### Teste no Android

1. rodar build do frontend
2. rodar `cap sync`
3. abrir `frontend/android`
4. executar no dispositivo

## 14. Proximos Passos Recomendados

- publicar documentacao operacional separada por ambiente
- formalizar versionamento de banco com migrations adicionais de performance
- adicionar monitoramento e logs centralizados
- ampliar automacao de testes E2E

