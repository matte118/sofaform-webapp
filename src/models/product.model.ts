// src/app/models/Product.model.ts

import { ComponentModel } from './component.model';

/**
 * Rappresenta un Product composto da più componenti,
 * con prezzo complessivo e una o più foto.
 */
export interface Product {
  nome: string;
  /** I componenti che compongono questo Product */
  componenti: ComponentModel[];
  /** Prezzo totale del Product */
  prezzo: number;
  /** Lista di URL alle foto del Product */
  foto: string[];
}

/**
 * Classe concreta per Product, con validazioni di base:
 * - la lista componenti non può essere vuota
 * - prezzo e foto sono obbligatori
 */
export class ProductModel implements Product {
  nome: string;
  componenti: ComponentModel[];
  prezzo: number;
  foto: string[];

  constructor(data: Partial<Product>) {
    // validazioni
    if (!data.componenti || data.componenti.length === 0) {
      throw new Error('La lista di componenti è obbligatoria e non può essere vuota');
    }
    if (data.prezzo == null) {
      throw new Error('Il campo "prezzo" è obbligatorio');
    }
    if (!data.foto || data.foto.length === 0) {
      throw new Error('Devi fornire almeno una foto (URL)');
    }

    // assegnazioni
    this.nome       = data.nome || 'Prodotto senza nome';
    this.componenti = data.componenti;
    this.prezzo     = data.prezzo;
    this.foto       = data.foto;
  }

  
}
