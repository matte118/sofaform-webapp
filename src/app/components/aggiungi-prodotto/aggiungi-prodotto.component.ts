import { Component as NgComponent, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MultiSelectModule } from 'primeng/multiselect';
import { FileUploadModule } from 'primeng/fileupload';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';    // Add this for p-message component
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

import { SofaProduct } from '../../../models/sofa-product.model';
import { Variant } from '../../../models/variant.model';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';
import { Rivestimento } from '../../../models/rivestimento.model';

import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { PhotoUploadService } from '../../../services/upload.service';
import { RivestimentoService } from '../../../services/rivestimento.service';

@NgComponent({
  selector: 'app-aggiungi-prodotto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    StepsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    TableModule,
    FloatLabelModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextareaModule,
    ToastModule,
    DialogModule,
    FileUploadModule,
    HttpClientModule,
    ProgressSpinnerModule,
    MultiSelectModule,
    MessagesModule,
    MessageModule,  // Add this module to fix the p-message error
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './aggiungi-prodotto.component.html',
  styleUrls: ['./aggiungi-prodotto.component.scss'],
})
export class AggiungiProdottoComponent implements OnInit {
  steps: MenuItem[] = [
    { label: 'Informazioni Prodotto' },
    { label: 'Varianti' },
    { label: 'Componenti' },
  ];

  // 1) Selezioni singole
  selectedFusto?: ComponentModel;
  selectedGomma?: ComponentModel;
  selectedMeccanismo?: ComponentModel;
  selectedMaterasso?: ComponentModel;
  selectedImballo?: ComponentModel;
  selectedScatola?: ComponentModel;

  // 2) Piedini (minimo 2)
  selectedPiedini?: ComponentModel;
  piediniQty = 2;
  piediniQuantityOptions: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16];

  // 3) Liste multiple
  ferramentaList: ComponentModel[] = [];
  varieList: ComponentModel[] = [];

  // 4) Rivestimenti
  rivestimentiList: Rivestimento[] = [];
  selectedRivestimenti: Rivestimento[] = [];

  currentStep = 0;
  value1 = 1;

  // Product basic information
  newSofaProduct = new SofaProduct('', '', '');

  // Variants management
  variants: Variant[] = [];
  newVariant = new Variant('', '', '', 0);
  selectedVariant?: Variant;
  editingVariantIndex = -1;

  // Components management
  availableComponents: ComponentModel[] = [];
  selectedComponent?: ComponentModel;
  newComponent = new ComponentModel('', '', 0, [], undefined);
  editingComponentIndex = -1;

  // Suppliers
  availableSuppliers: Supplier[] = [];
  selectedSuppliers: Supplier[] = [];

  // Component types
  componentTypes: ComponentType[] = [];
  selectedComponentType?: ComponentType;

  // Markup and pricing
  markupPercentage = 30;
  finalPrices = new Map<string, number>();

  // Supplier dialog
  showAddSupplierDialog = false;
  newSupplier = new Supplier('', '', '');

  // Image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadComplete = false;

  // Save progress
  isSavingProduct = false;
  saveProgress = '';

  // Dialog visibility
  showSedutaDialog = false;
  showSchienaleDialog = false;
  showMeccanicaDialog = false;
  showMaterassoDialog = false;

  // Form tracking
  formSubmitted = false;
  formValid = true;
  variantFormSubmitted = false;
  variantFormValid = true;
  componentFormSubmitted = false;
  componentFormValid = true;

  isBrowser: boolean;

  // Component quantities map
  componentQuantities = new Map<string, number>();

  // Add a cache for component types
  private componentsByTypeCache = new Map<string, ComponentModel[]>();

  constructor(
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private rivestimentoService: RivestimentoService,
    private componentService: ComponentService,
    private supplierService: SupplierService,
    private uploadService: PhotoUploadService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadInitialData();
      this.rivestimentoService.getRivestimenti().subscribe(list => {
        this.rivestimentiList = list;
      });
    }
  }

  private loadInitialData() {
    this.componentService.getComponents().subscribe(components => {
      this.availableComponents = components;
      this.componentsByTypeCache.clear(); // Clear cache when components change
    });
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.availableSuppliers = suppliers;
    });
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      if (!this.validateCurrentStep()) return;
      if (this.currentStep === 2) this.calculateFinalPrices();
      this.currentStep++;
    }
  }

  get canApplyComponents(): boolean {
    // Prima verifica che sia stata selezionata una variante
    if (!this.selectedVariant) return false;

    // Abilita il pulsante se almeno un componente è stato selezionato
    return !!this.selectedFusto ||
      !!this.selectedGomma ||
      !!this.selectedMeccanismo ||
      !!this.selectedMaterasso ||
      !!this.selectedImballo ||
      !!this.selectedScatola ||
      !!this.selectedPiedini ||
      this.ferramentaList.length > 0 ||
      this.varieList.length > 0 ||
      this.selectedRivestimenti.length > 0;
  }

  getComponentQuantity(component: ComponentModel): number {
    if (!this.selectedVariant) return 0;

    return this.selectedVariant.components.filter(c =>
      (c.id && c.id === component.id) ||
      (!c.id && !component.id && c.name === component.name)
    ).length;
  }

  validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      if (!this.newSofaProduct.name.trim()) {
        this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Inserisci il nome del prodotto' });
        return false;
      }
      if (this.isUploading) {
        this.messageService.add({ severity: 'warn', summary: 'Attendere', detail: 'Attendere il completamento del caricamento dell\'immagine' });
        return false;
      }
      return true;
    }
    if (this.currentStep === 1 && this.variants.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Aggiungi almeno una variante' });
      return false;
    }
    if (this.currentStep === 2) {
      if (this.variants.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Aggiungi almeno una variante prima di continuare' });
        return false;
      }

      const allHaveComponents = this.variants.every(v => v.components.length > 0);
      if (!allHaveComponents) {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Ogni variante deve avere almeno un componente. Applica i componenti a tutte le varianti.'
        });
        return false;
      }
    }
    return true;
  }

  addVariant(): void {
    this.variantFormSubmitted = true;
    if (!this.newVariant.longName.trim()) {
      this.variantFormValid = false;
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Completa tutti i campi obbligatori' });
      return;
    }
    this.variantFormValid = true;
    const variant = new Variant('', this.newSofaProduct.id || '', this.newVariant.longName, this.newVariant.price, [], this.newVariant.seatsCount, this.newVariant.mattressWidth);
    if (this.editingVariantIndex >= 0) {
      this.variants[this.editingVariantIndex] = variant;
      this.editingVariantIndex = -1;
    } else {
      this.variants.push(variant);
    }
    this.newVariant = new Variant('', '', '', 0);
    this.variantFormSubmitted = false;
  }

  editVariant(index: number): void {
    this.editingVariantIndex = index;
    const v = this.variants[index];
    this.newVariant = new Variant(v.id, v.sofaId, v.longName, v.price, v.components, v.seatsCount, v.mattressWidth);
  }

  deleteVariant(index: number): void {
    this.confirmationService.confirm({ message: 'Sei sicuro?', accept: () => this.variants.splice(index, 1) });
  }

  selectVariantForComponents(variant: Variant): void {
    this.selectedVariant = variant;
    this.componentQuantities.clear();

    // Reset component selections when changing variant
    this.resetComponentSelections();

    // If the variant has components, try to pre-populate the selection fields
    if (variant.components && variant.components.length > 0) {
      this.populateComponentSelections(variant.components);
    }

    const counts = new Map<string, number>();
    variant.components.forEach(c => counts.set(c.id || c.name, (counts.get(c.id || c.name) || 0) + 1));
    counts.forEach((qty, key) => this.componentQuantities.set(key, qty));
  }

  // Helper to reset all component selections
  private resetComponentSelections(): void {
    this.selectedFusto = undefined;
    this.selectedGomma = undefined;
    this.selectedMeccanismo = undefined;
    this.selectedMaterasso = undefined;
    this.selectedImballo = undefined;
    this.selectedScatola = undefined;
    this.selectedPiedini = undefined;
    this.piediniQty = 2;
    this.ferramentaList = [];
    this.varieList = [];
  }

  // Helper to populate component selections from existing components
  private populateComponentSelections(components: ComponentModel[]): void {
    // Group components by type
    const compsByType = new Map<string, ComponentModel[]>();
    components.forEach(comp => {
      if (!comp.type) return;
      const type = comp.type.toLowerCase();
      if (!compsByType.has(type)) compsByType.set(type, []);
      compsByType.get(type)?.push(comp);
    });

    // Set single components
    this.selectedFusto = this.findMatchingComponent('fusto', compsByType);
    this.selectedGomma = this.findMatchingComponent('gomma', compsByType);
    this.selectedMeccanismo = this.findMatchingComponent('meccanismo', compsByType);
    this.selectedMaterasso = this.findMatchingComponent('materasso', compsByType);
    this.selectedImballo = this.findMatchingComponent('imballo', compsByType);
    this.selectedScatola = this.findMatchingComponent('scatola', compsByType);

    // Handle piedini specially to get quantity
    const piedini = compsByType.get('piedini');
    if (piedini?.length) {
      this.selectedPiedini = piedini[0];
      this.piediniQty = piedini.length;
    }

    // Multi-selects
    this.ferramentaList = compsByType.get('ferramenta') || [];
    this.varieList = compsByType.get('varie') || [];

    // Also look for rivestimenti
    const rivestimentiComponents = components.filter(c => c.type && c.type.toLowerCase() === 'rivestimento');
    if (rivestimentiComponents.length > 0) {
      // Try to match rivestimenti from components to available rivestimenti list
      this.selectedRivestimenti = rivestimentiComponents.map(c => {
        const nameParts = c.name.split(' ');
        if (nameParts.length >= 2) {
          const rivestimentoType = nameParts[1];
          const codeMatch = c.name.match(/\(([^)]+)\)/); // extract code in parentheses if any
          const code = codeMatch ? codeMatch[1] : '';
          return this.rivestimentiList.find(r => r.type === rivestimentoType && (!code || r.code === code)) || null;
        }
        return null;
      }).filter((r): r is Rivestimento => r !== null);
    }
  }

  // Helper to find a component in the availableComponents list
  private findMatchingComponent(type: string, compsByType: Map<string, ComponentModel[]>): ComponentModel | undefined {
    const compsOfType = compsByType.get(type);
    if (!compsOfType?.length) return undefined;

    // Find the matching available component
    const comp = compsOfType[0];
    return this.availableComponents.find(c =>
      (comp.id && c.id === comp.id) ||
      (!comp.id && c.name === comp.name)
    );
  }

  /**
   * Verifica se sono stati selezionati tutti i componenti obbligatori
   * @returns true se tutti i componenti obbligatori sono selezionati
   */
  hasSelectedComponents(): boolean {
    // Verifica che tutti i componenti obbligatori siano selezionati
    return !!(this.selectedFusto && 
              this.selectedGomma && 
              this.selectedPiedini && 
              this.selectedMeccanismo && 
              this.selectedMaterasso && 
              this.selectedImballo && 
              this.selectedScatola &&
              this.selectedRivestimenti && 
              this.selectedRivestimenti.length > 0);
    
    // I campi opzionali (ferramentaList e varieList) non influiscono sulla validazione
  }

  /**
   * Verifica se ci sono errori sui campi obbligatori dei componenti
   * @returns un array con i nomi dei campi mancanti
   */
  getMissingRequiredComponents(): string[] {
    const missingComponents = [];
    if (!this.selectedFusto) missingComponents.push('Fusto');
    if (!this.selectedGomma) missingComponents.push('Gomma');
    if (!this.selectedPiedini) missingComponents.push('Piedini');
    if (!this.selectedMeccanismo) missingComponents.push('Meccanismo');
    if (!this.selectedMaterasso) missingComponents.push('Materasso');
    if (!this.selectedImballo) missingComponents.push('Imballo');
    if (!this.selectedScatola) missingComponents.push('Scatola');
    if (!this.selectedRivestimenti || this.selectedRivestimenti.length === 0) missingComponents.push('Rivestimenti');
    return missingComponents;
  }

  // Aggiorniamo anche la funzione applySpecialComponents per usare la nuova funzione di validazione
  applySpecialComponents(silent: boolean = false): boolean {
    if (!this.selectedVariant) return false;

    // Less strict validation - allow the product to be saved with just one component
    const missingComponents = [];
    if (!this.selectedFusto && !this.selectedGomma && !this.selectedPiedini &&
      !this.selectedMeccanismo && !this.selectedMaterasso && !this.selectedImballo &&
      !this.selectedScatola && this.ferramentaList.length === 0 && this.varieList.length === 0) {
      missingComponents.push('almeno un componente');
    }

    // Controlla se i rivestimenti sono stati selezionati
    if (!this.selectedRivestimenti || this.selectedRivestimenti.length === 0) {
      missingComponents.push('almeno un rivestimento');
    }

    if (missingComponents.length > 0) {
      if (!silent) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Componenti mancanti',
          detail: `È necessario selezionare ${missingComponents.join(', ')}`,
          life: 5000
        });
      }
      return false;
    }

    const comps: ComponentModel[] = [];
    // singoli e piedini
    [this.selectedFusto, this.selectedGomma, this.selectedMeccanismo, this.selectedMaterasso, this.selectedImballo, this.selectedScatola]
      .forEach(c => c && comps.push(c));
    if (this.selectedPiedini) for (let i = 0; i < Math.max(2, this.piediniQty); i++) comps.push(this.selectedPiedini);
    // liste multiple
    this.ferramentaList.forEach(c => comps.push(c));
    this.varieList.forEach(c => comps.push(c));
    // rivestimenti
    this.selectedRivestimenti.forEach(r => comps.push(new ComponentModel(r.id, `Rivestimento ${r.type}${r.code ? ` (${r.code})` : ''}`, r.mtPrice, [], 'rivestimento')));

    this.selectedVariant.components = comps;
    
    // Salva i rivestimenti selezionati nella variante
    this.selectedVariant.rivestimenti = [...this.selectedRivestimenti];
    
    this.selectedVariant.updatePrice();

    if (!silent) {
      this.messageService.add({
        severity: 'success',
        summary: 'Componenti Applicati',
        detail: `${this.selectedVariant.longName} aggiornato`
      });
    }

    return true;
  }

  calculateFinalPrices(): void {
    this.finalPrices.clear();
    this.variants.forEach(v => {
      v.updatePrice();
      const cost = v.price;
      const final = cost / ((100 - this.markupPercentage) / 100);
      this.finalPrices.set(v.longName, Math.round(final * 100) / 100);
    });
  }

  saveProduct(): void {
    // Auto-apply components to each variant that has selections but no components
    if (this.variants.length > 0) {
      // Remember the currently selected variant
      const previouslySelected = this.selectedVariant;

      // Check each variant
      for (const variant of this.variants) {
        // If this variant has no components, try to auto-apply
        if (!variant.components || variant.components.length === 0) {
          this.selectedVariant = variant;

          // Only try to auto-apply if there are selected components
          const hasSelections = this.selectedFusto || this.selectedGomma || this.selectedPiedini ||
            this.selectedMeccanismo || this.selectedMaterasso ||
            this.selectedImballo || this.selectedScatola ||
            this.ferramentaList.length > 0 || this.varieList.length > 0;

          if (hasSelections) {
            this.applySpecialComponents(true); // Apply silently
          }
        }
      }

      // Restore the previously selected variant
      this.selectedVariant = previouslySelected;
    }

    if (!this.validateCurrentStep()) return;

    // Continue with normal save process
    this.isSavingProduct = true;
    this.saveProgress = 'Preparazione dati...';
    this.sofaProductService.createProduct(this.newSofaProduct).subscribe(pid => {
      this.newSofaProduct.id = pid;
      this.saveProgress = 'Creazione varianti...';
      this.createVariants(pid);
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Salvataggio fallito' });
      this.isSavingProduct = false;
    });
  }

  private createVariants(productId: string): void {
    const calls = this.variants.map(v => {
      v.sofaId = productId; v.price = this.finalPrices.get(v.longName) || 0;
      return this.variantService.createVariant(v);
    });
    forkJoin(calls).subscribe(ids => {
      this.sofaProductService.updateProductVariants(productId, ids).subscribe(() => {
        this.router.navigate(['/prodotti']);
      });
    });
  }

  shouldShowProductFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowVariantFieldError(fieldValue: any): boolean {
    return this.variantFormSubmitted && !this.variantFormValid && !fieldValue?.trim();
  }

  shouldShowComponentFieldError(fieldValue: any): boolean {
    return this.componentFormSubmitted && !this.componentFormValid && !fieldValue?.trim();
  }

  removeImage(): void {
    // Se l'immagine è già stata caricata, eliminala da Firebase Storage
    if (this.newSofaProduct.photoUrl) {
      this.uploadService.deleteImage(this.newSofaProduct.photoUrl).subscribe({
        next: () => {
          console.log('Image deleted from Firebase Storage');
        },
        error: (error) => {
          console.error('Error deleting image:', error);
        },
      });
    }

    this.selectedFile = null;
    this.imagePreview = null;
    this.newSofaProduct.photoUrl = '';
    this.isUploading = false;
    this.uploadComplete = false;
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Carica immediatamente l'immagine
      this.uploadImageImmediately(file);
    }
  }

  cancelAddSupplier(): void {
    this.showAddSupplierDialog = false;
  }

  saveSupplier(): void {
    if (!this.newSupplier.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Il nome del fornitore è obbligatorio',
      });
      return;
    }

    this.supplierService.addSupplier(this.newSupplier).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Fornitore aggiunto con successo',
        });

        // Reload suppliers and add the new one to the selected list
        this.supplierService.getSuppliers().subscribe((suppliers) => {
          this.availableSuppliers = suppliers;

          // Find the newly added supplier (it should be the one with the same name)
          const addedSupplier = suppliers.find(
            (s) => s.name === this.newSupplier.name
          );
          if (addedSupplier) {
            // Add to selected suppliers if any
            if (!this.selectedSuppliers) {
              this.selectedSuppliers = [];
            }
            this.selectedSuppliers.push(addedSupplier);
          }
        });

        this.showAddSupplierDialog = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il salvataggio del fornitore',
        });
        console.error('Error saving supplier:', error);
      }
    );
  }

  private uploadImageImmediately(file: File): void {
    // Genera un ID temporaneo per il prodotto se non esiste
    const tempProductId = this.newSofaProduct.id || `temp_${Date.now()}`;

    this.isUploading = true;
    this.uploadComplete = false;

    this.uploadService.uploadProductImage(file, tempProductId).subscribe({
      next: (result) => {
        // Se abbiamo ricevuto l'URL di download, l'upload è completato
        if (result.downloadURL) {
          this.newSofaProduct.photoUrl = result.downloadURL;
          this.uploadComplete = true;
          this.isUploading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Immagine caricata con successo',
          });
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadComplete = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: "Errore durante il caricamento dell'immagine",
        });
        console.error('Error uploading image:', error);
      },
    });
  }

  // Make method explicitly public for template access
  public getComponentsByType(type: string): ComponentModel[] {
    // Check cache first
    const lowerType = type.toLowerCase();

    if (!this.componentsByTypeCache.has(lowerType)) {
      // Cache miss - filter the components and store in cache
      const filtered = this.availableComponents.filter(c =>
        c.type && c.type.toLowerCase() === lowerType
      );
      this.componentsByTypeCache.set(lowerType, filtered);
    }

    // Return from cache
    return this.componentsByTypeCache.get(lowerType) || [];
  }

  onComponentSelected(type: string, component: any): void {
    console.log(`Componente ${type} selezionato:`, component);
  }

  /**
   * Format component name with measure if available
   * @param component The component to format
   * @returns Formatted name with measure
   */
  formatComponentName(component: ComponentModel): string {
    if (!component) return '';
    if (!component.measure) return component.name;
    return `${component.name} (${component.measure})`;
  }

  // Add this method to modify how components are displayed in dropdowns
  customComponentTemplate(component: ComponentModel): string {
    return this.formatComponentName(component);
  }
}
