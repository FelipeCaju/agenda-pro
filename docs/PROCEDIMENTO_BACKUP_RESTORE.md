# AgendaPro - Procedimento de Backup e Restore

## Objetivo

Definir um processo minimo e repetivel para proteger o MySQL antes de venda ampla.

## Backup recomendado

- Frequencia minima diaria para producao
- Retencao minima de 7 dias para restauracao rapida
- Retencao adicional semanal para historico
- Armazenamento fora do servidor principal

## Itens que precisam entrar no backup

- Banco MySQL completo da aplicacao
- Migrations e schema versionados no repositorio
- Arquivo de variaveis de ambiente armazenado em cofre seguro

## Passos de backup

1. Identificar host, banco e credenciais do MySQL de producao.
2. Executar dump consistente do banco.
3. Salvar o arquivo com data e ambiente no nome.
4. Enviar o arquivo para armazenamento seguro fora do host principal.
5. Registrar resultado, tamanho do arquivo e responsavel.

## Passos de restore

1. Restaurar o dump em banco separado de homologacao primeiro.
2. Validar tabelas centrais: organizacoes, usuarios, agenda, clientes, servicos e pagamentos.
3. Validar login e consultas essenciais da API contra a base restaurada.
4. Somente depois aprovar restauracao no ambiente de producao, se necessario.

## Validacao periodica

- Testar restore pelo menos uma vez por mes
- Registrar tempo de restauracao e problemas encontrados
- Revisar se dumps estao realmente sendo gerados e copiados

## Observacao

Este documento define o processo. Ainda falta automatizar e evidenciar a rotina operacional no ambiente final.
