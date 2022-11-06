import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriasService } from '../categorias/categorias.service';
import { JogadoresService } from '../jogadores/jogadores.service';
import { AtribuirDesafioPartidaDto } from './dtos/atribuir-desafio-partida.dto';
import { AtualizarDesafioDto } from './dtos/atualizar-desafio';
import { CriarDesafioDto } from './dtos/criar-desafio.dto';
import { DesafioStatus } from './interface/desafio-status.enum';
import { Desafio, Partida } from './interface/desafio.interface';

@Injectable()
export class DesafiosService {
  constructor(
    @InjectModel('Desafio') private readonly desafioModel: Model<Desafio>,
    @InjectModel('Partida') private readonly partidaModel: Model<Partida>,
    private readonly jogadoresService: JogadoresService,
    private readonly categoriasService: CategoriasService,
  ) {}

  async criarDesafio(criarDesafioDto: CriarDesafioDto): Promise<Desafio> {
    const jogadores = await this.jogadoresService.consultarTodosJogadores();

    criarDesafioDto.jogadores.map((jogadorDto) => {
      const jogadorFilter = jogadores.filter(
        (jogador) => jogador._id == jogadorDto._id,
      );

      if (jogadorFilter.length === 0) {
        throw new BadRequestException(
          `O id ${jogadorDto._id} não é um jogador!`,
        );
      }
    });

    const solicitanteJogadorDaPartida = criarDesafioDto.jogadores.filter(
      (jogador) => jogador._id == criarDesafioDto.solicitante,
    );

    if (solicitanteJogadorDaPartida.length === 0) {
      throw new BadRequestException(
        `O solicitante deve ser um jogador da partida!`,
      );
    }

    const categoriaJogador =
      await this.categoriasService.consultarCategoriaDoJogador(
        criarDesafioDto.solicitante,
      );

    if (!categoriaJogador) {
      throw new BadRequestException(
        `O solicitante precisa estar registrado em uma categoria!`,
      );
    }

    const desafioCriado = new this.desafioModel(criarDesafioDto);
    desafioCriado.categoria = categoriaJogador.categoria;
    desafioCriado.dataHoraSolicitacao = new Date();

    desafioCriado.status = DesafioStatus.PENDENTE;

    return await desafioCriado.save();
  }

  async consultarDesafios() {
    return this.desafioModel
      .find()
      .populate('solicitante')
      .populate('jogadores')
      .populate('partida')
      .exec();
  }

  async atualizarDesafio(
    _id: string,
    atualizarDesafio: AtualizarDesafioDto,
  ): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id).exec();

    if (!desafioEncontrado) {
      throw new NotFoundException(`Desafio ${_id} não cadastrado!`);
    }

    if (atualizarDesafio.status) {
      desafioEncontrado.dataHoraResposta = new Date();
    }

    desafioEncontrado.status = atualizarDesafio.status;
    desafioEncontrado.dataHoraDesafio = atualizarDesafio.dataHoraDesafio;

    await this.desafioModel
      .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
      .exec();
  }

  async atribuirDesafioPartida(
    _id: string,
    atribuirDesafioPartidaDto: AtribuirDesafioPartidaDto,
  ): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id);

    if (!desafioEncontrado) {
      throw new BadRequestException(`Desafio ${_id} não cadastrado!`);
    }

    const jogadorFilter = desafioEncontrado.jogadores.filter(
      (jogador) => jogador._id == atribuirDesafioPartidaDto.def,
    );

    if (jogadorFilter.length == 0) {
      throw new BadRequestException(
        `O jogador vencedor não faz parte do desafio!`,
      );
    }

    const partidaCriada = new this.partidaModel(atribuirDesafioPartidaDto);

    partidaCriada.categoria = desafioEncontrado.categoria;

    partidaCriada.jogadores = desafioEncontrado.jogadores;

    const resultado = await partidaCriada.save();

    desafioEncontrado.status = DesafioStatus.REALIZADO;

    desafioEncontrado.partida = resultado._id;

    try {
      await this.desafioModel
        .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
        .exec();
    } catch (error) {
      await this.partidaModel.deleteOne({ _id: resultado._id }).exec();
      throw new InternalServerErrorException();
    }
  }

  async deletarDesafio(_id: string): Promise<void> {
    const desafioEncontrado = await this.desafioModel.findById(_id).exec();

    if (!desafioEncontrado) {
      throw new BadRequestException(`Desafio ${_id} não cadastrado!`);
    }

    desafioEncontrado.status = DesafioStatus.CANCELADO;

    await this.desafioModel
      .findOneAndUpdate({ _id }, { $set: desafioEncontrado })
      .exec();
  }
}
