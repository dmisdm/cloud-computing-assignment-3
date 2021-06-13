import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginRequest, RegisterRequest, UserDTO } from 'src/models';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersService } from './users/users.service';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { appConfig } from './config/config';
import getStream from 'get-stream';
import { DatabaseService } from './database/database.service';
import { run } from 'analytics';
const s3Client = new S3Client({ region: appConfig.awsRegion });

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('auth/login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const loginRequest = LoginRequest.create(req.body);
    const foundUser = await this.authService.validateUser(
      loginRequest.email,
      loginRequest.password,
    );
    if (!foundUser) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    const authServiceResponse = await this.authService.signUser(foundUser);
    res.cookie('access_token', authServiceResponse.access_token);
    return authServiceResponse.payload;
  }
  @Post('auth/register')
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const request = RegisterRequest.create(req.body);
    const createdUserResult = await this.userService.create(request);
    if (createdUserResult === 'AlreadyExists') {
      throw new BadRequestException('A user with that email already exists');
    }
    const authServiceResponse = await this.authService.signUser(
      createdUserResult,
    );
    res.cookie('access_token', authServiceResponse.access_token);
    return authServiceResponse.payload;
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
  async me(@Req() request: Request): Promise<typeof UserDTO.TYPE> {
    return UserDTO.create(request.user);
  }

  @Get('/removeme')
  async test() {
    return process.env;
  }

  @Get('/most-frequent-search-terms')
  async mostFrequentSearchTerms() {
    const command = new ListObjectsCommand({
      Bucket: appConfig.analyticsBucket,
      Prefix: 'output/part-r',
    });
    const result = await s3Client.send(command);
    const resultKeys =
      result.Contents?.map((item) => item.Key).filter(
        <K>(k: K): k is NonNullable<K> => !!k,
      ) || [];

    const termFrequencies: { term: string; frequency: number }[] = [];
    for (const key of resultKeys) {
      const command = new GetObjectCommand({
        Bucket: appConfig.analyticsBucket,
        Key: key,
      });
      const getObjectResult = await s3Client.send(command);
      if (getObjectResult.Body) {
        try {
          const lines = (await getStream(getObjectResult.Body as any))
            .split('\n')
            .filter((t) => t.trim().length > 1);
          lines.forEach((line) => {
            const [term, frequency] = line.split('\t');
            const parsedFrequency = parseInt(frequency, 10) || 0;
            if (parsedFrequency)
              termFrequencies.push({
                term,
                frequency: parsedFrequency,
              });
          });
        } catch (e) {
          console.error(`Failed to parse analytics file: ${key}`, e);
        }
      }
    }
    return termFrequencies;
  }

  @Post('/run-analytics-job')
  async runAnalyticsJob() {
    const allQueries = (
      await this.databaseService.prismaClient.event.findMany({
        select: {
          parameters: true,
        },
        where: {
          type: 'Search',
        },
      })
    ).map((event) => event.parameters as string);
    const putObjectCommand = new PutObjectCommand({
      Bucket: appConfig.analyticsBucket,
      Key: 'input',
      Body: allQueries.join('\n'),
    });
    await s3Client.send(putObjectCommand);
    const listAllOutputs = new ListObjectsCommand({
      Bucket: appConfig.analyticsBucket,
      Prefix: 'output',
    });
    const allOutputKeys = (await s3Client.send(listAllOutputs)).Contents?.map(
      (item) => item.Key,
    );
    if (allOutputKeys?.length && allOutputKeys.length > 0) {
      const deleteOutputCommand = new DeleteObjectsCommand({
        Bucket: appConfig.analyticsBucket,
        Delete: { Objects: allOutputKeys?.map((Key) => ({ Key })) },
      });

      await s3Client.send(deleteOutputCommand);
    }

    await run({
      awsRegion: appConfig.awsRegion,
      bucketName: appConfig.analyticsBucket,
      inputObjectKey: 'input',
      outputObjectKey: 'output',
    });
  }
}
