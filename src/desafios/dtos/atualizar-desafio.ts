import { DesafioStatus } from '../interface/desafio-status.enum';
import { IsOptional } from 'class-validator';

export class AtualizarDesafioDto {
  @IsOptional()
  dataHoraDesafio: Date;

  @IsOptional()
  status: DesafioStatus;
}
