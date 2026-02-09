import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (including ngrok)
  app.enableCors({
    origin: true, // Allow all origins (for ngrok and development)
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // <--- CAUSING THE ISSUE (If DTO is missing)
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(4000);
  console.log('🚀 Backend running on http://localhost:4000');
}

bootstrap();