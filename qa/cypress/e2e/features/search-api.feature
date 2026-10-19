#Language: en
Feature: Contrato da pesquisa de passagens

  @API @Pesquisa
  Scenario: rejeitar aeroporto fora da lista atendida
    Given os mocks dos fornecedores estão resetados
    When pesquiso de "XYZ" para "GIG" em uma data futura
    Then a pesquisa é rejeitada com HTTP 400 e erro explicativo

  @API @Pesquisa
  Scenario: rejeitar origem e destino iguais
    Given os mocks dos fornecedores estão resetados
    When pesquiso de "GRU" para "GRU" em uma data futura
    Then a pesquisa é rejeitada com HTTP 400 e erro explicativo

  @API @Pesquisa
  Scenario: rejeitar data de ida passada
    Given os mocks dos fornecedores estão resetados
    When pesquiso de "GRU" para "GIG" ontem
    Then a pesquisa é rejeitada com HTTP 400 e erro explicativo

  @API @Pesquisa
  Scenario: consultar os três fornecedores e ordenar ofertas por milhas
    Given os mocks dos fornecedores estão resetados
    When pesquiso de "GRU" para "GIG" em uma data futura
    Then os três fornecedores foram consultados
    And as ofertas retornadas estão ordenadas por milhas crescentes

  @API @Pesquisa
  Scenario: aceitar milhas do fornecedor C enviadas como texto
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "c" está configurado para enviar milhas como texto
    When pesquiso de "BSB" para "SSA" em uma data futura
    Then as ofertas do fornecedor C são mantidas com milhas numéricas

  @API @Pesquisa
  Scenario: preservar ofertas quando um fornecedor falha
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "b" está configurado para falhar
    When pesquiso de "REC" para "POA" em uma data futura
    Then a resposta contém ofertas parciais dos outros fornecedores

  @API @Pesquisa
  Scenario: responder em até seis segundos quando um fornecedor demora
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "b" está configurado para responder lentamente
    When pesquiso de "CNF" para "FOR" em uma data futura e meço a duração
    Then a busca termina em até 6 segundos e preserva as ofertas recebidas

  @API @Pesquisa
  Scenario: informar indisponibilidade quando nenhum fornecedor responde
    Given os mocks dos fornecedores estão resetados
    And todos os fornecedores estão configurados para falhar
    When pesquiso de "SSA" para "REC" em uma data futura
    Then a resposta indica que nenhum fornecedor respondeu e não contém ofertas

  @API @Pesquisa
  Scenario: entregar resultados da pesquisa pelo fluxo SSE
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "b" está configurado para falhar
    When pesquiso de "FOR" para "GIG" em uma data futura pelo fluxo
    Then o fluxo SSE contém eventos de ofertas, progresso e conclusão