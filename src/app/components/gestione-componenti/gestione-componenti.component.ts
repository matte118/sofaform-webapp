import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentService } from '../../../services/component.service';

@Component({
    selector: 'app-gestione-componenti',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        FloatLabelModule,
        DividerModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './gestione-componenti.component.html',
    styleUrls: ['./gestione-componenti.component.scss']
})
export class GestioneComponentiComponent implements OnInit {
    components: ComponentModel[] = [];
    newComponent: ComponentModel = new ComponentModel('', '', 0, []);
    availableSuppliers: Supplier[] = [];
    selectedSuppliers: Supplier[] = [];
    editingIndex: number = -1;
    loading: boolean = false;
    saving: boolean = false;

    constructor(
        private componentService: ComponentService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loading = true;
        this.loadSuppliers();
        this.loadComponents();
    }

    loadComponents() {
        this.componentService.getComponents().subscribe(
            comps => {
                this.components = comps;
                // Forza Angular a rilevare le modifiche subito dopo l'evento onValue
                this.cd.detectChanges();
                this.loading = false;
            },
            error => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Errore caricamento componenti'
                });
                console.error('Error loading components:', error);
                this.loading = false;
            }
        );
    }

    loadSuppliers() {
        // Implementa in modo analogo tramite un SupplierService o usa il tuo RealtimeDbService
    }

    addComponent() {
        if (!this.validateForm()) {
            return;
        }
        this.saving = true;
        const component = new ComponentModel(
            this.isEditing ? this.components[this.editingIndex].id : '',
            this.newComponent.name.trim(),
            this.newComponent.price || 0,
            [...this.selectedSuppliers],
            
        );
        const operation = this.isEditing
            ? this.componentService.updateComponent(component.id, component)
            : this.componentService.addComponent(component);
        operation.subscribe(
            () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successo',
                    detail: this.isEditing ? 'Componente aggiornato con successo' : 'Componente creato con successo'
                });
                this.loadComponents();
                this.resetForm();
                this.saving = false;
            },
            error => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: this.isEditing ? 'Errore durante l\'aggiornamento del componente' : 'Errore durante la creazione del componente'
                });
                console.error('Error saving component:', error);
                this.saving = false;
            }
        );
    }

    editComponent(component: ComponentModel, index: number) {
        this.newComponent = new ComponentModel(
            component.id,
            component.name,
            component.price,
            component.suppliers,
        );
        this.selectedSuppliers = [...component.suppliers];
        this.editingIndex = index;
    }

    deleteComponent(component: ComponentModel) {
        this.confirmationService.confirm({
            message: `Sei sicuro di voler eliminare il componente "${component.name}"?`,
            header: 'Conferma Eliminazione',
            accept: () => {
                this.saving = true;
                this.componentService.deleteComponent(component.id).subscribe(
                    () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successo',
                            detail: 'Componente eliminato con successo'
                        });
                        this.loadComponents();
                        if (this.editingIndex >= 0 && this.components[this.editingIndex]?.id === component.id) {
                            this.resetForm();
                        }
                        this.saving = false;
                    },
                    error => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Errore',
                            detail: 'Errore durante l\'eliminazione del componente'
                        });
                        console.error('Error deleting component:', error);
                        this.saving = false;
                    }
                );
            }
        });
    }

    resetForm() {
        this.newComponent = new ComponentModel('', '', 0, []);
        this.selectedSuppliers = [];
        this.editingIndex = -1;
    }

    get isEditing(): boolean {
        return this.editingIndex >= 0;
    }

    get formTitle(): string {
        return this.isEditing ? 'Modifica Componente' : 'Aggiungi Nuovo Componente';
    }

    get submitButtonLabel(): string {
        return this.isEditing ? 'Aggiorna' : 'Aggiungi';
    }

    onGlobalFilter(event: Event, dt: any) {
        const target = event.target as HTMLInputElement;
        dt.filterGlobal(target.value, 'contains');
    }

    private validateForm(): boolean {
        if (!this.newComponent.name?.trim()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Errore di Validazione',
                detail: 'Il nome del componente è obbligatorio'
            });
            return false;
        }

        if (this.newComponent.price < 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Errore di Validazione',
                detail: 'Il prezzo non può essere negativo'
            });
            return false;
        }

        const duplicate = this.components.find((comp, idx) =>
            comp.name.toLowerCase() === this.newComponent.name.trim().toLowerCase() && idx !== this.editingIndex
        );

        if (duplicate) {
            this.messageService.add({
                severity: 'error',
                summary: 'Errore di Validazione',
                detail: 'Esiste già un componente con questo nome'
            });
            return false;
        }

        return true;
    }
}
