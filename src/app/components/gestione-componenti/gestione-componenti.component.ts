import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit
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
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';

import { MessageService, ConfirmationService } from 'primeng/api';

import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { VariantService } from '../../../services/variant.service';
import { SofaProductService } from '../../../services/sofa-product.service';

import { forkJoin, of, Subject } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import {
  BulkComponentCreation,
  BulkComponentFixedData,
  BulkComponentVariableData
} from '../../../models/bulk-component.model';

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
    TabViewModule
  ],
  providers: [
    MessageService,
    ConfirmationService,
    SupplierService
  ],
  templateUrl: './gestione-componenti.component.html',
  styleUrls: ['./gestione-componenti.component.scss']
})
export class GestioneComponentiComponent implements OnInit, AfterViewInit {
  @ViewChild('componentTable') componentTable?: ElementRef;
  @ViewChild('variantEntriesContainer') variantEntriesContainer?: ElementRef<HTMLDivElement>;

  components: ComponentModel[] = [];
  newComponent: ComponentModel = new ComponentModel('', '', 0, []);
  availableSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;

  availableComponentTypes: { value: ComponentType; label: string }[] = [];
  selectedComponentType: ComponentType | null = null;

  editingIndex: number = -1;

  loading = true;
  dataLoaded = false;
  saving = false;

  private refresh$ = new Subject<void>();
  refreshNeeded = false;

  formSubmitted = false;
  formValid = true;

  showComponentTypeDialog = false;
  currentFilterValue: string = '';

  bulkFixedData: BulkComponentFixedData = {
    name: '',
    type: ComponentType.FUSTO
  };
  bulkVariableData: BulkComponentVariableData[] = [
    { supplier: null, measure: '', price: 0 }
  ];
  bulkFormSubmitted = false;

  activeTabIndex = 0;

  constructor(
    private componentService: ComponentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private supplierService: SupplierService,
    private variantService: VariantService,
    private sofaProductService: SofaProductService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.dataLoaded = false;
    this.loadAllData();

    this.refresh$.subscribe(() => {
      this.loadAllData();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.components.length > 0 && this.refreshNeeded) {
        this.refreshTable();
      }
    }, 500);
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    if (index === 0) {
      this.resetForm();
    } else if (index === 1) {
      this.resetBulkForm();
    }
  }

  private loadAllData() {
    this.loading = true;

    const components$ = this.componentService.getComponentsAsObservable().pipe(
      catchError(error => {
        console.error('Error loading components:', error);
        this.addError('Errore caricamento componenti');
        return of([]);
      }),
      tap(() => { })
    );

    const suppliers$ = this.supplierService.getSuppliersAsObservable().pipe(
      catchError(error => {
        console.error('Error loading suppliers:', error);
        this.addError('Errore caricamento fornitori');
        return of([]);
      })
    );

    this.loadComponentTypes();

    forkJoin({
      components: components$,
      suppliers: suppliers$
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;
          this.zone.run(() => {
            this.cd.detectChanges();
            setTimeout(() => {
              this.cd.detectChanges();
              this.refreshNeeded = false;
            }, 100);
          });
        })
      )
      .subscribe(results => {
        this.components = results.components;
        this.availableSuppliers = results.suppliers;
        this.refreshNeeded = true;
      });
  }

  private loadComponentTypes() {
    this.availableComponentTypes = [
      { value: ComponentType.FUSTO, label: 'Fusto' },
      { value: ComponentType.GOMMA, label: 'Gomma' },
      { value: ComponentType.RETE, label: 'Rete' },
      { value: ComponentType.MATERASSO, label: 'Materasso' },
      { value: ComponentType.PIEDINI, label: 'Piedini' },
      { value: ComponentType.FERRAMENTA, label: 'Ferramenta' },
      { value: ComponentType.VARIE, label: 'Varie' },
      { value: ComponentType.IMBALLO, label: 'Imballo' },
      { value: ComponentType.SCATOLA, label: 'Scatola' },
      { value: ComponentType.TELA_MARCHIATA, label: 'Tela Marchiata' },
      { value: ComponentType.TRASPORTO, label: 'Trasporto' }
    ];
    this.cd.detectChanges();
  }

  private refreshTable() {
    if (this.componentTable) {
      const el = this.componentTable.nativeElement;
      if (el) {
        el.classList.add('refreshing');
        setTimeout(() => {
          el.classList.remove('refreshing');
          this.cd.detectChanges();
        }, 50);
      }
    }
  }

  addComponent() {
    this.formSubmitted = true;
    if (!this.validateForm()) {
      this.formValid = false;
      return;
    }
    this.formValid = true;
    this.saving = true;

    const suppliers = this.selectedSupplier ? [this.selectedSupplier] : [];

    const component = new ComponentModel(
      this.isEditing ? this.components[this.editingIndex].id : '',
      this.newComponent.name.trim(),
      this.newComponent.price ?? 0,
      suppliers,
      this.selectedComponentType !== null ? this.selectedComponentType : undefined,
      this.newComponent.measure
    );

    const op$ = this.isEditing
      ? this.componentService.updateComponent(component.id, component)
      : this.componentService.addComponent(component);

    op$.subscribe(
      () => {
        this.addSuccess(
          this.isEditing
            ? 'Componente aggiornato con successo'
            : 'Componente creato con successo'
        );
        this.refresh$.next();
        this.resetForm();
        this.saving = false;
      },
      error => {
        this.addError(
          this.isEditing
            ? "Errore durante l'aggiornamento del componente"
            : 'Errore durante la creazione del componente'
        );
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
      JSON.parse(JSON.stringify(component.suppliers || [])),
      component.type,
      component.measure
    );

    if (component.suppliers?.length > 0) {
      const supplierId = component.suppliers[0].id;
      this.selectedSupplier =
        this.availableSuppliers.find(s => s.id === supplierId) || null;
    } else {
      this.selectedSupplier = null;
    }

    this.selectedComponentType = component.type || null;
    this.editingIndex = index;

    if (this.activeTabIndex !== 0) {
      this.activeTabIndex = 0;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.getElementById('componentName');
      nameInput?.focus();
      this.cd.detectChanges();
    }, 400);
  }

  deleteComponent(component: ComponentModel) {
    this.getProductsUsingComponent(component.id).then(productNames => {
      if (productNames.length === 0) {
        this.performDelete(component);
        return;
      }

      const message = `
        <div class="component-usage-warning">
          <div class="warning-content">
            <div class="warning-text">Questo componente è utilizzato nei seguenti prodotti:</div>
            <ul class="product-list">
              ${productNames.map(n => `<li class="product-item">${n}</li>`).join('')}
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
        message,
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sì',
        rejectLabel: 'No',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-danger',
        accept: () => this.performDelete(component),
        reject: () => { }
      });
    });
  }

  private performDelete(component: ComponentModel) {
    this.saving = true;
    this.componentService.deleteComponent(component.id).subscribe(
      () => {
        this.addSuccess('Componente eliminato con successo');
        this.loadAllData();
        if (
          this.editingIndex >= 0 &&
          this.components[this.editingIndex]?.id === component.id
        ) {
          this.resetForm();
        }
        this.saving = false;
      },
      error => {
        this.addError("Errore durante l'eliminazione del componente");
        console.error('Error deleting component:', error);
        this.saving = false;
      }
    );
  }

  saveBulkComponents() {
    this.bulkFormSubmitted = true;
    if (!this.validateBulkForm()) {
      return;
    }

    this.saving = true;

    const bulkCreation: BulkComponentCreation = {
      fixedData: { ...this.bulkFixedData },
      variableData: this.bulkVariableData.map(vd => ({
        supplier: vd.supplier,
        measure: vd.measure || '',
        price: vd.price || 0
      }))
    };

    this.componentService.addBulkComponents(bulkCreation).subscribe(
      () => {
        this.addSuccess(
          `${this.bulkVariableData.length} componenti creati con successo`
        );
        this.refresh$.next();
        this.resetBulkForm();
        this.activeTabIndex = 0;
        this.saving = false;
      },
      error => {
        this.addError('Errore durante la creazione dei componenti');
        console.error('Error saving bulk components:', error);
        this.saving = false;
      }
    );
  }

  addVariableDataEntry() {
    this.bulkVariableData.push({
      supplier: null,
      measure: '',
      price: 0
    });
    // Scroll automatico alla nuova variante (opzionale)
    setTimeout(() => {
      if (this.variantEntriesContainer?.nativeElement) {
        const el = this.variantEntriesContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  removeVariableDataEntry(index: number) {
    if (this.bulkVariableData.length > 1) {
      this.bulkVariableData.splice(index, 1);
    }
  }

  private getProductsUsingComponent(componentId: string): Promise<string[]> {
    return new Promise(resolve => {
      this.variantService.getVariants().subscribe(variants => {
        const variantsUsing = variants.filter(v =>
          v.components.some(c => c.id === componentId)
        );

        if (variantsUsing.length === 0) {
          resolve([]);
          return;
        }

        this.sofaProductService.getSofaProducts().subscribe(products => {
          const productNames: string[] = [];
          variantsUsing.forEach(variant => {
            const p = products.find(prod => prod.id === variant.sofaId);
            if (p && !productNames.includes(p.name)) {
              productNames.push(p.name);
            }
          });
          resolve(productNames);
        });
      });
    });
  }

  resetForm() {
    this.newComponent = new ComponentModel('', '', 0, []);
    this.selectedSupplier = null;
    this.selectedComponentType = null;
    this.editingIndex = -1;
    this.formSubmitted = false;
    this.formValid = true;
  }

  resetBulkForm() {
    this.bulkFixedData = {
      name: '',
      type: ComponentType.FUSTO
    };
    this.bulkVariableData = [
      { supplier: null, measure: '', price: 0 }
    ];
    this.bulkFormSubmitted = false;
  }

  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowPriceError(): boolean {
    return this.formSubmitted && !this.formValid && this.newComponent.price < 0;
  }

  shouldShowBulkFixedFieldError(fieldValue: any): boolean {
    return this.bulkFormSubmitted && !fieldValue?.trim();
  }

  shouldShowBulkVariablePriceError(price: number): boolean {
    return this.bulkFormSubmitted && price < 0;
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

  onComponentTypeChange(event: any) { }

  onComponentTypeFilter(event: any) {
    this.currentFilterValue = event.filter;
  }

  getComponentTypeDisplayName(type: ComponentType | null | undefined): string {
    if (type === null || type === undefined) return 'Non specificato';
    const found = this.availableComponentTypes.find(o => o.value === type);
    return found ? found.label : 'Sconosciuto';
  }

  private validateForm(): boolean {
    if (!this.newComponent.name?.trim()) {
      this.addError('Il nome del componente è obbligatorio', 'Errore di Validazione');
      return false;
    }

    if (this.newComponent.price < 0) {
      this.addError('Il prezzo non può essere negativo', 'Errore di Validazione');
      return false;
    }

    const duplicate = this.components.find(
      (comp, idx) =>
        comp.name.toLowerCase() === this.newComponent.name.trim().toLowerCase() &&
        idx !== this.editingIndex
    );

    if (duplicate) {
      this.addError('Esiste già un componente con questo nome', 'Errore di Validazione');
      return false;
    }

    return true;
  }

  private validateBulkForm(): boolean {
    if (!this.bulkFixedData.name?.trim()) {
      this.addError('Il nome del componente è obbligatorio', 'Errore di Validazione');
      return false;
    }

    for (let i = 0; i < this.bulkVariableData.length; i++) {
      const vd = this.bulkVariableData[i];
      if (vd.price < 0) {
        this.addError(`Il prezzo della variante ${i + 1} non può essere negativo`, 'Errore di Validazione');
        return false;
      }
    }

    return true;
  }

  private addError(detail: string, summary: string = 'Errore') {
    this.messageService.add({ severity: 'error', summary, detail });
  }

  private addSuccess(detail: string, summary: string = 'Successo') {
    this.messageService.add({ severity: 'success', summary, detail });
  }
}
