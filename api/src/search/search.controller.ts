import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  MessageEvent,
  Post,
  Query,
  Res,
  Sse,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';

import { ZodValidationPipe } from '../common/http/zod-validation.pipe';
import { searchRequestSchema, type SearchRequest } from './dto/search-request.schema';
import type { SearchResponse } from './dto/search-response.types';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async search(
    @Body(new ZodValidationPipe(searchRequestSchema)) body: SearchRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SearchResponse> {
    const result = await this.searchService.search(body);

    if (result.unavailable) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result.response;
  }

  @Sse('stream')
  stream(
    @Query(new ZodValidationPipe(searchRequestSchema)) query: SearchRequest,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let ativo = true;

      this.searchService
        .search(query, ({ quotes, concluidos, total }) => {
          if (!ativo) {
            return;
          }

          if (quotes.length > 0) {
            subscriber.next({ type: 'ofertas', data: { quotes } });
          }

          subscriber.next({ type: 'progresso', data: { concluidos, total } });
        })
        .then((result) => {
          if (!ativo) {
            return;
          }

          subscriber.next({ type: 'done', data: result.response });
          subscriber.complete();
        })
        .catch((error: unknown) => {
          this.logger.error(
            `stream ${query.origin}->${query.destination} ${query.date} falhou`,
            error instanceof Error ? error.stack : String(error),
          );

          if (!ativo) {
            return;
          }

          subscriber.complete();
        });

      return () => {
        ativo = false;
      };
    });
  }
}
