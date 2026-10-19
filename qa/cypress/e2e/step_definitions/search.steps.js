import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import pesquisaPage from '../../pages/SearchPage';

Given('acesso a página de busca', () => {
  cy.acessarPaginaDeBusca();
});

When("seleciono a opção de viagem {string}", (tipoViagem) => {
  pesquisaPage.selecionarTipoDeViagem(tipoViagem);
});

When('seleciono a origem {string} e o destino {string}', (origem, destino) => {
  pesquisaPage.selecionarOrigemEDestino(origem, destino);
});

When('clico no botão Buscar passagens', () => {
  pesquisaPage.clicarNoBotaoBuscarPassagens();
});

Then('visualizo as ofertas dos parceiros', () => {
  pesquisaPage.validarOfertasDeParceiros();
});

Then('os aeroportos atendidos estão disponíveis para origem e destino', () => {
  pesquisaPage.assertSupportedAirportsAvailable();
});

Then('a origem selecionada não pode ser escolhida como destino', () => {
  pesquisaPage.validarQueOrigemSelecionadaNaoPodeSerEscolhidaComoDestino();
});

Then('valido que as datas anteriores a hoje não podem ser selecionadas', () => {
  pesquisaPage.validarDatasAnterioresAHojeNaoPodemSerSelecionadas();
});

When('seleciono ida e volta com datas futuras válidas', () => {
  pesquisaPage.selecionarIdaEVolta();
  pesquisaPage.selecionarDataFutura('ida', 1);
  pesquisaPage.selecionarDataFutura('volta', 2);
});

When('seleciono ida e volta com data de volta anterior à ida', () => {
  pesquisaPage.selecionarIdaEVolta();
  pesquisaPage.selecionarData('ida', 4);
  pesquisaPage.selecionarData('volta', 2);
});

Then('valido os resultados separados para ida e volta', () => {
  pesquisaPage.validarResultadosSeparadosParaIdaEVolta();
});

Then('valido as ofertas parciais e o aviso de mais opções', () => {
  pesquisaPage.validarOfertasDeParceiros();
  pesquisaPage.assertPartialResultsNotice();
});

Then('valido a mensagem de nenhuma oferta disponível', () => {
  pesquisaPage.validarMensagemNenhumaOfertaDisponivel();
});

Then('valido que a oferta do fornecedor C mostra taxa não informada e não pode ser reservada', () => {
  pesquisaPage.validarOfertaNaoReservavelTaxaFaltando();
});

Then('valido a validação da data de volta e não posso pesquisar', () => {
  pesquisaPage.validarRetornoDeDataDeValidacao();
});

When('clico no botão Confirmar reserva', () => {
  pesquisaPage.clicarNoBotaoConfirmarReserva();
});

Then('visualizo a página de Confirmação da compra', () => {
  pesquisaPage.validarPaginaDeConfirmacaoDaCompra();
});
