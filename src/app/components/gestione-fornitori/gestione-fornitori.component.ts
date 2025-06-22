import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-fornitori.component.html',
  styleUrl: './gestione-fornitori.component.scss'
})
export class GestioneFornitoriComponent implements OnInit {
  suppliers: Supplier[] = [];
  newSupplier: Supplier = new Supplier('', '', '');
  editingIndex: number = -1;
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private supplierService: SupplierService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loading = true;
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(
      suppliers => {
        this.suppliers = suppliers;
        this.cd.detectChanges();
        this.loading = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento fornitori'
        });
        console.error('Error loading suppliers:', error);
        this.loading = false;
      }
    );
  }

  addSupplier() {
    if (!this.validateForm()) {
      return;
    }
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
          detail: this.isEditing ? 'Fornitore aggiornato con successo' : 'Fornitore creato con successo'
        });
        this.loadSuppliers();
        this.resetForm();
        this.saving = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing ? 'Errore durante l\'aggiornamento del fornitore' : 'Errore durante la creazione del fornitore'
        });
        console.error('Error saving supplier:', error);
        this.saving = false;
      }
    );
  }

  editSupplier(supplier: Supplier, index: number) {
    this.newSupplier = new Supplier(
      supplier.id,
      supplier.name,
      supplier.contact
    );
    this.editingIndex = index;
  }

  deleteSupplier(supplier: Supplier) {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il fornitore "${supplier.name}"?`,
      header: 'Conferma Eliminazione',
      accept: () => {
        this.saving = true;
        this.supplierService.deleteSupplier(supplier.id).subscribe(
          () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successo',
              detail: 'Fornitore eliminato con successo'
            });
            this.loadSuppliers();
            if (this.editingIndex >= 0 && this.suppliers[this.editingIndex]?.id === supplier.id) {
              this.resetForm();
            }
            this.saving = false;
          },
          error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Errore durante l\'eliminazione del fornitore'
            });
            console.error('Error deleting supplier:', error);
            this.saving = false;
          }
        );
      }
    });
  }

  resetForm() {
    this.newSupplier = new Supplier('', '', '');
    this.editingIndex = -1;
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
        detail: 'Il nome del fornitore è obbligatorio'
      });
      return false;
    }

    const duplicate = this.suppliers.find((supp, idx) =>
      supp.name.toLowerCase() === this.newSupplier.name.trim().toLowerCase() && idx !== this.editingIndex
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Esiste già un fornitore con questo nome'
      });
      return false;
    }

    return true;
  }
}
