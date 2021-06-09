import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ArxivSearchSourceProvider } from './arxiv.provider';
import { SearchController } from './search.controller';
import { UploadedSearchSourceProvider } from './uploaded.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [ArxivSearchSourceProvider, UploadedSearchSourceProvider],
  exports: [ArxivSearchSourceProvider],
})
export class SearchModule {}
