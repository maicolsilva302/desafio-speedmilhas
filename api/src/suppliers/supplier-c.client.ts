import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { toMoney, toPositiveInt } from '../common/coercion';
import { env } from '../common/config/env';
import { carrierFromIata } from './carriers';
import { HttpSupplierClient } from './http-supplier.client';
import type { NormalizedPayload, NormalizedQuote, SearchQuery, SupplierCode } from './supplier.types';

const envelopeSchema = z.object({ data: z.array(z.unknown()) });

@Injectable()
export class SupplierCClient extends HttpSupplierClient {
  readonly code: SupplierCode = 'C';
  readonly displayName = 'Fornecedor C';

  protected readonly perAttemptTimeoutMs = env.SUPPLIER_C_TIMEOUT_MS;
  protected readonly maxAttempts = 1;
  protected readonly errorKey = 'message';

  protected buildRequest(query: SearchQuery): { url: string; init: RequestInit } {
    return {
      url: `${env.SUPPLIERS_BASE_URL}/supplier-c/v2/quotes`,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          origin: query.origin,
          destination: query.destination,
          date: query.date,
        }),
      },
    };
  }

  protected normalize(payload: unknown): NormalizedPayload {
    const envelope = envelopeSchema.safeParse(payload);

    if (!envelope.success) {
      return { quotes: [], itemsRaw: 0, itemsDropped: 0 };
    }

    const items = envelope.data.data;
    const quotes: NormalizedQuote[] = [];
    let itemsDropped = 0;

    items.forEach((raw, index) => {
      const item = raw as Record<string, unknown> | null;

      const miles = toPositiveInt(item?.price_miles);
      const carrier = carrierFromIata(item?.airline_code);

      if (miles === null || carrier === null) {
        itemsDropped += 1;
        return;
      }

      quotes.push({
        supplier: this.code,
        carrier: carrier.name,
        carrierCode: carrier.iata,
        miles,
        taxesBrl: toMoney(item?.fee),
        supplierIndex: index,
      });
    });

    return { quotes, itemsRaw: items.length, itemsDropped };
  }
}
