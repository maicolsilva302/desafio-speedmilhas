import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

import bookingPage from '../../pages/BookingPage';
import apiDePesquisaPage from '../../pages/SearchApiPage';
import { apiTestContext, uniqueFutureDate } from '../../support/api-test-context';

Given('tenho uma cotação disponível para preencher os dados', () => {
  apiDePesquisaPage.resetSuppliers();

  return apiDePesquisaPage.search({
    origin: 'GRU',
    destination: 'GIG',
    date: uniqueFutureDate(),
  }).then((response) => {
    apiTestContext.quote = response.body.quotes.find((quote) => quote.bookable);
    expect(apiTestContext.quote).to.exist;
    bookingPage.visitQuote(apiTestContext.quote.id);
  });
});

Then('não posso continuar sem informar o nome do passageiro', () => {
  bookingPage.btnContinuarDesabilitado();
});

When('informo apenas o nome {string}', (nomePassageiro) => {
  bookingPage.continuarComNome(nomePassageiro);
});

Given('continuo para revisão com o nome {string}', (nomePassageiro) => {
  bookingPage.continuarComNome(nomePassageiro);
  cy.intercept('POST', 'http://localhost:3000/orders', (request) => {
    request.continue({ delay: 1000 });
  }).as('createOrder');
});

When('clico duas vezes em confirmar reserva', () => {
  bookingPage.clicarDuasVezesParaConfirmarReserva();
});

Then('somente uma chamada de criação de reserva é enviada', () => {
  bookingPage.validarCriacaoDeReserva();
});

Then('a revisão confirma o nome e mantém documento e e-mail opcionais vazios', () => {
  bookingPage.validarConfirmacaoComCamposOpcionaisVazios();
});