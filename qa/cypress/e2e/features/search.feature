#Language: en
Feature: Busca de passagens

  @PesquisaDeVoos
  Scenario: buscar de passagens somente IDA
    Given acesso a página de busca
    And seleciono a opção de viagem "Somente ida"
    When seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros

  @ValidacaoDaPesquisa
  Scenario: exibir somente os aeroportos atendidos
    Given acesso a página de busca
    Then os aeroportos atendidos estão disponíveis para origem e destino

  @ValidacaoDaPesquisa
  Scenario: impedir que origem e destino sejam iguais
    Given acesso a página de busca
    Then a origem selecionada não pode ser escolhida como destino

  @ValidacaoDaPesquisa
  Scenario: impedir a seleção de data de ida no passado
    Given acesso a página de busca
    Then valido que as datas anteriores a hoje não podem ser selecionadas

  @PesquisaDeVoos
  Scenario: buscar ida e volta em trechos separados
    Given acesso a página de busca
    And seleciono a origem "GRU" e o destino "GIG"
    When seleciono ida e volta com datas futuras válidas
    And clico no botão Buscar passagens
    Then valido os resultados separados para ida e volta

  @PreenchimentoDeInformacoesDoPassageiro
  Scenario Outline: preencher informações do passageiro por doumento <documento>
    Given acesso a página de busca
    When seleciono a origem "GRU" e o destino "FOR"
    And clico no botão Buscar passagens
    Then visualizo as ofertas dos parceiros
    And Reservo a passagem de um dos parceiros
    And informo o nome do passageiro "Automação Teste"
    And seleciono o tipo de documento "<documento>"
    And informo o documento "<numeroDocumento>"
    And informo o email "automacao@teste.com"
    When clico no botão Continuar
    Then visualizo a página de Revisão das informações

    Examples:
      | documento  | numeroDocumento |
      | CPF        | 52998224725     |
      | Passaporte | AB123456        |

  @Pesquisa @Cotacao
  Scenario: mostrar taxa ausente e impedir reservar a oferta
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "c" está configurado para enviar taxa não informada
    And acesso a página de busca
    And seleciono a origem "GIG" e o destino "SSA"
    When clico no botão Buscar passagens
    Then valido que a oferta do fornecedor C mostra taxa não informada e não pode ser reservada

  @Pesquisa @Parcial
  Scenario: mostrar ofertas disponíveis e aviso quando um fornecedor falha
    Given os mocks dos fornecedores estão resetados
    And o fornecedor "b" está configurado para falhar
    And acesso a página de busca
    And seleciono a origem "POA" e o destino "CNF"
    When clico no botão Buscar passagens
    Then valido as ofertas parciais e o aviso de mais opções

  @Pesquisa @Indisponibilidade
  Scenario: exibir indisponibilidade apenas quando nenhum fornecedor responde
    Given os mocks dos fornecedores estão resetados
    And todos os fornecedores estão configurados para falhar
    And acesso a página de busca
    And seleciono a origem "SSA" e o destino "FOR"
    When clico no botão Buscar passagens
    Then valido a mensagem de nenhuma oferta disponível

  @Pesquisa @IdaEVolta
  Scenario: impedir data de volta anterior à data de ida
    Given acesso a página de busca
    And seleciono a origem "GIG" e o destino "BSB"
    When seleciono ida e volta com data de volta anterior à ida
    Then valido a validação da data de volta e não posso pesquisar