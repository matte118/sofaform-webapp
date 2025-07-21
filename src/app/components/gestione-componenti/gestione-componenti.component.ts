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
    // Remove ComponentTypeService since it's not needed anymore
  ],
  templateUrl: './gestione-componenti.component.html',
  styleUrls: ['./gestione-componenti.component.scss'],
})
export class GestioneComponentiComponent implements OnInit, AfterViewInit {
  @ViewChild('componentTable') componentTable?: ElementRef; // Make it optional with ?

  components: ComponentModel[] = [];
  newComponent: ComponentModel = new ComponentModel('', '', 0); // Removed empty array parameter
  availableSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;

  // Change to work with enum values and display names
  availableComponentTypes: { value: ComponentType; label: string }[] = [];
  selectedComponentType: ComponentType | null = null;

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

  // Add a property to store the current filter value
  currentFilterValue: string = '';

  // Add missing property for new component type
  newComponentType: ComponentType = ComponentType.FUSTO;

  constructor(
    private componentService: ComponentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private supplierService: SupplierService,
    // Remove componentTypeService since we're loading types directly
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
        // Remove logging about measure values since Component model doesn't have measure
        console.log('Components loaded:', components.map(c => ({
          name: c.name,
          type: c.type
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

    // Load component types directly instead of using service
    this.loadComponentTypes();

    // Use forkJoin to load all data simultaneously
    forkJoin({
      components: components$,
      suppliers: suppliers$,
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
    // Create array of enum options with labels
    this.availableComponentTypes = [
      { value: ComponentType.FUSTO, label: 'Fusto' },
      { value: ComponentType.GOMMA, label: 'Gomma' },
      { value: ComponentType.RETE, label: 'Rete' },
      { value: ComponentType.MATERASSO, label: 'Materasso' },
      { value: ComponentType.TAPPEZZERIA, label: 'Tappezzeria' },
      { value: ComponentType.PIEDINI, label: 'Piedini' },
      { value: ComponentType.FERRAMENTA, label: 'Ferramenta' },
      { value: ComponentType.VARIE, label: 'Varie' },
      { value: ComponentType.IMBALLO_PLASTICA, label: 'Imballo Plastica' },
      { value: ComponentType.SCATOLA, label: 'Scatola' },
      { value: ComponentType.TELA_MARCHIATA, label: 'Tela Marchiata' },
      { value: ComponentType.TRASPORTO, label: 'Trasporto' }
    ];
    this.cd.detectChanges();
    return this.availableComponentTypes; // Return the loaded types
  }

  addComponent() {
    this.formSubmitted = true;
    if (!this.validateForm()) {
      this.formValid = false;
      return;
    }
    this.formValid = true;
    this.saving = true;

    // Use the selected supplier directly instead of creating an array
    const component = new ComponentModel(
      this.isEditing ? this.components[this.editingIndex].id : '',
      this.newComponent.name.trim(),
      this.newComponent.price || 0,
      this.selectedSupplier || undefined, // Changed from suppliers array to single supplier
      this.selectedComponentType !== null && this.selectedComponentType !== undefined ? this.selectedComponentType : undefined
    );

    // Add explicit logging before saving
    console.log('GestioneComponenti: Final component object:', component);
    console.log('GestioneComponenti: Component type value:', component.type);
    console.log('GestioneComponenti: Component type typeof:', typeof component.type);

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
    console.log('Component type before editing:', component.type);

    // Deep copy to avoid reference issues
    this.newComponent = new ComponentModel(
      component.id,
      component.name,
      component.price,
      component.supplier ? JSON.parse(JSON.stringify(component.supplier)) : undefined,
      component.type
    );

    // Set the selected supplier directly instead of finding in array
    this.selectedSupplier = component.supplier || null;

    // Set component type (enum value) - this should populate the dropdown
    this.selectedComponentType = component.type !== undefined && component.type !== null ? component.type : null;
    console.log('Selected component type for editing:', this.selectedComponentType);
    console.log('Available component types:', this.availableComponentTypes);

    // Find the matching option to verify it exists
    const matchingTypeOption = this.availableComponentTypes.find(option => option.value === this.selectedComponentType);
    console.log('Matching type option found:', matchingTypeOption);

    this.editingIndex = index;

    // Don't auto-update name when editing - preserve the existing name
    // this.updateComponentName();

    // Scroll to the top of the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Focus the first input field after scrolling and trigger change detection
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
    this.newComponent = new ComponentModel('', '', 0); // Removed empty array parameter
    this.selectedSupplier = null;
    this.selectedComponentType = null;
    this.editingIndex = -1;
    // Reset form state
    this.formSubmitted = false;
    this.formValid = true;
    
    console.log('Form reset - selectedComponentType:', this.selectedComponentType);
  }

  // Add method to check if field should show error
  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowPriceError(): boolean {
    return this.formSubmitted && !this.formValid && this.newComponent.price < 0;
  }

  // Add method to check if component type should show error
  shouldShowComponentTypeError(): boolean {
    return this.formSubmitted && !this.formValid && (this.selectedComponentType === null || this.selectedComponentType === undefined);
  }

  // Add method to validate that type and supplier are selected
  private validateForm(): boolean {
    if (!this.newComponent.name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il nome del componente è obbligatorio',
      });
      return false;
    }

    // Rimuovi la validazione del fornitore - non è più obbligatorio
    // if (!this.selectedSupplier) {
    //   this.messageService.add({
    //     severity: 'error',
    //     summary: 'Errore di Validazione',
    //     detail: 'Il fornitore è obbligatorio',
    //   });
    //   return false;
    // }

    if (this.selectedComponentType === null || this.selectedComponentType === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore di Validazione',
        detail: 'Il tipo di componente è obbligatorio',
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

  // Rimuovi il metodo shouldShowSupplierError poiché non è più necessario
  // shouldShowSupplierError(): boolean {
  //   return this.formSubmitted && !this.formValid && !this.selectedSupplier;
  // }

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

  // Add method to automatically generate component name
  private updateComponentName(): void {
    // Only auto-generate if not editing an existing component
    if (this.isEditing) {
      return;
    }

    if (this.selectedComponentType !== null && this.selectedSupplier) {
      const typeName = this.getComponentTypeDisplayName(this.selectedComponentType);
      const supplierName = this.selectedSupplier.name;
      this.newComponent.name = `${typeName} ${supplierName}`;
    } else if (this.selectedComponentType !== null) {
      // If only type is selected, just use the type name
      const typeName = this.getComponentTypeDisplayName(this.selectedComponentType);
      this.newComponent.name = typeName;
    } else if (this.selectedSupplier) {
      // If only supplier is selected, just use the supplier name
      this.newComponent.name = this.selectedSupplier.name;
    } else {
      // Clear the name if neither type nor supplier is selected
      this.newComponent.name = '';
    }
  }

  // Add method to track the filter value
  onComponentTypeFilter(event: any) {
    this.currentFilterValue = event.filter;
  }

  // Add method to get ComponentType display name
  getComponentTypeDisplayName(type: ComponentType | null | undefined): string {
    if (type === null || type === undefined) return 'Non specificato';
    
    const typeOption = this.availableComponentTypes.find(option => option.value === type);
    return typeOption ? typeOption.label : 'Sconosciuto';
  }

  // Add method to handle supplier change
  onSupplierChange(event: any) {
    console.log('onSupplierChange called with:', event);
    console.log('Event value:', event.value);
    console.log('Selected supplier before change:', this.selectedSupplier);
    
    // Make sure we're setting the correct supplier
    this.selectedSupplier = event.value;
    
    console.log('Selected supplier after change:', this.selectedSupplier);
    
    // Update component name when supplier changes
    this.updateComponentName();
  }

  // Update method to work with enum
  onComponentTypeChange(event: any) {
    console.log('onComponentTypeChange called with:', event);
    console.log('Event value:', event.value);
    console.log('Selected component type before change:', this.selectedComponentType);
    
    // Make sure we're setting the correct enum value
    this.selectedComponentType = event.value;
    
    console.log('Selected component type after change:', this.selectedComponentType);
    console.log('Component type display name:', this.getComponentTypeDisplayName(this.selectedComponentType));
    
    // Update component name when type changes
    this.updateComponentName();
  }
}