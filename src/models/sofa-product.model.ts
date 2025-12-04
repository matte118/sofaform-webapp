import { ExtraMattress } from "./extra-mattress.model";
import { ExtraMeccanismo } from "./extra-meccanismo.model";

export class SofaProduct {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public variants: string[] = [],
    public photoUrl?: string[],
    public seduta?: string,
    public schienale?: string,
    public meccanica?: string,
    public materasso?: string,

    // Optional fields
    public materassiExtra?: ExtraMattress[],
    public meccanismiExtra?: ExtraMeccanismo[],
    public deliveryPrice?: number,
    public ricarico?: number,
  ) { }
}
