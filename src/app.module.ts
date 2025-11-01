import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import appConfig from './config/app.config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EventsModule } from './modules/events/events.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { LoggerModule } from './modules/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time to live in milliseconds
        limit: 100, // Max requests per TTL
      },
    ]),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PaymentsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}