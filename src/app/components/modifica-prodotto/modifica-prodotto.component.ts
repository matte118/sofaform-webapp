import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductModel } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-modifica-prodotto',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './modifica-prodotto.component.html',
  styleUrl: './modifica-prodotto.component.scss'
})
export class ModificaProdottoComponent implements OnInit {
  products: ProductModel[] = [];

  constructor(
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  editProduct(product: ProductModel) {
    this.productService.setSelectedProduct(product);
    // Navigate to edit form or show edit dialog
  }

  backToHome() {
    this.router.navigate(['/home']);
  }
}
