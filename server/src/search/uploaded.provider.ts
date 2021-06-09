import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { SearchResults } from 'src/models';
import { SearchSource } from './types';

@Injectable()
export class UploadedSearchSourceProvider implements SearchSource {
  constructor(private databaseService: DatabaseService) {}
  name: string = 'user';
  async search({
    query,
    offset,
    limit,
  }: {
    query: string;
    limit: number;
    offset: number;
  }): Promise<typeof SearchResults.TYPE> {
    const articles = await this.databaseService.prismaClient.article.findMany({
      include: {
        authors: true,
      },
      take: limit,
      skip: offset,
      where: {
        source: 'User',
        OR: [
          {
            summary: {
              mode: 'insensitive',
              contains: query,
            },
          },
          {
            title: {
              mode: 'insensitive',
              contains: query,
            },
          },
        ],
      },
    });

    return {
      limit,
      offset,
      query,
      results: articles.map((article) => ({
        categories: article.categories,
        id: article.id.toString(),
        published: article.createdAt,
        updated: article.updatedAt,
        summary: article.summary,
        title: article.title,
        authors: article.authors.map((u) => u.name),
      })),
    };
  }
}
