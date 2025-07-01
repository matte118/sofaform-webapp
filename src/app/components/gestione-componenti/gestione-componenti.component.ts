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
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { ComponentTypeService } from '../../../services/component-type.service';
import { VariantService } from '../../../services/variant.service';
import { SofaProductService } from '../../../services/sofa-product.service';
import { DialogModule } from 'primeng/dialog';

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
    TooltipModule,
    MultiSelectModule,
    DialogModule,
  ],
  providers: [
    MessageService,
    ConfirmationService,
    SupplierService,
    ComponentTypeService,
  ],
  templateUrl: './gestione-componenti.component.html',
  styleUrls: ['./gestione-componenti.component.scss'],
})
export class GestioneComponentiComponent implements OnInit {
  components: ComponentModel[] = [];
  newComponent: ComponentModel = new ComponentModel('', '', 0, []);
  availableSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  availableComponentTypes: ComponentType[] = [];
  selectedComponentType: string | null = null;
  editingIndex: number = -1;
  loading: boolean = false;
  saving: boolean = false;

  // Add missing property for dialog visibility
  showComponentTypeDialog = false;

  // Add the missing property for new component type
  newComponentType: ComponentType = new ComponentType('', '');

  // Add a property to store the current filter value
  currentFilterValue: string = '';

  constructor(
    private componentService: ComponentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef,
    private supplierService: SupplierService,
    private componentTypeService: ComponentTypeService,
    private variantService: VariantService,
    private sofaProductService: SofaProductService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.loadSuppliers();
    this.loadComponentTypes();
    this.loadComponents();
  }

  loadComponents() {
    this.componentService.getComponents().subscribe(
      (comps) => {
        this.components = comps;
        // Forza Angular a rilevare le modifiche subito dopo l'evento onValue
        this.cd.detectChanges();
        this.loading = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento componenti',
        });
        console.error('Error loading components:', error);
        this.loading = false;
      }
    );
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(
      (suppliers: Supplier[]) => {
        this.availableSuppliers = suppliers;
        this.cd.detectChanges();
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento fornitori',
        });
        console.error('Error loading suppliers:', error);
      }
    );
  }

  loadComponentTypes() {
    this.componentTypeService.getComponentTypes().subscribe(
      (types: ComponentType[]) => {
        this.availableComponentTypes = types;
        this.cd.detectChanges();
      },
      (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento tipi di componente',
        });
        console.error('Error loading component types:', error);
      }
    );
  }

  addComponent() {
    if (!this.validateForm()) {
      return;
    }
    this.saving = true;

    // Creare un array di fornitori dal singolo fornitore selezionato (se presente)
    const suppliers = this.selectedSupplier ? [this.selectedSupplier] : [];

    const component = new ComponentModel(
      this.isEditing ? this.components[this.editingIndex].id : '',
      this.newComponent.name.trim(),
      this.newComponent.price || 0,
      suppliers,
      this.selectedComponentType || undefined
    );
    const operation = this.isEditing
      ? this.componentService.updateComponent(component.id, component)
      : this.componentService.addComponent(component);
    operation.subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: this.isEditing
            ? 'Componente aggiornato con successo'
            : 'Componente creato con successo',
        });
        this.loadComponents();
        this.resetForm();
        this.saving = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: this.isEditing
            ? "Errore durante l'aggiornamento del componente"
            : 'Errore durante la creazione del componente',
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
      component.type
    );

    // Imposta il fornitore selezionato dal primo fornitore nell'array (se esiste)
    this.selectedSupplier =
      component.suppliers?.length > 0 ? component.suppliers[0] : null;
    this.selectedComponentType = component.type || null;
    this.editingIndex = index;
  }

  private getProductsUsingComponent(componentId: string): Promise<string[]> {
    return new Promise((resolve) => {
      // Get all variants
      this.variantService.getVariants().subscribe((variants) => {
        // Find variants that use this component
        const variantsUsingComponent = variants.filter((variant) =>
          variant.components.some((comp) => comp.id === componentId)
        );

        if (variantsUsingComponent.length === 0) {
          resolve([]);
          return;
        }

        // Get all products
        this.sofaProductService.getSofaProducts().subscribe((products) => {
          const productNames: string[] = [];

          variantsUsingComponent.forEach((variant) => {
            const product = products.find((p) => p.id === variant.sofaId);
            if (product && !productNames.includes(product.name)) {
              productNames.push(product.name);
            }
          });

          resolve(productNames);
        });
      });
    });
  }

  deleteComponent(component: ComponentModel) {
    // First check which products use this component
    this.getProductsUsingComponent(component.id).then((productNames) => {
      if (productNames.length === 0) {
        // Component is not used in any products, proceed directly with deletion
        this.saving = true;
        this.componentService.deleteComponent(component.id).subscribe(
          () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Successo',
              detail: 'Componente eliminato con successo',
            });
            this.loadComponents();
            if (
              this.editingIndex >= 0 &&
              this.components[this.editingIndex]?.id === component.id
            ) {
              this.resetForm();
            }
            this.saving = false;
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: "Errore durante l'eliminazione del componente",
            });
            console.error('Error deleting component:', error);
            this.saving = false;
          }
        );
        return;
      }

      // Component is used in products, show confirmation dialog
      const message = `
        <div class="component-usage-warning">
          <div class="warning-content">
            <div class="warning-text">
              Questo componente è utilizzato nei seguenti prodotti:
            </div>
            
            <ul class="product-list">
              ${productNames
                .map((name) => `<li class="product-item">${name}</li>`)
                .join('')}
            </ul>
            
            <div class="removal-warning">
              <i class="pi pi-info-circle info-icon"></i>
              <span>
                <strong>Se procedi con l'eliminazione, il componente verrà automaticamente rimosso da tutti questi prodotti.</strong>
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
        rejectLabel: 'Annulla',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.saving = true;
          this.componentService.deleteComponent(component.id).subscribe(
            () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Successo',
                detail: `Componente eliminato con successo e rimosso da ${
                  productNames.length
                } prodotto${productNames.length > 1 ? 'i' : ''}`,
              });
              this.loadComponents();
              if (
                this.editingIndex >= 0 &&
                this.components[this.editingIndex]?.id === component.id
              ) {
                this.resetForm();
              }
              this.saving = false;
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Errore',
                detail: "Errore durante l'eliminazione del componente",
              });
              console.error('Error deleting component:', error);
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
    this.newComponent = new ComponentModel('', '', 0, []);
    this.selectedSupplier = null; // Cambiato da selectedSuppliers a selectedSupplier
    this.selectedComponentType = null;
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
        detail: 'Il nome del componente è obbligatorio',
      });
      return false;
    }

    if (this.newComponent.price < 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il prezzo non può essere negativo',
      });
      return false;
    }

    const duplicate = this.components.find(
      (comp, idx) =>
        comp.name.toLowerCase() ===
          this.newComponent.name.trim().toLowerCase() &&
        idx !== this.editingIndex
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Esiste già un componente con questo nome',
      });
      return false;
    }

    return true;
  }

  // Add a method to track the filter value
  onComponentTypeFilter(event: any) {
    this.currentFilterValue = event.filter;
  }

  createNewComponentType(event: Event) {
    event.stopPropagation();

    // Use the tracked filter value instead of trying to get it from the DOM
    const filterValue = this.currentFilterValue;

    if (!filterValue || !filterValue.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Inserisci un nome per il tipo di componente',
      });
      return;
    }

    // Create a new component type with the search value
    const newType = new ComponentType('', filterValue.trim());

    this.componentTypeService.addComponentType(newType).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Tipo di componente creato con successo',
        });

        // Reload the component types list
        this.loadComponentTypes();

        // Reset the filter value
        this.currentFilterValue = '';
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante la creazione del tipo di componente',
        });
        console.error('Error creating component type:', error);
      }
    );
  }

  // Add missing methods for dialog
  cancelAddComponentType() {
    this.showComponentTypeDialog = false;
  }

  saveComponentType() {
    if (!this.newComponentType.name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il nome del tipo di componente è obbligatorio',
      });
      return;
    }

    this.componentTypeService.addComponentType(this.newComponentType).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Tipo di componente creato con successo',
        });
        this.loadComponentTypes();
        this.showComponentTypeDialog = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante la creazione del tipo di componente',
        });
        console.error('Error saving component type:', error);
      }
    );
  }

  // Method to open the dialog
  openComponentTypeDialog() {
    this.newComponentType = new ComponentType('', '');
    this.showComponentTypeDialog = true;
  }
}
