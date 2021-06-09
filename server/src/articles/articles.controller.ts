import { Like } from '.prisma/client';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DatabaseService } from 'src/database/database.service';
import { UserDTO } from 'src/models';
import { ArticlesProvider } from './articles.provider';

class ArticleLikeDTO {
  @IsNotEmpty()
  articleId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('articles')
export class ArticlesController {
  constructor(
    private database: DatabaseService,
    private articlesProvider: ArticlesProvider,
  ) {}
  @Post('like')
  async like(
    @Req() request: Request,
    @Body() body: ArticleLikeDTO,
  ): Promise<Like> {
    const user = UserDTO.create(request.user);
    let isArxiv = false;
    try {
      const parsedId = new URL(body.articleId);
      if (parsedId.host === 'arxiv.org') {
        isArxiv = true;
      }

      await this.articlesProvider.syncArticles([body.articleId]);
    } catch (e) {}

    const like = await this.database.prismaClient.like.upsert({
      where: {
        userId_articleId: {
          articleId: body.articleId,
          userId: user.id,
        },
      },
      create: {
        articleId: body.articleId,
        userId: user.id,
      },
      update: {},
    });
    return like;
  }
  @Post('unlike')
  async unlike(
    @Req() request: Request,
    @Body() article: ArticleLikeDTO,
  ): Promise<Like> {
    const user = UserDTO.create(request.user);
    return this.database.prismaClient.like.delete({
      where: {
        userId_articleId: {
          articleId: article.articleId,
          userId: user.id,
        },
      },
    });
  }

  @Get('liked')
  async getLiked(@Req() request: Request): Promise<Like[]> {
    const user = UserDTO.create(request.user);
    return this.database.prismaClient.like.findMany({
      where: { userId: user.id },
    });
  }

  @Get('my')
  async getMy(@Req() request: Request) {
    const user = UserDTO.create(request.user);
    const foundDbUser = await this.database.prismaClient.user.findUnique({
      where: { id: user.id },
      include: { authored: true },
    });

    return foundDbUser?.authored || [];
  }
}
