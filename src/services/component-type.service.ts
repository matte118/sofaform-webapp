import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { ComponentType } from '../models/component-type.model';

@Injectable({
    providedIn: 'root'
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
        if (!this.isBrowser) {
            return of(void 0);
        }
        return from(this.dbService.addComponentType(componentType));
    }

    getComponentTypes(): Observable<ComponentType[]> {
        if (!this.isBrowser) {
            return of([]);
        }

        return new Observable(observer => {
            this.dbService.getComponentTypes(types => {
                const mappedTypes = types.map(t =>
                    new ComponentType(
                        t.id,
                        t.data.name,
                    )
                );
                observer.next(mappedTypes);
            });
        });
    }

    updateComponentType(id: string, componentType: ComponentType): Observable<void> {
        if (!this.isBrowser) {
            return of(void 0);
        }
        return from(this.dbService.updateComponentType(id, componentType));
    }

    deleteComponentType(id: string): Observable<void> {
        if (!this.isBrowser) {
            return of(void 0);
        }
        return from(this.dbService.deleteComponentType(id));
    }
}
