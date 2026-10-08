import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { Client } from '../generated/prisma/client';
import type { RequestWithClient } from './client.guard';

export const CurrentClient = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Client =>
    context.switchToHttp().getRequest<RequestWithClient>().client,
);
