import { Injectable } from '@angular/core';
import { Observable, from, forkJoin } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Component } from '../models/component.model';
import { ComponentType } from '../models/component-type.model';
import { BulkComponentCreation } from '../models/bulk-component.model';

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
      supplier: component.supplier || null,
      type: typeToSave,
      measure: component.measure || null
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
              c.data.supplier || undefined,
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
                c.data.supplier || undefined,
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
      supplier: component.supplier || null,
      type: typeToSave,
      measure: component.measure || null
    };

    // Add explicit logging to see what's being saved
    console.log('Component data type field for update:', componentData.type);
    console.log('Component data being updated in DB:', componentData);
    
    return from(this.dbService.updateComponent(id, componentData));
  }

  // Helper method to parse component type from string back to enum
  private parseComponentType(typeString: string | undefined | null): ComponentType | undefined {
    
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
              c.data.supplier || undefined,
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

  addBulkComponents(bulkData: BulkComponentCreation): Observable<void[]> {
    console.log('ComponentService: Adding bulk components', bulkData);

    const componentPromises = bulkData.variableData.map(variableData => {
      // Generate unique ID for each component
      const componentId = this.generateComponentId();
      
      // Generate component name: Type + Supplier + Measure
      const typeName = this.getComponentTypeDisplayName(bulkData.fixedData.type);
      const supplierName = bulkData.fixedData.supplier?.name || '';
      const measure = variableData.measure?.trim() || '';
      
      const componentName = [typeName, supplierName, measure]
        .filter(part => part)
        .join(' ');
      
      // Create component with generated name - fix supplier null handling
      const component = new Component(
        componentId,
        componentName,
        variableData.price,
        bulkData.fixedData.supplier || undefined, // Convert null to undefined
        bulkData.fixedData.type,
        variableData.measure
      );

      // Create plain object for database storage
      const componentData = {
        id: component.id,
        name: component.name,
        price: component.price,
        supplier: component.supplier || undefined,
        type: component.type !== undefined ? ComponentType[component.type] : undefined,
        measure: component.measure
      };

      return this.dbService.addComponent(componentData);
    });

    return forkJoin(componentPromises);
  }

  private getComponentTypeDisplayName(type: ComponentType): string {
    const typeNames: { [key in ComponentType]: string } = {
      [ComponentType.FUSTO]: 'Fusto',
      [ComponentType.GOMMA]: 'Gomma',
      [ComponentType.RETE]: 'Rete',
      [ComponentType.MATERASSO]: 'Materasso',
      [ComponentType.TAPPEZZERIA]: 'Tappezzeria',
      [ComponentType.PIEDINI]: 'Piedini',
      [ComponentType.FERRAMENTA]: 'Ferramenta',
      [ComponentType.VARIE]: 'Varie',
      [ComponentType.IMBALLO]: 'Imballo',
      [ComponentType.SCATOLA]: 'Scatola',
      [ComponentType.TELA_MARCHIATA]: 'Tela Marchiata',
      [ComponentType.TRASPORTO]: 'Trasporto'
    };
    
    return typeNames[type] || 'Sconosciuto';
  }

  private generateComponentId(): string {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async updateComponentsPricesBySupplier(supplierId: string, percentageChange: number): Promise<void> {
    try {
      // Get components using the existing observable method
      const components = await new Promise<Component[]>((resolve, reject) => {
        this.getComponentsAsObservable().subscribe({
          next: (components) => resolve(components),
          error: (error) => reject(error)
        });
      });

      const componentsToUpdate = components.filter(component => 
        component.supplier?.id === supplierId
      );
      
      if (componentsToUpdate.length === 0) {
        throw new Error('Nessun componente trovato per il fornitore specificato');
      }

      const multiplier = 1 + (percentageChange / 100);
      const updatePromises = componentsToUpdate.map(component => {
        const newPrice = Math.round(component.price * multiplier * 100) / 100;
        
        // Create updated component data using the same structure as updateComponent
        const updatedComponentData = {
          id: component.id,
          name: component.name,
          price: newPrice,
          supplier: component.supplier || null,
          type: component.type !== null && component.type !== undefined ? ComponentType[component.type] : null,
          measure: component.measure || null
        };

        return this.dbService.updateComponent(component.id, updatedComponentData);
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dei prezzi per fornitore:', error);
      throw error;
    }
  }
}
