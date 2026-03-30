# AgendaPro - Runbook Operacional

## Objetivo

Ter um roteiro curto para responder aos incidentes mais provaveis da plataforma.

## Incidentes prioritarios

### API indisponivel

1. Validar `GET /api/health`.
2. Verificar logs do backend no provedor.
3. Confirmar conectividade com o MySQL.
4. Validar se houve mudanca recente de ambiente ou deploy.

### Falha de login

1. Confirmar se a API responde normalmente.
2. Validar expiracao de sessao e tentativas bloqueadas por rate limit.
3. Confirmar `SESSION_SECRET` e credenciais de administrador da plataforma.
4. Revisar erros 401, 403 e 429.

### Lentidao geral

1. Medir tempo de resposta da API.
2. Revisar consultas lentas ou saturacao de conexoes MySQL.
3. Confirmar latencia entre aplicacao e banco.
4. Verificar se ha aumento de carga ou erro repetitivo em alguma rota.

### Bloqueio indevido por assinatura

1. Confirmar dados da organizacao e ultimo pagamento.
2. Revisar configuracoes de dias de folga e alerta.
3. Validar a resposta de `GET /api/auth/session`.

## Registro minimo por incidente

- data e hora
- ambiente afetado
- sintoma observado
- causa identificada
- acao tomada
- responsavel
- proximo passo
