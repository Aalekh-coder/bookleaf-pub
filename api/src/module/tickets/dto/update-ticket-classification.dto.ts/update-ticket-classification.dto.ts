
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class UpdateTicketClassificationDto {
  @ApiPropertyOptional({
    enum: TicketCategory,
    example: TicketCategory.ROYALTY_PAYMENTS,
    description: 'Admin-corrected ticket category',
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    description: 'Admin-corrected ticket priority',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
