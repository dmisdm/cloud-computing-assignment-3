import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';
import { ArticlesController } from './articles/articles.controller';
import { ArticlesProvider } from './articles/articles.provider';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TerminusModule,
    DatabaseModule,
    SearchModule,
  ],
  controllers: [AppController, HealthController, ArticlesController],
  providers: [ArticlesProvider],
})
export class AppModule {}
