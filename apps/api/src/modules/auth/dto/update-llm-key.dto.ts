import { PartialType } from '@nestjs/mapped-types';
import { CreateLlmKeyDto } from './create-llm-key.dto';

export class UpdateLlmKeyDto extends PartialType(CreateLlmKeyDto) {}
