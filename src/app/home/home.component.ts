import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProductModel } from '../models/product.model';
import { ComponentModel } from '../models/component.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  products: ProductModel[] = [];

  ngOnInit(): void {
    this.products = [
      new ProductModel({
        nome: 'Sofa A',
        componenti: [
          new ComponentModel({ nome: 'Sofa A', prezzo: 599, fornitore: 'SofaCo', quantita: 1 }),
          new ComponentModel({ nome: 'Cuscino Deluxe', variante: 'Rosso', prezzo: 49, fornitore: 'HomeDeco', quantita: 2 })
        ],
        prezzo: 599 + 2 * 49,
        foto: ['https://via.placeholder.com/300x200?text=Sofa+A']
      }),
      new ProductModel({
        nome: 'Sofa B',
        componenti: [
          new ComponentModel({ nome: 'Sofa B', prezzo: 799, fornitore: 'ComfortLtd', quantita: 1 })
        ],
        prezzo: 799,
        foto: ['https://via.placeholder.com/300x200?text=Sofa+B']
      })
    ];
  }
}
