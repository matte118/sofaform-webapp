import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComponentModel } from '../models/component.model';
import { Category } from '../models/component-category.model';
import { RealtimeDbService } from './realtime-db.service';

@Injectable({
  providedIn: 'root'
})
export class ComponentService {
  private components = new BehaviorSubject<ComponentModel[]>([]);
  private componentIds = new Map<string, string>(); // Maps component key to Firebase ID

  constructor(private realtimeDbService: RealtimeDbService) {
    this.loadComponentsFromDb();
  }

  private loadComponentsFromDb() {
    this.realtimeDbService.getComponents((componentsFromDb) => {
      const components = componentsFromDb.map(item => {
        const component = new ComponentModel(item.data);
        // Store the mapping between component key and Firebase ID
        const componentKey = `${component.nome}_${component.categoria}`;
        this.componentIds.set(componentKey, item.id);
        return component;
      });
      this.components.next(components);
    });
  }

  private getComponentKey(nome: string, categoria: Category): string {
    return `${nome}_${categoria}`;
  }

  getComponents(): Observable<ComponentModel[]> {
    return this.components.asObservable();
  }

  addComponent(component: ComponentModel) {
    this.realtimeDbService.addComponent(component).then(() => {
      // Component will be automatically updated via loadComponentsFromDb subscription
    }).catch(error => {
      console.error('Error adding component:', error);
    });
  }

  updateComponent(updatedComponent: ComponentModel) {
    const componentKey = this.getComponentKey(updatedComponent.nome, updatedComponent.categoria);
    const firebaseId = this.componentIds.get(componentKey);
    
    if (firebaseId) {
      this.realtimeDbService.updateComponent(firebaseId, updatedComponent).then(() => {
        console.log('Component updated successfully in database');
        // Update local state immediately
        const currentComponents = this.components.getValue();
        const index = currentComponents.findIndex(c => 
          this.getComponentKey(c.nome, c.categoria) === componentKey
        );
        if (index !== -1) {
          currentComponents[index] = updatedComponent;
          this.components.next([...currentComponents]);
        }
      }).catch((error: any) => {
        console.error('Error updating component in database:', error);
      });
    } else {
      console.error('Component ID not found for update:', componentKey);
    }
  }

  // Add method to update component by original identity
  updateComponentByOriginal(originalComponent: ComponentModel, updatedComponent: ComponentModel) {
    const originalKey = this.getComponentKey(originalComponent.nome, originalComponent.categoria);
    const firebaseId = this.componentIds.get(originalKey);
    
    if (firebaseId) {
      // If name or category changed, update the mapping
      const newKey = this.getComponentKey(updatedComponent.nome, updatedComponent.categoria);
      if (originalKey !== newKey) {
        this.componentIds.delete(originalKey);
        this.componentIds.set(newKey, firebaseId);
      }
      
      this.realtimeDbService.updateComponent(firebaseId, updatedComponent).then(() => {
        console.log('Component updated successfully in database');
      }).catch((error: any) => {
        console.error('Error updating component in database:', error);
      });
    } else {
      console.error('Component ID not found for update:', originalKey);
    }
  }

  deleteComponent(nome: string, categoria: Category) {
    const componentKey = this.getComponentKey(nome, categoria);
    const firebaseId = this.componentIds.get(componentKey);
    
    if (firebaseId) {
      this.realtimeDbService.deleteComponent(firebaseId).then(() => {
        this.componentIds.delete(componentKey);
        console.log('Component deleted successfully from database');
      }).catch(error => {
        console.error('Error deleting component from database:', error);
      });
    } else {
      console.error('Component ID not found for deletion:', componentKey);
    }
  }

  getComponentsByCategory(category: Category): Observable<ComponentModel[]> {
    return new BehaviorSubject(
      this.components.getValue().filter(c => c.categoria === category)
    ).asObservable();
  }
}
