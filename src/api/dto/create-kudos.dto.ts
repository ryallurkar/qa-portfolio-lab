import { IsInt, IsNotEmpty, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";
import { Expose } from "class-transformer";

export class CreateKudosDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  @Matches(/\S/, { message: "message must not be whitespace only" })
  message!: string;

  // @IsInt rejects floats and non-numeric strings; @Min(1) rejects 0 and negatives
  @Expose()
  @IsInt()
  @Min(1)
  receiverId!: number;
}
