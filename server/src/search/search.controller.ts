import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DatabaseService } from 'src/database/database.service';
import { SearchResults } from 'src/models';
import { ArxivSearchSourceProvider } from './arxiv.provider';
import { SearchSource } from './types';
import { UploadedSearchSourceProvider } from './uploaded.provider';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  providers: SearchSource[];
  constructor(
    arxiv: ArxivSearchSourceProvider,
    user: UploadedSearchSourceProvider,
    private database: DatabaseService,
  ) {
    this.providers = [arxiv, user];
  }
  @Get()
  async search(
    @Query('query') query: string,
    @Query('offset') offset = 0,
    @Query('limit') limit = 20,
  ) {
    const results: { name: string; results: typeof SearchResults.TYPE }[] = [];
    for (const provider of this.providers) {
      results.push({
        name: provider.name,
        results: await provider.search({ query, offset, limit }),
      });
    }
    await this.database.prismaClient.event.create({
      data: {
        type: 'Search',
        parameters: query,
      },
    });
    return results.reduce(
      (acc, result) => ({
        ...acc,
        [result.name]: result.results,
      }),
      {} as Record<string, typeof SearchResults.TYPE>,
    );
  }
}
