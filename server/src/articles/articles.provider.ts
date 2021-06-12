import { Article } from 'prisma-client';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ArxivSearchSourceProvider } from 'src/search/arxiv.provider';

@Injectable()
export class ArticlesProvider {
  constructor(
    private database: DatabaseService,
    private arxivSearch: ArxivSearchSourceProvider,
  ) {}
  async syncArticles(articleIds: string[]) {
    const currentArticleIds = new Set(
      (
        await this.database.prismaClient.article.findMany({
          where: {
            id: {
              in: articleIds,
            },
          },
        })
      ).map((a) => a.id),
    );
    const results: (
      | {
          articleId: string;
          status: 'Success';
          article: Article;
        }
      | {
          articleId: string;
          status: 'Error';
          errorReason?: string;
        }
    )[] = [];
    for (const articleId of articleIds) {
      if (currentArticleIds.has(articleId)) {
        continue;
      } else {
        if (
          !(await this.database.prismaClient.article.findUnique({
            where: { id: articleId },
          }))
        ) {
          const arxivArticleSearch = await this.arxivSearch.search({
            ids: [articleId],
          });
          if (!arxivArticleSearch.results[0]) {
            results.push({
              articleId,
              status: 'Error',
              errorReason: 'Article not found on arxiv',
            });
            continue;
          }
          const arxivArticle = arxivArticleSearch.results[0];
          const article = await this.database.prismaClient.article.upsert({
            where: {
              id: articleId,
            },
            update: {},
            create: {
              id: arxivArticle.id,
              documentUrl: arxivArticle.id,
              source: 'Arxiv',
              summary: arxivArticle.summary,
              title: arxivArticle.title,
              arxivArticle: {
                connectOrCreate: {
                  create: arxivArticle,
                  where: {
                    id: arxivArticle.id,
                  },
                },
              },
              categories: arxivArticle.categories,
            },
          });
          results.push({
            article,
            articleId: article.id,
            status: 'Success',
          });
        }
      }
    }
    return results;
  }
}
