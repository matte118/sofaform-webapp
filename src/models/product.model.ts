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
    this.nome = data.nome || 'Prodotto senza nome';
    this.componenti = data.componenti || [];
    this.prezzo = data.prezzo || 0;
    this.foto = data.foto || ['https://via.placeholder.com/300x200?text=Product'];
  }
}
