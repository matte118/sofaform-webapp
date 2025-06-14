import { Injectable } from '@angular/core';
import { Database, ref, set, push, onValue, remove } from '@angular/fire/database';
import { ComponentModel } from '../models/component.model';
import { ProductModel } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class RealtimeDbService {
  constructor(private db: Database) {}

  private sanitizeData(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeData(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  addComponent(component: ComponentModel): Promise<void> {
    const refPath = ref(this.db, 'components');
    const newRef = push(refPath);
    const sanitizedComponent = this.sanitizeData(component);
    return set(newRef, sanitizedComponent);
  }

  getComponents(callback: (components: { id: string; data: ComponentModel }[]) => void) {
    const refPath = ref(this.db, 'components');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({ id, data: val as ComponentModel }))
        : [];
      callback(parsed);
    });
  }

  deleteComponent(id: string): Promise<void> {
    return remove(ref(this.db, `components/${id}`));
  }

  updateComponent(id: string, component: ComponentModel): Promise<void> {
    const sanitizedComponent = this.sanitizeData(component);
    return set(ref(this.db, `components/${id}`), sanitizedComponent);
  }

  addProduct(product: ProductModel): Promise<void> {
    const refPath = ref(this.db, 'products');
    const newRef = push(refPath);
    const sanitizedProduct = this.sanitizeData(product);
    return set(newRef, sanitizedProduct);
  }

  getProducts(callback: (products: { id: string; data: ProductModel }[]) => void) {
    const refPath = ref(this.db, 'products');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({ id, data: val as ProductModel }))
        : [];
      callback(parsed);
    });
  }

  deleteProduct(id: string): Promise<void> {
    return remove(ref(this.db, `products/${id}`));
  }

  updateProduct(id: string, product: ProductModel): Promise<void> {
    const sanitizedProduct = this.sanitizeData(product);
    return set(ref(this.db, `products/${id}`), sanitizedProduct);
  }
}
