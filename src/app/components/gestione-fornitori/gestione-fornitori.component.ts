import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

import { Supplier } from '../../../models/supplier.model';
import { SupplierService } from '../../../services/supplier.service';
import { ComponentService } from '../../../services/component.service';
import { of, Subject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gestione-fornitori',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    DividerModule,
    ToastModule,
    DialogModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './gestione-fornitori.component.html',
  styleUrls: ['./gestione-fornitori.component.scss'],
})
export class GestioneFornitoriComponent implements OnInit, AfterViewInit {
  @ViewChild('supplierTable') supplierTable?: ElementRef;

  suppliers: Supplier[] = [];
  newSupplier: Supplier = new Supplier('', '', '');
  editingIndex = -1;
  loading = true;
  dataLoaded = false;
  saving = false;
  private refresh$ = new Subject<void>();
  formSubmitted = false;
  formValid = true;
  loadingDependencies = false;


  // Controllo del dialog
  displayConfirmDelete = false;
  supplierToDelete?: Supplier;
  supplierDependentComponents: string[] = [];

  constructor(
    private supplierService: SupplierService,
    private componentService: ComponentService,
    private messageService: MessageService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.loadAllData();
    this.refresh$.subscribe(() => this.loadAllData());
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.suppliers.length && !this.dataLoaded) {
        this.refreshTable();
      }
    }, 500);
  }

  private loadAllData() {
    this.loading = true;
    this.supplierService
      .getSuppliersAsObservable()
      .pipe(
        catchError((err) => {
          console.error('Error loading suppliers', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile caricare i fornitori',
          });
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;
          this.zone.run(() => {
            this.cd.detectChanges();
            this.refreshTable();
          });
        })
      )
      .subscribe((list) => (this.suppliers = list));
  }

  private refreshTable() {
    if (!this.supplierTable) {
      return;
    }
    const el = this.supplierTable.nativeElement;
    el.classList.add('refreshing');
    setTimeout(() => {
      el.classList.remove('refreshing');
      this.cd.detectChanges();
    }, 50);
  }

  addSupplier() {
    this.formSubmitted = true;
    if (!this.validateForm()) {
      this.formValid = false;
      return;
    }
    this.formValid = true;
    this.saving = true;

    const supplier = new Supplier(
      this.isEditing ? this.suppliers[this.editingIndex].id : '',
      this.newSupplier.name.trim(),
      this.newSupplier.contact?.trim() ?? ''
    );

    const op = this.isEditing
      ? this.supplierService.updateSupplier(supplier.id, supplier)
      : this.supplierService.addSupplier(supplier);

    op.subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing
            ? 'Fornitore aggiornato'
            : 'Fornitore creato',
        });
        this.refresh$.next();
        this.resetForm();
        this.saving = false;
      },
      (err) => {
        console.error('Save error', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing
            ? 'Errore aggiornamento'
            : 'Errore creazione',
        });
        this.saving = false;
      }
    );
  }

  editSupplier(s: Supplier, idx: number) {
    this.newSupplier = new Supplier(s.id, s.name, s.contact);
    this.editingIndex = idx;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('supplierName')?.focus();
      this.cd.detectChanges();
    }, 300);
  }

  private getComponentsUsingSupplier(id: string): Promise<string[]> {
    return new Promise((res) => {
      this.componentService
        .getComponentsBySupplier(id)
        .subscribe((comps) => res(comps.map((c) => c.name)));
    });
  }


  deleteSupplier(supplier: Supplier) {
    this.supplierToDelete = supplier;
    this.supplierDependentComponents = [];
    this.loadingDependencies = true;
    this.displayConfirmDelete = true;

    this.componentService.getComponentsBySupplier(supplier.id)
      .pipe(finalize(() => this.loadingDependencies = false))
      .subscribe(
        (components) => {
          const names = components.map(c => c.name);
          if (names.length === 0) {
            this.displayConfirmDelete = false;
            this.executeDelete(supplier);
          } else {
            this.supplierDependentComponents = names;
          }
        },
        (err) => {
          console.error('Errore fetching components', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: "Impossibile controllare le dipendenze"
          });
          this.displayConfirmDelete = false;
        }
      );
  }

  private executeDelete(s: Supplier) {
    this.saving = true;
    this.supplierService.deleteSupplier(s.id).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Fornitore eliminato',
        });
        this.refresh$.next();
        if (
          this.editingIndex >= 0 &&
          this.suppliers[this.editingIndex]?.id === s.id
        ) {
          this.resetForm();
        }
        this.saving = false;
      },
      (err) => {
        console.error('Delete error', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: "Impossibile eliminare il fornitore",
        });
        this.saving = false;
      }
    );
  }

  confirmDelete() {
    if (!this.supplierToDelete) {
      this.displayConfirmDelete = false;
      return;
    }
    this.saving = true;
    this.componentService
      .deleteComponentsBySupplier(this.supplierToDelete.id)
      .subscribe(
        () => {
          this.executeDelete(this.supplierToDelete!);
          this.displayConfirmDelete = false;
        },
        (err) => {
          console.error('Delete components error', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: "Non è stato possibile eliminare i componenti",
          });
          this.saving = false;
          this.displayConfirmDelete = false;
        }
      );
  }

  rejectDelete() {
    this.displayConfirmDelete = false;
    this.supplierToDelete = undefined;
    this.supplierDependentComponents = [];
  }

  resetForm() {
    this.newSupplier = new Supplier('', '', '');
    this.editingIndex = -1;
    this.formSubmitted = false;
    this.formValid = true;
  }

  shouldShowFieldError(val: any): boolean {
    return this.formSubmitted && !this.formValid && !val?.trim();
  }

  get isEditing(): boolean {
    return this.editingIndex >= 0;
  }

  get formTitle(): string {
    return this.isEditing ? 'Modifica Fornitore' : 'Aggiungi Nuovo Fornitore';
  }

  get submitButtonLabel(): string {
    return this.isEditing ? 'Aggiorna' : 'Aggiungi';
  }

  onGlobalFilter(event: Event, dt: any) {
    dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  private validateForm(): boolean {
    if (!this.newSupplier.name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Nome obbligatorio',
      });
      return false;
    }
    const dup = this.suppliers.find(
      (f, i) =>
        f.name.toLowerCase() ===
        this.newSupplier.name.trim().toLowerCase() && i !== this.editingIndex
    );
    if (dup) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Nome già esistente',
      });
      return false;
    }
    return true;
  }
}
