import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    // Log environment check at startup
    console.error('========================================');
    console.error('🚀 APPLICATION STARTING');
    console.error('========================================');
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.error('DATABASE_URL full value:', process.env.DATABASE_URL || 'NOT SET');
    console.error('POSTGRES_URL:', process.env.POSTGRES_URL || 'NOT SET');
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('All env vars with DATABASE or POSTGRES:', Object.keys(process.env).filter(k => k.toUpperCase().includes('DATABASE') || k.toUpperCase().includes('POSTGRES')).join(', '));
    console.error('========================================');

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
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Available endpoints:`);
    console.log(`  GET  / - API information`);
    console.log(`  GET  /health - Health check`);
    console.log(`  GET  /test - Test endpoint`);
    console.log(`  GET  /bookings/debug/all - Get all bookings`);
    console.log(`  POST /voice/session/start - Start voice session`);
    console.log(`✅ Server started successfully!`);
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
