import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';

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
    StepsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    TableModule, 
    FloatLabelModule,
    ConfirmDialogModule,
    DropdownModule
  ],
  providers: [ConfirmationService],
  templateUrl: './aggiungi-prodotto.component.html',
  styleUrls: ['./aggiungi-prodotto.component.scss']
})
export class AggiungiProdottoComponent {
  readonly Categoria = Category;

  steps = [
    { label: 'Dettagli' },
    { label: 'Componenti' }
  ];
  currentStep = 0;

  newProductData = {
    nome: '',
    componenti: [] as ComponentModel[],
    foto: [] as string[]
  };
  newProduct?: ProductModel;

  newComponent = new ComponentModel({
    nome: '',
    prezzo: 0,
    fornitore: '',
    quantita: 1,
    categoria: Category.Bedroom
  });

  editingComponent?: ComponentModel;

  categoryOptions = Object.entries(Category).map(([label, value]) => ({
    label,
    value
  }));

  constructor(
    private productService: ProductService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  addComponent(): void {
    const comp = new ComponentModel({
      ...this.newComponent,
      prezzo: Number(this.newComponent.prezzo) || 0
    });
    
    this.newProductData.componenti.push(comp);

    if (!this.newProduct) {
      this.newProduct = new ProductModel({
        nome: this.newProductData.nome,
        componenti: this.newProductData.componenti,
        prezzo: this.calculateTotalPrice(),
        foto: this.newProductData.foto.length
          ? this.newProductData.foto
          : ['https://via.placeholder.com/300x200?text=Nuovo+Prodotto']
      });
    } else {
      this.newProduct.componenti = [...this.newProductData.componenti];
      this.newProduct.prezzo = this.calculateTotalPrice();
    }

    this.resetNewComponent();
  }

  calculateTotalPrice(): number {
    const total = this.newProductData.componenti
      .reduce((sum, c) => sum + (Number(c.prezzo) || 0) * (c.quantita || 1), 0);
    return total;
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

  deleteComponent(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo componente?',
      accept: () => {
        this.newProductData.componenti.splice(index, 1);
        if (this.newProduct) {
          this.newProduct.componenti = this.newProductData.componenti;
          this.calculateTotalPrice();
        }
      }
    });
  }

  editComponent(component: ComponentModel): void {
    this.editingComponent = component; // Store reference to original component
    this.newComponent = new ComponentModel({ ...component }); // Create new instance with component data
  }

  updateComponent(): void {
    if (!this.editingComponent) return;
    
    const index = this.newProductData.componenti.indexOf(this.editingComponent);
    if (index !== -1) {
      this.newProductData.componenti[index] = new ComponentModel({
        ...this.newComponent,
        prezzo: Number(this.newComponent.prezzo) || 0
      });
      
      if (this.newProduct) {
        this.newProduct.componenti = [...this.newProductData.componenti];
        this.newProduct.prezzo = this.calculateTotalPrice();
      }
      
      this.editingComponent = undefined;
      this.resetNewComponent();
    }
  }

  resetNewComponent(): void {
    this.newComponent = new ComponentModel({
      nome: '',
      prezzo: 0,
      fornitore: '',
      quantita: 1,
      categoria: Category.Bedroom
    });
  }
}
