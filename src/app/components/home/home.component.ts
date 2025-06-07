import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProductModel } from '../../../models/product.model';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  products: ProductModel[] = [];

  constructor(
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  trackByName(_: number, item: ProductModel) {
    return item.nome;
  }



  generaListino(product: ProductModel) {
    console.log('Generazione listino in corso...');
  }

}
