import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Database, ref, update, onValue, get } from '@angular/fire/database';
import { RealtimeDbService } from './realtime-db.service';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';

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
        const mappedVariants = variants.map(
          (v) => {
            const variant = new Variant(
              v.id,
              v.data.sofaId,
              v.data.longName,
              v.data.price,
              v.data.components || [],
              v.data.seatsCount,
              v.data.mattressWidth
            );
            // Ensure price is updated based on components
            variant.updatePrice();
            return variant;
          }
        );
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
          .map(
            (v) => {
              const variant = new Variant(
                v.id,
                v.data.sofaId,
                v.data.longName,
                v.data.price,
                v.data.components || [],
                v.data.seatsCount,
                v.data.mattressWidth
              );
              // Ensure price is updated based on components
              variant.updatePrice();
              return variant;
            }
          );
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
}
        