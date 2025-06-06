import { IsString, IsOptional, IsMACAddress, IsIP, IsInt, Min, IsEnum } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  inventoryNumber: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsMACAddress()
  macAddress?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  login?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  cabinet?: string;

  @IsOptional()
  @IsInt()
  assignedToUserId?: number | null;
}
