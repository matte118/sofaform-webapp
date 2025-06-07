import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

import { ProductModel } from '../../../models/product.model';
import { ComponentModel } from '../../../models/component.model';
import { ProductService } from '../../../services/product.service';
import { Router } from '@angular/router';
import { Category } from '../../../models/component-category.model';

@Component({
  selector: 'app-aggiungi-prodotto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './aggiungi-prodotto.component.html',
  styleUrls: ['./aggiungi-prodotto.component.scss']
})
export class AggiungiProdottoComponent {
  // Espongo l'enum come proprietà pubblica
  readonly Categoria = Category;

  // Buffer per i dati iniziali
  newProductData = {
    nome: '',
    componenti: [] as ComponentModel[],
    foto: [] as string[]
  };

  // Istanza di ProductModel solo dopo il primo componente
  newProduct?: ProductModel;

  // Modello per il form del singolo componente
  newComponent = new ComponentModel({
    nome: '',
    prezzo: 0,
    fornitore: '',
    quantita: 1,
    categoria: Category.Bedroom
  });

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  addComponent(): void {
    const comp = new ComponentModel({ ...this.newComponent });
    this.newProductData.componenti.push(comp);

    if (!this.newProduct) {
      this.newProduct = new ProductModel({
        nome: this.newProductData.nome,
        componenti: this.newProductData.componenti,
        prezzo: comp.prezzo * comp.quantita,
        foto: this.newProductData.foto.length
          ? this.newProductData.foto
          : ['https://via.placeholder.com/300x200?text=Nuovo+Prodotto']
      });
    } else {
      this.newProduct.componenti = this.newProductData.componenti;
      this.calculateTotalPrice();
    }

    this.newComponent = new ComponentModel({
      nome: '',
      prezzo: 0,
      fornitore: '',
      quantita: 1,
      categoria: Category.Bedroom
    });
  }

  calculateTotalPrice(): void {
    if (!this.newProduct) return;
    this.newProduct.prezzo = this.newProduct.componenti
      .reduce((acc, c) => acc + c.prezzo * c.quantita, 0);
  }

  saveProduct(): void {
    if (
      this.newProduct &&
      this.newProduct.nome.trim() &&
      this.newProduct.componenti.length > 0
    ) {
      this.productService.addProduct(this.newProduct);
      this.router.navigate(['/home']);
    }
  }
}
