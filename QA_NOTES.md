# Notas

## Tempo gasto

Cerca de 10 minutos nesta etapa: conferi a tela em `localhost:3001`, li a SPEC e as
instruções existentes de QA e registrei o plano e as notas. Não executei a suíte automatizada
nesta etapa.

## Como rodar a automação

Com Docker e Compose instalados, suba a aplicação na raiz do repositório:

```bash
docker compose up -d
```

Depois, rode todas as features E2E/API existentes em outra janela:

```bash
npm --prefix qa run test:e2e
```

O runner usado é Cypress com Cucumber; o comando não abre a interface gráfica. Para abrir o
Cypress, use `npm --prefix qa run cy:open`.

## O que eu faria com mais tempo

Reproduziria a busca com data futura e os modos controlados de falha/lentidão/sujeira dos
fornecedores; depois, confirmaria o isolamento entre agências e a idempotência com chamadas
repetidas. Também executaria a suíte e registraria os resultados com evidências reproduzíveis.

## Como usei IA

Usei o Copilot no VS Code para organizar os riscos a partir da SPEC e conferir os fluxos e o
comando de automação já presentes no repositório. Revisei as sugestões contra o que consegui
observar: a tela mostrava 19/10/2026 (um dia antes da data desta execução) e a busca retornou
“Nenhuma oferta disponível agora”, com respostas 400 no console. Tratei a data como hipótese para investigar, não como causa confirmada, porque não reproduzi a busca com uma data futura nem isolei a resposta da API.
