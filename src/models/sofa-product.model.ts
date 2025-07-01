import { Variant } from './variant.model';

export class SofaProduct {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public variants: string[] = [],
    public photoUrl?: string,
    public seduta?: string,
    public schienale?: string,
    public meccanica?: string,
    public materasso?: string
  ) {}
}
