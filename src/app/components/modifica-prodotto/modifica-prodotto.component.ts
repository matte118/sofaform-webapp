import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductModel } from '../../../models/product.model';
import { ComponentModel } from '../../../models/component.model';
import { ProductService } from '../../../services/product.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-modifica-prodotto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './modifica-prodotto.component.html',
  styleUrl: './modifica-prodotto.component.scss'
})
export class ModificaProdottoComponent implements OnInit {
  products: ProductModel[] = [];
  selectedProduct?: ProductModel;
  private originalProductBackup?: ProductModel;  // ← backup del prodotto prima di ogni edit
  showSaveDialog = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    const productName = this.route.snapshot.paramMap.get('nome');
    
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      
      if (productName) {
        const product = products.find(p => p.nome === productName);
        if (product) {
          this.editProduct(product);
        }
      }
    });
  }

  editProduct(product: ProductModel) {
    // Salvo un clone profondo del prodotto originale
    this.originalProductBackup = new ProductModel({
      nome: product.nome,
      componenti: product.componenti.map(c => new ComponentModel({ ...c })),
      prezzo: product.prezzo,
      foto: [...product.foto]
    });

    // E lavoro su un clone separato in selectedProduct
    this.selectedProduct = new ProductModel({
      nome: product.nome,
      componenti: product.componenti.map(c => new ComponentModel({ ...c })),
      prezzo: product.prezzo,
      foto: [...product.foto]
    });
  }

  saveProduct() {
    this.showSaveDialog = true;
  }

  overwriteProduct() {
    if (this.selectedProduct) {
      this.productService.updateProduct(this.selectedProduct);
      this.showSaveDialog = false;
      this.selectedProduct = undefined;
      this.router.navigate(['/home']);
    }
  }

  saveAsNewProduct() {
    if (!this.selectedProduct) {
      return;
    }

    // Creo il nuovo prodotto sulla base delle modifiche
    const newProduct = new ProductModel({
      nome: `${this.selectedProduct.nome} (Copia)`,
      componenti: this.selectedProduct.componenti.map(comp =>
        new ComponentModel({ ...comp })
      ),
      prezzo: this.selectedProduct.prezzo,
      foto: [...this.selectedProduct.foto]
    });
    this.productService.addProduct(newProduct);

    // Ripristino il prodotto originale nella lista (per non propagare modifiche)
    if (this.originalProductBackup) {
      const idx = this.products.findIndex(
        p => p.nome === this.originalProductBackup!.nome
      );
      if (idx > -1) {
        this.products[idx] = this.originalProductBackup;
      }
    }

    // Pulisco lo stato e torno alla home
    this.showSaveDialog = false;
    this.selectedProduct = undefined;
    this.originalProductBackup = undefined;
    this.router.navigate(['/home']);
  }

  cancelSave() {
    this.showSaveDialog = false;
  }

  deleteComponent(index: number) {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo componente?',
      accept: () => {
        if (this.selectedProduct) {
          this.selectedProduct.componenti.splice(index, 1);
          this.calculateTotalPrice();
        }
      }
    });
  }

  calculateTotalPrice() {
    if (this.selectedProduct) {
      this.selectedProduct.prezzo = this.selectedProduct.componenti
        .reduce((sum, c) => sum + c.prezzo * c.quantita, 0);
    }
  }

  backToHome() {
    this.router.navigate(['/home']);
  }

  deleteProduct(product: ProductModel) {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo prodotto?',
      accept: () => {
        this.productService.deleteProduct(product.nome);
      }
    });
  }
}
