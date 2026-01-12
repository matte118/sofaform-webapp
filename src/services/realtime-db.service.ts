import { Injectable } from '@angular/core';
import {
  Database,
  ref,
  set,
  push,
  onValue,
  remove,
  get,
  update,
} from '@angular/fire/database';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Supplier } from '../models/supplier.model';
import { Rivestimento } from '../models/rivestimento.model';

@Injectable({ providedIn: 'root' })
export class RealtimeDbService {
  constructor(private db: Database) { }

  public sanitizeData(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeData(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Special handling for the 'type' field to ensure it's always preserved
        if (key === 'type') {
          sanitized[key] = value; // Always keep the type field, even if null
        } else if (value !== undefined) {
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

    const sanitizedProduct = this.sanitizeData({
      ...product,
      materassiExtra: product.materassiExtra ?? null,
      meccanismiExtra: product.meccanismiExtra ?? null,
      deliveryPrice: product.deliveryPrice ?? null,
      ricarico: product.ricarico ?? null,
    });

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
    const sanitizedProduct = this.sanitizeData({
      ...product,
      materassiExtra: product.materassiExtra ?? null,
      meccanismiExtra: product.meccanismiExtra ?? null,
      deliveryPrice: product.deliveryPrice ?? null,
      ricarico: product.ricarico ?? null,
    });
    return set(ref(this.db, `products/${id}`), sanitizedProduct);
  }

  deleteSofaProduct(id: string): Promise<void> {
    // Use 'products' path to match the database structure
    return remove(ref(this.db, `products/${id}`));
  }

  // Add method to get a single product by ID
  getSofaProduct(
    id: string
  ): Promise<{ id: string; data: SofaProduct } | null> {
    return new Promise((resolve) => {
      const refPath = ref(this.db, `products/${id}`);
      onValue(
        refPath,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const sanitizedData = this.sanitizeData({
              ...data,
              materassiExtra: data.materassiExtra ?? null,
              meccanismiExtra: data.meccanismiExtra ?? null,
              deliveryPrice: data.deliveryPrice ?? null,
              rivestimenti: data.rivestimenti ?? null,
              ricarico: data.ricarico ?? null,
            });
            resolve({ id, data: sanitizedData as SofaProduct });
          } else {
            resolve(null);
          }
        },
        { onlyOnce: true }
      );
    });
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
    // 1. Rimuovi la variante dalla collezione 'variants'
    return remove(ref(this.db, `variants/${id}`)).then(() => {
      // 2. Rimuovi l'id della variante da tutti i prodotti che la referenziano
      return new Promise<void>((resolve, reject) => {
        this.getSofaProducts((products) => {
          const updatePromises: Promise<void>[] = [];
          const deleteProductPromises: Promise<void>[] = [];

          products.forEach((product) => {
            if (product.data.variants && Array.isArray(product.data.variants)) {
              const newVariants = product.data.variants.filter(
                (vId: string) => vId !== id
              );
              if (newVariants.length !== product.data.variants.length) {
                if (newVariants.length === 0) {
                  // Se non ci sono più varianti, elimina il prodotto
                  deleteProductPromises.push(
                    remove(ref(this.db, `products/${product.id}`))
                  );
                } else {
                  // Aggiorna la lista delle varianti
                  updatePromises.push(
                    set(
                      ref(this.db, `products/${product.id}/variants`),
                      newVariants
                    )
                  );
                }
              }
            }
          });

          // Attendi sia gli update che le delete
          Promise.all([...updatePromises, ...deleteProductPromises])
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      });
    });
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
    return set(ref(this.db, `suppliers/${id}`), sanitizedSupplier).then(() =>
      this.updateSupplierReferences(id, sanitizedSupplier)
    );
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
  addComponent(component: any): Promise<void> {
    const refPath = ref(this.db, 'components');
    const newRef = push(refPath);
    const sanitizedComponent = this.sanitizeData(component);

    // Assegna l'ID generato al componente prima di salvarlo
    sanitizedComponent.id = newRef.key;

    return set(newRef, sanitizedComponent);
  }

  getComponents(
    callback: (components: { id: string; data: any }[]) => void
  ) {
    const refPath = ref(this.db, 'components');
    onValue(refPath, (snapshot) => {
      const raw = snapshot.val();

      const parsed = raw
        ? Object.entries(raw).map(([id, val]) => {
          return {
            id,
            data: val as any,
          };
        })
        : [];

      callback(parsed);
    });
  }

  updateComponent(id: string, component: any): Promise<void> {
    const sanitizedComponent = this.sanitizeData(component);

    return set(ref(this.db, `components/${id}`), sanitizedComponent).then(() =>
      this.updateComponentInVariants(id, sanitizedComponent)
    );
  }

  deleteComponent(id: string): Promise<void> {
    return remove(ref(this.db, `components/${id}`));
  }

  // Method to remove a component from all variants that use it
  removeComponentFromAllVariants(componentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getVariants((variants) => {
        const updatePromises: Promise<void>[] = [];

        variants.forEach((variant) => {
          const variantData = variant.data;

          // Check if this variant contains the component to be removed
          if (
            variantData.components &&
            variantData.components.some((comp: any) => comp.id === componentId)
          ) {
            // Remove the component from the variant's components array
            variantData.components = variantData.components.filter(
              (comp: any) => comp.id !== componentId
            );

            // Recalculate the variant price based on remaining components
            variantData.price = variantData.components.reduce(
              (sum: number, comp: any) => sum + (comp.price || 0),
              0
            );

            // Update the variant in the database
            const sanitizedVariant = this.sanitizeData(variantData);
            const updatePromise = set(
              ref(this.db, `variants/${variant.id}`),
              sanitizedVariant
            );
            updatePromises.push(updatePromise);
          }
        });

        // Wait for all updates to complete
        if (updatePromises.length > 0) {
          Promise.all(updatePromises)
            .then(() => resolve())
            .catch((error) => reject(error));
        } else {
          resolve();
        }
      });
    });
  }

  private async updateComponentInVariants(componentId: string, componentData: any): Promise<void> {
    const snapshot = await get(ref(this.db, 'variants'));
    const variants = snapshot.val() || {};
    const updatePromises: Promise<void>[] = [];

    Object.entries(variants).forEach(([variantId, variantData]: [string, any]) => {
      const components = Array.isArray(variantData.components) ? variantData.components : [];
      let touched = false;

      const updatedComponents = components.map((comp: any) => {
        if (comp && comp.id === componentId) {
          touched = true;
          return {
            ...comp,
            ...componentData,
            id: componentId
          };
        }
        return comp;
      });

      if (touched) {
        const payload: any = { components: updatedComponents };

        if (variantData.pricingMode !== 'custom') {
          const newPrice = updatedComponents.reduce(
            (sum: number, c: any) => sum + (c?.price || 0),
            0
          );
          payload.price = newPrice;
        } else if (variantData.customPrice !== undefined) {
          payload.price = variantData.customPrice;
        }

        const sanitizedPayload = this.sanitizeData(payload);
        updatePromises.push(update(ref(this.db, `variants/${variantId}`), sanitizedPayload));
      }
    });

    if (updatePromises.length) {
      await Promise.all(updatePromises);
    }
  }

  // New methods for creating products and variants
  createProduct(product: any): Promise<string> {
    const refPath = ref(this.db, 'products');
    const newRef = push(refPath);
    const sanitizedProduct = this.sanitizeData({
      ...product,
      materassiExtra: product.materassiExtra ?? null,
      meccanismiExtra: product.meccanismiExtra ?? null,
      deliveryPrice: product.deliveryPrice ?? null,
      rivestimenti: product.rivestimenti ?? null,
      ricarico: product.ricarico ?? null,
    });

    // Assign the generated ID to the product before saving it
    sanitizedProduct.id = newRef.key;

    return set(newRef, sanitizedProduct).then(() => newRef.key!);
  }

  // realtime-db.service.ts
  createVariant(variant: Variant): Promise<string> {
    // 1. Genero un nuovo nodo sotto 'variants'
    const newRef = push(ref(this.db, 'variants'));

    // 2. Costruisco il payload esplicito con tutti i campi necessari
    const payload = {
      id: newRef.key,
      sofaId: variant.sofaId,
      longName: variant.longName,
      price: variant.price,
      seatsCount: variant.seatsCount ?? null,
      mattressWidth: variant.mattressWidth ?? null,
      openDepth: (variant as any).openDepth ?? null,
      closedDepth: (variant as any).closedDepth ?? null,
      height: (variant as any).height ?? null,
      components: variant.components.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        // Ensure optional fields are never undefined for Firebase
        type: (c as any).type ?? null,
        sofaType: (c as any).sofaType ?? null,
        supplier: c.supplier ?? null
      }))
    };

    // 3. Uso ref(this.db, `variants/${newRef.key}`) per ottenere il DatabaseReference giusto
    const variantRef = ref(this.db, `variants/${newRef.key}`);
    return set(variantRef, payload).then(() => newRef.key!);
  }



  // Method to update product with variant IDs
  updateProductVariants(
    productId: string,
    variantIds: string[]
  ): Promise<void> {
    return set(ref(this.db, `products/${productId}/variants`), variantIds);
  }

  // Method to delete all components that have a specific supplier
  deleteComponentsBySupplier(supplierId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getComponents((components) => {
        const componentsToDelete = components.filter((c) => {
          // Changed to check single supplier instead of suppliers array
          return c.data.supplier && c.data.supplier.id === supplierId;
        });

        if (componentsToDelete.length === 0) {
          resolve();
          return;
        }

        const deletePromises: Promise<void>[] = [];

        componentsToDelete.forEach((component) => {
          // First remove the component from all variants
          const removeFromVariantsPromise = this.removeComponentFromAllVariants(
            component.id
          );

          // Then delete the component itself
          const deleteComponentPromise = removeFromVariantsPromise.then(() =>
            this.deleteComponent(component.id)
          );

          deletePromises.push(deleteComponentPromise);
        });

        // Wait for all deletions to complete
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch((error) => reject(error));
      });
    });
  }

  // Generic method to remove data from any path
  remove(path: string): Promise<void> {
    return remove(ref(this.db, path));
  }

  private async updateSupplierReferences(supplierId: string, supplierData: any): Promise<void> {
    // Aggiorna i componenti con questo supplier
    const componentsSnap = await get(ref(this.db, 'components'));
    const componentsVal = componentsSnap.val() || {};
    const componentPromises: Promise<void>[] = [];

    Object.entries(componentsVal).forEach(([compId, compData]: [string, any]) => {
      if (compData?.supplier?.id === supplierId) {
        const updated = {
          ...compData,
          supplier: supplierData
        };
        const sanitized = this.sanitizeData(updated);
        componentPromises.push(set(ref(this.db, `components/${compId}`), sanitized));
      }
    });

    // Aggiorna i componenti all'interno delle varianti
    const variantsSnap = await get(ref(this.db, 'variants'));
    const variantsVal = variantsSnap.val() || {};
    const variantPromises: Promise<void>[] = [];

    Object.entries(variantsVal).forEach(([variantId, variantData]: [string, any]) => {
      const comps = Array.isArray(variantData.components) ? variantData.components : [];
      let touched = false;
      const updatedComponents = comps.map((comp: any) => {
        if (comp?.supplier?.id === supplierId) {
          touched = true;
          return { ...comp, supplier: supplierData };
        }
        return comp;
      });

      if (touched) {
        const payload = this.sanitizeData({ components: updatedComponents });
        variantPromises.push(update(ref(this.db, `variants/${variantId}`), payload));
      }
    });

    await Promise.all([...componentPromises, ...variantPromises]);
  }
}
