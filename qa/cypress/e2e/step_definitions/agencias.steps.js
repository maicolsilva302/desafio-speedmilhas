import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import agenciasPage from '../../pages/AgenciasPage';

Then('as agências Alfa Turismo e Beta Viagens estão disponíveis no topo', () => {
  agenciasPage.validarAgenciasRegistradas();
});

When('seleciono a agência {string}', (nomeAgencia) => {
  agenciasPage.selecionarAgencia(nomeAgencia);
});

Then('valido que a agência {string} fica selecionada', (nomeAgencia) => {
  agenciasPage.validarAgenciaSelecionada(nomeAgencia);
});