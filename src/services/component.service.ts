import { Injectable } from '@angular/core';
import { Observable, from, forkJoin } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Component } from '../models/component.model';
import { ComponentType } from '../models/component-type.model';
import { BulkComponentCreation } from '../models/bulk-component.model';
import { SofaType } from '../models/sofa-type.model';

@Injectable({
  providedIn: 'root',
})
export class ComponentService {
  constructor(private dbService: RealtimeDbService) { }

  addComponent(component: Component): Observable<void> {
    // Create a plain object for database storage, converting enum to string
    let typeToSave = null;

    if (component.type !== null && component.type !== undefined) {
      // Convert enum number to string
      typeToSave = ComponentType[component.type];
    }

    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      supplier: component.supplier || null,
      type: typeToSave,
      sofaType: component.sofaType ?? null,
      sofaTypeCustomName: this.normalizeSofaTypeCustomName(component.sofaType, component.sofaTypeCustomName)
    };

    return from(this.dbService.addComponent(componentData));
  }

  getComponents(): Observable<Component[]> {
    return new Observable((observer) => {
      this.dbService.getComponents((components) => {
        const mappedComponents = components.map(
          (c) => {
            const rawSofaType = c.data.sofaType ?? c.data.measure;
            const parsedCustomName = this.parseSofaTypeCustomName(c.data.sofaTypeCustomName, rawSofaType);
            const parsedSofaType = this.parseSofaType(rawSofaType);
            const resolvedSofaType = parsedSofaType ?? (parsedCustomName ? SofaType.CUSTOM : null);
            return new Component(
              c.id,
              c.data.name,
              c.data.price,
              c.data.supplier || undefined,
              this.parseComponentType(c.data.type),
              resolvedSofaType,
              parsedCustomName
            );
          }
        );
        observer.next(mappedComponents);
      });
    });
  }

  getComponentsAsObservable(): Observable<Component[]> {
    return new Observable<Component[]>((observer) => {
      this.dbService.getComponents(
        (components: { id: string; data: any }[]) => {
          const mappedComponents = components.map(
            (c) => {
              const rawSofaType = c.data.sofaType ?? c.data.measure;
              const parsedCustomName = this.parseSofaTypeCustomName(c.data.sofaTypeCustomName, rawSofaType);
              const parsedSofaType = this.parseSofaType(rawSofaType);
              const resolvedSofaType = parsedSofaType ?? (parsedCustomName ? SofaType.CUSTOM : null);
              return new Component(
                c.id,
                c.data.name,
                c.data.price,
                c.data.supplier || undefined,
                this.parseComponentType(c.data.type),
                resolvedSofaType,
                parsedCustomName
              );
            }
          );
          observer.next(mappedComponents);
          observer.complete();
        }
      );
    });
  }

  updateComponent(id: string, component: Component): Observable<void> {
    // Create a plain object for database storage, converting enum to string
    let typeToSave = null;

    if (component.type !== null && component.type !== undefined) {
      // Convert enum number to string
      typeToSave = ComponentType[component.type];
    }

    const componentData = {
      id: component.id,
      name: component.name,
      price: component.price,
      supplier: component.supplier || null,
      type: typeToSave,
      sofaType: component.sofaType ?? null,
      sofaTypeCustomName: this.normalizeSofaTypeCustomName(component.sofaType, component.sofaTypeCustomName)
    };

    return from(this.dbService.updateComponent(id, componentData));
  }


  private parseComponentType(typeString: string | undefined | null): ComponentType | undefined {
    if (typeString === null || typeString === undefined) {
      return undefined;
    }

    const raw = String(typeString).trim();
    if (raw === '' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') {
      return undefined;
    }

    if (!isNaN(Number(raw))) {
      return Number(raw) as ComponentType;
    }

    const enumKeys = Object.keys(ComponentType).filter(k => isNaN(Number(k)));
    const keyMatch = enumKeys.find(k => k.toLowerCase() === raw.toLowerCase());
    if (keyMatch) {
      return ComponentType[keyMatch as keyof typeof ComponentType];
    }

    const labelToKey: Record<string, keyof typeof ComponentType> = {
      'fusto': 'FUSTO',
      'gomma': 'GOMMA',
      'rete': 'RETE',
      'materasso': 'MATERASSO',
      'tappezzeria': 'TAPPEZZERIA',
      'ferro schienale': 'FERRO_SCHIENALE',
      'imbottitura cuscinetti': 'IMBOTTITURA_CUSCINETTI',
      'piedini': 'PIEDINI',
      'ferramenta': 'FERRAMENTA',
      'varie': 'VARIE',
      'imballo': 'IMBALLO',
      'scatola': 'SCATOLA',
      'tela marchiata': 'TELA_MARCHIATA',
      'trasporto': 'TRASPORTO'
    };

    const labelKey = labelToKey[raw.toLowerCase()];
    if (labelKey) {
      return ComponentType[labelKey];
    }

    console.warn('Unable to parse component type:', typeString);
    return undefined;
  }

  private parseSofaType(raw: any): SofaType | null {
    if (raw === null || raw === undefined) return null;

    const value = String(raw).trim();
    if (!value) return null;

    const match = (Object.values(SofaType) as string[]).find(
      v => v.toLowerCase() === value.toLowerCase()
    );

    return match ? (match as SofaType) : null;
  }

  private parseSofaTypeCustomName(raw: any, fallbackRaw?: any): string | undefined {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed) return trimmed;
    }

    if (typeof fallbackRaw === 'string') {
      const fallback = fallbackRaw.trim();
      if (fallback && !this.isSofaTypeValue(fallback)) {
        return fallback;
      }
    }

    return undefined;
  }

  private isSofaTypeValue(value: string): boolean {
    return (Object.values(SofaType) as string[]).some(
      v => v.toLowerCase() === value.toLowerCase()
    );
  }

  private normalizeSofaTypeCustomName(type?: SofaType | null, customName?: string): string | undefined {
    if (type !== SofaType.CUSTOM) return undefined;
    const trimmed = (customName || '').trim();
    return trimmed ? trimmed : undefined;
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
          (c) => {
            const rawSofaType = c.data.sofaType ?? c.data.measure;
            const parsedCustomName = this.parseSofaTypeCustomName(c.data.sofaTypeCustomName, rawSofaType);
            const parsedSofaType = this.parseSofaType(rawSofaType);
            const resolvedSofaType = parsedSofaType ?? (parsedCustomName ? SofaType.CUSTOM : null);
            return new Component(
              c.id,
              c.data.name,
              c.data.price,
              c.data.supplier || undefined,
              this.parseComponentType(c.data.type),
              resolvedSofaType,
              parsedCustomName
            );
          }
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
    const componentPromises = bulkData.variableData.map(variableData => {
      // Generate unique ID for each component
      const componentId = this.generateComponentId();

      // Generate component name: Type + Supplier + SofaType
      const typeName = this.getComponentTypeDisplayName(bulkData.fixedData.type);
      const supplierName = bulkData.fixedData.supplier?.name || '';
      const sofaTypeLabel = this.getSofaTypeDisplayName(
        variableData.sofaType ?? null,
        variableData.sofaTypeCustomName
      );

      const componentName = [typeName, supplierName, sofaTypeLabel]
        .filter(part => part)
        .join(' ');

      // Create component with generated name - fix supplier null handling
      const component = new Component(
        componentId,
        componentName,
        variableData.price,
        bulkData.fixedData.supplier || undefined, // Convert null to undefined
        bulkData.fixedData.type,
        variableData.sofaType ?? null,
        this.normalizeSofaTypeCustomName(variableData.sofaType ?? null, variableData.sofaTypeCustomName)
      );

      // Create plain object for database storage
      const componentData = {
        id: component.id,
        name: component.name,
        price: component.price,
        supplier: component.supplier || undefined,
        type: component.type !== undefined ? ComponentType[component.type] : undefined,
        sofaType: component.sofaType ?? null,
        sofaTypeCustomName: this.normalizeSofaTypeCustomName(component.sofaType, component.sofaTypeCustomName)
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
      [ComponentType.FERRO_SCHIENALE]: 'Ferro Schienale',
      [ComponentType.TAPPEZZERIA]: 'Tappezzeria',
      [ComponentType.IMBOTTITURA_CUSCINETTI]: 'Imbottitura Cuscinetti',
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

  private getSofaTypeDisplayName(type: SofaType | null, customName?: string): string {
    if (!type) return '';
    if (type === SofaType.CUSTOM) {
      const trimmed = (customName || '').trim();
      if (trimmed) return trimmed;
    }
    const map: Record<SofaType, string> = {
      [SofaType.DIVANO_3_PL_MAXI]: 'Divano 3 PL Maxi',
      [SofaType.DIVANO_3_PL]: 'Divano 3 PL',
      [SofaType.DIVANO_2_PL]: 'Divano 2 PL',
      [SofaType.CHAISE_LONGUE]: 'Chaise Longue',
      [SofaType.POUF_50_X_50]: 'Pouf 50 x 50',
      [SofaType.POUF_60_X_60]: 'Pouf 60 x 60',
      [SofaType.POUF_70_X_70]: 'Pouf 70 x 70',
      [SofaType.ELEMENTO_SENZA_BRACCIOLO]: 'Elemento senza bracciolo',
      [SofaType.ELEMENTO_CON_BRACCIOLO]: 'Elemento con bracciolo',
      [SofaType.POLTRONA_90_CM]: 'Poltrona 90 cm',
      [SofaType.POLTRONA_80_CM]: 'Poltrona 80 cm',
      [SofaType.POLTRONA_70_CM]: 'Poltrona 70 cm',
      [SofaType.CUSTOM]: 'Custom',
    };
    return map[type] ?? type;
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
          sofaType: component.sofaType ?? null,
          sofaTypeCustomName: this.normalizeSofaTypeCustomName(component.sofaType, component.sofaTypeCustomName)
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
