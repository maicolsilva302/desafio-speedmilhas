# Automação

## Abrir o Cypress manualmente

1. Suba a aplicação em outro terminal, se ainda não estiver no ar: `docker compose up -d`.
2. Na raiz do repositório, execute:

	```powershell
	npm --prefix qa run cy:open
	```

3. Na janela do Cypress, escolha **E2E Testing**, selecione um navegador e clique na feature que deseja executar.

O runner está configurado para descobrir os arquivos `qa/cypress/e2e/features/*.feature`.
Se o Cypress já estiver aberto na raiz do projeto, feche-o e abra novamente com o comando acima.

As features estão separadas por fluxo: pesquisa, estados da busca, reservas/agências, expiração da cotação e interface.

Para executar uma feature sem abrir a interface, use, por exemplo:

```powershell
npm --prefix qa run cy:run -- --spec cypress/e2e/features/search-api.feature
```
