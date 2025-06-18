import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { SofaProduct } from '../models/sofa-product.model';

@Injectable({
  providedIn: 'root'
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

  getSofaProducts(): Observable<SofaProduct[]> {
    if (!this.isBrowser) {
      return of([]);
    }
    
    // Use the products path from the database structure
    return new Observable(observer => {
      this.dbService.getProductsFromPath('products', products => {
        const mappedProducts = products.map(p => 
          new SofaProduct(
            p.id, 
            p.data.name, 
            p.data.description,
            p.data.components || []
          )
        );
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
