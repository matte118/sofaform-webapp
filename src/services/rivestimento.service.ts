import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { Rivestimento } from '../models/rivestimento.model';

@Injectable({
  providedIn: 'root',
})
export class RivestimentoService {
  private isBrowser: boolean;

  constructor(
    private dbService: RealtimeDbService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addRivestimento(rivestimento: Rivestimento): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.addRivestimento(rivestimento));
  }

  getRivestimenti(): Observable<Rivestimento[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    return new Observable((observer) => {
      this.dbService.getRivestimenti((rivestimenti) => {
        const mappedRivestimenti = rivestimenti.map(
          (r) =>
            new Rivestimento(r.id, r.data.name, r.data.mtPrice)
        );
        observer.next(mappedRivestimenti);
      });
    });
  }

  updateRivestimento(id: string, rivestimento: Rivestimento): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateRivestimento(id, rivestimento));
  }

  deleteRivestimento(id: string): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.deleteRivestimento(id));
  }
}
