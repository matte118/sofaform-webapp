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
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Rivestimento } from '../../../models/rivestimento.model';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-gestione-tessuti',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-tessuti.component.html',
  styleUrl: './gestione-tessuti.component.scss',
})
export class GestioneTessutiComponent implements OnInit, AfterViewInit {
  @ViewChild('tessutoTable') tessutoTable?: ElementRef;

  tessuti: Rivestimento[] = [];
  newTessuto: Rivestimento = new Rivestimento('', "", 0);
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
    private rivestimentoService: RivestimentoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) { }

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
    // If we have tessuti but they're not displaying correctly, force a refresh
    setTimeout(() => {
      if (this.tessuti.length > 0 && this.refreshNeeded) {
        this.refreshTable();
      }
    }, 500);
  }

  // New method to load all data at once with proper error handling
  loadAllData() {
    this.loading = true;

    // Create observable for tessuti
    const tessuti$ = this.rivestimentoService
      .getRivestimentiAsObservable()
      .pipe(
        catchError((error) => {
          console.error('Error loading tessuti:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore caricamento tessuti',
          });
          return of([]);
        })
      );

    // Load tessuti
    tessuti$
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
      .subscribe((tessuti) => {
        this.tessuti = tessuti;
        console.log(`Loaded ${this.tessuti.length} tessuti`);
        this.refreshNeeded = true;
      });
  }

  // Utility method to force table refresh
  refreshTable() {
    if (this.tessutoTable) {
      const tableElement = this.tessutoTable.nativeElement;
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

  // Existing method for backward compatibility
  loadTessuti() {
    this.rivestimentoService.getRivestimenti().subscribe(
      (tessuti) => {
        this.tessuti = tessuti;
        this.cd.detectChanges();
        this.loading = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento tessuti',
        });
        console.error('Error loading tessuti:', error);
        this.loading = false;
      }
    );
  }

  addTessuto() {
    this.formSubmitted = true;
    if (!this.validateForm()) {
      this.formValid = false;
      return;
    }
    this.formValid = true;
    this.saving = true;
    const tessuto = new Rivestimento(
      this.isEditing ? this.tessuti[this.editingIndex].id : '',
      this.newTessuto.name.trim(),
      this.newTessuto.mtPrice
    );
    console.log('Payload update:', tessuto);

    const operation = this.isEditing
      ? this.rivestimentoService.updateRivestimento(tessuto.id, tessuto)
      : this.rivestimentoService.addRivestimento(tessuto);

    operation.subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing
            ? 'Tessuto aggiornato con successo'
            : 'Tessuto creato con successo',
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
            ? "Errore durante l'aggiornamento del tessuto"
            : 'Errore durante la creazione del tessuto',
        });
        console.error('Error saving tessuto:', error);
        this.saving = false;
      }
    );
  }

  editTessuto(tessuto: Rivestimento, index: number) {
    console.log('Editing tessuto:', tessuto);

    // Deep copy to avoid reference issues
    this.newTessuto = new Rivestimento(
      tessuto.id,
      tessuto.name,
      tessuto.mtPrice,
    );

    this.editingIndex = index;

    // Scroll to the top of the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Focus the first input field after scrolling
    setTimeout(() => {
      const typeInput = document.getElementById('tessutoType');
      if (typeInput) {
        typeInput.focus();
      }
      this.cd.detectChanges();
    }, 500);
  }

  deleteTessuto(tessuto: Rivestimento) {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il tessuto?`,
      header: 'Conferma Eliminazione',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.saving = true;
        this.rivestimentoService.deleteRivestimento(tessuto.id).subscribe(
          () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successo',
              detail: 'Tessuto eliminato con successo',
            });

            // Use our refresh subject
            this.refresh$.next();

            if (
              this.editingIndex >= 0 &&
              this.tessuti[this.editingIndex]?.id === tessuto.id
            ) {
              this.resetForm();
            }
            this.saving = false;
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: "Errore durante l'eliminazione del tessuto",
            });
            console.error('Error deleting tessuto:', error);
            this.saving = false;
          }
        );
      },
    });
  }

  resetForm() {
    this.newTessuto = new Rivestimento('', '', 0);
    this.editingIndex = -1;
    // Reset form state
    this.formSubmitted = false;
    this.formValid = true;
  }

  // Add method to check if field should show error
  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue;
  }

  get isEditing(): boolean {
    return this.editingIndex >= 0;
  }

  get formTitle(): string {
    return this.isEditing ? 'Modifica Tessuto' : 'Aggiungi Nuovo Tessuto';
  }

  get submitButtonLabel(): string {
    return this.isEditing ? 'Aggiorna' : 'Aggiungi';
  }

  onGlobalFilter(event: Event, dt: any) {
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }

  private validateForm(): boolean {
    if (this.newTessuto.mtPrice <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il prezzo al metro deve essere maggiore di zero',
      });
      return false;
    }

    const duplicate = this.tessuti.find(
      (tessuto, idx) =>
        tessuto.name.toLowerCase() ===
        this.newTessuto.name.trim().toLowerCase() &&
        idx !== this.editingIndex
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Esiste già un tessuto con questo codice',
      });
      return false;
    }

    return true;
  }
}
