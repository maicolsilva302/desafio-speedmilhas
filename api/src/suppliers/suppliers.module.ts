import { Module } from '@nestjs/common';

import { SupplierAClient } from './supplier-a.client';
import { SupplierBClient } from './supplier-b.client';
import { SupplierCClient } from './supplier-c.client';
import { SUPPLIER_CLIENTS } from './supplier.tokens';
import type { SupplierClient } from './supplier.types';

@Module({
  providers: [
    SupplierAClient,
    SupplierBClient,
    SupplierCClient,
    {
      provide: SUPPLIER_CLIENTS,
      useFactory: (...clients: SupplierClient[]): SupplierClient[] => clients,
      inject: [SupplierAClient, SupplierBClient, SupplierCClient],
    },
  ],
  exports: [SUPPLIER_CLIENTS],
})
export class SuppliersModule {}
