import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import type { Client } from '../generated/prisma/client';
import { ClientsService } from './clients.service';

export const CLIENT_HEADER = 'x-client-id';

export type RequestWithClient = Request & { client: Client };

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly clients: ClientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithClient>();
    const header = request.headers[CLIENT_HEADER];
    const id = typeof header === 'string' ? header.trim() : '';
    const client = id ? await this.clients.findById(id) : null;

    if (!client) {
      throw new UnauthorizedException({
        code: 'CLIENT_REQUIRED',
        message: `Informe uma agência válida no header ${CLIENT_HEADER}.`,
      });
    }

    request.client = client;

    return true;
  }
}
