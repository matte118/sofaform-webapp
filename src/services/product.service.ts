import { Injectable } from '@angular/core';
import { ProductModel } from '../models/product.model';
import { ComponentModel } from '../models/component.model';
import { Category } from '../models/component-category.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = new BehaviorSubject<ProductModel[]>([]);
  private selectedProduct = new BehaviorSubject<ProductModel | null>(null);
  private productIds = new Map<string, string>(); // Maps product name to Firebase ID

  constructor(private realtimeDbService: RealtimeDbService) {
    this.loadProductsFromDb();
  }

  private loadProductsFromDb() {
    this.realtimeDbService.getProducts((productsFromDb) => {
      const products = productsFromDb.map(item => {
        const product = new ProductModel(item.data);
        // Store the mapping between product name and Firebase ID
        this.productIds.set(product.nome, item.id);
        return product;
      });
      this.products.next(products);
    });
  }

  getProducts(): Observable<ProductModel[]> {
    return this.products.asObservable();
  }

  updateProduct(updatedProduct: ProductModel) {
    const firebaseId = this.productIds.get(updatedProduct.nome);
    
    if (firebaseId) {
      this.realtimeDbService.updateProduct(firebaseId, updatedProduct).then(() => {
        console.log('Product updated successfully in database');
      }).catch((error: any) => {
        console.error('Error updating product in database:', error);
      });
    } else {
      console.error('Product ID not found for update:', updatedProduct.nome);
    }
  }

  setSelectedProduct(product: ProductModel) {
    console.log('Setting selected product:', product);
    this.selectedProduct.next(product);
  }

  getSelectedProduct(): Observable<ProductModel | null> {
    return this.selectedProduct.asObservable();
  }

  addProduct(newProduct: ProductModel) {
    this.realtimeDbService.addProduct(newProduct).then(() => {
    }).catch(error => {
      console.error('Error adding product:', error);
    });
  }

  deleteProduct(productName: string) {
    const firebaseId = this.productIds.get(productName);
    
    if (firebaseId) {
      this.realtimeDbService.deleteProduct(firebaseId).then(() => {
        this.productIds.delete(productName);
        console.log('Product deleted successfully from database');
      }).catch(error => {
        console.error('Error deleting product from database:', error);
      });
    } else {
      console.error('Product ID not found for deletion:', productName);
    }
  }
}
