import { IsIn, IsString } from "class-validator";

const PLAN_KEYS = ["monthly", "yearly"] as const;

export class CreateCheckoutDto {
  @IsString()
  @IsIn(PLAN_KEYS)
  plan!: string;
}
