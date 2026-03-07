import { IsString, IsNumber, IsInt, Min, Max } from "class-validator";

export class UpsertBudgetDto {
    @IsString()
    category: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @IsInt()
    @Min(2000)
    year: number;
}
