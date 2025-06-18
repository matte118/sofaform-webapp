import { RivestimentoType } from '../models/rivestimento-type.model';

export class Rivestimento {
  constructor(
    public id: string,
    public type: RivestimentoType,
    public mtPrice: number,
    public code?: string,
  ) {}
}