import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './module/auth/auth.module.js';
import { UsersService } from './module/users/users.service.js';
import { UsersModule } from './module/users/users.module.js';
import { ConfigModule } from '@nestjs/config';
import { BookModule } from './module/book/book.module.js';
import { TicketsModule } from './module/tickets/tickets.module.js';
import { AiModule } from './module/ai/ai.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService, UsersService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BookModule,
    TicketsModule,
    AiModule,
  ],
})
export class AppModule {}
