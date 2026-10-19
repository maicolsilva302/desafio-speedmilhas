class AgenciasPage {
  elements = {
    agenciaRegistrada: () => cy.contains('label', 'Agência').find('select'),
    campoAgenciaLink: () => cy.contains('a', 'Minhas reservas'),
  };

  validarAgenciasRegistradas() {
    this.elements.agenciaRegistrada().should('contain', 'Alfa Turismo');
    this.elements.agenciaRegistrada().should('contain', 'Beta Viagens');
  }

  selecionarAgencia(agencyId) {
    this.elements.agenciaRegistrada().select(agencyId);
  }

  validarAgenciaSelecionada(agencyId) {
    this.elements.agenciaRegistrada().should('have.value', agencyId);
  }

  visitReservations() {
    this.elements.campoAgenciaLink().click();
  }
}

export default new AgenciasPage();