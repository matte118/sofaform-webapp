import { Variant } from "./variant.model";

export class SofaProduct {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public components: Variant[] = [],
  ) {}
}