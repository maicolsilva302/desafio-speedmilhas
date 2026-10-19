class BookingPage {
  elements = {
    campoNome: () => cy.get('input[autocomplete="name"]'),
    campoDocumento: () => cy.get('input[aria-label="CPF"], input[aria-label="Passaporte"]'),
    campoEmail: () => cy.get('input[type="email"][autocomplete="email"]'),
    btnContinuar: () => cy.contains('button', 'Continuar'),
    txtRevisao: () => cy.contains('h2', 'Confira antes de reservar'),
    btnConfirmar: () => cy.contains('button', /Confirmar reserva|Reservando…/),
    txtReservaConfirmada: () => cy.contains('h2', 'Reserva confirmada'),
    continue: () => cy.contains('button', 'Continuar'),
    btnQuemVaiVIajar: () => cy.contains('h2', 'Quem vai viajar'),
    txtInformeONomeParaContinuar: () => cy.contains('p', 'Informe o nome para continuar.'),
  };

  visitQuote(quoteId, agencyId = 'alfa-turismo') {
    cy.visit(`/reservar/${quoteId}`, {
      onBeforeLoad(window) {
        window.localStorage.setItem('speedmilhas:agencia', agencyId);
      },
    });
    this.elements.txtRevisao().should('be.visible');
  }

  btnContinuarDesabilitado() {
    this.elements.continue().should('be.disabled');
    this.elements.txtInformeONomeParaContinuar().should('be.visible');
  }

  continuarComNome(nomePassageiro) {
    this.elements.campoNome({timeout:15000}).type(nomePassageiro);
    this.elements.btnContinuar().should('be.enabled').click();
    this.elements.txtRevisao().should('be.visible');
  }

  validarConfirmacaoComCamposOpcionaisVazios() {
    cy.contains('dt', 'Passageiro').next('dd').should('contain.text', 'Passageiro QA');
    cy.contains('dt', 'CPF').should('not.exist');
    cy.contains('dt', 'Passaporte').should('not.exist');
    cy.contains('dt', 'E-mail').should('not.exist');
  }

  clicarDuasVezesParaConfirmarReserva() {
    this.elements.btnConfirmar().click();
    this.elements.btnConfirmar().should('be.disabled');
  }

  validarCriacaoDeReserva() {
    cy.wait('@createOrder');
    cy.get('@createOrder.all').should('have.length', 1);
    this.elements.txtReservaConfirmada().should('be.visible');
  }
}

export default new BookingPage();