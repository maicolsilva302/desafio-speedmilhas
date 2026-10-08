import type { QuoteResponse } from './search-response.types';

export type QuoteAvailability =
  | 'available'
  | 'expired'
  | 'not_bookable';

export interface QuoteDetailResponse {
  quote: QuoteResponse;
  query: { origin: string; destination: string; date: string };
  availability: QuoteAvailability;
}
