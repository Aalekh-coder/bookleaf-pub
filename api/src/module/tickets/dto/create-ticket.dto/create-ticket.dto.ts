import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { TicketCategory } from '@prisma/client';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiPropertyOptional({
    description:
      'ID of the related book. Omit for general/account-level queries.',
    example: 'cm8abc123xyz',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bookId?: string;

  @ApiProperty({
    description: 'Short subject describing the support query.',
    example: 'Royalty payment not received',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'Detailed explanation of the support issue.',
    example:
      'I have not received royalty payments for my published book for six months.',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;
}