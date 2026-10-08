import type { Agencia } from './cliente';
import type {
  CreateOrderRequest,
  OrderResponse,
  QuoteDetail,
  SearchQuery,
  SearchResponse,
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const CLIENT_TIMEOUT_MS = 8000;

const ORDER_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly code: string;

  constructor(message: string, code = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}

export interface SearchOutcome {
  response: SearchResponse;
  unavailable: boolean;
}

export async function search(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<SearchOutcome> {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;

  try {
    response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(query),
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(`falha de rede em ${API_URL}/search`, 'NETWORK');
  }

  if (response.status === 503) {
    return { response: (await response.json()) as SearchResponse, unavailable: true };
  }

  if (!response.ok) {
    throw await toApiError(response, 'POST /search');
  }

  return { response: (await response.json()) as SearchResponse, unavailable: false };
}

export async function buscarCotacao(
  quoteId: string,
  signal?: AbortSignal,
): Promise<QuoteDetail> {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;

  try {
    response = await fetch(`${API_URL}/quotes/${encodeURIComponent(quoteId)}`, {
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(`falha de rede em ${API_URL}/quotes`, 'NETWORK');
  }

  if (!response.ok) {
    throw await toApiError(response, `GET /quotes/${quoteId}`);
  }

  return (await response.json()) as QuoteDetail;
}

export async function listarAgencias(signal?: AbortSignal): Promise<Agencia[]> {
  const response = await chamar(`${API_URL}/clients`, { signal }, 'GET /clients');

  return ((await response.json()) as { clients: Agencia[] }).clients;
}

export async function buscarReservas(
  agencia: string,
  signal?: AbortSignal,
): Promise<OrderResponse[]> {
  const response = await chamar(
    `${API_URL}/orders`,
    { headers: { 'x-client-id': agencia }, signal },
    'GET /orders',
  );

  return ((await response.json()) as { orders: OrderResponse[] }).orders;
}

export async function buscarReserva(
  agencia: string,
  id: string,
  signal?: AbortSignal,
): Promise<OrderResponse> {
  const response = await chamar(
    `${API_URL}/orders/${encodeURIComponent(id)}`,
    { headers: { 'x-client-id': agencia }, signal },
    `GET /orders/${id}`,
  );

  return (await response.json()) as OrderResponse;
}

async function chamar(url: string, init: RequestInit, contexto: string): Promise<Response> {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;

  let response: Response;

  try {
    response = await fetch(url, { ...init, signal });
  } catch (error) {
    if (init.signal?.aborted) {
      throw error;
    }

    throw new ApiError(`falha de rede em ${url}`, 'NETWORK');
  }

  if (!response.ok) {
    throw await toApiError(response, contexto);
  }

  return response;
}

export interface BookingOutcome {
  order: OrderResponse;
  replay: boolean;
}

export async function criarReserva(
  agencia: string,
  payload: CreateOrderRequest,
  signal?: AbortSignal,
): Promise<BookingOutcome> {
  const timeout = AbortSignal.timeout(ORDER_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;

  try {
    response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-client-id': agencia },
      body: JSON.stringify(payload),
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(`falha de rede em ${API_URL}/orders`, 'NETWORK');
  }

  if (!response.ok) {
    throw await toApiError(response, 'POST /orders');
  }

  return {
    order: (await response.json()) as OrderResponse,
    replay: response.headers.get('idempotent-replay') === 'true',
  };
}

async function toApiError(response: Response, contexto: string): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: { message: string }[] };
  } | null;

  const detalhes = body?.error?.details?.map((detail) => detail.message).join('; ');

  return new ApiError(
    `${contexto}: ${detalhes || body?.error?.message || `HTTP ${response.status}`}`,
    body?.error?.code ?? 'UNKNOWN',
  );
}

export function novaChaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const aleatorio = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0'),
  ).join('');

  return `k-${Date.now().toString(16)}-${aleatorio}`;
}

export function formatMiles(miles: number): string {
  return miles.toLocaleString('pt-BR');
}

export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function secondsSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}
