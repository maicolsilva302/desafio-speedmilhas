import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { env } from './common/config/env';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  app.enableShutdownHooks();

  await app.listen(env.PORT);

  new Logger('bootstrap').log(`ouvindo em http://localhost:${env.PORT}`);
}

void bootstrap();
