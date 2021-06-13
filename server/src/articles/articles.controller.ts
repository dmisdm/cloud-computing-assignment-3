import { Like } from 'prisma-client';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DatabaseService } from 'src/database/database.service';
import { UserDTO } from 'src/models';
import { ArticlesProvider } from './articles.provider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { appConfig } from 'src/config/config';
import { v4 } from 'uuid';
import { Article } from 'prisma-client';
class ArticleLikeDTO {
  @IsNotEmpty()
  articleId!: string;
}
class ArticleAndCommentDTO {
  @IsNotEmpty()
  articleId!: string;
  @IsNotEmpty()
  comment!: string;
}

class ArticleCreateDTO {
  @IsNotEmpty()
  title!: string;
  @IsNotEmpty()
  summary!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('articles')
export class ArticlesController {
  s3Client: S3Client;
  bucket: string;
  publicBaseUrl: URL;
  region: string;
  constructor(
    private database: DatabaseService,
    private articlesProvider: ArticlesProvider,
  ) {
    this.s3Client = new S3Client({});
    this.bucket = appConfig.articlesBucket;
    this.region = appConfig.awsRegion;
    this.publicBaseUrl = new URL(
      `https://${this.bucket}.s3.${this.region}.amazonaws.com/`,
    );
  }

  @Post('bookmark')
  async bookmark(
    @Req() request: Request,
    @Body() body: ArticleLikeDTO,
  ): Promise<Like> {
    const user = UserDTO.create(request.user);

    try {
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
      include: {
        article: {
          include: {
            authors: true,
          },
        },
      },
    });
    return like;
  }
  @Post('unbookmark')
  async unbookmark(
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
      include: {
        article: {
          include: {
            authors: true,
          },
        },
      },
    });
  }
  @Post('add-comment')
  async addNote(
    @Req() request: Request,
    @Body() articleAndComment: ArticleAndCommentDTO,
  ) {
    const user = UserDTO.create(request.user);
    const newcomment = await this.database.prismaClient.comment.create({
      data: {
        text: articleAndComment.comment,
        articleId: articleAndComment.articleId,
        authorId: user.id,
      },
      include: {
        author: true,
        article: {
          include: {
            authors: true,
          },
        },
      },
    });
    return newcomment;
  }
  @Get('comments')
  async getComments(@Req() request: Request) {
    const user = UserDTO.create(request.user);
    return this.database.prismaClient.comment.findMany({
      where: {
        authorId: user.id,
      },
      include: {
        author: true,
        article: {
          include: {
            authors: true,
          },
        },
      },
    });
  }

  @Get('bookmarks')
  async getBookmarks(@Req() request: Request): Promise<Like[]> {
    const user = UserDTO.create(request.user);
    const found = await this.database.prismaClient.like.findMany({
      where: { userId: user.id },
      include: {
        article: {
          include: {
            authors: true,
            arxivArticle: true,
          },
        },
      },
    });

    return found;
  }

  @Get('my')
  async getMy(@Req() request: Request) {
    const user = UserDTO.create(request.user);
    const foundDbUser = await this.database.prismaClient.user.findUnique({
      where: { id: user.id },
      include: {
        authored: {
          include: {
            authors: true,
          },
        },
      },
    });

    return foundDbUser?.authored || [];
  }

  @Post('publish')
  @UseInterceptors(FileInterceptor('document'))
  async publish(
    @Req() request: Request,
    @Body() body: ArticleCreateDTO,
    @UploadedFile() document: Express.Multer.File,
  ): Promise<Article> {
    const user = UserDTO.create(request.user);
    const newKey = `${v4()}-${document.originalname}`;
    const command = new PutObjectCommand({
      Bucket: appConfig.articlesBucket,
      Key: newKey,
      Body: document.buffer,
      ACL: 'public-read',
    });
    await this.s3Client.send(command);

    return this.database.prismaClient.article.create({
      data: {
        authors: {
          connect: {
            id: user.id,
          },
        },
        documentUrl: new URL(`/${newKey}`, this.publicBaseUrl).href,
        source: 'User',
        summary: body.summary,
        title: body.title,
      },
    });
  }
}
