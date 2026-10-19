import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import infoPassageiroPage from '../../pages/PassengerInformationPage';

When('Reservo a passagem de um dos parceiros', () => {
	cy.contains('a', 'Reservar').first().click();
	infoPassageiroPage.assertPassengerFormVisible();
});

When('informo o nome do passageiro {string}', (nomePassageiro) => {
	infoPassageiroPage.informarNomeDoPassageiro(nomePassageiro);
});

When('seleciono o tipo de documento {string}', (tipoDocumento) => {
	infoPassageiroPage.selecionarTipoDeDocumento(tipoDocumento);
});

When('informo o documento {string}', (documento) => {
	infoPassageiroPage.informarDocumento(documento);
});

When('informo o email {string}', (email) => {
	infoPassageiroPage.informarEmail(email);
});

When('clico no botão Continuar', () => {
	infoPassageiroPage.continueToReview();
});

Then('visualizo a página de Revisão das informações', () => {
	infoPassageiroPage.assertPassengerDetailsOnReview();
});