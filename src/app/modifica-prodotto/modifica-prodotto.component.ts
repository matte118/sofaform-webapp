import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductModel } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-modifica-prodotto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modifica-prodotto.component.html',
  styleUrl: './modifica-prodotto.component.scss'
})
export class ModificaProdottoComponent implements OnInit {
  product?: ProductModel;

  constructor(
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.productService.getSelectedProduct().subscribe(product => {
      if (product) {
        this.product = product;
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  backToHome() {
    this.router.navigate(['/']);
  }
}
