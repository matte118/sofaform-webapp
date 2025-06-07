import { Injectable } from '@angular/core';
import { ProductModel } from '../models/product.model';
import { ComponentModel } from '../models/component.model';
import { Category } from '../models/component-category.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = new BehaviorSubject<ProductModel[]>([
    new ProductModel({
      nome: 'Sofa A',
      componenti: [
        new ComponentModel({
          nome: 'Sofa A',
          prezzo: 599,
          fornitore: 'SofaCo',
          quantita: 1,
          categoria: Category.Bedroom,
        }),
        new ComponentModel({
          nome: 'Cuscino Deluxe',
          variante: 'Rosso',
          prezzo: 49,
          fornitore: 'HomeDeco',
          quantita: 2,
          categoria: Category.Bedroom,
        })
      ],
      prezzo: 599 + 2 * 49,
      foto: ['https://via.placeholder.com/300x200?text=Sofa+A']
    }),
    new ProductModel({
      nome: 'Sofa B',
      componenti: [
        new ComponentModel({
          nome: 'Sofa B',
          prezzo: 799,
          fornitore: 'ComfortLtd',
          quantita: 1,
          categoria: Category.Bedroom,
        })
      ],
      prezzo: 799,
      foto: ['https://via.placeholder.com/300x200?text=Sofa+B']
    })
  ]);

  private selectedProduct = new BehaviorSubject<ProductModel | null>(null);

  getProducts(): Observable<ProductModel[]> {
    return this.products.asObservable();
  }

  updateProduct(updatedProduct: ProductModel) {
    const currentProducts = this.products.getValue();
    const index = currentProducts.findIndex(p => p.nome === updatedProduct.nome);
    if (index !== -1) {
      currentProducts[index] = updatedProduct;
      this.products.next([...currentProducts]);
    }
  }

  setSelectedProduct(product: ProductModel) {
    console.log('Setting selected product:', product); // Debug log
    this.selectedProduct.next(product);
  }

  getSelectedProduct(): Observable<ProductModel | null> {
    return this.selectedProduct.asObservable();
  }

  addProduct(newProduct: ProductModel) {
    const currentProducts = this.products.getValue();
    this.products.next([...currentProducts, newProduct]);
  }
}
