import {
  ConflictException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type { Order } from '../generated/prisma/client';
import { priceOf } from '../pricing/service-fee';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderRequest } from './dto/create-order.schema';
import {
  toOrderResponse,
  type OrderResponse,
  type QuoteComBusca,
} from './order-response.mapper';

export interface CreateOrderResult {
  response: OrderResponse;
  replay: boolean;
}

interface UniqueViolation {
  code: string;
  meta?: { target?: unknown };
}

function isUniqueViolation(error: unknown): error is UniqueViolation {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, request: CreateOrderRequest): Promise<CreateOrderResult> {
    const requestHash = this.hashRequest(clientId, request);

    const existing = await this.findExisting(request.idempotencyKey);

    if (existing) {
      return this.replayOf(existing, requestHash);
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: request.quoteId },
      include: { search: true },
    });

    if (!quote) {
      throw new NotFoundException({
        code: 'QUOTE_NOT_FOUND',
        message: 'Cotação não encontrada. Faça uma nova busca.',
      });
    }

    if (quote.expiresAt.getTime() <= Date.now()) {
      throw new GoneException({
        code: 'QUOTE_EXPIRED',
        message: 'Cotação expirada. Faça uma nova busca.',
      });
    }

    if (!quote.bookable || quote.taxesBrl === null) {
      throw new UnprocessableEntityException({
        code: 'QUOTE_NOT_BOOKABLE',
        message:
          'Esta cotação não pode ser reservada: o fornecedor não informou a taxa. ' +
          'Escolha outra opção ou refaça a busca.',
      });
    }

    return this.insert(clientId, request, requestHash, quote);
  }

  private async insert(
    clientId: string,
    request: CreateOrderRequest,
    requestHash: string,
    quote: QuoteComBusca,
  ): Promise<CreateOrderResult> {
    const pricing = priceOf(Number(quote.taxesBrl));

    try {
      const order = await this.prisma.order.create({
        data: {
          id: randomUUID(),
          idempotencyKey: request.idempotencyKey,
          requestHash,
          clientId,
          quoteId: quote.id,
          passengerName: request.passenger.name as string,
          passengerDocument: request.passenger.document,
          passengerDocumentType: request.passenger.documentType,
          passengerEmail: request.passenger.email,
          miles: quote.miles,
          taxesBrl: pricing.taxesBrl,
          serviceFeeBrl: pricing.serviceFeeBrl,
        },
      });

      this.logger.log(`reserva ${order.id} criada para a cotação ${quote.id}`);

      return { response: toOrderResponse(order, quote), replay: false };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const winner = await this.findExisting(request.idempotencyKey);

      if (!winner) {
        throw error;
      }

      return this.replayOf(winner, requestHash);
    }
  }

  private async findExisting(
    idempotencyKey: string,
  ): Promise<(Order & { quote: QuoteComBusca }) | null> {
    return this.prisma.order.findUnique({
      where: { idempotencyKey },
      include: { quote: { include: { search: true } } },
    });
  }

  async findByClient(clientId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { clientId },
      include: { quote: { include: { search: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((order) => toOrderResponse(order, order.quote));
  }

  async findOne(clientId: string, id: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id, clientId },
      include: { quote: { include: { search: true } } },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Reserva não encontrada.',
      });
    }

    return toOrderResponse(order, order.quote);
  }

  private replayOf(
    order: Order & { quote: QuoteComBusca },
    requestHash: string,
  ): CreateOrderResult {
    if (order.requestHash !== requestHash) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_CONFLICT',
        message:
          'Esta idempotencyKey já foi usada com outro conteúdo. ' +
          'Use uma chave nova para uma reserva diferente.',
      });
    }

    return { response: toOrderResponse(order, order.quote), replay: true };
  }

  private hashRequest(clientId: string, request: CreateOrderRequest): string {
    const canonical = JSON.stringify({
      clientId,
      quoteId: request.quoteId,
      name: request.passenger.name,
      document: request.passenger.document,
      documentType: request.passenger.documentType,
      email: request.passenger.email,
    });

    return createHash('sha256').update(canonical).digest('hex');
  }
}
