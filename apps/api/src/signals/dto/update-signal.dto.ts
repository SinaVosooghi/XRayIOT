import { PartialType } from '@nestjs/swagger';
import { CreateSignalDto } from './create-signal.dto';

// UpdateSignalDto extends CreateSignalDto with all fields optional
export class UpdateSignalDto extends PartialType(CreateSignalDto) {}
