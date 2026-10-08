import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { QuoteDetailResponse, QuoteAvailability } from './dto/quote-detail.types';
import { toQuoteResponse } from './search-response.mapper';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QuoteDetailResponse> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { search: true },
    });

    if (!quote) {
      throw new NotFoundException({
        code: 'QUOTE_NOT_FOUND',
        message: 'Cotação não encontrada.',
      });
    }

    return {
      quote: toQuoteResponse(quote),
      query: {
        origin: quote.search.origin,
        destination: quote.search.destination,
        date: quote.search.departureDate,
      },
      availability: this.availabilityOf(quote),
    };
  }

  private availabilityOf(quote: { expiresAt: Date; bookable: boolean }): QuoteAvailability {
    if (!quote.bookable) {
      return 'not_bookable';
    }

    return quote.expiresAt.getTime() <= Date.now() ? 'expired' : 'available';
  }
}
