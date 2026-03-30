# AgendaPro - Checklist de Deploy em Producao

## Antes do deploy

- Confirmar `SESSION_SECRET` forte e unica no backend
- Confirmar `CORS_ALLOWED_ORIGINS` com os dominios oficiais da web
- Confirmar `PLATFORM_ADMIN_EMAILS` e `PLATFORM_ADMIN_PASSWORD`
- Confirmar credenciais do MySQL e conectividade a partir do ambiente publicado
- Confirmar `VITE_API_URL` apontando para a API publica correta
- Confirmar que o app Android nao depende de HTTP em producao

## Publicacao do backend

- Executar instalacao de dependencias no diretorio `backend`
- Publicar a API com as variaveis de ambiente revisadas
- Validar `GET /api/health`
- Validar login por email e senha
- Validar `GET /api/auth/session` com token valido
- Validar CORS a partir do dominio web oficial

## Publicacao do frontend web

- Gerar build do `frontend`
- Publicar com `VITE_API_URL=https://SUA_API_PUBLICA/api`
- Validar login, onboarding e logout
- Validar agenda, clientes, servicos e painel
- Validar tela de bloqueio por assinatura

## Publicacao Android

- Executar build web atualizada
- Executar `cap sync`
- Confirmar `allowBackup=false`
- Confirmar trafego sem HTTP aberto em producao
- Gerar APK ou AAB e validar login, agenda e notificacoes

## Pos deploy

- Revisar logs de erro do backend logo apos a publicacao
- Validar criacao de agendamento, cliente e servico
- Validar uma operacao de pagamento ou aviso de pagamento
- Registrar data, versao e responsavel pelo deploy
