import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Demo Medium NestJs API')
    .setDescription('The Medium NestJs API description')
    .setVersion('1.0')
    .addTag('medium_clonethetic')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.APP_PORT ?? 3036);
}
bootstrap();
