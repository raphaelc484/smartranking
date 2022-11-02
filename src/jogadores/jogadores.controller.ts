import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AtualizarJogadorDto } from './dtos/atualizar-joagdor.dto';
import { CriarJogadorDto } from './dtos/criar-joagdor.dto';
import { Jogador } from './interfaces/jogador.interface';
import { JogadoresService } from './jogadores.service';
import { JogadoresValidacaoParamentros } from './pipes/jogadores-validacao-parametros.pipe';

@Controller('api/v1/jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresSercice: JogadoresService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async criarJogador(@Body() criarJogadorDto: CriarJogadorDto) {
    await this.jogadoresSercice.criarJogador(criarJogadorDto);
  }

  @Put('/:_id')
  @UsePipes(ValidationPipe)
  async atualizarJogador(
    @Body() atualizarJogadorDto: AtualizarJogadorDto,
    @Param('_id', JogadoresValidacaoParamentros) _id: string,
  ) {
    await this.jogadoresSercice.atualizarJogador(_id, atualizarJogadorDto);
  }

  @Get('todos')
  async consultarJogadores(): Promise<Jogador[]> {
    return await this.jogadoresSercice.consultarTodosJogadores();
  }

  @Get('/:_id')
  async consultarJogadorPeloId(
    @Param('_id', JogadoresValidacaoParamentros) _id: string,
  ): Promise<Jogador> {
    return await this.jogadoresSercice.consultarJogadorPeloId(_id);
  }

  @Delete('/:_id')
  async deletarJogador(
    @Param('_id', JogadoresValidacaoParamentros) _id: string,
  ): Promise<void> {
    await this.jogadoresSercice.deletarJogador(_id);
  }
}
