import { createApp } from './createApp';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const expressApp = express();
  const app = await createApp(expressApp);
  const config = new DocumentBuilder()
    .setTitle('Arxivism API')
    .setDescription("The API documentation for Arxivism's backend")
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT || 8080);
}
bootstrap();
