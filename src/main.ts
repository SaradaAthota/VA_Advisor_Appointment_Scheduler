import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    app.enableCors({
        origin: frontendUrl,
        credentials: true,
    });
    console.log(`CORS enabled for: ${frontendUrl}`);

    // Enable global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const port = process.env.PORT || 3000;
    //await app.listen(port);
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Server running on port ${port}`);
    
    // Log all registered routes for debugging
    const server = app.getHttpServer();
    const router = server._events.request;
    console.log('Routes registered successfully');
}
bootstrap();
