import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCookieAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto/create-ticket.dto.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { AuthGuard } from '@nestjs/passport';
import { QueryMyTicketsDto } from './dto/query-my-tickets.dto/query-my-tickets.dto.js';

@ApiTags('Author Support Tickets')
@Controller('tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('AUTHOR')
@ApiCookieAuth('access_token')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a support ticket as an author',
    description:
      'Requires an authenticated, active author. The author ID is extracted from the authenticated JWT user. Authors may optionally link a book they own; omit bookId for a general or account-level query.',
  })
  @ApiCreatedResponse({
    description: 'Support ticket created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication cookie.',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user is not authorized as an author.',
  })
  @ApiNotFoundResponse({
    description: 'Author or selected book was not found.',
  })
  async createTicket(
    @Body() createTicketDto: CreateTicketDto,
    @GetUser('id') authorId: string,
  ) {
    return this.ticketsService.create(createTicketDto, authorId);
  }

  @Get('my-tickets')
  @ApiOperation({
    summary: 'Get the logged-in author’s support tickets',
    description:
      'Returns only the authenticated author’s tickets. Supports filtering, search, date range, and pagination.',
  })
  @ApiOkResponse({ description: 'Author tickets retrieved successfully.' })
  async getMyTickets(
    @GetUser('id') authorId: string,
    @Query() query: QueryMyTicketsDto,
  ) {
    return this.ticketsService.getMyTickets(authorId, query);
  }

  
}
