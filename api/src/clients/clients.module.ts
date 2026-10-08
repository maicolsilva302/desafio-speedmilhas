import { Module } from '@nestjs/common';

import { ClientGuard } from './client.guard';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientGuard],
  exports: [ClientsService, ClientGuard],
})
export class ClientsModule {}
