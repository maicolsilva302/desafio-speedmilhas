#Language: en
Feature: Validação das informações do passageiro

  @Reserva @UI
  Scenario: exigir o nome antes de avançar para revisão
    Given acesso a página de busca
    And seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros
    And Reservo a passagem de um dos parceiros
    Then não posso continuar sem informar o nome do passageiro

  @Reserva @UI
  Scenario: permitir avançar sem documento e e-mail
    Given acesso a página de busca
    And seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros
    And Reservo a passagem de um dos parceiros
    When informo apenas o nome "Passageiro QA"
    Then a revisão confirma o nome e mantém documento e e-mail opcionais vazios

  @Reserva @UI @Idempotencia
  Scenario: clique duplo em confirmar não cria reservas duplicadas
    Given acesso a página de busca
    And seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros
    And Reservo a passagem de um dos parceiros
    And continuo para revisão com o nome "Passageiro QA"
    When clico duas vezes em confirmar reserva
    Then somente uma chamada de criação de reserva é enviada