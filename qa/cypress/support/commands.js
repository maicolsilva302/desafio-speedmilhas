Cypress.Commands.add('clicarNoBotaoPorTexto', (text) => {
	cy.contains('button', text).should('be.visible').click();
});

Cypress.Commands.add('acessarPaginaDeBusca', () => {
	cy.visit('/');
});