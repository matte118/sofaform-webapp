import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeDbService } from './realtime-db.service';
import { Variant } from '../models/variant.model';

@Injectable({
  providedIn: 'root'
})
export class VariantService {
  constructor(private dbService: RealtimeDbService) {}

  addVariant(variant: Variant): Observable<void> {
    return from(this.dbService.addVariant(variant));
  }

  getVariants(): Observable<Variant[]> {
    return new Observable(observer => {
      this.dbService.getVariants(variants => {
        const mappedVariants = variants.map(v => 
          new Variant(
            v.id, 
            v.data.sofaId, 
            v.data.code, 
            v.data.longName, 
            v.data.price, 
            v.data.components || [],
            v.data.seatsCount,
            v.data.mattressWidth
          )
        );
        observer.next(mappedVariants);
      });
    });
  }

  getVariantsBySofaId(sofaId: string): Observable<Variant[]> {
    return this.getVariants().pipe(
      map(variants => variants.filter(v => v.sofaId === sofaId))
    );
  }

  updateVariant(id: string, variant: Variant): Observable<void> {
    return from(this.dbService.updateVariant(id, variant));
  }

  deleteVariant(id: string): Observable<void> {
    return from(this.dbService.deleteVariant(id));
  }
}
