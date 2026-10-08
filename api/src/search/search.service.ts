import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { env } from '../common/config/env';
import type { Prisma, Quote, Search, SupplierRun } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SUPPLIER_CLIENTS } from '../suppliers/supplier.tokens';
import type {
  SearchQuery,
  SupplierClient,
  SupplierOutcome,
} from '../suppliers/supplier.types';
import type { SearchRequest } from './dto/search-request.schema';
import type { SearchResponse } from './dto/search-response.types';
import type { OnSearchProgress } from './dto/search-stream.types';
import { sortQuotes, toSearchResponse, toStreamQuote } from './search-response.mapper';

export interface SearchResult {
  response: SearchResponse;
  unavailable: boolean;
}

type SupplierRunStatus = 'OK' | 'EMPTY' | 'TIMEOUT' | 'ERROR' | 'RATE_LIMITED';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  private readonly inFlight = new Map<string, Promise<SearchResult>>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SUPPLIER_CLIENTS) private readonly suppliers: readonly SupplierClient[],
  ) {}

  async search(request: SearchRequest, onProgress?: OnSearchProgress): Promise<SearchResult> {
    const query: SearchQuery = {
      origin: request.origin,
      destination: request.destination,
      date: request.date,
    };

    const cached = await this.readFromCache(query);

    if (cached) {
      this.logger.log(
        `${query.origin}->${query.destination} ${query.date} CACHE_HIT ` +
          `${cached.quotes.length} cotações (busca ${cached.searchId})`,
      );

      return { response: cached, unavailable: false };
    }

    const key = this.cacheKey(query);
    const running = this.inFlight.get(key);

    if (running) {
      return running;
    }

    const promise = this.runSearch(query, onProgress).finally(() =>
      this.inFlight.delete(key),
    );

    this.inFlight.set(key, promise);

    return promise;
  }

  private cacheKey(query: SearchQuery): string {
    return `${query.origin}|${query.destination}|${query.date}`;
  }

  private async readFromCache(query: SearchQuery): Promise<SearchResponse | null> {
    const hit = await this.prisma.search.findFirst({
      where: {
        origin: query.origin,
        destination: query.destination,
        departureDate: query.date,
        cacheExpiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { quotes: true, supplierRuns: true },
    });

    if (!hit) {
      return null;
    }

    return toSearchResponse(hit, hit.quotes, hit.supplierRuns, { cached: true });
  }

  private async runSearch(
    query: SearchQuery,
    onProgress?: OnSearchProgress,
  ): Promise<SearchResult> {
    const startedAt = Date.now();
    const deadlineAt = startedAt + env.SEARCH_BUDGET_MS;

    const searchId = randomUUID();
    const expiresAt = new Date(startedAt + env.QUOTE_TTL_SECONDS * 1000);

    await this.prisma.search.create({
      data: {
        id: searchId,
        origin: query.origin,
        destination: query.destination,
        departureDate: query.date,
        status: 'PARTIAL',
        elapsedMs: 0,
        cacheExpiresAt: null,
      },
    });

    let concluidos = 0;

    const outcomes = await Promise.all(
      this.suppliers.map(async (supplier) => {
        const outcome = await supplier.fetchQuotes(query, deadlineAt);

        const quotes = await this.persistOutcome(searchId, outcome, expiresAt);

        concluidos += 1;
        onProgress?.({
          quotes: sortQuotes(quotes).map(toStreamQuote),
          concluidos,
          total: this.suppliers.length,
        });

        return outcome;
      }),
    );

    const elapsedMs = Date.now() - startedAt;
    const responded = outcomes.filter((outcome) => outcome.kind === 'ok').length;
    const status = this.resolveStatus(outcomes, responded);

    const search = await this.prisma.search.update({
      where: { id: searchId },
      data: {
        status,
        elapsedMs,
        cacheExpiresAt:
          status === 'COMPLETE'
            ? new Date(Date.now() + env.SEARCH_CACHE_TTL_SECONDS * 1000)
            : null,
      },
      include: { quotes: true, supplierRuns: true },
    });

    this.logger.log(
      `${query.origin}->${query.destination} ${query.date} ${status} ` +
        `${elapsedMs}ms ${search.quotes.length} cotações ` +
        outcomes.map((o) => `${o.supplier}=${this.statusOf(o).toLowerCase()}`).join(' '),
    );

    return {
      response: toSearchResponse(search, search.quotes, search.supplierRuns, {
        cached: false,
      }),
      unavailable: status === 'UNAVAILABLE',
    };
  }

  private async persistOutcome(
    searchId: string,
    outcome: SupplierOutcome,
    expiresAt: Date,
  ): Promise<Quote[]> {
    const run: Prisma.SupplierRunCreateInput = {
      id: randomUUID(),
      search: { connect: { id: searchId } },
      supplier: outcome.supplier,
      status: this.statusOf(outcome),
      httpStatus: outcome.kind === 'fail' ? outcome.httpStatus : null,
      elapsedMs: outcome.elapsedMs,
      attempts: outcome.attempts,
      itemsRaw: outcome.kind === 'ok' ? outcome.itemsRaw : 0,
      itemsKept: outcome.kind === 'ok' ? outcome.quotes.length : 0,
      message: outcome.kind === 'fail' ? outcome.message : null,
    };

    if (outcome.kind !== 'ok' || outcome.quotes.length === 0) {
      await this.prisma.supplierRun.create({ data: run });

      return [];
    }

    const rows: Prisma.QuoteCreateManyInput[] = outcome.quotes.map((quote) => ({
      id: randomUUID(),
      searchId,
      supplier: quote.supplier,
      carrier: quote.carrier,
      carrierCode: quote.carrierCode,
      miles: quote.miles,
      taxesBrl: quote.taxesBrl,
      bookable: quote.taxesBrl !== null,
      supplierIndex: quote.supplierIndex,
      expiresAt,
    }));

    const [quotes] = await this.prisma.$transaction([
      this.prisma.quote.createManyAndReturn({ data: rows }),
      this.prisma.supplierRun.create({ data: run }),
    ]);

    return quotes;
  }

  private resolveStatus(
    outcomes: SupplierOutcome[],
    responded: number,
  ): 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' {
    if (responded === 0) {
      return 'UNAVAILABLE';
    }

    return responded === outcomes.length ? 'COMPLETE' : 'PARTIAL';
  }

  private statusOf(outcome: SupplierOutcome): SupplierRunStatus {
    if (outcome.kind === 'ok') {
      return outcome.quotes.length === 0 ? 'EMPTY' : 'OK';
    }

    switch (outcome.reason) {
      case 'timeout':
        return 'TIMEOUT';
      case 'rate_limited':
        return 'RATE_LIMITED';
      default:
        return 'ERROR';
    }
  }
}

export type PersistedSearch = Search & { quotes: Quote[]; supplierRuns: SupplierRun[] };
