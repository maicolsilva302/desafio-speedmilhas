#Language: en
Feature: Contrato de reservas e agências

  @API @Reserva
  Scenario: exigir agência para criar e listar reservas
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When tento reservar sem informar agência
    Then a criação da reserva é rejeitada com HTTP 401
    When tento listar reservas sem informar agência
    Then a listagem de reservas é rejeitada com HTTP 401

  @API @Reserva
  Scenario: exigir nome e explicar pedidos inválidos com HTTP 400
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When envio uma reserva sem nome de passageiro para a agência "alfa-turismo"
    Then a reserva é rejeitada com HTTP 400 e mensagem explicativa

  @API @Reserva
  Scenario: aceitar nome sem documento nem e-mail
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When reservo a cotação sem documento e e-mail para a agência "alfa-turismo"
    Then a reserva é criada com nome e dados opcionais ausentes

  @API @Idempotencia
  Scenario: devolver a mesma reserva ao repetir a mesma chave
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When envio duas vezes a mesma reserva com a mesma chave para "alfa-turismo"
    Then a segunda resposta repete a mesma reserva com header de replay

  @API @Idempotencia
  Scenario: rejeitar reutilização da chave com conteúdo diferente
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When reenvio a chave de reserva com outro passageiro para "alfa-turismo"
    Then a reserva é rejeitada por conflito de idempotência

  @API @Reserva
  Scenario: permitir reservar a mesma cotação em tentativas distintas
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When faço duas reservas distintas da cotação para "alfa-turismo"
    Then são criadas duas reservas diferentes

  @API @Preco
  Scenario: preservar milhas e componentes em reais na reserva
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When reservo a cotação para a agência "alfa-turismo"
    Then a reserva preserva milhas, embarque, serviço e total da cotação

  @API @IdaEVolta
  Scenario: reservar cada trecho da ida e volta separadamente
    Given tenho cotações reserváveis para ida e volta
    When reservo cada trecho para a agência "alfa-turismo"
    Then existem duas reservas para os trechos em direções opostas

  @API @Agencias
  Scenario: listar as agências cadastradas
    When consulto as agências cadastradas
    Then Alfa Turismo e Beta Viagens estão disponíveis

  @API @Agencias
  Scenario: listar apenas reservas da agência selecionada
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When faço uma reserva para a agência "alfa-turismo"
    And consulto as reservas da agência "beta-viagens"
    Then a lista da Beta não contém a reserva da Alfa

  @API @Agencias
  Scenario: ocultar reserva de outra agência ao consultar seu identificador
    Given tenho uma cotação reservável para a agência "alfa-turismo"
    When faço uma reserva para a agência "alfa-turismo"
    And consulto a reserva criada usando a agência "beta-viagens"
    Then a consulta da reserva retorna HTTP 404

  @API @Preco
  Scenario: calcular taxa de serviço arredondando para cima ao centavo
    Given os mocks dos fornecedores estão resetados
    When pesquiso uma cotação de "GRU" para "GIG" com taxas informadas
    Then todas as taxas de serviço usam 7 por cento arredondados para cima

  @API @Cotacao
  Scenario: manter cotação reservável por dez minutos
    Given os mocks dos fornecedores estão resetados
    When pesquiso uma cotação de "BSB" para "FOR" com taxas informadas
    Then a cotação permanece válida por dez minutos

  @API @Cotacao
  Scenario: cotação sem taxa de embarque não pode ser reservada
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "c" está configurado para enviar taxa não informada
    And pesquiso uma cotação sem taxa de embarque de "REC" para "SSA"
    And a cotação mostra indisponibilidade para reserva
    When tento reservar essa cotação para a agência "alfa-turismo"
    Then a reserva é rejeitada porque a cotação não permite reserva