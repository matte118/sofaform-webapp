import { Variant } from './variant.model';

export class SofaProduct {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public variants: string[] = [], // Store variant IDs instead of full objects
    public photoUrl?: string
  ) {}
}
