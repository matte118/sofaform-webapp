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
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, take, tap, catchError } from 'rxjs/operators';

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
export class GestioneComponentiComponent implements OnInit, AfterViewInit {
  @ViewChild('componentTable') componentTable?: ElementRef; // Make it optional with ?

  components: ComponentModel[] = [];
  newComponent: ComponentModel = new ComponentModel('', '', 0, []);
  availableSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  availableComponentTypes: ComponentType[] = [];
  selectedComponentType: string | null = null;
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
    private zone: NgZone,
    private supplierService: SupplierService,
    private componentTypeService: ComponentTypeService,
    private variantService: VariantService,
    private sofaProductService: SofaProductService
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
    // If we have components but they're not displaying correctly, force a refresh
    setTimeout(() => {
      if (this.components.length > 0 && this.refreshNeeded) {
        this.refreshTable();
      }
    }, 500);
  }

  // New method to load all data at once with proper error handling
  loadAllData() {
    this.loading = true;

    // Create observables for each data type
    const components$ = this.componentService.getComponentsAsObservable().pipe(
      catchError((error) => {
        console.error('Error loading components:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore caricamento componenti',
        });
        return of([]);
      }),
      tap(components => {
        // Add logging to check the measure values
        console.log('Components with measures:', components.map(c => ({
          name: c.name,
          measure: c.measure,
          measureType: typeof c.measure,
          isEmpty: c.measure === '',
          isNull: c.measure === null,
          isUndefined: c.measure === undefined
        })));
      })
    );

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

    const types$ = this.componentTypeService
      .getComponentTypesAsObservable()
      .pipe(
        catchError((error) => {
          console.error('Error loading component types:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore caricamento tipi di componente',
          });
          return of([]);
        })
      );

    // Use forkJoin to load all data simultaneously
    forkJoin({
      components: components$,
      suppliers: suppliers$,
      types: types$,
    })
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
      .subscribe((results) => {
        this.components = results.components;
        this.availableSuppliers = results.suppliers;
        this.availableComponentTypes = results.types;

        console.log(`Loaded ${this.components.length} components`);
        console.log(`Loaded ${this.availableSuppliers.length} suppliers`);
        console.log(
          `Loaded ${this.availableComponentTypes.length} component types`
        );

        this.refreshNeeded = true;
      });
  }

  // Utility method to force table refresh
  refreshTable() {
    if (this.componentTable) {
      const tableElement = this.componentTable.nativeElement;
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
    this.formSubmitted = true;
    if (!this.validateForm()) {
      this.formValid = false;
      return;
    }
    this.formValid = true;
    this.saving = true;

    // Creare un array di fornitori dal singolo fornitore selezionato (se presente)
    const suppliers = this.selectedSupplier ? [this.selectedSupplier] : [];

    // Find the actual component type object that matches the selected ID
    const selectedTypeObj = this.selectedComponentType
      ? this.availableComponentTypes.find(
          (type) => type.id === this.selectedComponentType
        )
      : null;

    const component = new ComponentModel(
      this.isEditing ? this.components[this.editingIndex].id : '',
      this.newComponent.name.trim(),
      this.newComponent.price || 0,
      suppliers,
      selectedTypeObj ? selectedTypeObj.name : undefined,
      this.newComponent.measure
    );

    console.log('Saving component with measure:', component.measure, 'Type:', typeof component.measure); // Debug log

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
            ? "Errore durante l'aggiornamento del componente"
            : 'Errore durante la creazione del componente',
        });
        console.error('Error saving component:', error);
        this.saving = false;
      }
    );
  }

  editComponent(component: ComponentModel, index: number) {
    console.log('Editing component:', component);

    // Deep copy to avoid reference issues
    this.newComponent = new ComponentModel(
      component.id,
      component.name,
      component.price,
      JSON.parse(JSON.stringify(component.suppliers || [])),
      component.type,
      component.measure // Include the measure/dimension field
    );

    // Find matching supplier in availableSuppliers
    if (component.suppliers?.length > 0) {
      const supplierId = component.suppliers[0].id;
      console.log('Looking for supplier with ID:', supplierId);

      const matchingSupplier = this.availableSuppliers.find(
        (s) => s.id === supplierId
      );
      this.selectedSupplier = matchingSupplier || null;

      console.log('Selected supplier:', this.selectedSupplier);
    } else {
      this.selectedSupplier = null;
    }

    // Set component type
    this.selectedComponentType = component.type || null;
    console.log('Selected component type:', this.selectedComponentType);

    this.editingIndex = index;

    // Scroll to the top of the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Focus the first input field after scrolling
    setTimeout(() => {
      const nameInput = document.getElementById('componentName');
      if (nameInput) {
        nameInput.focus();
      }
      this.cd.detectChanges();
    }, 500);
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
        rejectLabel: 'No',
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
    this.selectedSupplier = null;
    this.selectedComponentType = null;
    this.editingIndex = -1;
    // Reset form state
    this.formSubmitted = false;
    this.formValid = true;
  }

  // Add method to check if field should show error
  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowPriceError(): boolean {
    return this.formSubmitted && !this.formValid && this.newComponent.price < 0;
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

  // Add this method to track component type changes
  onComponentTypeChange(event: any) {
    console.log('Selected component type:', event.value);
    console.log('Full component type object:', 
      this.availableComponentTypes.find(type => type.id === event.value));
  }
}
