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
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Rivestimento } from '../../../models/rivestimento.model';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { of, Subject } from 'rxjs';
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
    DialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-tessuti.component.html',
  styleUrl: './gestione-tessuti.component.scss',
})
export class GestioneTessutiComponent implements OnInit, AfterViewInit {
  @ViewChild('tessutoTable') tessutoTable?: ElementRef;

  tessuti: Rivestimento[] = [];
  newTessuto: Rivestimento = new Rivestimento('', '', 0);
  editingIndex = -1;
  loading = true;
  dataLoaded = false;
  saving = false;
  refreshNeeded = false;
  private refresh$ = new Subject<void>();
  formSubmitted = false;
  formValid = true;

  displayConfirmDelete = false;
  tessutoToDelete?: Rivestimento;

  constructor(
    private rivestimentoService: RivestimentoService,
    private messageService: MessageService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.loadTessuti();
    this.refresh$.subscribe(() => this.loadTessuti());
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.tessuti.length > 0 && this.refreshNeeded) {
        this.refreshTable();
      }
    }, 500);
  }

  loadTessuti() {
    this.loading = true;
    this.dataLoaded = false;

    this.rivestimentoService.getRivestimenti().subscribe({
      next: (tessuti) => {
        this.tessuti = tessuti;
        this.loading = false;
        this.dataLoaded = true;
        this.refreshNeeded = true;
        this.cd.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento tessuti',
        });
        this.loading = false;
        this.dataLoaded = true;
        this.cd.detectChanges();
      }
    });
  }

  // Remove the complex loadAllData method and use the simpler loadTessuti
  refreshTable() {
    if (this.tessutoTable) {
      const tableElement = this.tessutoTable.nativeElement;
      if (tableElement) {
        tableElement.classList.add('refreshing');
        setTimeout(() => {
          tableElement.classList.remove('refreshing');
          this.cd.detectChanges();
        }, 50);
      }
    }
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

    const operation = this.isEditing
      ? this.rivestimentoService.updateRivestimento(tessuto.id, tessuto)
      : this.rivestimentoService.addRivestimento(tessuto);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing
            ? 'Tessuto aggiornato con successo'
            : 'Tessuto creato con successo',
        });
        this.refresh$.next();
        this.resetForm();
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving tessuto:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing
            ? "Errore durante l'aggiornamento del tessuto"
            : 'Errore durante la creazione del tessuto',
        });
        this.saving = false;
      }
    });
  }

  editTessuto(tessuto: Rivestimento, index: number) {
    console.log('Editing tessuto:', tessuto);
    this.newTessuto = new Rivestimento(
      tessuto.id,
      tessuto.name,
      tessuto.mtPrice,
    );
    this.editingIndex = index;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    setTimeout(() => {
      const nameInput = document.getElementById('tessutoName');
      if (nameInput) {
        nameInput.focus();
      }
      this.cd.detectChanges();
    }, 500);
  }

  deleteTessuto(tessuto: Rivestimento) {
    this.tessutoToDelete = tessuto;
    this.displayConfirmDelete = true;
  }

  confirmDelete() {
    if (!this.tessutoToDelete) {
      this.displayConfirmDelete = false;
      return;
    }
    
    this.saving = true;
    this.rivestimentoService.deleteRivestimento(this.tessutoToDelete.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Tessuto eliminato con successo',
          });
          this.refresh$.next();
          
          if (
            this.editingIndex >= 0 &&
            this.tessuti[this.editingIndex]?.id === this.tessutoToDelete?.id
          ) {
            this.resetForm();
          }
          this.saving = false;
          this.displayConfirmDelete = false;
        },
        error: (error) => {
          console.error('Error deleting tessuto:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: "Errore durante l'eliminazione del tessuto",
          });
          this.saving = false;
          this.displayConfirmDelete = false;
        }
      });
  }

  rejectDelete() {
    this.displayConfirmDelete = false;
    this.tessutoToDelete = undefined;
  }

  resetForm() {
    this.newTessuto = new Rivestimento('', '', 0);
    this.editingIndex = -1;
    this.formSubmitted = false;
    this.formValid = true;
  }

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
    if (!this.newTessuto.name || !this.newTessuto.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il nome del tessuto è obbligatorio',
      });
      return false;
    }

    if (!this.newTessuto.mtPrice || this.newTessuto.mtPrice <= 0) {
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
        detail: 'Esiste già un tessuto con questo nome',
      });
      return false;
    }

    return true;
  }
}
