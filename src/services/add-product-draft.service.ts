import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

const DRAFT_STORAGE_KEY = 'addProductDraft:v1';

export interface AddProductDraft {
  currentStep: number;

  newSofaProduct: {
    id?: string;
    name: string;
    description?: string;
    photoUrl?: string;
    seduta?: string;
    schienale?: string;
    meccanica?: string;
    materasso?: string;
  };

  variants: any[];

  selections: {
    selectedVariantIndex: number | null;
    selectedFustoId?: string | null;
    selectedGommaId?: string | null;
    selectedReteId?: string | null;
    selectedMaterassoId?: string | null;
    selectedImballoId?: string | null;
    selectedScatolaId?: string | null;
    selectedTelaMarchiataId?: string | null;
    selectedTrasportoId?: string | null;
    selectedPiediniId?: string | null;
    piediniQty?: number | null;
    ferramentaIds: string[];
    varieIds: string[];
    tappezzeriaIds: string[];
  };

  ui: {
    selectedPricingMode: 'components' | 'custom';
    customVariantPrice: number;
    editingVariantIndex: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AddProductDraftService {

  private draft$ = new BehaviorSubject<AddProductDraft | null>(this.loadFromStorage());

  readonly value$ = this.draft$.asObservable().pipe(distinctUntilChanged());

  get value(): AddProductDraft | null {
    return this.draft$.getValue();
  }

  save(draft: AddProductDraft) {
    this.draft$.next(draft);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {}
  }

  private loadFromStorage(): AddProductDraft | null {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) as AddProductDraft : null;
    } catch {
      return null;
    }
  }

  load(): AddProductDraft | null {
    return this.value;
  }

  clear() {
    this.draft$.next(null);
    try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
  }
}
