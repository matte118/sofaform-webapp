import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { SofaProduct } from '../models/sofa-product.model';

@Injectable({
  providedIn: 'root'
})
export class SofaProductService {
  constructor(private dbService: RealtimeDbService) {}

  addSofaProduct(product: SofaProduct): Observable<void> {
    return from(this.dbService.addSofaProduct(product));
  }

  getSofaProducts(): Observable<SofaProduct[]> {
    return new Observable(observer => {
      this.dbService.getSofaProducts(products => {
        const sofaProducts = products.map(p => 
          new SofaProduct(p.id, p.data.name, p.data.description, p.data.components || [])
        );
        observer.next(sofaProducts);
      });
    });
  }

  updateSofaProduct(id: string, product: SofaProduct): Observable<void> {
    return from(this.dbService.updateSofaProduct(id, product));
  }

  deleteSofaProduct(id: string): Observable<void> {
    return from(this.dbService.deleteSofaProduct(id));
  }
}
