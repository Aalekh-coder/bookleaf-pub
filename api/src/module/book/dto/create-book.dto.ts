import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsInt,
  IsArray,
  IsPositive,
  Min,
  MaxLength,
  IsISBN,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ maxLength: 200, example: 'BOOK-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  bookId: string;

  @ApiProperty({ maxLength: 255, example: 'The Example Book' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ format: 'isbn', example: '9780306406157' })
  @IsString()
  @IsNotEmpty()
  @IsISBN()
  isbn: string;

  @ApiProperty({ maxLength: 100, example: 'Fiction' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  genre: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-10-13T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional({ enum: BookStatus, example: BookStatus.DRAFT })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiProperty({ minimum: 0, exclusiveMinimum: true, example: 19.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  mrp: number;

  @ApiProperty({ minimum: 0, example: 5.25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  authorRoyaltyPerCopy: number;

  @ApiPropertyOptional({ minimum: 0, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalCopiesSold?: number;

  @ApiPropertyOptional({ minimum: 0, example: 525 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRoyaltyEarned?: number;

  @ApiPropertyOptional({ minimum: 0, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  royaltyPaid?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-10-13T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  lastRoyaltyPayoutDate?: string;

  @ApiPropertyOptional({ maxLength: 150, example: 'In-House' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  printPartner?: string;

  @ApiPropertyOptional({ type: [String], example: ['Amazon', 'BookLeaf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableOn?: string[];
}