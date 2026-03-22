import { IsNotEmpty, IsString } from "class-validator";
import { Expose } from "class-transformer";

export class SignInDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
