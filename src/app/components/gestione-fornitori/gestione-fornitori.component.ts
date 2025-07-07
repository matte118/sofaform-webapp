import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Supplier } from '../../../models/supplier.model';
import { SupplierService } from '../../../services/supplier.service';
import { ComponentService } from '../../../services/component.service';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

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
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-fornitori.component.html',
  styleUrls: ['./gestione-fornitori.component.scss'],
})
export class GestioneFornitoriComponent implements OnInit, AfterViewInit {
  @ViewChild('supplierTable') supplierTable?: ElementRef;

  suppliers: Supplier[] = [];
  newSupplier: Supplier = new Supplier('', '', '');
  editingIndex: number = -1;
  loading: boolean = true; // Start with loading true
  dataLoaded: boolean = false; // Track when data is loaded
  saving: boolean = false;

  // Tracking refresh
  refreshNeeded: boolean = false;
  private refresh$ = new Subject<void>();

  // Add form state tracking
  formSubmitted: boolean = false;
  formValid: boolean = true;

  constructor(
    private supplierService: SupplierService,
    private componentService: ComponentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.loading = true;
    this.dataLoaded = false;
    this.loadAllData();

    // Setup refresh listener
    this.refresh$.subscribe(() => {
      this.loadAllData();
    });
  }

  ngAfterViewInit() {
    // If we have suppliers but they're not displaying correctly, force a refresh
    setTimeout(() => {
      if (this.suppliers.length > 0 && this.refreshNeeded) {
        this.refreshTable();
      }
    }, 500);
  }

  // New method to load all data at once with proper error handling
  loadAllData() {
    this.loading = true;

    // Create observable for suppliers
    const suppliers$ = this.supplierService.getSuppliersAsObservable().pipe(
      catchError((error) => {
        console.error('Error loading suppliers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento fornitori',
        });
        return of([]);
      })
    );

    // Load suppliers
    suppliers$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;

          // Force detection in the Angular zone
          this.zone.run(() => {
            this.cd.detectChanges();

            // Schedule another change detection after a small delay to ensure icons are rendered
            setTimeout(() => {
              this.cd.detectChanges();
              this.refreshNeeded = false;
            }, 100);
          });
        })
      )
      .subscribe((suppliers) => {
        this.suppliers = suppliers;
        console.log(`Loaded ${this.suppliers.length} suppliers`);
        this.refreshNeeded = true;
      });
  }

  // Utility method to force table refresh
  refreshTable() {
    if (this.supplierTable) {
      const tableElement = this.supplierTable.nativeElement;
      if (tableElement) {
        // Toggle a class to force repaint
        tableElement.classList.add('refreshing');
        setTimeout(() => {
          tableElement.classList.remove('refreshing');
          this.cd.detectChanges();
        }, 50);
      }
    }
  }

  // Existing loadSuppliers method for backward compatibility
  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(
      (suppliers) => {
        this.suppliers = suppliers;
        this.cd.detectChanges();
        this.loading = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento fornitori',
        });
        console.error('Error loading suppliers:', error);
        this.loading = false;
      }
    );
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
      this.newSupplier.contact?.trim() ?? '' // Utilizzo dell'operatore optional chaining e coalescenza nulla
    );

    const operation = this.isEditing
      ? this.supplierService.updateSupplier(supplier.id, supplier)
      : this.supplierService.addSupplier(supplier);

    operation.subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing
            ? 'Fornitore aggiornato con successo'
            : 'Fornitore creato con successo',
        });

        // Use our refresh subject instead of direct calls
        this.refresh$.next();
        this.resetForm();
        this.saving = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing
            ? "Errore durante l'aggiornamento del fornitore"
            : 'Errore durante la creazione del fornitore',
        });
        console.error('Error saving supplier:', error);
        this.saving = false;
      }
    );
  }

  editSupplier(supplier: Supplier, index: number) {
    console.log('Editing supplier:', supplier);

    // Deep copy to avoid reference issues
    this.newSupplier = new Supplier(
      supplier.id,
      supplier.name,
      supplier.contact
    );

    this.editingIndex = index;

    // Scroll to the top of the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Focus the first input field after scrolling
    setTimeout(() => {
      const nameInput = document.getElementById('supplierName');
      if (nameInput) {
        nameInput.focus();
      }
      this.cd.detectChanges();
    }, 500);
  }

  private getComponentsUsingSupplier(supplierId: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.componentService
        .getComponentsBySupplier(supplierId)
        .subscribe((components) => {
          const componentNames = components.map((component) => component.name);
          resolve(componentNames);
        });
    });
  }

  deleteSupplier(supplier: Supplier) {
    // First check which components use this supplier
    this.getComponentsUsingSupplier(supplier.id).then((componentNames) => {
      if (componentNames.length === 0) {
        // Supplier is not used by any components, proceed directly with deletion
        this.saving = true;
        this.supplierService.deleteSupplier(supplier.id).subscribe(
          () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successo',
              detail: 'Fornitore eliminato con successo',
            });

            // Use our refresh subject
            this.refresh$.next();

            if (
              this.editingIndex >= 0 &&
              this.suppliers[this.editingIndex]?.id === supplier.id
            ) {
              this.resetForm();
            }
            this.saving = false;
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: "Errore durante l'eliminazione del fornitore",
            });
            console.error('Error deleting supplier:', error);
            this.saving = false;
          }
        );
        return;
      }

      // Supplier is used by components, show confirmation dialog
      const message = `
        <div class="supplier-usage-warning">
          <div class="warning-content">
            <div class="warning-text">
              Questo fornitore fornisce i seguenti componenti:
            </div>
            
            <ul class="component-list">
              ${componentNames
                .map((name) => `<li class="component-item">${name}</li>`)
                .join('')}
            </ul>
            
            <div class="removal-warning">
              <i class="pi pi-info-circle info-icon"></i>
              <span>
                <strong>Se procedi con l'eliminazione, tutti i componenti forniti da questo fornitore verranno automaticamente eliminati.</strong>
              </span>
            </div>
          </div>
        </div>
      `;

      this.confirmationService.confirm({
        message: message,
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sì',
        rejectLabel: 'No',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.saving = true;

          // First delete all components that use this supplier
          this.componentService
            .deleteComponentsBySupplier(supplier.id)
            .subscribe(
              () => {
                // Then delete the supplier itself
                this.supplierService.deleteSupplier(supplier.id).subscribe(
                  () => {
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Successo',
                      detail:
                        'Fornitore e componenti associati eliminati con successo',
                    });
                    this.loadSuppliers();
                    if (
                      this.editingIndex >= 0 &&
                      this.suppliers[this.editingIndex]?.id === supplier.id
                    ) {
                      this.resetForm();
                    }
                    this.saving = false;
                  },
                  (error) => {
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Errore',
                      detail: "Errore durante l'eliminazione del fornitore",
                    });
                    console.error('Error deleting supplier:', error);
                    this.saving = false;
                  }
                );
              },
              (error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Errore',
                  detail: "Errore durante l'eliminazione dei componenti",
                });
                console.error('Error deleting components:', error);
                this.saving = false;
              }
            );
        },
        reject: () => {
          console.log('Eliminazione annullata');
        },
      });
    });
  }

  resetForm() {
    this.newSupplier = new Supplier('', '', '');
    this.editingIndex = -1;
    // Reset form state
    this.formSubmitted = false;
    this.formValid = true;
  }

  // Add method to check if field should show error
  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
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
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }

  private validateForm(): boolean {
    if (!this.newSupplier.name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il nome del fornitore è obbligatorio',
      });
      return false;
    }

    const duplicate = this.suppliers.find(
      (supp, idx) =>
        supp.name.toLowerCase() ===
          this.newSupplier.name.trim().toLowerCase() &&
        idx !== this.editingIndex
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Esiste già un fornitore con questo nome',
      });
      return false;
    }

    return true;
  }
}
