import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private isBrowser: boolean;

  constructor(
    private dbService: RealtimeDbService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addSupplier(supplier: Supplier): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.addSupplier(supplier));
  }

  getSuppliers(): Observable<Supplier[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    return new Observable((observer) => {
      this.dbService.getSuppliers((suppliers) => {
        const mappedSuppliers = suppliers.map(
          (s) => new Supplier(s.id, s.data.name, s.data.contact)
        );
        observer.next(mappedSuppliers);
      });
    });
  }

  getSuppliersAsObservable(): Observable<Supplier[]> {
    return new Observable<Supplier[]>((observer) => {
      this.dbService.getSuppliers((suppliers: { id: string; data: any }[]) => {
        const mappedSuppliers = suppliers.map(
          (s) => new Supplier(s.id, s.data.name, s.data.contact)
        );
        observer.next(mappedSuppliers);
        observer.complete();
      });
    });
  }

  updateSupplier(id: string, supplier: Supplier): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateSupplier(id, supplier));
  }

  deleteSupplier(id: string): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.deleteSupplier(id));
  }
}
