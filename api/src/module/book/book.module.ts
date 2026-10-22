import { Module } from '@nestjs/common';
import { BooksController } from './book.controller.js';
import { BooksService } from './book.service.js';

@Module({
  controllers: [BooksController],
  providers: [BooksService]
})
export class BookModule {}
