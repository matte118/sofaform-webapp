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
            new Rivestimento(r.id, r.data.type, r.data.mtPrice, r.data.code)
        );
        observer.next(mappedRivestimenti);
      });
    });
  }

  getRivestimentiAsObservable(): Observable<Rivestimento[]> {
    return new Observable<Rivestimento[]>((observer) => {
      this.dbService.getRivestimenti(
        (rivestimenti: { id: string; data: any }[]) => {
          const mappedRivestimenti = rivestimenti.map(
            (r) =>
              new Rivestimento(r.id, r.data.type, r.data.mtPrice, r.data.code)
          );
          observer.next(mappedRivestimenti);
          observer.complete();
        }
      );
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
