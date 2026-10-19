#Language: en
Feature: Expiração de cotações

  @API @Cotacao
  Scenario: recusar a reserva de cotação expirada
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When a cotação expira
    And tento reservar essa cotação para a agência "alfa-turismo"
    Then a reserva é rejeitada porque a cotação expirou