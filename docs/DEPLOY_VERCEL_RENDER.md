# Publicacao: Vercel e Render

Este roteiro prepara o AgendaPro para uma primeira demonstracao comercial. Ele nao publica nem altera os servicos remotos automaticamente.

## Vercel

- Importe o repositorio e defina `frontend` como **Root Directory**.
- Framework: Vite; Build Command: `npm run build`; Output Directory: `dist`.
- Defina `VITE_API_URL=https://SEU_BACKEND.onrender.com/api` em Production, Preview e Development conforme aplicavel.
- O arquivo `frontend/vercel.json` ja faz o fallback das rotas React para `index.html`.

## Render

- Crie o Web Service usando `render.yaml` ou configure Root Directory como `backend`, Build Command como `npm install` e Start Command como `npm start`.
- O health check e `/api/health`.
- Configure estas variaveis no painel do Render, sem colocar valores no Git:

| Variavel | Uso |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL de producao |
| `DB_CONNECTION_LIMIT` | Comece com `10` |
| `SESSION_SECRET` | Segredo aleatorio longo e exclusivo de producao |
| `CORS_ALLOWED_ORIGINS` | URL exata da Vercel, por exemplo `https://agenda-pro.vercel.app` |
| `FRONTEND_APP_URL` | A mesma URL oficial da Vercel |
| `PLATFORM_ADMIN_EMAILS`, `PLATFORM_ADMIN_PASSWORD` | Acesso administrativo inicial |
| `ASAAS_ENV`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` | Somente quando o billing Asaas estiver homologado |
| `WHATSAPP_ENABLED` | Mantenha `false` enquanto nao houver provedor contratado |

`PORT` e fornecida pelo Render. Nao cadastre `Z_API_*` enquanto o WhatsApp estiver desativado.

## WhatsApp pausado

O backend agora trata WhatsApp como indisponivel por padrao. Isso bloqueia envio manual e automatico sem gerar tentativas repetidas no scheduler de lembretes ou de cobrancas recorrentes. A tela continua disponivel para consulta, mas os envios so voltam quando `WHATSAPP_ENABLED=true` e todas as credenciais do provedor forem configuradas.

## Validacao antes de divulgar

1. Abra `https://SEU_BACKEND.onrender.com/api/health` e confirme `{"status":"ok"}`.
2. Abra o dominio Vercel, teste login, clientes, servicos, agenda e orcamentos.
3. Confirme que uma chamada da Vercel para a API nao apresenta erro de CORS.
4. Confirme que a tela de WhatsApp informa indisponibilidade ao tentar enviar, sem acionar fornecedor externo.
5. Antes de habilitar pagamento real, configure e valide Asaas e webhook separadamente.

## Segredos expostos anteriormente

Credenciais antigas de Z-API estavam no arquivo `backend/.env.example`. Elas foram removidas deste repositorio, mas devem ser consideradas comprometidas se o repositorio foi compartilhado ou enviado para um remoto. Revogue-as ou gere novas credenciais no provedor antes de uma futura reativacao do WhatsApp.
