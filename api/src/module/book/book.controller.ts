import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BooksService } from './book.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { CreateBookDto } from './dto/create-book.dto.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the authenticated author's books",
    description: 'Returns all books belonging to the authenticated author.',
  })
  @ApiOkResponse({ description: "Author's books retrieved successfully." })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'Only users with the AUTHOR role can view author books.',
  })
  async findAllByAuthor(@GetUser('id') authorId: string) {
    return this.booksService.findAllByAuthor(authorId);
  }

  @Get("book-name")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AUTHOR)
  async findAllByAuthorIdName(@GetUser('id') authorId: string) {
    return this.booksService.findAllByAuthorIdName(authorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a book',
    description:
      'Only authenticated users with the AUTHOR role can create a book.',
  })
  @ApiCreatedResponse({ description: 'Book created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'Only users with the AUTHOR role can create books.',
  })
  @ApiBadRequestResponse({ description: 'Invalid book data.' })
  @ApiConflictResponse({ description: 'The book ID or ISBN already exists.' })
  async create(@Body() dto: CreateBookDto, @GetUser('id') authorId: string) {
    return this.booksService.create(dto, authorId);
  }
}
