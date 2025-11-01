import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, LoggerModule, UsersModule],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}