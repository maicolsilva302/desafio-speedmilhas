const COMMAND_TIMEOUT = 15000;

class MinhasReservasPage {
  elements = {
    btnMinhasReservas: () => cy.contains('Minhas reservas', { timeout: COMMAND_TIMEOUT }),
    btnVerDetalhesDeUmaReserva: () => cy.contains('Ver detalhes', { timeout: COMMAND_TIMEOUT }),
    txtPaginaMinhasReservas: () => cy.contains('h1', 'Minhas reservas', { timeout: COMMAND_TIMEOUT }),
    statusDaReservaConfirmada: () => cy.get('.mt-6 > :nth-child(2)', { timeout: COMMAND_TIMEOUT }),
  }

  clicarNoBotaoMinhasReservas() {
    this.elements.btnMinhasReservas().click();
    cy.location('pathname', { timeout: COMMAND_TIMEOUT }).should('eq', '/reservas');
    this.elements.txtPaginaMinhasReservas().should('be.visible');
  }

  clicarNoBotaoVerDetalhesDeUmaReserva() {
    this.elements.btnVerDetalhesDeUmaReserva().first().click();
  }

  validarPaginaMinhasReservas() {
    this.elements.txtPaginaMinhasReservas().should('be.visible');
  }
  validarPaginaDetalhesDaReserva() {
    this.elements.statusDaReservaConfirmada().should('be.visible');
  }

}

export default new MinhasReservasPage();