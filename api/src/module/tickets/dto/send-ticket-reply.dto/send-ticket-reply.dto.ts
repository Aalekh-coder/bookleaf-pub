
import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class SendTicketReplyDto {
  @ApiProperty({
    description: "The final, admin-approved reply sent to the author",
    example:
      "Dear Author, you can submit your updated book description through your author dashboard.",
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  body: string;

   @ApiProperty({
    description: 'AI analysis ID associated with this draft',
    example: 'cmvkp5wnj0008wg60uqh6ioy5',
    required: false,
  })
  @IsOptional()
  @IsString()
  analysisId?: string;
}
