import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import minhasReserasPage from '../../pages/MinhasReservasPage';

When('clico no botão Minhas Reservas', () => {
    minhasReserasPage.clicarNoBotaoMinhasReservas();
});

Then('visualizo a página de Minhas Reservas', () => {
    minhasReserasPage.validarPaginaMinhasReservas();
});

When('clico no botão Ver detalhes de uma reserva', () => {
    minhasReserasPage.clicarNoBotaoVerDetalhesDeUmaReserva();
});

Then('visualizo a página de Detalhes da reserva', () => {
    minhasReserasPage.validarPaginaDetalhesDaReserva();
});