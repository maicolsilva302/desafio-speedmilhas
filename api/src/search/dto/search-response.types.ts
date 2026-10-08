import type { SupplierCode } from '../../suppliers/supplier.types';

export type SearchResultStatus = 'complete' | 'partial' | 'unavailable';

export type SupplierResultStatus = 'ok' | 'empty' | 'timeout' | 'error' | 'rate_limited';

export interface QuoteResponse {
  id: string;
  supplier: SupplierCode;
  carrier: string;
  carrierCode: string | null;
  miles: number;
  taxesBrl: number | null;
  serviceFeeBrl: number | null;
  totalBrl: number | null;
  currency: string;
  bookable: boolean;
  expiresAt: string;
}

export interface SupplierResultResponse {
  code: SupplierCode;
  name: string;
  status: SupplierResultStatus;
  quotes: number;
  discarded: number;
  elapsedMs: number;
  attempts: number;
  message: string | null;
}

export interface SearchResponse {
  searchId: string;
  query: { origin: string; destination: string; date: string };
  status: SearchResultStatus;
  cached: boolean;
  cachedAt: string | null;
  elapsedMs: number;
  quotes: QuoteResponse[];
  suppliers: SupplierResultResponse[];
}
