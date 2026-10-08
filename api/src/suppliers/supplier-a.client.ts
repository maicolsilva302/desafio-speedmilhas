import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { toMoney, toPositiveInt } from '../common/coercion';
import { env } from '../common/config/env';
import { carrierFromName } from './carriers';
import { HttpSupplierClient } from './http-supplier.client';
import type { NormalizedPayload, NormalizedQuote, SearchQuery, SupplierCode } from './supplier.types';

const envelopeSchema = z.object({ results: z.array(z.unknown()) });

@Injectable()
export class SupplierAClient extends HttpSupplierClient {
  readonly code: SupplierCode = 'A';
  readonly displayName = 'Fornecedor A';

  protected readonly perAttemptTimeoutMs = env.SUPPLIER_A_TIMEOUT_MS;
  protected readonly maxAttempts = 2;
  protected readonly errorKey = 'error';

  protected buildRequest(query: SearchQuery): { url: string; init: RequestInit } {
    const params = new URLSearchParams({
      origin: query.origin,
      destination: query.destination,
      date: query.date,
    });

    return {
      url: `${env.SUPPLIERS_BASE_URL}/supplier-a/quotes?${params.toString()}`,
      init: { method: 'GET', headers: { accept: 'application/json' } },
    };
  }

  protected normalize(payload: unknown): NormalizedPayload {
    const envelope = envelopeSchema.safeParse(payload);

    if (!envelope.success) {
      return { quotes: [], itemsRaw: 0, itemsDropped: 0 };
    }

    const items = envelope.data.results;
    const quotes: NormalizedQuote[] = [];
    let itemsDropped = 0;

    items.forEach((raw, index) => {
      const item = raw as Record<string, unknown> | null;
      const miles = toPositiveInt(item?.miles);
      const carrier = carrierFromName(item?.carrier);

      if (miles === null || carrier === null) {
        itemsDropped += 1;
        return;
      }

      quotes.push({
        supplier: this.code,
        carrier: carrier.name,
        carrierCode: carrier.iata,
        miles,
        taxesBrl: toMoney(item?.taxes_brl),
        supplierIndex: index,
      });
    });

    return { quotes, itemsRaw: items.length, itemsDropped };
  }
}
