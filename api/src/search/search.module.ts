import { Module } from '@nestjs/common';

import { SuppliersModule } from '../suppliers/suppliers.module';
import { QuotesController } from './quotes.controller';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [SuppliersModule],
  controllers: [SearchController, QuotesController],
  providers: [SearchService],
})
export class SearchModule {}
