import { Injectable } from '@angular/core';
import {
  Database,
  ref,
  set,
  push,
  onValue,
  remove,
} from '@angular/fire/database';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Supplier } from '../models/supplier.model';
import { Component } from '../models/component.model';
import { Rivestimento } from '../models/rivestimento.model';
import { ComponentType } from '../models/component-type.model';

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

  // Generic method to get data from any path
  getProductsFromPath(
    path: string,
    callback: (products: { id: string; data: any }[]) => void
  ) {
    const refPath = ref(this.db, path);
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({ id, data: val as any }))
        : [];
      callback(parsed);
    });
  }

  // SofaProduct methods
  addSofaProduct(product: SofaProduct): Promise<void> {
    // Use 'products' path to match the database structure
    const refPath = ref(this.db, 'products');
    const newRef = push(refPath);
    const sanitizedProduct = this.sanitizeData(product);

    // Assign the generated ID to the product before saving it
    sanitizedProduct.id = newRef.key;

    return set(newRef, sanitizedProduct);
  }

  getSofaProducts(
    callback: (products: { id: string; data: SofaProduct }[]) => void
  ) {
    // Use 'products' path to match the database structure
    const refPath = ref(this.db, 'products');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({
            id,
            data: val as SofaProduct,
          }))
        : [];
      callback(parsed);
    });
  }

  updateSofaProduct(id: string, product: SofaProduct): Promise<void> {
    // Use 'products' path to match the database structure
    const sanitizedProduct = this.sanitizeData(product);
    return set(ref(this.db, `products/${id}`), sanitizedProduct);
  }

  deleteSofaProduct(id: string): Promise<void> {
    // Use 'products' path to match the database structure
    return remove(ref(this.db, `products/${id}`));
  }

  // Variant methods
  addVariant(variant: Variant): Promise<void> {
    const refPath = ref(this.db, 'variants');
    const newRef = push(refPath);
    const sanitizedVariant = this.sanitizeData(variant);

    // Assign the generated ID to the variant before saving it
    sanitizedVariant.id = newRef.key;

    // Always ensure sofaId is set from the original variant
    // This ensures the relationship is maintained regardless of sanitization
    if (variant.sofaId) {
      sanitizedVariant.sofaId = variant.sofaId;
      console.log('Saving variant with sofaId:', variant.sofaId);
    } else {
      console.warn('Variant being saved without sofaId!', variant);
    }

    return set(newRef, sanitizedVariant);
  }

  getVariants(callback: (variants: { id: string; data: Variant }[]) => void) {
    const refPath = ref(this.db, 'variants');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({ id, data: val as Variant }))
        : [];
      callback(parsed);
    });
  }

  updateVariant(id: string, variant: Variant): Promise<void> {
    const sanitizedVariant = this.sanitizeData(variant);
    return set(ref(this.db, `variants/${id}`), sanitizedVariant);
  }

  deleteVariant(id: string): Promise<void> {
    return remove(ref(this.db, `variants/${id}`));
  }

  // Supplier methods
  addSupplier(supplier: Supplier): Promise<void> {
    const refPath = ref(this.db, 'suppliers');
    const newRef = push(refPath);
    const sanitizedSupplier = this.sanitizeData(supplier);

    // Assign the generated ID to the supplier before saving it
    sanitizedSupplier.id = newRef.key;

    return set(newRef, sanitizedSupplier);
  }

  getSuppliers(
    callback: (suppliers: { id: string; data: Supplier }[]) => void
  ) {
    const refPath = ref(this.db, 'suppliers');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({
            id,
            data: val as Supplier,
          }))
        : [];
      callback(parsed);
    });
  }

  updateSupplier(id: string, supplier: Supplier): Promise<void> {
    const sanitizedSupplier = this.sanitizeData(supplier);
    return set(ref(this.db, `suppliers/${id}`), sanitizedSupplier);
  }

  deleteSupplier(id: string): Promise<void> {
    return remove(ref(this.db, `suppliers/${id}`));
  }

  // Rivestimento methods
  addRivestimento(rivestimento: Rivestimento): Promise<void> {
    const refPath = ref(this.db, 'rivestimenti');
    const newRef = push(refPath);
    const sanitizedRivestimento = this.sanitizeData(rivestimento);

    // Assign the generated ID to the rivestimento before saving it
    sanitizedRivestimento.id = newRef.key;

    return set(newRef, sanitizedRivestimento);
  }

  getRivestimenti(
    callback: (rivestimenti: { id: string; data: Rivestimento }[]) => void
  ) {
    const refPath = ref(this.db, 'rivestimenti');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({
            id,
            data: val as Rivestimento,
          }))
        : [];
      callback(parsed);
    });
  }

  updateRivestimento(id: string, rivestimento: Rivestimento): Promise<void> {
    const sanitizedRivestimento = this.sanitizeData(rivestimento);
    return set(ref(this.db, `rivestimenti/${id}`), sanitizedRivestimento);
  }

  deleteRivestimento(id: string): Promise<void> {
    return remove(ref(this.db, `rivestimenti/${id}`));
  }
  // Component methods
  addComponent(component: Component): Promise<void> {
    const refPath = ref(this.db, 'components');
    const newRef = push(refPath);
    const sanitizedComponent = this.sanitizeData(component);

    // Assegna l'ID generato al componente prima di salvarlo
    sanitizedComponent.id = newRef.key;

    return set(newRef, sanitizedComponent);
  }

  getComponents(
    callback: (components: { id: string; data: Component }[]) => void
  ) {
    const refPath = ref(this.db, 'components');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({
            id,
            data: val as Component,
          }))
        : [];
      callback(parsed);
    });
  }

  updateComponent(id: string, component: Component): Promise<void> {
    const sanitizedComponent = this.sanitizeData(component);
    return set(ref(this.db, `components/${id}`), sanitizedComponent);
  }

  deleteComponent(id: string): Promise<void> {
    return remove(ref(this.db, `components/${id}`));
  }

  // Component Type methods
  addComponentType(componentType: ComponentType): Promise<void> {
    const refPath = ref(this.db, 'componentTypes');
    const newRef = push(refPath);
    const sanitizedType = this.sanitizeData(componentType);

    // Assign the generated ID to the component type before saving it
    sanitizedType.id = newRef.key;

    return set(newRef, sanitizedType);
  }

  getComponentTypes(
    callback: (types: { id: string; data: ComponentType }[]) => void
  ) {
    const refPath = ref(this.db, 'componentTypes');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();
      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => ({
            id,
            data: val as ComponentType,
          }))
        : [];
      callback(parsed);
    });
  }

  updateComponentType(id: string, componentType: ComponentType): Promise<void> {
    const sanitizedType = this.sanitizeData(componentType);
    return set(ref(this.db, `componentTypes/${id}`), sanitizedType);
  }

  deleteComponentType(id: string): Promise<void> {
    return remove(ref(this.db, `componentTypes/${id}`));
  }

  // New methods for creating products and variants
  createProduct(product: any): Promise<string> {
    const refPath = ref(this.db, 'products');
    const newRef = push(refPath);
    const sanitizedProduct = this.sanitizeData(product);

    // Assign the generated ID to the product before saving it
    sanitizedProduct.id = newRef.key;

    return set(newRef, sanitizedProduct).then(() => newRef.key!);
  }

  createVariant(variant: any): Promise<string> {
    const refPath = ref(this.db, 'variants');
    const newRef = push(refPath);
    const sanitizedVariant = this.sanitizeData(variant);

    // Assign the generated ID to the variant before saving it
    sanitizedVariant.id = newRef.key;

    return set(newRef, sanitizedVariant).then(() => newRef.key!);
  }

  // Method to update product with variant IDs
  updateProductVariants(productId: string, variantIds: string[]): Promise<void> {
    return set(ref(this.db, `products/${productId}/variants`), variantIds);
  }
}
