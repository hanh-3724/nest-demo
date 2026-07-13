import { Module } from '@nestjs/common';

import { ArticleController } from './article.controller';
import { ArticleRepository } from './article.repository';
import { ArticleService } from './article.service';

@Module({
  controllers: [ArticleController],
  providers: [ArticleRepository, ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
