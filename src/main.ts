import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { I18nValidationPipe } from 'nestjs-i18n';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new I18nValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  setupSwagger(app);
  await app.listen(process.env.APP_PORT ?? 3036);
}
void bootstrap();
