import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Component } from '../models/component.model';

@Injectable({
  providedIn: 'root',
})
export class ComponentService {
  constructor(private dbService: RealtimeDbService) {}
  addComponent(component: Component): Observable<void> {
    console.log('ComponentService: Adding component', component);
    return from(this.dbService.addComponent(component));
  }
  getComponents(): Observable<Component[]> {
    return new Observable((observer) => {
      this.dbService.getComponents((components) => {
        const mappedComponents = components.map(
          (c) =>
            new Component(
              c.id,
              c.data.name,
              c.data.price,
              c.data.suppliers || [],
              c.data.type,
              c.data.measure // Add the measure field
            )
        );
        console.log('ComponentService: Mapped components', mappedComponents);
        observer.next(mappedComponents);
      });
    });
  }

  getComponentsAsObservable(): Observable<Component[]> {
    return new Observable<Component[]>((observer) => {
      this.dbService.getComponents(
        (components: { id: string; data: any }[]) => {
          const mappedComponents = components.map(
            (c) =>
              new Component(
                c.id,
                c.data.name,
                c.data.price,
                c.data.suppliers || [],
                c.data.type,
                c.data.measure // Add the measure field
              )
          );
          observer.next(mappedComponents);
          observer.complete();
        }
      );
    });
  }

  updateComponent(id: string, component: Component): Observable<void> {
    return from(this.dbService.updateComponent(id, component));
  }

  deleteComponent(id: string): Observable<void> {
    return new Observable((observer) => {
      // First remove the component from all variants that use it
      this.dbService
        .removeComponentFromAllVariants(id)
        .then(() => {
          // Then delete the component itself
          return this.dbService.deleteComponent(id);
        })
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  getComponentsBySupplier(supplierId: string): Observable<Component[]> {
    return new Observable((observer) => {
      this.dbService.getComponents((components) => {
        const componentsWithSupplier = components.filter((c) => {
          // Check if suppliers exists and is an array
          if (!c.data.suppliers || !Array.isArray(c.data.suppliers)) {
            return false;
          }
          return c.data.suppliers.some(
            (supplier: any) => supplier.id === supplierId
          );
        });

        const mappedComponents = componentsWithSupplier.map(
          (c) =>
            new Component(
              c.id,
              c.data.name,
              c.data.price,
              c.data.suppliers || [],
              c.data.type,
              c.data.measure // Add the measure field
            )
        );

        observer.next(mappedComponents);
        observer.complete();
      });
    });
  }

  deleteComponentsBySupplier(supplierId: string): Observable<void> {
    return from(this.dbService.deleteComponentsBySupplier(supplierId));
  }
}
