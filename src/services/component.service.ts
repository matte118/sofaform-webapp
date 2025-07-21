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
    console.log('Component type before saving:', component.type, 'Type:', typeof component.type);
    console.log('Component type === null:', component.type === null);
    console.log('Component type === undefined:', component.type === undefined);

    // Create a plain object for database storage, converting enum to string
    let typeToSave = null;
    
    if (component.type !== null && component.type !== undefined) {
      // Convert enum number to string
      typeToSave = ComponentType[component.type];
      console.log('Converting enum to string:', component.type, '->', typeToSave);
    }

    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      supplier: component.supplier || null, // Changed from suppliers array to single supplier
      type: typeToSave
    };

    // Add explicit logging to see what's being saved
    console.log('Component data type field:', componentData.type);
    console.log('Component data being saved to DB:', componentData);
    
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
              c.data.supplier || undefined, // Changed from suppliers array to single supplier
              this.parseComponentType(c.data.type)
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
                c.data.supplier || undefined, // Changed from suppliers array to single supplier
                this.parseComponentType(c.data.type)
              )
          );
          observer.next(mappedComponents);
          observer.complete();
        }
      );
    });
  }

  updateComponent(id: string, component: Component): Observable<void> {
    console.log('ComponentService: Updating component', component);
    console.log('Component type before updating:', component.type, 'Type:', typeof component.type);

    // Create a plain object for database storage, converting enum to string
    let typeToSave = null;
    
    if (component.type !== null && component.type !== undefined) {
      // Convert enum number to string
      typeToSave = ComponentType[component.type];
      console.log('Converting enum to string for update:', component.type, '->', typeToSave);
    }

    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      supplier: component.supplier || null, // Changed from suppliers array to single supplier
      type: typeToSave
    };

    // Add explicit logging to see what's being saved
    console.log('Component data type field for update:', componentData.type);
    console.log('Component data being updated in DB:', componentData);
    
    return from(this.dbService.updateComponent(id, componentData));
  }

  // Helper method to parse component type from string back to enum
  private parseComponentType(typeString: string | undefined | null): ComponentType | undefined {
    console.log('Parsing component type from DB:', typeString, 'Type:', typeof typeString);
    
    if (!typeString || typeString === 'null' || typeString === 'undefined') {
      return undefined;
    }

    // Handle both numeric and string enum values
    if (!isNaN(Number(typeString))) {
      // If it's a numeric string, convert to number and use as enum value
      const numericValue = Number(typeString) as ComponentType;
      console.log('Parsed as numeric enum:', numericValue);
      return numericValue;
    }

    // If it's a string, find the matching enum key
    const enumKeys = Object.keys(ComponentType).filter((key) => isNaN(Number(key)));
    const matchingKey = enumKeys.find((key) => key === typeString);

    if (matchingKey) {
      const enumValue = ComponentType[matchingKey as keyof typeof ComponentType];
      console.log('Parsed as string enum:', enumValue, 'from key:', matchingKey);
      return enumValue;
    }

    console.warn('Unable to parse component type:', typeString);
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
          // Changed to check single supplier instead of suppliers array
          return c.data.supplier && c.data.supplier.id === supplierId;
        });

        const mappedComponents = componentsWithSupplier.map(
          (c) =>
            new Component(
              c.id,
              c.data.name,
              c.data.price,
              c.data.supplier || undefined, // Changed from suppliers array to single supplier
              this.parseComponentType(c.data.type)
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
