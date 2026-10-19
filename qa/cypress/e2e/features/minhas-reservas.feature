#Language: en
Feature: Minhas Reservas

    @MinhasReservas
    Scenario: acessar a página de Minhas Reservas
        Given acesso a página de busca
        When clico no botão Minhas Reservas
        Then visualizo a página de Minhas Reservas

    @MinhasReservas
    Scenario: Ver detalhes de reservas solicitadas
        Given acesso a página de busca
        And clico no botão Minhas Reservas
        When clico no botão Ver detalhes de uma reserva
        Then visualizo a página de Detalhes da reserva
