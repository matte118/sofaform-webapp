import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Database, ref, update, onValue, get } from '@angular/fire/database';
import { RealtimeDbService } from './realtime-db.service';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { SofaType } from '../models/sofa-type.model';

@Injectable({
  providedIn: 'root',
})
export class VariantService {
  private isBrowser: boolean;
  private db = inject(Database);

  constructor(
    private dbService: RealtimeDbService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addVariant(variant: Variant): Observable<void> {
    return from(this.dbService.addVariant(variant));
  }

  createVariant(variant: Variant): Observable<string> {
    if (!this.isBrowser) {
      return of('');
    }
    return from(this.dbService.createVariant(variant));
  }

  getVariants(): Observable<Variant[]> {
    return new Observable((observer) => {
      this.dbService.getVariants((variants) => {
        const mappedVariants = variants.map((v) => this.mapToVariant(v.data, v.id));
        observer.next(mappedVariants);
      });
    });
  }

  getVariantsBySofaId(sofaId: string): Observable<Variant[]> {
    if (!this.isBrowser) {
      return of([]);
    }
    return new Observable((observer) => {
      this.dbService.getProductsFromPath('variants', (variants) => {
        const mappedVariants = variants
          .filter((v) => v.data.sofaId === sofaId)
          .map((v) => this.mapToVariant(v.data, v.id));
        observer.next(mappedVariants);
      });
    });
  }

  updateVariant(id: string, variant: Variant): Observable<void> {
    return from(this.dbService.updateVariant(id, variant));
  }

  deleteVariant(id: string): Observable<void> {
    return from(this.dbService.deleteVariant(id));
  }

  // Add rivestimento to variant
  async addRivestimentoToVariant(variantId: string, rivestimento: Rivestimento): Promise<void> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}`);
      const snapshot = await get(variantRef);

      if (snapshot.exists()) {
        const variantData = snapshot.val();
        const currentRivestimenti = variantData.rivestimenti || [];

        // Add new rivestimento with unique ID if not provided
        if (!rivestimento.id) {
          rivestimento.id = `riv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        currentRivestimenti.push(rivestimento);

        const sanitizedData = this.dbService.sanitizeData({ rivestimenti: currentRivestimenti });
        await update(variantRef, sanitizedData);
      }
    } catch (error) {
      console.error('Error adding rivestimento to variant:', error);
      throw error;
    }
  }

  // Remove rivestimento from variant
  async removeRivestimentoFromVariant(variantId: string, rivestimentoId: string): Promise<void> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}`);
      const snapshot = await get(variantRef);

      if (snapshot.exists()) {
        const variantData = snapshot.val();
        const currentRivestimenti = variantData.rivestimenti || [];

        const updatedRivestimenti = currentRivestimenti.filter((r: Rivestimento) => r.id !== rivestimentoId);

        const sanitizedData = this.dbService.sanitizeData({ rivestimenti: updatedRivestimenti });
        await update(variantRef, sanitizedData);
      }
    } catch (error) {
      console.error('Error removing rivestimento from variant:', error);
      throw error;
    }
  }

  // Update rivestimento in variant
  async updateRivestimentoInVariant(variantId: string, rivestimento: Rivestimento): Promise<void> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}`);
      const snapshot = await get(variantRef);

      if (snapshot.exists()) {
        const variantData = snapshot.val();
        const currentRivestimenti = variantData.rivestimenti || [];

        const updatedRivestimenti = currentRivestimenti.map((r: Rivestimento) =>
          r.id === rivestimento.id ? rivestimento : r
        );

        const sanitizedData = this.dbService.sanitizeData({ rivestimenti: updatedRivestimenti });
        await update(variantRef, sanitizedData);
      }
    } catch (error) {
      console.error('Error updating rivestimento in variant:', error);
      throw error;
    }
  }

  // Get rivestimenti for a specific variant
  getRivestimentiForVariant(variantId: string): Observable<Rivestimento[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    const variantRef = ref(this.db, `variants/${variantId}/rivestimenti`);
    return new Observable(observer => {
      const unsubscribe = onValue(variantRef, (snapshot) => {
        const rivestimentiData = snapshot.val();
        const rivestimenti: Rivestimento[] = rivestimentiData ? Object.values(rivestimentiData) : [];
        observer.next(rivestimenti);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  // Save rivestimenti selections for variant
  async saveVariantRivestimenti(variantId: string, rivestimenti: { rivestimento: Rivestimento; metri: number }[]): Promise<void> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}`);
      const snapshot = await get(variantRef);

      if (snapshot.exists()) {
        const variantData = snapshot.val();

        // Save rivestimenti with meters information
        const rivestimentiData = rivestimenti.map(item => ({
          rivestimento: item.rivestimento,
          metri: item.metri
        }));

        const updatedData = {
          ...variantData,
          rivestimenti: rivestimentiData
        };

        const sanitizedData = this.dbService.sanitizeData(updatedData);
        await update(variantRef, sanitizedData);
      }
    } catch (error) {
      console.error('Error saving variant rivestimenti:', error);
      throw error;
    }
  }

  // Load rivestimenti selections for variant
  async loadVariantRivestimenti(variantId: string): Promise<{ rivestimento: Rivestimento; metri: number }[]> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}`);
      const snapshot = await get(variantRef);

      if (snapshot.exists()) {
        const variantData = snapshot.val();
        const rivestimentiData = variantData.rivestimenti || [];
        
        // Ensure the data structure is correct
        if (Array.isArray(rivestimentiData)) {
          return rivestimentiData.filter(item => 
            item && 
            item.rivestimento && 
            typeof item.metri === 'number' && 
            item.metri > 0
          );
        }
      }

      return [];
    } catch (error) {
      console.error('Error loading variant rivestimenti:', error);
      return [];
    }
  }

  // Update variant with rivestimenti
  async updateVariantRivestimenti(variantId: string, rivestimenti: { rivestimento: Rivestimento; metri: number }[]): Promise<void> {
    try {
      const variantRef = ref(this.db, `variants/${variantId}/rivestimenti`);
      const sanitizedData = this.dbService.sanitizeData(rivestimenti);
      await update(ref(this.db, `variants/${variantId}`), { rivestimenti: sanitizedData });
    } catch (error) {
      console.error('Error updating variant rivestimenti:', error);
      throw error;
    }
  }

  private mapToVariant(data: any, id: string): Variant {
    console.log('Mapping variant data from Firebase:', { id, data }); // Debug log

    const variant = new Variant(
      id,
      data.sofaId || '',
      (data.longName as SofaType) || SofaType.DIVANO_3_PL,
      0, // Initialize with 0, will set properly below
      data.components || [],
      data.seatsCount,
      data.mattressWidth,
      data.depth,
      data.height,
      data.rivestimenti,
      data.pricingMode || 'components',
      data.customPrice
    );

    // Preserve the price from database
    if (typeof data.price === 'number') {
      variant.price = data.price;
      console.log(`Preserved price ${data.price} for variant ${data.longName}`); // Debug log
    } else {
      console.warn(`Missing or invalid price for variant ${data.longName}, calculating from components`); // Debug log
      variant.updatePrice(); // Calculate if not available
    }

    // Ensure pricing mode consistency
    if (variant.pricingMode === 'custom' && variant.customPrice !== undefined) {
      variant.price = variant.customPrice;
    }

    console.log('Final variant object:', {
      name: variant.longName,
      price: variant.price,
      pricingMode: variant.pricingMode,
      customPrice: variant.customPrice
    }); // Debug log

    return variant;
  }
}



