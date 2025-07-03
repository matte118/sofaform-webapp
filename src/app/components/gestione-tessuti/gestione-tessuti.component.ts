import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { RivestimentoType } from '../../../models/rivestimento-type.model';

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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-tessuti.component.html',
  styleUrl: './gestione-tessuti.component.scss'
})
export class GestioneTessutiComponent implements OnInit {
  tessuti: Rivestimento[] = [];
  newTessuto: Rivestimento = new Rivestimento('', null as any, 0, '');
  editingIndex: number = -1;
  loading: boolean = false;
  saving: boolean = false;

  // Add form state tracking
  formSubmitted: boolean = false;
  formValid: boolean = true;

  constructor(
    private rivestimentoService: RivestimentoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loading = true;
    this.loadTessuti();
  }

  loadTessuti() {
    this.rivestimentoService.getRivestimenti().subscribe(
      tessuti => {
        this.tessuti = tessuti;
        this.cd.detectChanges();
        this.loading = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento tessuti'
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
      this.newTessuto.type,
      this.newTessuto.mtPrice,
      this.newTessuto.code?.trim() ?? ''
    );

    const operation = this.isEditing
      ? this.rivestimentoService.updateRivestimento(tessuto.id, tessuto)
      : this.rivestimentoService.addRivestimento(tessuto);

    operation.subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing ? 'Tessuto aggiornato con successo' : 'Tessuto creato con successo'
        });
        this.loadTessuti();
        this.resetForm();
        this.saving = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing ? 'Errore durante l\'aggiornamento del tessuto' : 'Errore durante la creazione del tessuto'
        });
        console.error('Error saving tessuto:', error);
        this.saving = false;
      }
    );
  }

  editTessuto(tessuto: Rivestimento, index: number) {
    this.newTessuto = new Rivestimento(
      tessuto.id,
      tessuto.type,
      tessuto.mtPrice,
      tessuto.code
    );
    this.editingIndex = index;
  }

  deleteTessuto(tessuto: Rivestimento) {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il tessuto "${tessuto.type}" (${tessuto.code})?`,
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
              detail: 'Tessuto eliminato con successo'
            });
            this.loadTessuti();
            if (this.editingIndex >= 0 && this.tessuti[this.editingIndex]?.id === tessuto.id) {
              this.resetForm();
            }
            this.saving = false;
          },
          error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Errore durante l\'eliminazione del tessuto'
            });
            console.error('Error deleting tessuto:', error);
            this.saving = false;
          }
        );
      }
    });
  }

  resetForm() {
    this.newTessuto = new Rivestimento('', null as any, 0, '');
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
    if (!this.newTessuto.type) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il tipo di tessuto è obbligatorio'
      });
      return false;
    }

    if (!this.newTessuto.code?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il codice del tessuto è obbligatorio'
      });
      return false;
    }

    if (this.newTessuto.mtPrice <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il prezzo al metro deve essere maggiore di zero'
      });
      return false;
    }

    const duplicate = this.tessuti.find((tessuto, idx) =>
      tessuto.code?.toLowerCase() === this.newTessuto.code?.trim().toLowerCase() && idx !== this.editingIndex
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Esiste già un tessuto con questo codice'
      });
      return false;
    }

    return true;
  }
}
