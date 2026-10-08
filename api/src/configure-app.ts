import type { INestApplication } from '@nestjs/common';

import { HttpExceptionFilter } from './common/http/http-exception.filter';

export function configureApp(app: INestApplication): void {
  app.enableCors({ exposedHeaders: ['Idempotent-Replay'] });

  app.useGlobalFilters(new HttpExceptionFilter());
}
