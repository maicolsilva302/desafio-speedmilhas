import { Injectable } from '@nestjs/common';

import type { Client } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Client[]> {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }
}
