import { IsString, IsOptional, IsMACAddress, IsIP, IsInt } from 'class-validator';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  inventoryNumber?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

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

  @IsOptional()
  @IsString()
  location?: string;

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
