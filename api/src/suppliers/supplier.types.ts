export type SupplierCode = 'A' | 'B' | 'C';

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
}

export interface NormalizedQuote {
  supplier: SupplierCode;
  carrier: string;
  carrierCode: string | null;
  miles: number;
  taxesBrl: number | null;
  supplierIndex: number;
}

export type SupplierFailureReason = 'timeout' | 'error' | 'rate_limited' | 'malformed';

export type SupplierOutcome =
  | {
      kind: 'ok';
      supplier: SupplierCode;
      quotes: NormalizedQuote[];
      itemsRaw: number;
      itemsDropped: number;
      elapsedMs: number;
      attempts: number;
    }
  | {
      kind: 'fail';
      supplier: SupplierCode;
      reason: SupplierFailureReason;
      httpStatus: number | null;
      message: string;
      elapsedMs: number;
      attempts: number;
    };

export interface SupplierClient {
  readonly code: SupplierCode;
  readonly displayName: string;

  fetchQuotes(query: SearchQuery, deadlineAt: number): Promise<SupplierOutcome>;
}

export interface NormalizedPayload {
  quotes: NormalizedQuote[];
  itemsRaw: number;
  itemsDropped: number;
}
