import { Module } from '@nestjs/common';
import { ArxivSearchSourceProvider } from './arxiv.provider';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [ArxivSearchSourceProvider],
})
export class SearchModule {}
