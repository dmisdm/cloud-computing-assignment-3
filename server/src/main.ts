import { createApp } from './createApp';
import express from 'express';
async function bootstrap() {
  const expressApp = express();
  const app = await createApp(expressApp);
  await app.listen(process.env.PORT || 8080);
}
bootstrap();
