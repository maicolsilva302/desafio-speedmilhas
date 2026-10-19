import { After, Given } from '@badeball/cypress-cucumber-preprocessor';

import searchApiPage from '../../pages/SearchApiPage';

After(() => searchApiPage.resetSuppliers());

Given('os mocks dos fornecedores estão resetados', () => searchApiPage.resetSuppliers());

Given('o fornecedor {string} está configurado para falhar', (supplier) =>
  searchApiPage.forceSupplierFailure(supplier),
);

Given('o fornecedor {string} está configurado para enviar taxa não informada', (supplier) =>
  searchApiPage.forceSupplierDirty(supplier, 'null'),
);

Given('todos os fornecedores estão configurados para falhar', () =>
  searchApiPage.forceSupplierFailure('a')
    .then(() => searchApiPage.forceSupplierFailure('b'))
    .then(() => searchApiPage.forceSupplierFailure('c')),
);