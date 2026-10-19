import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

import apiDePesquisaPage from '../../pages/SearchApiPage';
import {
  apiTestContext,
  uniqueFutureDate,
  yesterdayIso,
} from '../../support/api-test-context';

function searchQuery(origin, destination, date = uniqueFutureDate()) {
  return { origin, destination, date };
}

Given('o fornecedor {string} está configurado para responder lentamente', (supplier) => {
  return apiDePesquisaPage.forceSupplierSlow(supplier);
});

Given('o fornecedor {string} está configurado para enviar milhas como texto', (supplier) => {
  return apiDePesquisaPage.forceSupplierDirty(supplier, 'string');
});

When('pesquiso de {string} para {string} em uma data futura', (origin, destination) => {
  apiTestContext.query = searchQuery(origin, destination);

  return apiDePesquisaPage.search(apiTestContext.query).then((response) => {
    apiTestContext.response = response;
    apiTestContext.searchResponse = response.body;
  });
});

When('pesquiso de {string} para {string} ontem', (origin, destination) => {
  apiTestContext.query = searchQuery(origin, destination, yesterdayIso());

  return apiDePesquisaPage.search(apiTestContext.query).then((response) => {
    apiTestContext.response = response;
    apiTestContext.searchResponse = response.body;
  });
});

When('pesquiso de {string} para {string} em uma data futura e meço a duração', (origin, destination) => {
  apiTestContext.query = searchQuery(origin, destination);
  apiTestContext.startedAt = Date.now();

  return apiDePesquisaPage.search(apiTestContext.query).then((response) => {
    apiTestContext.durationMs = Date.now() - apiTestContext.startedAt;
    apiTestContext.response = response;
    apiTestContext.searchResponse = response.body;
  });
});

When('pesquiso de {string} para {string} em uma data futura pelo fluxo', (origin, destination) => {
  apiTestContext.query = searchQuery(origin, destination);

  return apiDePesquisaPage.streamSearch(apiTestContext.query).then((response) => {
    apiTestContext.response = response;
  });
});

Then('a pesquisa é rejeitada com HTTP 400 e erro explicativo', () => {
  expect(apiTestContext.response.status).to.equal(400);
  expect(apiTestContext.response.body.error.message).to.be.a('string').and.not.be.empty;
});

Then('os três fornecedores foram consultados', () => {
  return searchApiPage.supplierStats().then(({ body }) => {
    expect(body.suppliers['supplier-a'].calls).to.be.greaterThan(0);
    expect(body.suppliers['supplier-b'].calls).to.be.greaterThan(0);
    expect(body.suppliers['supplier-c'].calls).to.be.greaterThan(0);
    expect(apiTestContext.response.status).to.equal(200);

    apiTestContext.searchResponse.suppliers.forEach((supplier) => {
      const savedQuotes = apiTestContext.searchResponse.quotes.filter(
        (quote) => quote.supplier === supplier.code,
      );

      expect(savedQuotes).to.have.length(supplier.quotes);
    });
  });
});

Then('as ofertas retornadas estão ordenadas por milhas crescentes', () => {
  const miles = apiTestContext.searchResponse.quotes.map((quote) => quote.miles);

  expect(miles.length).to.be.greaterThan(0);
  expect(miles).to.deep.equal([...miles].sort((first, second) => first - second));
});

Then('as ofertas do fornecedor C são mantidas com milhas numéricas', () => {
  expect(apiTestContext.response.status).to.equal(200);

  const supplierCQuotes = apiTestContext.searchResponse.quotes.filter(
    (quote) => quote.supplier === 'C',
  );

  expect(supplierCQuotes.length).to.be.greaterThan(0);
  supplierCQuotes.forEach((quote) => expect(quote.miles).to.be.a('number'));
});

Then('a resposta contém ofertas parciais dos outros fornecedores', () => {
  expect(apiTestContext.response.status).to.equal(200);
  expect(apiTestContext.searchResponse.status).to.equal('partial');
  expect(apiTestContext.searchResponse.quotes.length).to.be.greaterThan(0);
  expect(apiTestContext.searchResponse.quotes.some((quote) => quote.supplier !== 'B')).to.equal(true);
  expect(apiTestContext.searchResponse.suppliers.find((supplier) => supplier.code === 'B').status)
    .to.equal('error');
});

Then('a busca termina em até 6 segundos e preserva as ofertas recebidas', () => {
  expect(apiTestContext.durationMs).to.be.at.most(6000);
  expect(apiTestContext.response.status).to.equal(200);
  expect(apiTestContext.searchResponse.quotes.length).to.be.greaterThan(0);
});

Then('a resposta indica que nenhum fornecedor respondeu e não contém ofertas', () => {
  expect(apiTestContext.response.status).to.equal(503);
  expect(apiTestContext.searchResponse.status).to.equal('unavailable');
  expect(apiTestContext.searchResponse.quotes).to.have.length(0);
});

Then('o fluxo SSE contém eventos de ofertas, progresso e conclusão', () => {
  expect(apiTestContext.response.status).to.equal(200);
  expect(apiTestContext.response.headers['content-type']).to.include('text/event-stream');
  expect(apiTestContext.response.body).to.include('event: ofertas');
  expect(apiTestContext.response.body).to.include('event: progresso');
  expect(apiTestContext.response.body).to.include('event: done');
});