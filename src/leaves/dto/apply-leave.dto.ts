import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class ApplyLeaveDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;
}