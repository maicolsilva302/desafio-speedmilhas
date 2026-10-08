import { Logger } from '@nestjs/common';

import type {
  NormalizedPayload,
  SearchQuery,
  SupplierClient,
  SupplierCode,
  SupplierFailureReason,
  SupplierOutcome,
} from './supplier.types';

interface AttemptFailure {
  reason: SupplierFailureReason;
  httpStatus: number | null;
  message: string;
}

type AttemptResult = { ok: true; payload: NormalizedPayload } | ({ ok: false } & AttemptFailure);

export abstract class HttpSupplierClient implements SupplierClient {
  abstract readonly code: SupplierCode;
  abstract readonly displayName: string;

  protected abstract readonly perAttemptTimeoutMs: number;
  protected abstract readonly maxAttempts: number;

  protected abstract readonly errorKey: string;

  protected abstract buildRequest(query: SearchQuery): { url: string; init: RequestInit };

  protected abstract normalize(payload: unknown): NormalizedPayload;

  protected readonly logger = new Logger(this.constructor.name);

  async fetchQuotes(query: SearchQuery, deadlineAt: number): Promise<SupplierOutcome> {
    const startedAt = Date.now();
    let attempts = 0;
    let lastFailure: AttemptFailure = {
      reason: 'timeout',
      httpStatus: null,
      message: 'Sem tempo no orçamento da busca',
    };

    while (attempts < this.maxAttempts) {
      const effectiveTimeoutMs = this.perAttemptTimeoutMs;

      if (effectiveTimeoutMs <= 0) {
        break;
      }

      attempts += 1;
      const result = await this.attempt(query, effectiveTimeoutMs);

      if (result.ok) {
        const { payload } = result;

        return {
          kind: 'ok',
          supplier: this.code,
          quotes: payload.quotes,
          itemsRaw: payload.itemsRaw,
          itemsDropped: payload.itemsDropped,
          elapsedMs: Date.now() - startedAt,
          attempts,
        };
      }

      lastFailure = result;

      if (!this.shouldRetry(result.reason)) {
        break;
      }

      if (deadlineAt - Date.now() <= this.perAttemptTimeoutMs) {
        break;
      }
    }

    return {
      kind: 'fail',
      supplier: this.code,
      reason: lastFailure.reason,
      httpStatus: lastFailure.httpStatus,
      message: lastFailure.message,
      elapsedMs: Date.now() - startedAt,
      attempts,
    };
  }

  private shouldRetry(reason: SupplierFailureReason): boolean {
    return reason === 'error' || reason === 'timeout';
  }

  private async attempt(query: SearchQuery, timeoutMs: number): Promise<AttemptResult> {
    const { url, init } = this.buildRequest(query);

    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

      if (!response.ok) {
        return {
          ok: false,
          reason: response.status === 429 ? 'rate_limited' : 'error',
          httpStatus: response.status,
          message: await this.extractErrorMessage(response),
        };
      }

      const payload: unknown = await response.json();

      return { ok: true, payload: this.normalize(payload) };
    } catch (error) {
      return { ok: false, ...this.classifyError(error, timeoutMs) };
    }
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const body: unknown = await response.json();

      if (typeof body === 'object' && body !== null) {
        const value = (body as Record<string, unknown>)[this.errorKey];

        if (typeof value === 'string' && value.trim() !== '') {
          return value;
        }
      }
    } catch {
    }

    return response.status === 429
      ? 'Limite de requisições excedido'
      : `Respondeu HTTP ${response.status}`;
  }

  private classifyError(error: unknown, timeoutMs: number): AttemptFailure {
    const name = this.readStringProperty(error, 'name');

    if (name === 'TimeoutError' || name === 'AbortError') {
      return {
        reason: 'timeout',
        httpStatus: null,
        message: `Não respondeu em ${timeoutMs}ms`,
      };
    }

    if (name === 'SyntaxError') {
      return { reason: 'malformed', httpStatus: null, message: 'Resposta não era JSON válido' };
    }

    return {
      reason: 'error',
      httpStatus: null,
      message: this.readStringProperty(error, 'message') || 'Falha de rede',
    };
  }

  private readStringProperty(value: unknown, property: string): string {
    if (typeof value !== 'object' || value === null || !(property in value)) {
      return '';
    }

    const found = (value as Record<string, unknown>)[property];

    return typeof found === 'string' ? found : '';
  }
}
