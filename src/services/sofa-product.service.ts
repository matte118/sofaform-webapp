import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { SofaProduct } from '../models/sofa-product.model';

@Injectable({
  providedIn: 'root',
})
export class SofaProductService {
  private isBrowser: boolean;

  constructor(
    private dbService: RealtimeDbService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addSofaProduct(product: SofaProduct): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.addSofaProduct(product));
  }

  createProduct(product: SofaProduct): Observable<string> {
    if (!this.isBrowser) {
      return of('');
    }
    return from(this.dbService.createProduct(product));
  }

  updateProductVariants(
    productId: string,
    variantIds: string[]
  ): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateProductVariants(productId, variantIds));
  }

  getSofaProducts(): Observable<SofaProduct[]> {
    return new Observable((observer) => {
      this.dbService.getSofaProducts((products) => {
        const mappedProducts = products.map((p) => {
          console.log('Raw product data from DB:', p);
          const sofaProduct = new SofaProduct(
            p.id,
            p.data.name,
            p.data.description || '',
            p.data.variants || [],
            p.data.photoUrl || ''
          );
          console.log('Mapped SofaProduct:', sofaProduct);
          return sofaProduct;
        });
        console.log('SofaProductService: Mapped products', mappedProducts);
        observer.next(mappedProducts);
      });
    });
  }

  updateSofaProduct(id: string, product: SofaProduct): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateSofaProduct(id, product));
  }

  deleteSofaProduct(id: string): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.deleteSofaProduct(id));
  }
}
