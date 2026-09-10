import { IsNotEmpty, IsNumber, IsString, IsUrl, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsUrl()
  downloadUrl!: string;
}
