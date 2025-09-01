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

  componentsView: Array<
    ComponentModel & {
      supplierName: string;
      typeLabel: string;
      priceText: string;
      priceTextComma: string;
    }
  > = [];


  components: ComponentModel[] = [];
  newComponent: ComponentModel = new ComponentModel('', '', null as any);

  availableSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;

  availableComponentTypes: { value: ComponentType; label: string }[] = [];
  selectedComponentType: ComponentType | null = null;

  editingIndex: number = -1;

  loading = true;
  dataLoaded = false;
  saving = false;

  editingId: string | null = null;

  private refresh$ = new Subject<void>();
  refreshNeeded = false;

  formSubmitted = false;
  formValid = true;

  showComponentTypeDialog = false;
  currentFilterValue: string = '';

  bulkFixedData: BulkComponentFixedData = {
    name: '',
    type: ComponentType.FUSTO,
    supplier: null
  };
  bulkVariableData: BulkComponentVariableData[] = [
    { measure: '', price: null as any, name: '' }
  ];

  bulkFormSubmitted = false;

  activeTabIndex = 0;

  showMultipleMeasuresDialog = false;
  measureEntries: { measure: string; price: number }[] = [{ measure: '', price: 0 }];
  multipleMeasuresFormSubmitted = false;

  displayConfirmDelete = false;
  loadingDependencies = false;
  componentToDelete?: ComponentModel;
  componentDependentProducts: string[] = [];

  // Price List Properties
  priceListData = {
    selectedSupplier: null as Supplier | null,
    percentage: null as number | null
  };

  filteredComponentsForPriceList: ComponentModel[] = [];
  displayConfirmPriceUpdate = false;
  savingPriceList = false;

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
      })
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

        this.rebuildComponentsView();

        this.refreshNeeded = true;
      });
  }


  private rebuildComponentsView(): void {
    this.componentsView = this.components.map(c => {
      const priceNum = c.price ?? null;
      const priceText = priceNum !== null ? priceNum.toFixed(2) : '';
      const priceTextComma = priceText ? priceText.replace('.', ',') : '';

      return {
        ...c,
        supplierName: c.supplier?.name ?? 'Nessuno',
        typeLabel: this.getComponentTypeDisplayName(c.type ?? null),
        priceText,
        priceTextComma
      };
    });
  }




  private loadComponentTypes() {
    this.availableComponentTypes = [
      { value: ComponentType.FUSTO, label: 'Fusto' },
      { value: ComponentType.GOMMA, label: 'Gomma' },
      { value: ComponentType.RETE, label: 'Rete' },
      { value: ComponentType.MATERASSO, label: 'Materasso' },
      { value: ComponentType.TAPPEZZERIA, label: 'Tappezzeria' },
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

    const component = new ComponentModel(
      this.isEditing ? (this.editingId || '') : '',
      this.newComponent.name.trim(),
      this.newComponent.price ?? 0,
      this.selectedSupplier || undefined,
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

  // Add method to handle measure change
  onMeasureChange(): void {
    this.updateComponentName();
  }

  // Update method to automatically generate component name including measure
  private updateComponentName(): void {
    // Only auto-generate if not editing an existing component
    if (this.isEditing) {
      return;
    }

    this.newComponent.name = this.generateComponentName(
      this.selectedComponentType,
      this.selectedSupplier,
      this.newComponent.measure
    );
  }

  generateComponentName(type: ComponentType | null, supplier: Supplier | null, measure?: string): string {
    const parts: string[] = [];

    if (type !== null) {
      parts.push(this.getComponentTypeDisplayName(type));
    }

    if (supplier) {
      parts.push(supplier.name);
    }

    if (measure && measure.trim()) {
      parts.push(measure.trim());
    }

    return parts.join(' ') || '';
  }

  // Multiple measures dialog methods
  openMultipleMeasuresDialog(): void {
    if (!this.selectedComponentType || !this.selectedSupplier) {
      this.addError('Seleziona tipo componente e fornitore prima di creare multiple misure');
      return;
    }

    this.measureEntries = [{ measure: '', price: 0 }];
    this.multipleMeasuresFormSubmitted = false;
    this.showMultipleMeasuresDialog = true;
  }

  onMultipleMeasuresDialogHide(): void {
    this.measureEntries = [{ measure: '', price: 0 }];
    this.multipleMeasuresFormSubmitted = false;
  }

  addMeasureEntry(): void {
    this.measureEntries.push({ measure: '', price: 0 });
  }

  removeMeasureEntry(index: number): void {
    if (this.measureEntries.length > 1) {
      this.measureEntries.splice(index, 1);
    }
  }

  shouldShowMeasureEntryError(measure: string): boolean {
    return this.multipleMeasuresFormSubmitted && !measure?.trim();
  }

  shouldShowMeasureEntryPriceError(price: number): boolean {
    return this.multipleMeasuresFormSubmitted && price < 0;
  }

  canSaveMultipleMeasures(): boolean {
    return this.measureEntries.every(entry =>
      entry.measure?.trim() && entry.price >= 0
    );
  }

  cancelMultipleMeasuresDialog(): void {
    this.showMultipleMeasuresDialog = false;
    this.onMultipleMeasuresDialogHide();
  }

  saveMultipleMeasures(): void {
    this.multipleMeasuresFormSubmitted = true;

    if (!this.canSaveMultipleMeasures()) {
      this.addError('Compila tutti i campi obbligatori per ogni misura');
      return;
    }

    this.saving = true;

    const componentPromises = this.measureEntries.map(entry => {
      const component = new ComponentModel(
        '', // ID will be generated
        this.generateComponentName(this.selectedComponentType, this.selectedSupplier, entry.measure),
        entry.price,
        this.selectedSupplier || undefined,
        this.selectedComponentType !== null ? this.selectedComponentType : undefined,
        entry.measure.trim()
      );

      return this.componentService.addComponent(component).toPromise();
    });

    Promise.all(componentPromises)
      .then(() => {
        this.addSuccess(`${this.measureEntries.length} componenti creati con successo`);
        this.refresh$.next();
        this.showMultipleMeasuresDialog = false;
        this.onMultipleMeasuresDialogHide();
        this.resetForm();
        this.saving = false;
      })
      .catch(error => {
        this.addError('Errore durante la creazione dei componenti');
        console.error('Error saving multiple measures:', error);
        this.saving = false;
      });
  }

  editComponent(component: ComponentModel, index: number) {
    console.log('Editing component:', component);
    console.log('Component supplier:', component.supplier);
    console.log('Component type before editing:', component.type);

    this.editingIndex = index;
    this.editingId = component.id;

    this.newComponent = new ComponentModel(
      component.id,
      component.name,
      component.price,
      component.supplier ? JSON.parse(JSON.stringify(component.supplier)) : undefined,
      component.type,
      component.measure
    );

    this.selectedSupplier = component.supplier || null;

    this.selectedComponentType = component.type !== undefined && component.type !== null
      ? component.type
      : null;

    console.log('Selected component type for editing:', this.selectedComponentType);
    console.log('Selected supplier for editing:', this.selectedSupplier);
    console.log('Component measure for editing:', this.newComponent.measure);

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
    this.componentToDelete = component;
    this.componentDependentProducts = [];
    this.loadingDependencies = true;
    this.displayConfirmDelete = true;

    // Recupera i prodotti che usano questo componente
    this.getProductsUsingComponent(component.id)
      .then(names => {
        this.componentDependentProducts = names;
        this.loadingDependencies = false;
      })
      .catch(() => {
        this.addError('Errore durante verifica dipendenze');
        this.loadingDependencies = false;
        this.displayConfirmDelete = false;
      });
  }

  // Se l’utente scarta
  rejectDelete() {
    this.displayConfirmDelete = false;
    this.componentToDelete = undefined;
  }

  // Se l’utente conferma
  confirmDelete() {
    if (!this.componentToDelete) { this.displayConfirmDelete = false; return; }
    this.saving = true;
    // (Eventualmente, qui cancelli anche relazioni / varianti se serve)
    this.componentService.deleteComponent(this.componentToDelete.id)
      .subscribe(() => {
        this.addSuccess('Componente eliminato con successo');
        this.refresh$.next();
        this.displayConfirmDelete = false;
        this.saving = false;
      }, err => {
        this.addError('Errore durante eliminazione');
        this.saving = false;
        this.displayConfirmDelete = false;
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

  // Bulk form event handlers
  onBulkTypeChange(event: any): void {
    this.bulkFixedData.type = event.value;
    this.updateBulkBaseName();
    this.updateAllVariantNames();
  }

  onBulkSupplierChange(event: any): void {
    this.bulkFixedData.supplier = event.value;
    this.updateBulkBaseName();
    this.updateAllVariantNames();
  }

  onBulkMeasureChange(index: number): void {
    // Update the specific variant name when measure changes
    this.updateVariantName(index);
    setTimeout(() => this.cd.detectChanges(), 0);
  }

  private updateAllVariantNames(): void {
    this.bulkVariableData.forEach((_, index) => {
      this.updateVariantName(index);
    });
    this.cd.detectChanges();
  }

  private updateVariantName(index: number): void {
    if (index < 0 || index >= this.bulkVariableData.length) {
      return;
    }

    const variableData = this.bulkVariableData[index];
    variableData.name = this.generateComponentName(
      this.bulkFixedData.type,
      this.bulkFixedData.supplier,
      variableData.measure
    );
  }

  private updateBulkBaseName(): void {
    if (this.bulkFixedData.type && this.bulkFixedData.supplier) {
      const typeName = this.getComponentTypeDisplayName(this.bulkFixedData.type);
      const supplierName = this.bulkFixedData.supplier.name;
      this.bulkFixedData.name = `${typeName} ${supplierName}`;
    } else {
      this.bulkFixedData.name = '';
    }
    this.cd.detectChanges();
  }

  getBulkBaseName(): string {
    return this.bulkFixedData.name;
  }

  getBulkVariantName(variableData: BulkComponentVariableData): string {
    const baseName = this.getBulkBaseName();
    if (!baseName) return '';

    if (variableData.measure && variableData.measure.trim()) {
      return `${baseName} ${variableData.measure.trim()}`;
    }

    return baseName;
  }

  getValidBulkVariants(): BulkComponentVariableData[] {
    return this.bulkVariableData.filter(vd =>
      vd.price >= 0
    );
  }

  canSaveBulkComponents(): boolean {
    if (this.bulkFixedData.type == null || !this.bulkFixedData.supplier) {
      return false;
    }

    return this.bulkVariableData.some(vd =>
      vd.measure?.trim() && vd.price >= 0
    );
  }

  shouldShowBulkMeasureError(measure: string): boolean {
    return this.bulkFormSubmitted && !measure?.trim();
  }

  saveBulkComponents() {
    this.bulkFormSubmitted = true;
    if (!this.validateBulkForm()) {
      return;
    }

    this.saving = true;

    const validVariants = this.getValidBulkVariants();
    // (Non serve più questo controllo: validateBulkForm lo copre)
    // if (validVariants.length === 0) { ... }

    const componentPromises = validVariants.map(vd => {
      const componentName = vd.name!.trim();  // prendo direttamente il nome inserito

      const component = new ComponentModel(
        '',                           // ID sarà generato lato server
        componentName,                // nome dalla variante
        vd.price,                     // prezzo
        this.bulkFixedData.supplier!, // fornitore (sicuro non nullo, validato sopra)
        this.bulkFixedData.type,      // tipo
        vd.measure?.trim()            // misura (opzionale)
      );

      return this.componentService.addComponent(component).toPromise();
    });

    Promise.all(componentPromises)
      .then(() => {
        this.addSuccess(`${validVariants.length} componenti creati con successo`);
        this.refresh$.next();
        this.resetBulkForm();
        this.activeTabIndex = 0;
        this.saving = false;
      })
      .catch(error => {
        this.addError('Errore durante la creazione dei componenti');
        console.error('Error saving bulk components:', error);
        this.saving = false;
      });
  }


  addVariableDataEntry() {
    const newVariant = {
      measure: '',
      price: 0,
      name: this.generateComponentName(this.bulkFixedData.type, this.bulkFixedData.supplier, '')
    };
    this.bulkVariableData.push(newVariant);
    setTimeout(() => {
      if (this.variantEntriesContainer?.nativeElement) {
        const el = this.variantEntriesContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  resetBulkForm() {
    this.bulkFixedData = { name: '', type: ComponentType.FUSTO, supplier: null };
    this.bulkVariableData = [
      { measure: '', price: null as any, name: '' }
    ];
    this.bulkFormSubmitted = false;
  }


  resetForm() {
    this.newComponent = new ComponentModel('', '', null as any);
    this.selectedSupplier = null;
    this.selectedComponentType = null;
    this.editingIndex = -1;
    this.editingId = null;
    this.formSubmitted = false;
    this.formValid = true;
  }


  private validateBulkForm(): boolean {
    // Controllo tipo e fornitore
    if (this.bulkFixedData.type == null) {
      this.addError('Il tipo di componente è obbligatorio', 'Errore di Validazione');
      return false;
    }

    if (!this.bulkFixedData.supplier) {
      this.addError('Il fornitore è obbligatorio', 'Errore di Validazione');
      return false;
    }

    const validVariants = this.getValidBulkVariants();
    // Almeno una variante valida
    if (validVariants.length === 0) {
      this.addError('Aggiungi almeno una variante con misura, prezzo e nome validi', 'Errore di Validazione');
      return false;
    }

    // Controllo campo 'name' non vuoto
    for (const vd of validVariants) {
      if (!vd.name?.trim()) {
        this.addError('Il nome di ogni variante è obbligatorio', 'Errore di Validazione');
        return false;
      }
    }

    // Controllo nomi duplicati tra le varianti stesse
    const names = validVariants.map(vd => vd.name!.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      this.addError('Non è possibile inserire due varianti con lo stesso nome', 'Errore di Validazione');
      return false;
    }

    // Controllo conflitto con componenti esistenti
    for (const vd of validVariants) {
      const nameToCheck = vd.name!.trim().toLowerCase();
      const exists = this.components.some(comp =>
        comp.name.toLowerCase() === nameToCheck
      );
      if (exists) {
        this.addError(
          `Esiste già un componente con il nome "${vd.name!.trim()}"`,
          'Errore di Validazione'
        );
        return false;
      }
    }

    return true;
  }


  // Add missing properties and getters
  get isEditing(): boolean {
    return this.editingIndex >= 0;
  }

  get formTitle(): string {
    return this.isEditing ? 'Modifica Componente' : 'Aggiungi Nuovo Componente';
  }

  get submitButtonLabel(): string {
    return this.isEditing ? 'Aggiorna' : 'Aggiungi';
  }

  // Add missing validateForm method
  private validateForm(): boolean {
    if (!this.newComponent.name?.trim()) {
      this.addError('Il nome del componente è obbligatorio', 'Errore di Validazione');
      return false;
    }

    if (this.newComponent.price < 0) {
      this.addError('Il prezzo non può essere negativo', 'Errore di Validazione');
      return false;
    }

    const duplicate = this.components.find(comp => {
      const sameId = this.isEditing && comp.id === this.editingId;
      if (sameId) return false;

      const isSameName = comp.name.trim().toLowerCase() === this.newComponent.name.trim().toLowerCase();
      const isSameMeasure = (comp.measure || '').trim().toLowerCase() === (this.newComponent.measure || '').trim().toLowerCase();
      return isSameName && isSameMeasure;
    });

    if (duplicate) {
      this.addError('Esiste già un componente con questo nome e misura', 'Errore di Validazione');
      return false;
    }

    return true;
  }

  // Add missing getProductsUsingComponent method
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

  // Add missing getComponentTypeDisplayName method
  getComponentTypeDisplayName(type: ComponentType | null): string {
    if (type === null || type === undefined) {
      return 'N/A';
    }

    const typeNames: { [key in ComponentType]: string } = {
      [ComponentType.FUSTO]: 'Fusto',
      [ComponentType.GOMMA]: 'Gomma',
      [ComponentType.RETE]: 'Rete',
      [ComponentType.MATERASSO]: 'Materasso',
      [ComponentType.TAPPEZZERIA]: 'Tappezzeria',
      [ComponentType.PIEDINI]: 'Piedini',
      [ComponentType.FERRAMENTA]: 'Ferramenta',
      [ComponentType.VARIE]: 'Varie',
      [ComponentType.IMBALLO]: 'Imballo',
      [ComponentType.SCATOLA]: 'Scatola',
      [ComponentType.TELA_MARCHIATA]: 'Tela Marchiata',
      [ComponentType.TRASPORTO]: 'Trasporto'
    };

    return typeNames[type] || 'Sconosciuto';
  }

  // Add missing shouldShowFieldError method
  shouldShowFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  // Add missing shouldShowPriceError method
  shouldShowPriceError(): boolean {
    return this.formSubmitted && (this.newComponent.price === null || this.newComponent.price < 0);
  }

  // Add missing shouldShowComponentTypeError method
  shouldShowComponentTypeError(): boolean {
    return this.formSubmitted && !this.formValid && (this.selectedComponentType === null || this.selectedComponentType === undefined);
  }

  // Add missing shouldShowBulkFixedFieldError method
  shouldShowBulkFixedFieldError(fieldValue: any): boolean {
    return this.bulkFormSubmitted && !fieldValue?.trim();
  }

  // Add missing shouldShowBulkVariablePriceError method
  shouldShowBulkVariablePriceError(price: number): boolean {
    return this.bulkFormSubmitted && price < 0;
  }

  // Add missing onGlobalFilter method
  onGlobalFilter(event: Event, dt: any) {
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }

  // Add missing removeVariableDataEntry method
  removeVariableDataEntry(index: number) {
    if (this.bulkVariableData.length > 1) {
      this.bulkVariableData.splice(index, 1);
    }
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

  // Add missing utility methods
  private addError(detail: string, summary: string = 'Errore') {
    this.messageService.add({ severity: 'error', summary, detail });
  }

  private addSuccess(detail: string, summary: string = 'Successo') {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  /** Nel componente: */
  shouldShowBulkNameError(name?: string): boolean {
    return this.bulkFormSubmitted && !name?.trim();
  }



  // Price List Methods
  onPriceListSupplierChange(event: any): void {
    this.priceListData.selectedSupplier = event.value;
    this.updateFilteredComponentsForPriceList();
  }

  onPercentageChange(): void {
    this.updateFilteredComponentsForPriceList();
  }

  updateFilteredComponentsForPriceList(): void {
    if (this.priceListData.selectedSupplier) {
      this.filteredComponentsForPriceList = this.components.filter(
        component => component.supplier?.id === this.priceListData.selectedSupplier!.id
      );
    } else {
      this.filteredComponentsForPriceList = [];
    }
  }

  calculateNewPrice(currentPrice: number): number {
    if (this.priceListData.percentage === null) return currentPrice;
    const multiplier = 1 + (this.priceListData.percentage / 100);
    return Math.round(currentPrice * multiplier * 100) / 100;
  }

  getPriceDifference(currentPrice: number): number {
    return this.calculateNewPrice(currentPrice) - currentPrice;
  }

  getPriceDifferenceClass(currentPrice: number): string {
    const difference = this.getPriceDifference(currentPrice);
    if (difference > 0) return 'price-increase';
    if (difference < 0) return 'price-decrease';
    return 'price-neutral';
  }

  confirmPriceListUpdate(): void {
    if (!this.priceListData.selectedSupplier || this.priceListData.percentage === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Seleziona un fornitore e inserisci una percentuale'
      });
      return;
    }

    if (this.filteredComponentsForPriceList.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Nessun componente da aggiornare per il fornitore selezionato'
      });
      return;
    }

    this.displayConfirmPriceUpdate = true;
  }

  async applyPriceListUpdate(): Promise<void> {
    if (!this.priceListData.selectedSupplier || this.priceListData.percentage === null) return;

    this.savingPriceList = true;

    try {
      await this.componentService.updateComponentsPricesBySupplier(
        this.priceListData.selectedSupplier.id,
        this.priceListData.percentage
      );

      // Update local components array
      this.filteredComponentsForPriceList.forEach(component => {
        const index = this.components.findIndex(c => c.id === component.id);
        if (index !== -1) {
          this.components[index].price = this.calculateNewPrice(component.price);
        }
      });

      this.rebuildComponentsView();
      this.updateFilteredComponentsForPriceList();

      this.messageService.add({
        severity: 'success',
        summary: 'Successo',
        detail: `Prezzi aggiornati per ${this.filteredComponentsForPriceList.length} componenti`
      });

      this.displayConfirmPriceUpdate = false;
      this.resetPriceListForm();

    } catch (error) {
      console.error('Errore durante l\'aggiornamento dei prezzi:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore durante l\'aggiornamento dei prezzi'
      });
    } finally {
      this.savingPriceList = false;
    }
  }

  rejectPriceUpdate(): void {
    this.displayConfirmPriceUpdate = false;
  }

  resetPriceListForm(): void {
    this.priceListData = {
      selectedSupplier: null,
      percentage: null
    };
    this.filteredComponentsForPriceList = [];
  }

}