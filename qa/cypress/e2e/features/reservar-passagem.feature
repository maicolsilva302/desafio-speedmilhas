#Language: en
Feature: Reservar passagens

@ResservarPassagens
  Scenario Outline: preencher informações do passageiro por documento <documento>
    Given acesso a página de busca
    And seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros
    And Reservo a passagem de um dos parceiros
    And informo o nome do passageiro "Automação Teste"
    And seleciono o tipo de documento "<documento>"
    And informo o documento "<numeroDocumento>"
    And informo o email "automacao@teste.com"
    And clico no botão Continuar
    And visualizo a página de Revisão das informações
    When clico no botão Confirmar reserva
    Then visualizo a página de Confirmação da compra

    Examples:
      | documento  | numeroDocumento |
      | CPF        | 52998224725     |
      | Passaporte | AB123456        |