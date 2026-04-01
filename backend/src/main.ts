import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Si estamos en local, corremos normal
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 3000);
  }
  
  return app;
}

// ESTA PARTE ES CRUCIAL PARA VERCEL
export default async (req: any, res: any) => {
  const app = await bootstrap();
  await app.init();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};
