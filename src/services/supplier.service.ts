import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  constructor(private dbService: RealtimeDbService) {}

  addSupplier(supplier: Supplier): Observable<void> {
    return from(this.dbService.addSupplier(supplier));
  }

  getSuppliers(): Observable<Supplier[]> {
    return new Observable(observer => {
      this.dbService.getSuppliers(suppliers => {
        const mappedSuppliers = suppliers.map(s => 
          new Supplier(s.id, s.data.name, s.data.contact)
        );
        observer.next(mappedSuppliers);
      });
    });
  }

  updateSupplier(id: string, supplier: Supplier): Observable<void> {
    return from(this.dbService.updateSupplier(id, supplier));
  }

  deleteSupplier(id: string): Observable<void> {
    return from(this.dbService.deleteSupplier(id));
  }
}
