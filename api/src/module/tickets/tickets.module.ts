import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { AdminTicketsController } from './admin-tickets.controller.js';

@Module({
  controllers: [TicketsController,AdminTicketsController],
  providers: [TicketsService]
})
export class TicketsModule {}
