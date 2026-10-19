const COMMAND_TIMEOUT = 10000;
const SEARCH_RESULT_TIMEOUT = 20000;

class SearchPage {
  elements = {
    campoOrigem: () => cy.contains('label', 'Origem', { timeout: COMMAND_TIMEOUT }).find('select'),
    campoDestino: () => cy.contains('label', 'Destino', { timeout: COMMAND_TIMEOUT }).find('select'),
    btnBuscarPassagens: () => cy.contains('button', 'Buscar passagens', { timeout: COMMAND_TIMEOUT }),
    ofertasDeParceiros: () => cy.contains('via parceiro'),
    textoSemOferta: () => cy.contains('Nenhuma oferta encontrada'),
    campoIda: () => cy.get('section[aria-label="Ida"]'),
    campoVolta: () => cy.get('section[aria-label="Volta"]'),
    selecionarSomenteIda: () => cy.contains('label', 'Somente ida', { timeout: COMMAND_TIMEOUT }),
    selecionarIdaEVolta: () => cy.contains('label', 'Ida e volta', { timeout: COMMAND_TIMEOUT }),
    btnReservaConfirmada: () => cy.contains('Reserva confirmada', { timeout: COMMAND_TIMEOUT }),
    btnConfirmarReserva: () => cy.contains('button', 'Confirmar reserva', { timeout: COMMAND_TIMEOUT }),
    txtPodeHaverMaisOpcoesParaEstaData: () => cy.contains('Pode haver mais opções para esta data', { timeout: SEARCH_RESULT_TIMEOUT }),
    txtNenhumaOfertaDisponivelAgora: () => cy.contains('Nenhuma oferta disponível agora', { timeout: SEARCH_RESULT_TIMEOUT }),
    txtDataVoltaAnteriorIda: () => cy.contains('A data de volta não pode ser anterior à data de ida.', { timeout: COMMAND_TIMEOUT })
  };

  selecionarTipoDeViagem(tipoViagem) {
    switch(tipoViagem) {
      case 'Ida e volta':
        this.elements.selecionarIdaEVolta().find('input[type="radio"]').check({ force: true });
        break;
      case 'Somente ida':
        this.elements.selecionarSomenteIda().find('input[type="radio"]').check({ force: true });
        break;
      default:
        throw new Error(`Tipo de viagem inválido: ${tipoViagem}`);
    }
  }

  selecionarOrigemEDestino(origem, destino) {
    this.elements.campoOrigem().select(origem, {force: true});
    this.elements.campoDestino().select(destino, {force: true});
  }

  clicarNoBotaoBuscarPassagens() {
    this.elements.btnBuscarPassagens().click();
  }

  selecionarDataFutura(rotulo, diasAFrente) {
    this.selecionarData(rotulo, diasAFrente);
  }

  selecionarData(rotulo, diasAFrente) {
    const data = new Date();

    data.setDate(data.getDate() + diasAFrente);

    const iso = [
      data.getFullYear(),
      String(data.getMonth() + 1).padStart(2, '0'),
      String(data.getDate()).padStart(2, '0'),
    ].join('-');

    cy.get(`#rotulo-${rotulo}`, { timeout: COMMAND_TIMEOUT }).parent().find('button').click();
    cy.get('[role="dialog"] button[aria-pressed="true"]', { timeout: COMMAND_TIMEOUT })
      .invoke('attr', 'data-dia').then((selectedDate) => {
      const selectedMonth = selectedDate.slice(0, 7);
      const targetMonth = iso.slice(0, 7);

      if (targetMonth < selectedMonth) {
        cy.get('[role="dialog"] button[aria-label="Mês anterior"]').click();
      } else if (targetMonth > selectedMonth) {
        cy.get('[role="dialog"] button[aria-label="Próximo mês"]').click();
      }
    });
    cy.get(`[data-dia="${iso}"]`).click();
  }

  selecionarIdaEVolta() {
    cy.contains('label', 'Ida e volta')
      .find('input[type="radio"]')
      .check({ force: true });
  }

  validarOfertasDeParceiros() {
    this.elements.ofertasDeParceiros().should('be.visible');
  }

  assertSupportedAirportsAvailable() {
    const airports = ['GRU', 'GIG', 'BSB', 'SSA', 'REC', 'POA', 'CNF', 'FOR'];

    [this.elements.campoOrigem(), this.elements.campoDestino()].forEach((select) => {
      select.find('option').then(($options) => {
        const available = [...$options]
          .map((option) => option.value)
          .filter(Boolean);

        expect(available).to.deep.equal(airports);
      });
    });
  }

  validarQueOrigemSelecionadaNaoPodeSerEscolhidaComoDestino() {
    this.elements.campoOrigem().invoke('val').then((origin) => {
      this.elements.campoDestino()
        .find(`option[value="${origin}"]`)
        .should('be.disabled');
    });
  }

  validarDatasAnterioresAHojeNaoPodemSerSelecionadas() {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    cy.get('#rotulo-ida').parent().find('button').click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label="Mês anterior"]').should('be.disabled');
      cy.get(`[data-dia="${today}"]`).should('not.be.disabled');
      cy.get('[data-dia]').each(($day) => {
        if ($day.attr('data-dia') < today) {
          cy.wrap($day).should('be.disabled');
        }
      });
    });
  }

  validarResultadosSeparadosParaIdaEVolta() {
    this.elements.campoIda().should('be.visible');
    this.elements.campoVolta().should('be.visible');
  }

  assertPartialResultsNotice() {
    //this.elements.txtPodeHaverMaisOpcoesParaEstaData().should('be.visible');
    this.elements.txtNenhumaOfertaDisponivelAgora().should('exist');
  }

  validarMensagemNenhumaOfertaDisponivel() {
    this.elements.txtNenhumaOfertaDisponivelAgora().should('be.visible');
  }

  validarOfertaNaoReservavelTaxaFaltando() {
    cy.contains('li', 'via parceiro C', { timeout: SEARCH_RESULT_TIMEOUT }).within(() => {
      cy.contains('taxa não informada').should('be.visible');
      cy.get('[aria-disabled="true"]').contains('Reservar').should('be.visible');
      //cy.get('a').contains('Reservar').should('not.exist');
    });
  }

  validarRetornoDeDataDeValidacao() {
    this.elements.txtDataVoltaAnteriorIda().should('be.visible');
    this.elements.btnBuscarPassagens().should('be.disabled');
  }

  clicarNoBotaoConfirmarReserva() {
    this.elements.btnConfirmarReserva().click();
  }

  validarPaginaDeConfirmacaoDaCompra() {
    this.elements.btnReservaConfirmada().should('be.visible');
  }
}

export default new SearchPage();
