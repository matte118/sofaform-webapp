import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Database, ref, update, onValue, get } from '@angular/fire/database';
import { RealtimeDbService } from './realtime-db.service';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { SofaType } from '../models/sofa-type.model';
import { ComponentType } from '../models/component-type.model';

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
    const preparedVariant = this.prepareVariantForSave(variant);
    return from(this.dbService.addVariant(preparedVariant as any));
  }

  createVariant(variant: Variant): Observable<string> {
    if (!this.isBrowser) {
      return of('');
    }
    const preparedVariant = this.prepareVariantForSave(variant);
    return from(this.dbService.createVariant(preparedVariant as any));
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
    const preparedVariant = this.prepareVariantForSave(variant);
    return from(this.dbService.updateVariant(id, preparedVariant as any));
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

  private prepareVariantForSave(variant: Variant): Variant {
    const trimmedCustomName = (variant.customName || '').trim();
    const isCustom = variant.longName === SofaType.CUSTOM && !!trimmedCustomName;
    const components = (variant.components || []).map((comp: any) => ({
      ...comp,
      type: this.toComponentTypeString(comp?.type),
      sofaType: this.parseSofaType(comp?.sofaType)
    }));

    return {
      ...variant,
      longName: isCustom ? trimmedCustomName : variant.longName,
      customName: isCustom ? trimmedCustomName : undefined,
      components
    } as Variant;
  }

  private toComponentTypeString(type: any): string | null {
    const parsedType = this.parseComponentType(type);
    return parsedType !== undefined ? ComponentType[parsedType] : null;
  }

  private parseComponentType(type: any): ComponentType | undefined {
    if (type === null || type === undefined) {
      return undefined;
    }

    if (typeof type === 'number' && !isNaN(type)) {
      return type as ComponentType;
    }

    const raw = String(type).trim();
    if (!raw) {
      return undefined;
    }

    const enumKey = Object.keys(ComponentType)
      .filter(k => isNaN(Number(k)))
      .find(k => k.toLowerCase() === raw.toLowerCase());

    if (enumKey) {
      return ComponentType[enumKey as keyof typeof ComponentType];
    }

    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) {
      return numeric as ComponentType;
    }

    return undefined;
  }

  private parseSofaType(raw: any): SofaType | null {
    if (raw === null || raw === undefined) return null;

    const value = String(raw).trim();
    if (!value) return null;

    const match = (Object.values(SofaType) as string[]).find(
      v => v.toLowerCase() === value.toLowerCase()
    );

    return match ? (match as SofaType) : null;
  }

  private mapToVariant(data: any, id: string): Variant {

    const parsedComponents = (data.components || []).map((comp: any) => ({
      ...comp,
      type: this.parseComponentType(comp?.type),
      sofaType: this.parseSofaType(comp?.sofaType)
    }));

    const parsedLongName = this.parseSofaType(data.longName);
    let resolvedLongName: SofaType = SofaType.DIVANO_3_PL;
    let customName: string | undefined;

    if (parsedLongName) {
      resolvedLongName = parsedLongName;
      if (parsedLongName === SofaType.CUSTOM) {
        const rawCustomName = typeof data.customName === 'string' ? data.customName.trim() : '';
        customName = rawCustomName || undefined;
      }
    } else {
      const rawName = typeof data.longName === 'string' ? data.longName.trim() : '';
      const rawCustomName = typeof data.customName === 'string' ? data.customName.trim() : '';
      const fallbackName = rawName || rawCustomName;
      if (fallbackName) {
        resolvedLongName = SofaType.CUSTOM;
        customName = fallbackName;
      }
    }

    const variant = new Variant(
      id,
      data.sofaId || '',
      resolvedLongName,
      0, // Initialize with 0, will set properly below
      parsedComponents,
      data.seatsCount,
      data.mattressWidth,
      typeof data.openDepth === 'number' ? data.openDepth : undefined,
      typeof data.closedDepth === 'number'
        ? data.closedDepth
        : (typeof data.depth === 'number' ? data.depth : undefined),
      data.height,
      data.rivestimenti,
      data.pricingMode || 'components',
      data.customPrice,
      customName
    );

    // Preserve the price from database
    if (typeof data.price === 'number') {
      variant.price = data.price;
    } else {
      console.warn(`Missing or invalid price for variant ${data.longName}, calculating from components`); // Debug log
      variant.updatePrice(); // Calculate if not available
    }

    // Ensure pricing mode consistency
    if (variant.pricingMode === 'custom' && variant.customPrice !== undefined) {
      variant.price = variant.customPrice;
    }
    return variant;
  }
}
