import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Use validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Use global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ariya Backend API')
    .setDescription('Ariya Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, () => {
    Logger.log(`Server running on port ${port}`, 'Bootstrap');
    Logger.log(`API documentation available at http://localhost:${port}/api/docs`, 'Bootstrap');
  });
}
bootstrap();