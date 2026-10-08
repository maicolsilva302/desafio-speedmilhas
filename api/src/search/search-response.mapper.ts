import type { Prisma, Quote, Search, SupplierRun } from '../generated/prisma/client';
import { priceOf } from '../pricing/service-fee';
import type { SupplierCode } from '../suppliers/supplier.types';
import type {
  QuoteResponse,
  SearchResponse,
  SearchResultStatus,
  SupplierResultResponse,
  SupplierResultStatus,
} from './dto/search-response.types';
import type { StreamQuote } from './dto/search-stream.types';

const SUPPLIER_NAMES: Record<SupplierCode, string> = {
  A: 'Fornecedor A',
  B: 'Fornecedor B',
  C: 'Fornecedor C',
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

export function toQuoteResponse(quote: Quote): QuoteResponse {
  const taxesBrl = decimalToNumber(quote.taxesBrl);
  const pricing = taxesBrl === null ? null : priceOf(taxesBrl);

  return {
    id: quote.id,
    supplier: quote.supplier as SupplierCode,
    carrier: quote.carrier,
    carrierCode: quote.carrierCode,
    miles: quote.miles,
    taxesBrl,
    serviceFeeBrl: pricing?.serviceFeeBrl ?? null,
    totalBrl: pricing?.totalBrl ?? null,
    currency: quote.currency,
    bookable: quote.bookable,
    expiresAt: quote.expiresAt.toISOString(),
  };
}

export function toStreamQuote(quote: Quote): StreamQuote {
  return { ...toQuoteResponse(quote), supplierIndex: quote.supplierIndex };
}

function toSupplierResponse(run: SupplierRun): SupplierResultResponse {
  return {
    code: run.supplier as SupplierCode,
    name: SUPPLIER_NAMES[run.supplier as SupplierCode],
    status: run.status.toLowerCase() as SupplierResultStatus,
    quotes: run.itemsKept,
    discarded: run.itemsRaw - run.itemsKept,
    elapsedMs: run.elapsedMs,
    attempts: run.attempts,
    message: run.message,
  };
}

function compareQuotes(a: Quote, b: Quote): number {
  if (a.miles !== b.miles) {
    return a.miles - b.miles;
  }

  const taxA = a.taxesBrl === null ? Number.POSITIVE_INFINITY : Number(a.taxesBrl);
  const taxB = b.taxesBrl === null ? Number.POSITIVE_INFINITY : Number(b.taxesBrl);

  if (taxA !== taxB) {
    return taxA - taxB;
  }

  if (a.supplier !== b.supplier) {
    return a.supplier.localeCompare(b.supplier);
  }

  return a.supplierIndex - b.supplierIndex;
}

export function sortQuotes(quotes: Quote[]): Quote[] {
  return [...quotes].sort(compareQuotes);
}

export function toSearchResponse(
  search: Search,
  quotes: Quote[],
  runs: SupplierRun[],
  options: { cached: boolean },
): SearchResponse {
  return {
    searchId: search.id,
    query: {
      origin: search.origin,
      destination: search.destination,
      date: search.departureDate,
    },
    status: search.status.toLowerCase() as SearchResultStatus,
    cached: options.cached,
    cachedAt: options.cached ? search.createdAt.toISOString() : null,
    elapsedMs: search.elapsedMs,
    quotes: sortQuotes(quotes).map(toQuoteResponse),
    suppliers: [...runs]
      .sort((a, b) => a.supplier.localeCompare(b.supplier))
      .map(toSupplierResponse),
  };
}
