import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { ComponentType } from '../models/component-type.model';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ComponentTypeService {
  private isBrowser: boolean;

  constructor(
    private dbService: RealtimeDbService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addComponentType(componentType: ComponentType): Observable<void> {
    console.log('ComponentTypeService: Adding component type', componentType);
    return from(this.dbService.addComponentType(componentType));
  }

  getComponentTypes(): Observable<ComponentType[]> {
    return new Observable((observer) => {
      this.dbService.getComponentTypes((types) => {
        const mappedTypes = types.map(
          (t) => new ComponentType(t.id, t.data.name)
        );
        console.log(
          'ComponentTypeService: Mapped component types',
          mappedTypes
        );
        observer.next(mappedTypes);
        observer.complete();
      });
    });
  }

  updateComponentType(
    id: string,
    componentType: ComponentType
  ): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    console.log(
      `ComponentTypeService: Updating component type ${id}`,
      componentType
    );
    return from(this.dbService.updateComponentType(id, componentType));
  }

  deleteComponentType(id: string): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    console.log(`ComponentTypeService: Deleting component type ${id}`);
    return from(this.dbService.deleteComponentType(id));
  }
}
