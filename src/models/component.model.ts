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
    if (!data.nome) {
      throw new Error('Il campo "nome" è obbligatorio');
    }
    if (data.prezzo == null) {
      throw new Error('Il campo "prezzo" è obbligatorio');
    }
    if (!data.fornitore) {
      throw new Error('Il campo "fornitore" è obbligatorio');
    }
    if (!data.categoria) {
      throw new Error('Il campo "categoria" è obbligatorio');
    }

    this.nome = data.nome;
    this.categoria = data.categoria;
    this.variante = data.variante;
    this.prezzo = data.prezzo;
    this.fornitore = data.fornitore;
    this.quantita = data.quantita ?? 1;
  }
}
