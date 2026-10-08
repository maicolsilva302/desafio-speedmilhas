# Desafio Técnico — QA Pleno · Speed Milhas

A Speed Milhas é uma plataforma B2B de emissão de passagens aéreas com milhas. Agências de
viagem buscam passagens em vários fornecedores ao mesmo tempo e reservam pela nossa
plataforma. Os fornecedores são lentos, instáveis e cada um responde num formato diferente.

Este repositório tem uma versão reduzida desse produto: uma API e uma tela que **funcionam,
mas não estão livres de bugs**. Seu trabalho é o de QA num time que ainda não tem QA.

**O que estamos avaliando:** como você decide o que testar, como encontra e relata problemas,
como automatiza e como revisa código. Não esperamos que você encontre tudo.

| Item | Detalhe |
|---|---|
| Tempo de trabalho | Escopo de cerca de **3 horas**. Pare em **4 horas**, mesmo que falte algo |
| Prazo de entrega | **7 dias corridos** a partir do recebimento do desafio |
| Uso de IA | **Liberado.** Conte como usou no `QA_NOTES.md` |
| Entrega | Veja a seção [Entrega](#entrega) |

---

## 1. Subindo o ambiente

Você precisa de **Docker** com o Compose. Nada mais.

```bash
docker compose up --build
```

A primeira subida leva alguns minutos. Quando terminar:

| Serviço | Endereço |
|---|---|
| Tela | http://localhost:3001 |
| API | http://localhost:3000 |
| Fornecedores (mock) | http://localhost:4000 |
| PostgreSQL | `localhost:5432` · usuário, senha e banco: `speedmilhas` |

Se alguma porta estiver ocupada, copie `.env.example` para `.env` e troque a porta lá.

Para zerar o banco: `docker compose down -v`.

## 2. O que ler antes de começar

- **[`SPEC.md`](./SPEC.md)**: as regras de negócio, em uma página. É a referência para decidir o
  que é bug.
- **Seção 3 abaixo**: como provocar falhas nos fornecedores.

O código está todo aqui (`api/` em NestJS e `web/` em Next.js). Ler o código é permitido, mas o
desafio não depende disso.

## 3. Os fornecedores e os cenários de falha

Os três fornecedores são simulados pelo serviço `mock-suppliers` e se comportam mal **de
propósito**:

| | Latência | Falha |
|---|---|---|
| **A** | 100–800 ms | 5% de erro 500 |
| **B** | 1–5 s | 20% de erro 500 · limite de 5 req/s (responde 429) |
| **C** | rápido | 10% das respostas vêm "sujas": campo `null`, milhas como texto ou lista vazia |

Os preços são **determinísticos**: a mesma rota na mesma data devolve sempre os mesmos preços.
O que varia é o comportamento. Para tornar um cenário reproduzível, use os comandos do mock:

```bash
curl -X POST http://localhost:4000/admin/force-fail/supplier-b     # B sempre falha
curl -X POST http://localhost:4000/admin/force-slow/supplier-b     # B responde em 8 s
curl -X POST "http://localhost:4000/admin/force-dirty/supplier-c?mode=null"    # taxa nula
curl -X POST "http://localhost:4000/admin/force-dirty/supplier-c?mode=string"  # milhas como texto
curl -X POST "http://localhost:4000/admin/force-dirty/supplier-c?mode=empty"   # lista vazia
curl -X POST http://localhost:4000/admin/reset                      # volta ao normal
curl http://localhost:4000/admin/stats                              # chamadas recebidas
```

Também dá para chamar um fornecedor direto, para comparar com o que a API devolveu:

```bash
curl "http://localhost:4000/supplier-a/quotes?origin=GRU&destination=GIG&date=2026-12-01"
curl "http://localhost:4000/supplier-b/search?from=GRU&to=GIG&day=2026-12-01"
curl -X POST http://localhost:4000/supplier-c/v2/quotes \
  -H 'content-type: application/json' \
  -d '{"origin":"GRU","destination":"GIG","date":"2026-12-01"}'
```

> A API guarda em cache por 60 segundos as buscas em que os três fornecedores responderam.
> Para ver um cenário novo, troque a data ou a rota, ou espere um minuto.

## 4. As tarefas

O tempo ao lado de cada tarefa é uma referência, não uma regra.

### 4.1 `PLANO.md` — plano de testes (~30 min)

Um plano curto, para **esta** aplicação: os riscos que você vê, em ordem de prioridade; o que
vale automatizar; o que vale testar à mão; e o que você deixaria de fora agora, e por quê.

### 4.2 `BUGS.md` — bugs encontrados (~60 min)

Um registro por bug, com: título, passos para reproduzir, resultado esperado (cite a regra da
`SPEC.md` quando houver), resultado obtido, gravidade e evidência (comando, print ou trecho de
log). Um modelo já está no arquivo.

### 4.3 Automação (~75 min)

Na pasta `qa/`:

- **3 testes E2E** da tela, com Playwright ou Cypress;
- **3 ou 4 testes de API**, com a ferramenta que preferir.

Tudo precisa rodar **com um comando**, documentado no `QA_NOTES.md`. Teste que falha porque
encontrou um bug é um resultado válido: deixe claro qual bug ele pega.

Bônus: um workflow do GitHub Actions que rode os testes.

### 4.4 Revisão de PR (~20 min)

A branch `feature/cupom-desconto` adiciona cupom de desconto à reserva. A descrição do PR está
em `docs/PR-cupom-desconto.md`, dentro da própria branch.

Revise como revisaria o PR de um colega. Você pode abrir o PR no seu repositório e comentar
nele, ou escrever a revisão em `REVIEW.md`. Diga o que bloqueia o merge e o que é sugestão.

```bash
git fetch origin
git diff main...origin/feature/cupom-desconto
```

### 4.5 `QA_NOTES.md` (~10 min)

Quanto tempo você gastou, o comando para rodar a automação, o que faria com mais tempo e
**como usou IA**: ferramentas, para quê, e um ponto em que você discordou dela ou corrigiu o
que ela sugeriu.

## 5. Fora de escopo

Teste de carga, segurança além das regras da `SPEC.md`, acessibilidade e responsividade
avançadas, e qualquer alteração no `mock-suppliers/`.

## Entrega

1. Crie o seu repositório a partir deste template, com **"Include all branches"** marcado, para a
   branch do PR ir junto.
2. Faça o desafio na `main` do seu repositório. Os arquivos `PLANO.md`, `BUGS.md`,
   `QA_NOTES.md` e `REVIEW.md` já estão na raiz, à sua espera.
3. Deixe o repositório **público**, ou privado e compartilhado com quem enviou o desafio.
4. Responda o e-mail do desafio com o link do repositório.

Não corrija os bugs: queremos o relato, não a correção.
