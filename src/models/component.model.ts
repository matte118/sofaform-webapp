import { Category }  from './component-category.model'; // Importazione opzionale per evitare errori di tipo


export interface Component {
  nome: string;      
  categoria: Category;
  variante?: string;      
  prezzo: number;      
  fornitore: string;      
  quantita: number;
}

export class ComponentModel implements Component {
  nome: string;
  categoria: Category;
  variante?: string;
  prezzo: number;
  fornitore: string;
  quantita: number;

  constructor(data: Partial<ComponentModel>) {
    this.nome = data.nome ?? '';
    this.variante = data.variante;
    this.prezzo = data.prezzo ?? 0;
    this.fornitore = data.fornitore ?? '';
    this.quantita = data.quantita ?? 1;
    this.categoria = data.categoria ?? Category.Bedroom;
  }
}
