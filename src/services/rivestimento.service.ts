import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { RealtimeDbService } from './realtime-db.service';
import { Rivestimento } from '../models/rivestimento.model';

@Injectable({
  providedIn: 'root'
})
export class RivestimentoService {
  constructor(private dbService: RealtimeDbService) {}

  addRivestimento(rivestimento: Rivestimento): Observable<void> {
    return from(this.dbService.addRivestimento(rivestimento));
  }

  getRivestimenti(): Observable<Rivestimento[]> {
    return new Observable(observer => {
      this.dbService.getRivestimenti(rivestimenti => {
        const mappedRivestimenti = rivestimenti.map(r => 
          new Rivestimento(r.id, r.data.type, r.data.mtPrice, r.data.code)
        );
        observer.next(mappedRivestimenti);
      });
    });
  }

  updateRivestimento(id: string, rivestimento: Rivestimento): Observable<void> {
    return from(this.dbService.updateRivestimento(id, rivestimento));
  }

  deleteRivestimento(id: string): Observable<void> {
    return from(this.dbService.deleteRivestimento(id));
  }
}
