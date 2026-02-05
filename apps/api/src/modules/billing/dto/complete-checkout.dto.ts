import { IsString } from "class-validator";

export class CompleteCheckoutDto {
  @IsString()
  sessionId!: string;
}
