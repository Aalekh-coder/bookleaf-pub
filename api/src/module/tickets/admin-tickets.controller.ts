import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TicketsService } from './tickets.service.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { QueryAdminTicketsDto } from './dto/query-admin-tickets.dto/query-admin-tickets.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { UpdateTicketDto } from './dto/update-ticket.dto/update-ticket.dto.js';

@ApiTags('Admin Support Tickets')
@Controller('admin/tickets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@ApiCookieAuth('access_token')
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the global ticket queue',
    description:
      'Returns support tickets from all authors. Supports filtering by status, category, priority, assigned user, date range, and search, with pagination.',
  })
  @ApiOkResponse({
    description: 'Admin ticket queue retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    description: 'Only active admins can access the global ticket queue.',
  })
  async getAllTickets(
    @GetUser('id') adminId: string,
    @Query() query: QueryAdminTicketsDto,
  ) {
    return this.ticketsService.getAllTicketsForAdmin(adminId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a support ticket by ID',
    description:
      'Returns the support ticket matching the supplied ID. Only authenticated admins can access this endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the support ticket.',
    type: String,
  })
  @ApiOkResponse({
    description: 'Support ticket retrieved successfully.',
  })
  @ApiBadRequestResponse({
    description: 'No support ticket exists with the supplied ID.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access support tickets.',
  })
  async getTicketById(@Param('id') id: string) {
    return this.ticketsService.ticketById(id);
  }

  @Patch(':ticketId')
  @ApiOperation({
    summary: 'Update a support ticket',
    description:
      'Allows an active admin to update ticket status, category, priority, or assignee.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Internal support ticket ID',
  })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ description: 'Support ticket updated successfully.' })
  async updateTicket(
    @Param('ticketId') ticketId: string,
    @GetUser('id') adminId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(ticketId, adminId, dto);
  }
}
