import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { ClientGuard } from '../clients/client.guard';
import { CurrentClient } from '../clients/current-client.decorator';
import { ZodValidationPipe } from '../common/http/zod-validation.pipe';
import type { Client } from '../generated/prisma/client';
import { createOrderSchema, type CreateOrderRequest } from './dto/create-order.schema';
import type { OrderResponse } from './order-response.mapper';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(ClientGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentClient() client: Client,
    @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OrderResponse> {
    const result = await this.ordersService.create(client.id, body);

    response.setHeader('Idempotent-Replay', String(result.replay));

    return result.response;
  }

  @Get()
  async list(@CurrentClient() client: Client): Promise<{ orders: OrderResponse[] }> {
    return { orders: await this.ordersService.findByClient(client.id) };
  }

  @Get(':id')
  findOne(@CurrentClient() client: Client, @Param('id') id: string): Promise<OrderResponse> {
    return this.ordersService.findOne(client.id, id);
  }
}
