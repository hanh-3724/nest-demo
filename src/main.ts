import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { I18nValidationException } from 'nestjs-i18n';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new I18nValidationException(errors, HttpStatus.UNPROCESSABLE_ENTITY),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  setupSwagger(app);
  await app.listen(process.env.APP_PORT ?? 3036);
}
void bootstrap();
