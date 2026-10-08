export type SupplierCode = 'A' | 'B' | 'C';

export type SearchResultStatus = 'complete' | 'partial' | 'unavailable';

export type SupplierResultStatus = 'ok' | 'empty' | 'timeout' | 'error' | 'rate_limited';

export interface Quote {
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

export interface SupplierResult {
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
  quotes: Quote[];
  suppliers: SupplierResult[];
}

export interface StreamQuote extends Quote {
  supplierIndex: number;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
}

export interface Pedido {
  ida: SearchQuery;
  volta: SearchQuery | null;
}

export type QuoteAvailability =
  | 'available'
  | 'expired'
  | 'not_bookable';

export interface QuoteDetail {
  quote: Quote;
  query: SearchQuery;
  availability: QuoteAvailability;
}

export interface Passageiro {
  nome: string;
  documento: string;
  documentoTipo?: 'cpf' | 'passaporte';
  email?: string;
}

export interface CreateOrderRequest {
  quoteId: string;
  passageiro: Passageiro;
  idempotencyKey: string;
}

export interface OrderResponse {
  id: string;
  status: string;
  idempotencyKey: string;
  clientId: string;
  createdAt: string;
  passageiro: {
    nome: string;
    documento: string | null;
    documentoTipo: string | null;
    email: string | null;
  };
  quote: {
    id: string;
    supplier: SupplierCode;
    carrier: string;
    carrierCode: string | null;
  };
  trecho: { origin: string; destination: string; date: string };
  total: {
    miles: number;
    taxesBrl: number;
    serviceFeeBrl: number;
    totalBrl: number;
    currency: string;
  };
}

export type SearchUiState =
  | { kind: 'idle' }
  | {
      kind: 'buscando';
      query: SearchQuery;
      startedAt: number;
      parciais: StreamQuote[];
      concluidos: number;
      total: number;
      anterior: SearchResponse | null;
    }
  | { kind: 'pronto'; result: SearchResponse }
  | { kind: 'indisponivel'; query: SearchQuery; code: string };
