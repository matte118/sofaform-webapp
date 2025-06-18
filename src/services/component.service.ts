import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Component } from '../models/component.model';

@Injectable({
  providedIn: 'root'
})
export class ComponentService {
  constructor(private dbService: RealtimeDbService) {}

  addComponent(component: Component): Observable<void> {
    return from(this.dbService.addComponent(component));
  }

  getComponents(): Observable<Component[]> {
    return new Observable(observer => {
      this.dbService.getComponents(components => {
        const mappedComponents = components.map(c => 
          new Component(
            c.id, 
            c.data.name, 
            c.data.price,
            c.data.suppliers || [], 
            c.data.componentModels || []
          )
        );
        observer.next(mappedComponents);
      });
    });
  }

  updateComponent(id: string, component: Component): Observable<void> {
    return from(this.dbService.updateComponent(id, component));
  }

  deleteComponent(id: string): Observable<void> {
    return from(this.dbService.deleteComponent(id));
  }
}
