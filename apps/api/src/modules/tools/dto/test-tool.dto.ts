import { IsObject } from 'class-validator';

export class TestToolDto {
  @IsObject()
  input!: Record<string, any>;
}
