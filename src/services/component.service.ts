import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComponentModel } from '../models/component.model';
import { Category } from '../models/component-category.model';

@Injectable({
  providedIn: 'root'
})
export class ComponentService {
  private components = new BehaviorSubject<ComponentModel[]>([]);

  getComponents(): Observable<ComponentModel[]> {
    return this.components.asObservable();
  }

  addComponent(component: ComponentModel) {
    const current = this.components.getValue();
    this.components.next([...current, component]);
  }

  updateComponent(updatedComponent: ComponentModel) {
    const current = this.components.getValue();
    const index = current.findIndex(c => 
      c.nome === updatedComponent.nome && 
      c.categoria === updatedComponent.categoria
    );
    if (index !== -1) {
      current[index] = updatedComponent;
      this.components.next([...current]);
    }
  }

  deleteComponent(nome: string, categoria: Category) {
    const current = this.components.getValue();
    this.components.next(
      current.filter(c => !(c.nome === nome && c.categoria === categoria))
    );
  }

  getComponentsByCategory(category: Category): Observable<ComponentModel[]> {
    return new BehaviorSubject(
      this.components.getValue().filter(c => c.categoria === category)
    ).asObservable();
  }
}
