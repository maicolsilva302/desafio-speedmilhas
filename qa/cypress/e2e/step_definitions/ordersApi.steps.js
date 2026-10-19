import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

import ordersApiPage from '../../pages/OrdersApiPage';
import searchApiPage from '../../pages/SearchApiPage';
import {
  apiTestContext,
  uniqueFutureDate,
  uniqueIdempotencyKey,
} from '../../support/api-test-context';

const PASSENGER = { nome: 'Passageiro QA' };

function getBookableQuote(origin, destination) {
  const query = { origin, destination, date: uniqueFutureDate() };

  return searchApiPage.search(query).then((response) => {
    expect(response.status).to.equal(200);

    const quote = response.body.quotes.find((item) => item.bookable);

    expect(quote, 'cotação reservável').to.exist;
    apiTestContext.query = query;
    apiTestContext.searchResponse = response.body;
    apiTestContext.quote = quote;
  });
}

function orderBody(quoteId, name = PASSENGER.nome, key = uniqueIdempotencyKey()) {
  return {
    quoteId,
    passageiro: {
      nome: name,
    },
    idempotencyKey: key,
  };
}

Given('tenho uma cotação reservável para a agência {string}', (_clientId) => {
  return searchApiPage.resetSuppliers().then(() => getBookableQuote('GRU', 'GIG'));
});

Given('tenho cotações reserváveis para ida e volta', () => {
  searchApiPage.resetSuppliers();

  return getBookableQuote('GRU', 'GIG').then(() => {
    apiTestContext.outboundQuote = apiTestContext.quote;

    return getBookableQuote('GIG', 'GRU').then(() => {
      apiTestContext.returnQuote = apiTestContext.quote;
    });
  });
});

When('tento reservar sem informar agência', () => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest).then((response) => {
    apiTestContext.response = response;
  });
});

When('tento listar reservas sem informar agência', () => {
  return ordersApiPage.listOrders().then((response) => {
    apiTestContext.response = response;
  });
});

When('envio uma reserva sem nome de passageiro para a agência {string}', (clientId) => {
  apiTestContext.orderRequest = {
    quoteId: apiTestContext.quote.id,
    passageiro: {},
    idempotencyKey: uniqueIdempotencyKey(),
  };

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((response) => {
    apiTestContext.response = response;
  });
});

When('reservo a cotação sem documento e e-mail para a agência {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((response) => {
    apiTestContext.response = response;
    apiTestContext.order = response.body;
  });
});

When('envio duas vezes a mesma reserva com a mesma chave para {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((first) => {
    apiTestContext.firstResponse = first;

    return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((second) => {
      apiTestContext.response = second;
      apiTestContext.order = second.body;
    });
  });
});

When('reenvio a chave de reserva com outro passageiro para {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then(() => {
    const changedRequest = { ...apiTestContext.orderRequest, passageiro: { nome: 'Outro QA' } };

    return ordersApiPage.createOrder(changedRequest, clientId).then((response) => {
      apiTestContext.response = response;
    });
  });
});

When('faço duas reservas distintas da cotação para {string}', (clientId) => {
  const firstRequest = orderBody(apiTestContext.quote.id, 'Passageiro Um');

  return ordersApiPage.createOrder(firstRequest, clientId).then((first) => {
    apiTestContext.firstResponse = first;

    const secondRequest = orderBody(apiTestContext.quote.id, 'Passageiro Dois');

    return ordersApiPage.createOrder(secondRequest, clientId).then((second) => {
      apiTestContext.response = second;
      apiTestContext.secondOrder = second.body;
    });
  });
});

When('consulto as agências cadastradas', () => {
  return ordersApiPage.listClients().then((response) => {
    apiTestContext.clients = response.body.clients;
  });
});

When('faço uma reserva para a agência {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((response) => {
    apiTestContext.response = response;
    apiTestContext.order = response.body;
  });
});

When('consulto as reservas da agência {string}', (clientId) => {
  return ordersApiPage.listOrders(clientId).then((response) => {
    apiTestContext.response = response;
  });
});

When('consulto a reserva criada usando a agência {string}', (clientId) => {
  return ordersApiPage.orderDetails(apiTestContext.order.id, clientId).then((response) => {
    apiTestContext.response = response;
  });
});

When('pesquiso uma cotação de {string} para {string} com taxas informadas', (origin, destination) => {
  return getBookableQuote(origin, destination);
});

When('pesquiso uma cotação sem taxa de embarque de {string} para {string}', (origin, destination) => {
  return getBookableQuote(origin, destination).then(() => {
    apiTestContext.quote = apiTestContext.searchResponse.quotes.find(
      (quote) => quote.supplier === 'C' && quote.taxesBrl === null,
    );
    expect(apiTestContext.quote, 'cotação sem taxa do fornecedor C').to.exist;
  });
});

When('tento reservar essa cotação para a agência {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((response) => {
    apiTestContext.response = response;
  });
});

When('a cotação expira', () => ordersApiPage.expireQuote(apiTestContext.quote.id));

Then('a criação da reserva é rejeitada com HTTP 401', () => {
  expect(apiTestContext.response.status).to.equal(401);
});

Then('a listagem de reservas é rejeitada com HTTP 401', () => {
  expect(apiTestContext.response.status).to.equal(401);
});

Then('a reserva é rejeitada com HTTP 400 e mensagem explicativa', () => {
  expect(apiTestContext.response.status).to.equal(400);
  expect(apiTestContext.response.body.error.message).to.be.a('string').and.not.be.empty;
});

Then('a reserva é criada com nome e dados opcionais ausentes', () => {
  expect(apiTestContext.response.status).to.equal(201);
  expect(apiTestContext.order.passageiro.nome).to.equal(PASSENGER.nome);
  expect(apiTestContext.order.passageiro.documento).to.equal(null);
  expect(apiTestContext.order.passageiro.email).to.equal(null);
});

Then('a segunda resposta repete a mesma reserva com header de replay', () => {
  expect(apiTestContext.firstResponse.status).to.equal(201);
  expect(apiTestContext.response.status).to.equal(201);
  expect(apiTestContext.response.headers['idempotent-replay']).to.equal('true');
  expect(apiTestContext.response.body.id).to.equal(apiTestContext.firstResponse.body.id);
});

Then('a reserva é rejeitada por conflito de idempotência', () => {
  expect(apiTestContext.response.status).to.equal(409);
  expect(apiTestContext.response.body.error.code).to.equal('IDEMPOTENCY_KEY_CONFLICT');
});

Then('são criadas duas reservas diferentes', () => {
  expect(apiTestContext.firstResponse.status).to.equal(201);
  expect(apiTestContext.response.status).to.equal(201);
  expect(apiTestContext.firstResponse.body.id).not.to.equal(apiTestContext.secondOrder.id);
});

Then('Alfa Turismo e Beta Viagens estão disponíveis', () => {
  expect(apiTestContext.clients).to.deep.include({ id: 'alfa-turismo', name: 'Alfa Turismo' });
  expect(apiTestContext.clients).to.deep.include({ id: 'beta-viagens', name: 'Beta Viagens' });
});

Then('a lista da Beta não contém a reserva da Alfa', () => {
  expect(apiTestContext.response.status).to.equal(200);
  expect(apiTestContext.response.body.orders.map((order) => order.id))
    .not.to.include(apiTestContext.order.id);
});

Then('a consulta da reserva retorna HTTP 404', () => {
  expect(apiTestContext.response.status).to.equal(404);
});

Then('todas as taxas de serviço usam 7 por cento arredondados para cima', () => {
  const quotes = apiTestContext.searchResponse.quotes.filter((quote) => quote.taxesBrl !== null);

  expect(quotes.length).to.be.greaterThan(0);
  quotes.forEach((quote) => {
    const taxCents = Math.round(quote.taxesBrl * 100);
    const expectedFeeCents = Math.ceil(taxCents * 0.07);

    expect(Math.round(quote.serviceFeeBrl * 100)).to.equal(expectedFeeCents);
    expect(Math.round(quote.totalBrl * 100)).to.equal(taxCents + expectedFeeCents);
  });
});

Then('a cotação permanece válida por dez minutos', () => {
  const quote = apiTestContext.searchResponse.quotes[0];

  expect(quote).to.exist;

  return ordersApiPage.quoteDetails(quote.id).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body.availability).to.equal('available');
    expect(new Date(response.body.quote.expiresAt).getTime())
      .to.be.closeTo(Date.now() + 10 * 60 * 1000, 15000);
  });
});

Then('a cotação mostra indisponibilidade para reserva', () => {
  expect(apiTestContext.quote.bookable).to.equal(false);
  expect(apiTestContext.quote.taxesBrl).to.equal(null);
});

Then('a reserva é rejeitada porque a cotação não permite reserva', () => {
  expect(apiTestContext.response.status).to.equal(422);
  expect(apiTestContext.response.body.error.code).to.equal('QUOTE_NOT_BOOKABLE');
});

Then('a reserva é rejeitada porque a cotação expirou', () => {
  expect(apiTestContext.response.status).to.equal(410);
  expect(apiTestContext.response.body.error.code).to.equal('QUOTE_EXPIRED');
});

When('reservo a cotação para a agência {string}', (clientId) => {
  apiTestContext.orderRequest = orderBody(apiTestContext.quote.id);

  return ordersApiPage.createOrder(apiTestContext.orderRequest, clientId).then((response) => {
    apiTestContext.response = response;
    apiTestContext.order = response.body;
  });
});

When('reservo cada trecho para a agência {string}', (clientId) => {
  const outboundRequest = orderBody(apiTestContext.outboundQuote.id, 'Passageiro Ida');

  return ordersApiPage.createOrder(outboundRequest, clientId).then((outbound) => {
    apiTestContext.outboundOrder = outbound.body;
    const returnRequest = orderBody(apiTestContext.returnQuote.id, 'Passageiro Volta');

    return ordersApiPage.createOrder(returnRequest, clientId).then((response) => {
      apiTestContext.response = response;
      apiTestContext.returnOrder = response.body;
    });
  });
});

Then('a reserva preserva milhas, embarque, serviço e total da cotação', () => {
  expect(apiTestContext.response.status).to.equal(201);
  expect(apiTestContext.order.total.miles).to.equal(apiTestContext.quote.miles);
  expect(apiTestContext.order.total.taxesBrl).to.equal(apiTestContext.quote.taxesBrl);
  expect(apiTestContext.order.total.serviceFeeBrl).to.equal(apiTestContext.quote.serviceFeeBrl);
  expect(apiTestContext.order.total.totalBrl).to.equal(apiTestContext.quote.totalBrl);
});

Then('existem duas reservas para os trechos em direções opostas', () => {
  expect(apiTestContext.response.status).to.equal(201);
  expect(apiTestContext.outboundOrder.trecho).to.include({ origin: 'GRU', destination: 'GIG' });
  expect(apiTestContext.returnOrder.trecho).to.include({ origin: 'GIG', destination: 'GRU' });
  expect(apiTestContext.outboundOrder.id).not.to.equal(apiTestContext.returnOrder.id);
});