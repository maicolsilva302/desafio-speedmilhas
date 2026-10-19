class PassengerInformationPage {
	elements = {
		campoNome: () => cy.get('input[autocomplete="name"]'),
		campoTipoDocumento: (type) => cy.get(`input[name="tipo-documento"][value="${type}"]`),
		campoDocumento: () => cy.get('input[aria-label="CPF"], input[aria-label="Passaporte"]'),
		campoEmail: () => cy.get('input[type="email"][autocomplete="email"]'),
		reviewHeading: () => cy.contains('h2', 'Confira antes de reservar'),
		passengerValue: () => cy.contains('dt', 'Passageiro').next('dd'),
		emailValue: () => cy.contains('dt', 'E-mail').next('dd'),
		txtQuemVaiViajar: () => cy.contains('h2', 'Quem vai viajar'),
	};

	assertPassengerFormVisible() {
		this.elements.txtQuemVaiViajar().should('be.visible');
	}

	informarNomeDoPassageiro(nomePassageiro) {
		this.elements.campoNome().clear().type(nomePassageiro);
	}

	selecionarTipoDeDocumento(tipoDocumento) {
		this.elements.campoTipoDocumento(tipoDocumento.toLowerCase()).check({ force: true });
	}

	informarDocumento(documento) {
		this.elements.campoDocumento().clear().type(documento);
	}

	informarEmail(email) {
		this.elements.campoEmail().clear().type(email);
	}

	continueToReview() {
		cy.clicarNoBotaoPorTexto('Continuar');
		this.elements.reviewHeading().should('be.visible');
	}

	assertPassengerDetailsOnReview() {
		this.elements.reviewHeading().should('be.visible');
		this.elements.passengerValue().should('be.visible');
	}
}

export default new PassengerInformationPage();
