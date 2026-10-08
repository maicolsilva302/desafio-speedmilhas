import { Module } from '@nestjs/common';

import { ClientsModule } from './clients/clients.module';
import { HealthController } from './health.controller';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [PrismaModule, ClientsModule, SearchModule, OrdersModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
