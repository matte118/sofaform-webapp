import { Injectable } from '@angular/core';
import { Database, ref, set, push, onValue, update, remove } from '@angular/fire/database';

@Injectable({
    providedIn: 'root'
})
export class RealtimeDbService {
    constructor(private db: Database) { }

    addItem(data: any) {
        const itemsRef = ref(this.db, 'items');
        const newItemRef = push(itemsRef);
        return set(newItemRef, data);
    }

    getItems(callback: (data: any) => void) {
        const itemsRef = ref(this.db, 'items');
        onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            callback(data);
        });
    }

    updateItem(id: string, data: any) {
        return update(ref(this.db, `items/${id}`), data);
    }

    deleteItem(id: string) {
        return remove(ref(this.db, `items/${id}`));
    }
}