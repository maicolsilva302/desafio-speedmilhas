import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { toMoney, toPositiveInt } from '../common/coercion';
import { env } from '../common/config/env';
import { carrierFromName } from './carriers';
import { HttpSupplierClient } from './http-supplier.client';
import type { NormalizedPayload, NormalizedQuote, SearchQuery, SupplierCode } from './supplier.types';

const envelopeSchema = z.object({ dados: z.array(z.unknown()) });

@Injectable()
export class SupplierBClient extends HttpSupplierClient {
  readonly code: SupplierCode = 'B';
  readonly displayName = 'Fornecedor B';

  protected readonly perAttemptTimeoutMs = env.SUPPLIER_B_TIMEOUT_MS;
  protected readonly maxAttempts = 1;
  protected readonly errorKey = 'erro';

  protected buildRequest(query: SearchQuery): { url: string; init: RequestInit } {
    const params = new URLSearchParams({
      from: query.origin,
      to: query.destination,
      day: query.date,
    });

    return {
      url: `${env.SUPPLIERS_BASE_URL}/supplier-b/search?${params.toString()}`,
      init: { method: 'GET', headers: { accept: 'application/json' } },
    };
  }

  protected normalize(payload: unknown): NormalizedPayload {
    const envelope = envelopeSchema.safeParse(payload);

    if (!envelope.success) {
      return { quotes: [], itemsRaw: 0, itemsDropped: 0 };
    }

    const items = envelope.data.dados;
    const quotes: NormalizedQuote[] = [];
    let itemsDropped = 0;

    items.forEach((raw, index) => {
      const item = raw as Record<string, unknown> | null;
      const miles = toPositiveInt(item?.pontos);
      const carrier = carrierFromName(item?.cia);

      if (miles === null || carrier === null) {
        itemsDropped += 1;
        return;
      }

      const taxa = item?.taxa as Record<string, unknown> | null | undefined;

      quotes.push({
        supplier: this.code,
        carrier: carrier.name,
        carrierCode: carrier.iata,
        miles,
        taxesBrl: toMoney(taxa?.valor),
        supplierIndex: index,
      });
    });

    return { quotes, itemsRaw: items.length, itemsDropped };
  }
}
