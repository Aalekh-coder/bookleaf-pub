import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TicketsService } from './tickets.service.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { QueryAdminTicketsDto } from './dto/query-admin-tickets.dto/query-admin-tickets.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { UpdateTicketDto } from './dto/update-ticket.dto/update-ticket.dto.js';
import { SendTicketReplyDto } from './dto/send-ticket-reply.dto/send-ticket-reply.dto.js';
import { UpdateTicketClassificationDto } from './dto/update-ticket-classification.dto.ts/update-ticket-classification.dto.js';

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

  @Post(':id/reply')
  @ApiOperation({
    summary: 'Send an approved reply to an author',
    description: 'Saves the admin-approved reply as a public ticket message.',
  })
  @ApiParam({
    name: 'id',
    description: 'Support ticket ID',
  })
  @ApiBody({ type: SendTicketReplyDto })
  @ApiResponse({
    status: 201,
    description: 'Reply sent successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication.',
  })
  @ApiForbiddenResponse({
    description: 'Only admins can send replies.',
  })
  @ApiNotFoundResponse({
    description: 'Support ticket not found.',
  })
  async sendReply(
    @Param('id') id: string,
    @Body() dto: SendTicketReplyDto,
    @GetUser('id') adminId: string,
  ) {
    return this.ticketsService.sendReply(id, adminId, dto.body, dto.analysisId);
  }

  
@Patch(':id/classification')
@ApiOperation({
  summary: 'Override AI ticket category or priority',
  description:
    'Allows an admin to correct the AI-generated category, priority, or both. Manual overrides are preserved during subsequent AI classification.',
})
@ApiParam({
  name: 'id',
  description: 'Support ticket ID',
})
@ApiBody({
  type: UpdateTicketClassificationDto,
  examples: {
    priorityCorrection: {
      summary: 'Change priority to Critical',
      value: {
        priority: 'CRITICAL',
      },
    },
    categoryCorrection: {
      summary: 'Correct the category',
      value: {
        category: 'ROYALTY_PAYMENTS',
      },
    },
    both: {
      summary: 'Change category and priority',
      value: {
        category: 'ROYALTY_PAYMENTS',
        priority: 'HIGH',
      },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Ticket classification updated successfully.',
})
@ApiResponse({
  status: 400,
  description: 'Invalid category or priority.',
})
@ApiResponse({
  status: 403,
  description: 'Only admins can update classification.',
})
@ApiResponse({
  status: 404,
  description: 'Ticket not found.',
})
async updateClassification(
  @Param('id') id: string,
  @Body() dto: UpdateTicketClassificationDto,
   @GetUser('id') adminId: string,
) {
  return this.ticketsService.updateClassification(id, dto,adminId);
}

}
