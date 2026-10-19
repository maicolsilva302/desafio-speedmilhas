#Language: en
Feature: Seleção da agência na interface

    @Agencias @UI
    Scenario: selecionar Alfa Turismo ou Beta Viagens no topo
        Given acesso a página de busca
        Then as agências Alfa Turismo e Beta Viagens estão disponíveis no topo
        When seleciono a agência "beta-viagens"
        Then valido que a agência "beta-viagens" fica selecionada