,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,# Especificação — Busca e reserva de passagens em milhas

Estas são as regras de negócio da aplicação. Comportamento que contraria uma regra daqui é bug.
Comportamento que nenhuma regra cobre é ponto de atenção, e vale registrar como tal.

## 1. Busca

1. A busca recebe origem, destino e data de ida. Aeroportos atendidos: `GRU`, `GIG`, `BSB`,
   `SSA`, `REC`, `POA`, `CNF`, `FOR`. Origem e destino precisam ser diferentes. A data de ida
   não pode estar no passado.
2. Na **ida e volta**, a data de volta não pode ser anterior à data de ida. Cada trecho é
   buscado e reservado separadamente.
3. A busca consulta os três fornecedores (A, B e C) e junta as ofertas numa lista só, ordenada
   por milhas, da menor para a maior.
4. Toda oferta válida enviada por um fornecedor aparece na lista. Os fornecedores mandam
   formatos diferentes, e o fornecedor C às vezes manda as milhas como texto (`"45000"`), o que
   ainda é um valor válido.
5. Uma oferta cuja taxa de embarque não foi informada aparece na lista com o aviso "taxa não
   informada", mas **não pode ser reservada**.
6. A busca responde em **até 6 segundos**, mesmo quando um fornecedor está lento. O que chegou
   até lá é mostrado.
7. **Resultado parcial:** quando algum fornecedor falha ou demora, a tela mostra as ofertas dos
   outros com o aviso "Pode haver mais opções para esta data". A mensagem "Nenhuma oferta
   disponível agora" só aparece quando **nenhum** fornecedor respondeu.

## 2. Preço

8. O preço tem duas partes: milhas e reais. Em reais, o cliente paga a **taxa de embarque**
   (informada pelo fornecedor) mais a **taxa de serviço** da Speed Milhas.
9. A taxa de serviço é **7% da taxa de embarque, arredondada para cima ao centavo**.
   Exemplo: embarque de R$ 39,76 → serviço de R$ 2,79 (7% = 2,7832) → total de R$ 42,55.
10. A cotação vale por 10 minutos. Depois disso a reserva é recusada e é preciso buscar de novo.

## 3. Reserva

11. O nome do passageiro é obrigatório. Documento (CPF ou passaporte) e e-mail são opcionais.
    Um pedido inválido é recusado com **400** e uma mensagem que explica o problema, nunca
    com erro 500.
12. **Uma tentativa de reserva gera uma reserva só.** Clique duplo, repetição de rede ou
    reenvio do mesmo pedido não podem criar reservas a mais. O pedido traz uma
    `idempotencyKey`: a mesma chave devolve a mesma reserva (`201` e header
    `Idempotent-Replay: true`).
13. A mesma oferta pode ser reservada mais de uma vez, por exemplo para passageiros diferentes,
    desde que sejam tentativas de reserva diferentes.

## 4. Agências

14. Os clientes da Speed Milhas são agências. Há duas cadastradas: **Alfa Turismo**
    (`alfa-turismo`) e **Beta Viagens** (`beta-viagens`). Na tela, a agência é escolhida no
    topo da página. Na API, ela vai no header `x-client-id`.
15. Toda operação de reserva exige a agência. Sem ela, a resposta é **401**.
16. Uma agência só vê e consulta as **próprias** reservas. Pedir uma reserva de outra agência
    responde **404**, como se ela não existisse.

## 5. API

| Método e rota | O que faz |
|---|---|
| `POST /search` | Busca. Corpo: `{ "origin": "GRU", "destination": "GIG", "date": "2026-12-01" }` |
| `GET /search/stream?origin=&destination=&date=` | A mesma busca, entregue em partes (SSE). É o que a tela usa |
| `GET /quotes/:id` | Uma oferta e se ela ainda pode ser reservada |
| `GET /clients` | As agências cadastradas |
| `POST /orders` | Reserva. Corpo: `{ "quoteId", "passageiro": { "nome", "documento", "documentoTipo", "email" }, "idempotencyKey" }` |
| `GET /orders` | As reservas da agência do header |
| `GET /orders/:id` | Uma reserva da agência do header |

Os erros seguem um formato único: `{ "error": { "code": "QUOTE_EXPIRED", "message": "…" } }`.
