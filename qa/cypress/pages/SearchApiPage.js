const API_URL = 'http://localhost:3000';
const MOCK_URL = 'http://localhost:4000';

class SearchApiPage {
  resetSuppliers() {
    return cy.request('POST', `${MOCK_URL}/admin/reset`);
  }

  forceSupplierFailure(supplier) {
    return cy.request('POST', `${MOCK_URL}/admin/force-fail/${supplier}`);
  }

  forceSupplierSlow(supplier) {
    return cy.request('POST', `${MOCK_URL}/admin/force-slow/${supplier}`);
  }

  forceSupplierDirty(supplier, mode) {
    return cy.request('POST', `${MOCK_URL}/admin/force-dirty/${supplier}?mode=${mode}`);
  }

  supplierStats() {
    return cy.request(`${MOCK_URL}/admin/stats`);
  }

  search(query) {
    return cy.request({
      method: 'POST',
      url: `${API_URL}/search`,
      body: query,
      failOnStatusCode: false,
      timeout: 30000,
    });
  }

  streamSearch(query) {
    return cy.request({
      method: 'GET',
      url: `${API_URL}/search/stream`,
      qs: query,
      failOnStatusCode: false,
      timeout: 30000,
    });
  }

  quoteDetails(quoteId) {
    return cy.request({
      url: `${API_URL}/quotes/${quoteId}`,
      failOnStatusCode: false,
    });
  }
}

export default new SearchApiPage();