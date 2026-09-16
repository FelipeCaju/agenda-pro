# Ambiente local para testes

Preparado e validado em 16/09/2026, no Windows deste computador.

## Abrir e encerrar

1. Abra `INICIAR-AGENDAPRO.cmd` com dois cliques. Ele inicia o banco, a API e o frontend em segundo plano e abre o navegador.
2. Acesse http://localhost:5173.
3. Ao terminar, execute `PARAR-AGENDAPRO.cmd`. Os dados ficam salvos para o proximo teste.

Os atalhos existem tanto na pasta externa `agenda-pro` quanto na raiz do repositorio interno. Nao e necessario instalar npm para usar os atalhos neste computador: eles usam o Node ja disponivel e as dependencias existentes.

| Perfil de teste | Email | Senha |
| --- | --- | --- |
| Empresa liberada | contato@agendapro.app | Agenda123! |
| Empresa em atraso | bloqueado@agendapro.app | Agenda123! |
| Administrador da plataforma | admin@agendapro.local | AdminLocal123! |

As credenciais acima sao exclusivas da demonstracao local.

## Isolamento e persistencia

- MySQL Community 8.4.11 LTS portatil, obtido do [site oficial](https://dev.mysql.com/downloads/mysql/), em `.local/mysql-8.4.11-winx64`.
- Banco `agendapro` em `127.0.0.1:3307`; arquivos persistentes em `.local/mysql-data`.
- API em `127.0.0.1:3333`; frontend em `127.0.0.1:5173`.
- `backend/.env` configura apenas o MySQL local, com segredo de sessao e senha do banco gerados aleatoriamente.
- `frontend/.env.local` aponta para a API local e tem precedencia sobre o `.env` original, inclusive em builds. Para publicar no futuro, use a configuracao do ambiente de destino.
- Configuracoes originais preservadas em `.local/backend.env.original` e `.local/frontend.env.original`. Esses arquivos contem segredos e nao devem ser compartilhados.
- `.local/` e os arquivos de ambiente estao ignorados pelo Git.
- WhatsApp/Z-API e Asaas ficam sem credenciais no ambiente local. Envios externos e checkout real nao fazem parte deste teste.
- A conta de demonstracao tem assinatura liberada ate setembro de 2027 e agendamentos de exemplo no dia da preparacao. Depois disso, use a area administrativa local para renovar o vencimento.

## Roteiro sugerido

1. Entre com a empresa liberada e confira Painel, Agenda, Clientes e Servicos.
2. Na Agenda, crie atendimento futuro para Maria Silva, com Consulta inicial e Retorno. Confira duracao de 1h30 e valor de R$ 300 antes de salvar.
3. Abra o atendimento, edite, altere status/pagamento e confira a listagem.
4. Teste profissionais e bloqueios pela area de Gestao.
5. Crie um orcamento com varios itens e use a conversao em agendamento.
6. Em Recorrencia, cadastre uma mensalidade e confira as telas de cobrancas. Recorrencia financeira e repeticao de agendamento sao modulos distintos.
7. Use a conta em atraso para observar o bloqueio; use o administrador para explorar empresas e assinaturas locais.

## Validacoes realizadas

- TypeScript e build Vite concluidos.
- 12 testes automatizados existentes do backend aprovados.
- Login pelo navegador, abertura da agenda e adicao de dois servicos no formulario com totalizacao correta.
- Teste de integracao `node scripts/smoke-local.mjs`: login, sessao, consultas principais, criacao/leitura/edicao/exclusao de atendimento multi-servico e exclusao de recorrencia preservando tenant e auditoria.
- Schema completo instalado em banco MySQL novo, incluindo infraestrutura automatica de billing.
- Parada e reinicio pelos scripts validados, seguidos de nova execucao bem-sucedida do teste de integracao.
- Login administrativo e listagem de organizacoes confirmados.

O teste de integracao usa exclusivamente `127.0.0.1:3307`, cria registros temporarios e remove esses registros ao terminar; o log de auditoria da exclusao permanece.

Nao foram homologados nesta preparacao: aplicativo Android, notificacoes nativas, login social, pagamentos Asaas e envio real de WhatsApp. Google/Apple aparecem desabilitados sem a configuracao correspondente. A validacao visual completa em celular continua pendente.

## Diagnostico e continuidade

- Logs: `.local/backend.out.log`, `.local/backend.err.log`, `.local/frontend.err.log`, `.local/mysql-error.log`.
- Saude da API: http://127.0.0.1:3333/api/health.
- Scripts de controle: `scripts/start-local.ps1` e `scripts/stop-local.ps1`.
- Nao apague `.local/mysql-data` se quiser manter os testes.
- Os caminhos do runtime e do MySQL sao especificos deste computador e ficam em `.local/runtime.json` e `.local/mysql.ini`. Ao mover a pasta, ajuste esses caminhos antes de iniciar.

## Leitura consolidada do sistema

O aplicativo ativo e `frontend/` (React, TypeScript, Vite, React Query, Tailwind e Capacitor), com API Express em `backend/` e MySQL compartilhado por empresas, segregadas por `organization_id`. `portfolio-frontend/` e uma variante fora dos workspaces principais.

A API organiza regras em controllers, services e `lib/data.js`; billing tem repository proprio e integracao Asaas. O startup garante estruturas adicionais e executa schedulers de lembretes e recorrencia. A agenda usa `appointments` e `appointment_items`; orcamentos possuem suas proprias tabelas; recorrencia financeira usa `recurring_profiles`, `recurring_charges` e `recurring_logs`.

Os nove arquivos de `docs/` foram revisados, junto com README, arquitetura, modelo multi-tenant e documento de billing. Ha registros historicos que nao representam exatamente o codigo atual: o diagnostico multi-servico antecede sua implementacao, e o checklist inicial de recorrencia tem itens pendentes que a atualizacao tecnica posterior ja descreve como implementados. O checklist comercial ainda exige mais testes, observabilidade e homologacao das integracoes antes de venda ampla.

Na instalacao limpa, foi corrigida uma incompatibilidade real: as FKs compostas dos logs de recorrencia usavam `ON DELETE SET NULL`, mas incluiam `organization_id NOT NULL`. Agora usam `RESTRICT`; a exclusao permitida de um perfil sem cobrancas desvincula somente `recurring_profile_id`, mantendo a empresa e o historico dentro da mesma transacao. Schema, migration 016 e bootstrap foram alinhados.
