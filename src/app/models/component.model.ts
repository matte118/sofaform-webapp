// src/app/models/component.model.ts  // Fixed comment

/** Rappresenta un prodotto nel catalogo */
export interface Component {
  nome: string;           // obbligatorio
  variante?: string;      // opzionale
  prezzo: number;         // obbligatorio
  fornitore: string;      // obbligatorio
  quantita: number;       // default a 1 se non definita
}

/**
 * Classe concreta che implementa Product,
 * con gestione del default a 1 per quantita.
 */
export class ComponentModel implements Component {
  nome: string;
  variante?: string;
  prezzo: number;
  fornitore: string;
  quantita: number;

  constructor(data: Partial<ComponentModel>) {
    if (!data.nome) {
      throw new Error('Il campo "nome" è obbligatorio');
    }
    if (data.prezzo == null) {
      throw new Error('Il campo "prezzo" è obbligatorio');
    }
    if (!data.fornitore) {
      throw new Error('Il campo "fornitore" è obbligatorio');
    }

    this.nome = data.nome;
    this.variante = data.variante;
    this.prezzo = data.prezzo;
    this.fornitore = data.fornitore;
    // se data.quantita è undefined o null, mettiamo 1
    this.quantita = data.quantita ?? 1;
  }
}
