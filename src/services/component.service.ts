import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Component } from '../models/component.model';
import { ComponentType } from '../models/component-type.model';

@Injectable({
  providedIn: 'root',
})
export class ComponentService {
  constructor(private dbService: RealtimeDbService) {}
  
  addComponent(component: Component): Observable<void> {
    console.log('ComponentService: Adding component', component);

    // Create a plain object for database storage, converting enum to string
    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      suppliers: component.suppliers || [],
      type: component.type !== undefined ? ComponentType[component.type] : undefined,
      measure: component.measure
    };

    return from(this.dbService.addComponent(componentData));
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
              this.parseComponentType(c.data.type),
              c.data.measure
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
                this.parseComponentType(c.data.type),
                c.data.measure
              )
          );
          observer.next(mappedComponents);
          observer.complete();
        }
      );
    });
  }

  updateComponent(id: string, component: Component): Observable<void> {
    // Create a plain object for database storage, converting enum to string
    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      suppliers: component.suppliers || [],
      type: component.type !== undefined ? ComponentType[component.type] : undefined,
      measure: component.measure
    };

    return from(this.dbService.updateComponent(id, componentData));
  }

  // Helper method to parse component type from string back to enum
  private parseComponentType(typeString: string | undefined): ComponentType | undefined {
    if (!typeString) return undefined;

    // Handle both numeric and string enum values
    if (!isNaN(Number(typeString))) {
      // If it's a numeric string, convert to number and use as enum value
      return Number(typeString) as ComponentType;
    }

    // If it's a string, find the matching enum key
    const enumKeys = Object.keys(ComponentType).filter((key) => isNaN(Number(key)));
    const matchingKey = enumKeys.find((key) => key === typeString);

    if (matchingKey) {
      return ComponentType[matchingKey as keyof typeof ComponentType];
    }

    return undefined;
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
              this.parseComponentType(c.data.type),
              c.data.measure
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
