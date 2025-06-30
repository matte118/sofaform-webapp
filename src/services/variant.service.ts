import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { Variant } from '../models/variant.model';

@Injectable({
  providedIn: 'root',
})
export class VariantService {
  private isBrowser: boolean;

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
}
