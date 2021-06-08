import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ArxivSearchSourceProvider } from './arxiv.provider';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private arxiv: ArxivSearchSourceProvider) {}
  @Get()
  async search(
    @Query('query') query: string,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 20,
  ) {
    return this.arxiv.search({
      query,
      offset,
      limit,
    });
  }
}
