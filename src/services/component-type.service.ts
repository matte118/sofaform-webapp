import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ComponentType } from '../models/component-type.model';

@Injectable({
  providedIn: 'root',
})
export class ComponentTypeService {
  constructor() {}

  // Since ComponentType is now an enum, we don't need database operations
  // Just return the enum values directly

  getComponentTypes(): Observable<ComponentType[]> {
    // Return all enum values as an array
    const enumValues = Object.values(ComponentType).filter(
      (value) => typeof value === 'number'
    ) as ComponentType[];
    return of(enumValues);
  }

  getComponentTypesAsObservable(): Observable<ComponentType[]> {
    return this.getComponentTypes();
  }

  // These methods are no longer needed since ComponentType is an enum
  // addComponentType, updateComponentType, deleteComponentType are removed
}