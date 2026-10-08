import type { QuoteResponse, SearchResponse } from './search-response.types';

export interface StreamQuote extends QuoteResponse {
  supplierIndex: number;
}

export interface OfertasEvent {
  quotes: StreamQuote[];
}

export interface ProgressoEvent {
  concluidos: number;
  total: number;
}

export type DoneEvent = SearchResponse;

export interface SearchProgress {
  quotes: StreamQuote[];
  concluidos: number;
  total: number;
}

export type OnSearchProgress = (progress: SearchProgress) => void;
