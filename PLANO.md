# Plano de testes

## Riscos, em ordem de prioridade

1. **Reserva duplicada ou vinculada à agência errada (SPEC 12, 14–16).** Pode gerar emissão/cobrança indevida ou expor dados de outra agência. Idempotência e isolamento entre clientes são bloqueadores.

2. **Busca lenta ou resultado parcial incorreto (SPEC 3–7).** Um fornecedor instável não pode atrasar a resposta além de 6 segundos nem esconder ofertas válidas dos demais. Também é importante diferenciar falha parcial de ausência total de ofertas.

3. **Preço ou disponibilidade incorretos (SPEC 5, 8–10).** Taxa de serviço calculada incorretamente, oferta sem taxa reservável ou cotação expirada aceita afetam diretamente o valor e a validade da reserva.

4. **Validação insuficiente da busca e do passageiro (SPEC 1–2, 11).** Aeroportos iguais, datas passadas/volta anterior à ida ou passageiro sem nome devem ser recusados com erro claro, sem erro 500.
5. **Fluxo de tela não representar o estado da API.** Loading, erro, resultado parcial e seleção de agência precisam ficar claros; se a tela divergir da API, a pessoa pode repetir a operação ou acreditar que a reserva não foi feita.

## O que automatizar

- **API — busca:** validar origem/destino e datas, normalização de respostas dos três fornecedores (incluindo milhas como texto e taxa nula), ordenação crescente e SLA de 6 segundos. Forçar falha e lentidão do fornecedor B para conferir resultado parcial e o caso sem nenhuma resposta.

- **API — preço e cotação:** conferir taxa de serviço arredondada para cima no centavo, oferta sem taxa não reservável e recusa após 10 minutos.

- **API — pedidos e agências:** nome obrigatório com resposta 400, reserva com agência ausente (401), chave repetida retornando a mesma reserva e `Idempotent-Replay: true`, além de isolamento (agência diferente recebe 404). Também cobrir duas reservas legítimas da mesma oferta com chaves diferentes.

- **E2E — busca:** ida e volta, campos de aeroporto/data e apresentação das ofertas em ordem, incluindo aviso para oferta sem taxa e aviso de resultado parcial.

- **E2E — reserva:** selecionar uma oferta reservável, preencher passageiro e conferir o resultado na lista/detalhe de reservas. Cobrir validação antes do envio e troca de agência.

- **Priorizar** testes estáveis com respostas controladas pelo mock; os percentuais aleatórios de
falha dos fornecedores não devem ser a única forma de cobrir indisponibilidade.

## O que testar manualmente

- Usar `force-fail`, `force-slow` e `force-dirty` no mock, sempre restaurando o cenário com `/admin/reset`, e observar mensagens, tempo percebido e se a tela distingue falha parcial de nenhuma resposta.

- Percorrer a busca e a reserva pela interface, conferindo se os estados de carregamento, erros e confirmação são compreensíveis e se trocar de agência atualiza os dados exibidos.

- Conferir no navegador cenários que dependem de tempo real, como expiração da cotação, e comparar uma busca com a resposta direta dos fornecedores quando houver divergência.

Na inspeção inicial da tela, a data exibida era **19/10/2026**, enquanto a data desta
execução era **20/10/2026**. Ao submeter a busca, apareceu “Nenhuma oferta disponível agora”
e houve respostas HTTP 400 no console. Isso merece reprodução com uma data futura antes de
concluir a causa; uma única observação não confirma se o problema é a data, a API ou o estado
dos fornecedores.

## O que fica de fora agora, e por quê

- Teste de carga, segurança além das regras de autorização da SPEC, acessibilidade e responsividade avançadas: fora do escopo definido para o desafio.

- Cobertura exaustiva de todas as combinações de aeroportos, datas e fornecedores: custo alto para pouco ganho inicial; começar pelas regras e cenários de maior risco acima.

- Variabilidade probabilística dos mocks como critério de aprovação: pode deixar a suíte intermitente. Usar os modos forçados para cenários determinísticos e deixar a variação aleatória para observação exploratória.
