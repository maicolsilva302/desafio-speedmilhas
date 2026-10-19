const API_URL = 'http://localhost:3000';

class OrdersApiPage {
  listClients() {
    return cy.request(`${API_URL}/clients`);
  }

  createOrder(body, clientId) {
    const request = {
      method: 'POST',
      url: `${API_URL}/orders`,
      body,
      failOnStatusCode: false,
    };

    if (clientId) {
      request.headers = { 'x-client-id': clientId };
    }

    return cy.request(request);
  }

  listOrders(clientId) {
    const request = {
      url: `${API_URL}/orders`,
      failOnStatusCode: false,
    };

    if (clientId) {
      request.headers = { 'x-client-id': clientId };
    }

    return cy.request(request);
  }

  orderDetails(orderId, clientId) {
    return cy.request({
      url: `${API_URL}/orders/${orderId}`,
      headers: { 'x-client-id': clientId },
      failOnStatusCode: false,
    });
  }

  quoteDetails(quoteId) {
    return cy.request({
      url: `${API_URL}/quotes/${quoteId}`,
      failOnStatusCode: false,
    });
  }

  expireQuote(quoteId) {
    const sql = `UPDATE "Quote" SET "expiresAt" = NOW() - INTERVAL '1 minute' WHERE id = '${quoteId}';`;
    const encodedSql = btoa(sql);
    const projectRoot = Cypress.config('projectRoot');
    const composeFile = /[\\/]qa$/.test(projectRoot)
      ? '../docker-compose.yml'
      : 'docker-compose.yml';

    return cy.exec(
      `docker compose -f ${composeFile} exec -T postgres sh -c "echo ${encodedSql} | base64 -d | psql -U speedmilhas -d speedmilhas"`,
      { failOnNonZeroExit: true },
    );
  }
}

export default new OrdersApiPage();
