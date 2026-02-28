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
import { MessageModule } from 'primeng/message';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Variant, PricingMode } from '../../../models/variant.model';

import { SofaProduct } from '../../../models/sofa-product.model';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';

import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { PhotoUploadService } from '../../../services/upload.service';
import { AddProductDraft, AddProductDraftService } from '../../../services/add-product-draft.service';
import { SofaType } from '../../../models/sofa-type.model';

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
    MessageModule,
    SelectButtonModule
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

  pricingOptions: { label: string; value: PricingMode }[] = [
    { label: 'Componenti', value: 'components' as PricingMode },
    { label: 'Custom', value: 'custom' as PricingMode } // vedi nota sotto
  ];

  // 1) Selezioni singole
  selectedFusto?: ComponentModel;
  selectedGomma?: ComponentModel;
  selectedRete?: ComponentModel;
  selectedMaterasso?: ComponentModel;
  selectedFerroSchienale?: ComponentModel;
  selectedImballo?: ComponentModel;
  selectedScatola?: ComponentModel;
  selectedTelaMarchiata?: ComponentModel;
  selectedTrasporto?: ComponentModel;

  // 2) Piedini
  selectedPiedini?: ComponentModel;
  piediniQty: number | null = 1;
  piediniQuantityOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16];

  // 3) Liste multiple
  ferramentaList: ComponentModel[] = [];
  varieList: ComponentModel[] = [];
  tappezzeriaList: ComponentModel[] = [];
  imbottituraCuscinettiList: ComponentModel[] = [];


  // 4) Remove rivestimenti properties - completely removed
  // No longer needed as rivestimenti are handled separately

  currentStep = 0;
  value1 = 1;

  // Product basic information
  newSofaProduct = new SofaProduct('', '', '');

  // Variants management
  variants: Variant[] = [];
  newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);
  selectedVariant?: Variant;
  editingVariantIndex = -1;

  // Components management
  availableComponents: ComponentModel[] = [];
  selectedComponent?: ComponentModel;
  newComponent = new ComponentModel('', '', 0, undefined, undefined); // Changed from empty array to undefined for single supplier

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
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  mainImageIndex: number | null = null;
  draggedImageIndex: number | null = null;
  dragOverIndex: number | null = null;
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

  private autosaveSub?: Subscription;
  private lastSerialized = ''; // per evitare write inutili

  // Add a cache for component types
  private componentsByTypeCache = new Map<string, ComponentModel[]>();

  private componentNameMeasureCount = new Map<string, number>();
  private duplicateNameMeasureKeys = new Set<string>();

  // Add pricing mode properties
  selectedPricingMode: PricingMode = 'components';
  customVariantPrice: number = 0;
  customVariantName: string = '';
  sofaTypeOptions = [
    { label: 'Divano 3 PL Maxi', value: SofaType.DIVANO_3_PL_MAXI },
    { label: 'Divano 3 PL', value: SofaType.DIVANO_3_PL },
    { label: 'Divano 2 PL', value: SofaType.DIVANO_2_PL },
    { label: 'Chaise Longue', value: SofaType.CHAISE_LONGUE },
    { label: 'Pouf 50 x 50', value: SofaType.POUF_50_X_50 },
    { label: 'Pouf 60 x 60', value: SofaType.POUF_60_X_60 },
    { label: 'Pouf 70 x 70', value: SofaType.POUF_70_X_70 },
    { label: 'Elemento senza bracciolo', value: SofaType.ELEMENTO_SENZA_BRACCIOLO },
    { label: 'Elemento con bracciolo', value: SofaType.ELEMENTO_CON_BRACCIOLO },
    { label: 'Poltrona 90 cm', value: SofaType.POLTRONA_90_CM },
    { label: 'Poltrona 80 cm', value: SofaType.POLTRONA_80_CM },
    { label: 'Poltrona 70 cm', value: SofaType.POLTRONA_70_CM },
    { label: 'Custom', value: SofaType.CUSTOM },
  ];

  constructor(
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private componentService: ComponentService,
    private supplierService: SupplierService,
    private uploadService: PhotoUploadService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private draftService: AddProductDraftService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadInitialData();

      const draft = this.draftService.load();
      if (draft) {
        this.applyDraft(draft);
      }

      this.autosaveSub = interval(2000).subscribe(() => this.autosaveIfChanged());
    }
  }

  ngOnDestroy(): void {
    this.autosaveSub?.unsubscribe();
  }


  private loadInitialData() {
    this.componentService.getComponents().subscribe(components => {
      this.availableComponents = components;
      this.componentsByTypeCache.clear();
      this.rebuildDuplicateNameMeasureIndex(); // NEW
    });

    this.supplierService.getSuppliers().subscribe(supplier => {
      this.availableSuppliers = supplier;
    });
  }

  private rebuildDuplicateNameMeasureIndex(): void {
    this.componentNameMeasureCount.clear();
    this.duplicateNameMeasureKeys.clear();

    for (const c of this.availableComponents) {
      const key = this.buildNameMeasureKey(c);
      this.componentNameMeasureCount.set(
        key,
        (this.componentNameMeasureCount.get(key) || 0) + 1
      );
    }

    for (const [key, count] of this.componentNameMeasureCount.entries()) {
      if (count > 1) this.duplicateNameMeasureKeys.add(key);
    }
  }

  private buildNameMeasureKey(c: ComponentModel): string {
    const name = (c.name || '').trim().toLowerCase();
    const sofaType = c.sofaType
      ? this.getSofaTypeDisplayName(c.sofaType, c.sofaTypeCustomName).toLowerCase()
      : '';
    return `${name}|${sofaType}`;
  }

  private getSupplierNameForComponent(c: ComponentModel): string | undefined {
    if (!c?.supplier) return undefined;
    return c.supplier.name;
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

  addVariant(): void {
    this.variantFormSubmitted = true;
    if (!this.newVariant.longName) {
      this.variantFormValid = false;
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Completa tutti i campi obbligatori' });
      return;
    }
    if (this.newVariant.longName === SofaType.CUSTOM && !this.customVariantName.trim()) {
      this.variantFormValid = false;
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Inserisci il nome della variante custom' });
      return;
    }

    // Validate custom price if in custom mode
    if (this.selectedPricingMode === 'custom' && (this.customVariantPrice <= 0 || !this.customVariantPrice)) {
      this.variantFormValid = false;
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Inserisci un prezzo valido per la modalità custom' });
      return;
    }

    this.variantFormValid = true;

    // Create variant with proper price setting
    const variant = new Variant(
      '',
      this.newSofaProduct.id || '',
      this.newVariant.longName,
      0, // Initialize with 0, will be set correctly below
      [],
      this.newVariant.seatsCount,
      this.newVariant.mattressWidth,
      this.newVariant.openDepth,
      this.newVariant.closedDepth,
      this.newVariant.height,
      undefined,
      this.selectedPricingMode,
      this.selectedPricingMode === 'custom' ? this.customVariantPrice : undefined,
      this.newVariant.longName === SofaType.CUSTOM ? this.customVariantName.trim() : undefined
    );

    // Set the correct price based on pricing mode
    if (this.selectedPricingMode === 'custom') {
      variant.price = this.customVariantPrice;
      variant.customPrice = this.customVariantPrice;
    } else {
      variant.price = 0; // Will be calculated from components later
    }

    if (this.editingVariantIndex >= 0) {
      this.variants[this.editingVariantIndex] = variant;
      this.editingVariantIndex = -1;
    } else {
      this.variants.push(variant);
    }

    this.resetVariantForm();
  }

  editVariant(index: number): void {
    this.editingVariantIndex = index;
    const v = this.variants[index];
    this.newVariant = new Variant(
      v.id,
      v.sofaId,
      v.longName,
      v.price,
      v.components,
      v.seatsCount,
      v.mattressWidth,
      v.openDepth,
      v.closedDepth,
      v.height,
      undefined,
      v.pricingMode,
      v.customPrice,
      v.customName
    );
    this.selectedPricingMode = v.pricingMode;
    this.customVariantPrice = v.customPrice || 0;
    this.customVariantName = v.customName || '';
  }

  deleteVariant(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questa variante?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Conferma',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.variants.splice(index, 1);
        if (this.editingVariantIndex === index) {
          this.resetVariantForm();
        } else if (this.editingVariantIndex > index) {
          this.editingVariantIndex--;
        }
      }
    });
  }

  private resetVariantForm(): void {
    this.newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);
    this.selectedPricingMode = 'components';
    this.customVariantPrice = 0;
    this.customVariantName = '';
    this.variantFormSubmitted = false;
    this.editingVariantIndex = -1;
  }

  onPricingModeChange(): void {
    if (this.selectedPricingMode === 'custom') {
      // Reset component selections when switching to custom
      this.resetComponentSelections();
    }
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

      // Updated validation: only require components for variants in component mode
      const componentsVariants = this.variants.filter(v => v.pricingMode === 'components');
      const allComponentsVariantsHaveComponents = componentsVariants.every(v => v.components.length > 0);

      if (componentsVariants.length > 0 && !allComponentsVariantsHaveComponents) {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Ogni variante in modalità componenti deve avere almeno un componente. Applica i componenti o cambia modalità.'
        });
        return false;
      }
    }
    return true;
  }

  selectVariantForComponents(variant: Variant): void {
    this.selectedVariant = variant;
    this.componentQuantities.clear();

    // Reset component selections when changing variant
    this.resetComponentSelections();

    // Only populate if variant has components and is in components mode
    if (variant.components && variant.components.length > 0 && variant.pricingMode === 'components') {
      this.populateComponentSelections(variant.components);
    }

    const counts = new Map<string, number>();
    variant.components.forEach(c => counts.set(c.id || c.name, (counts.get(c.id || c.name) || 0) + 1));
    counts.forEach((qty, key) => this.componentQuantities.set(key, qty));
  }

  get canApplyComponents(): boolean {
    if (!this.selectedVariant || this.selectedVariant.pricingMode === 'custom') return false;

    return !!this.selectedFusto ||
      !!this.selectedGomma ||
      !!this.selectedRete ||
      !!this.selectedMaterasso ||
      !!this.selectedFerroSchienale ||
      !!this.selectedImballo ||
      !!this.selectedScatola ||
      !!this.selectedPiedini ||
      !!this.selectedTelaMarchiata ||
      !!this.selectedTrasporto ||
      this.tappezzeriaList.length > 0 ||
      this.imbottituraCuscinettiList.length > 0 ||
      this.ferramentaList.length > 0 ||
      this.varieList.length > 0;
  }

  applySpecialComponents(silent: boolean = false): boolean {
    if (!this.selectedVariant || this.selectedVariant.pricingMode === 'custom') return false;

    const missingComponents = [];
    if (!this.selectedFusto && !this.selectedGomma && !this.selectedRete && !this.selectedPiedini
      && !this.selectedMaterasso && !this.selectedFerroSchienale && !this.selectedImballo &&
      !this.selectedScatola && this.ferramentaList.length === 0 && this.varieList.length === 0 &&
      this.tappezzeriaList.length === 0 && this.imbottituraCuscinettiList.length === 0 && !this.selectedTelaMarchiata && !this.selectedTrasporto) {
      missingComponents.push('almeno un componente');
    }

    if (missingComponents.length > 0) {
      if (!silent) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Componenti mancanti',
          detail: `E' necessario selezionare ${missingComponents.join(', ')}`,
          life: 5000
        });
      }
      return false;
    }

    const comps: ComponentModel[] = [];
    [this.selectedFusto, this.selectedGomma, this.selectedRete, this.selectedMaterasso, this.selectedFerroSchienale, this.selectedImballo, this.selectedScatola, this.selectedTelaMarchiata, this.selectedTrasporto]
      .forEach(c => c && comps.push(c));
    if (this.selectedPiedini) {
      const qty = this.piediniQty ?? 0;
      for (let i = 0; i < qty; i++) {
        comps.push(this.selectedPiedini);
      }
    }
    this.ferramentaList.forEach(c => comps.push(c));
    this.varieList.forEach(c => comps.push(c));
    this.tappezzeriaList.forEach(c => comps.push(c));
    this.imbottituraCuscinettiList.forEach(c => comps.push(c));

    this.selectedVariant.components = comps;
    this.selectedVariant.updatePrice();

    if (!silent) {
      this.messageService.add({
        severity: 'success',
        summary: 'Componenti Applicati',
        detail: `${this.getVariantDisplayName(this.selectedVariant)} aggiornato`
      });
    }

    return true;
  }

  resetVariantComponents(variant?: Variant): void {
    if (!variant) return;

    variant.components = [];
    variant.updatePrice();
    if (variant === this.selectedVariant) {
      this.componentQuantities.clear();
      this.resetComponentSelections();
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Variante resettata',
      detail: `${this.getVariantDisplayName(variant)} è stata ripulita`
    });
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
            this.selectedMaterasso || this.selectedFerroSchienale || this.selectedImballo || this.selectedScatola ||
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

      // Se sono state caricate immagini in anticipo con ID temporaneo, rinomina/sposta sotto products/{pid}/
      if (this.uploadComplete && this.selectedFiles.length > 0 && this.newSofaProduct.photoUrl && this.newSofaProduct.photoUrl.length > 0) {
        this.saveProgress = 'Allineamento immagini prodotto...';

        // Aggiorna tutte le URL delle immagini per spostarle nella cartella del prodotto
        const renamePromises = this.newSofaProduct.photoUrl.map((url, index) =>
          this.uploadService.renameProductImage(url, pid, this.selectedFiles[index])
        );

        forkJoin(renamePromises).subscribe({
          next: (newUrls) => {
            // Aggiorna tutte le URL nel prodotto e salva
            this.newSofaProduct.photoUrl = newUrls;
            this.saveProgress = 'Aggiornamento prodotto...';
            this.sofaProductService.updateProduct(pid, this.newSofaProduct).subscribe({
              next: () => {
                this.saveProgress = 'Creazione varianti...';
                this.createVariants(pid);
              },
              error: () => {
                // Anche se l'update fallisce, procedi con la creazione varianti
                this.createVariants(pid);
              }
            });
          },
          error: (e) => {
            console.warn('Rinomina immagine fallita, procedo comunque:', e);
            this.saveProgress = 'Creazione varianti...';
            this.createVariants(pid);
          }
        });
      } else {
        this.saveProgress = 'Creazione varianti...';
        this.createVariants(pid);
      }
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Salvataggio fallito' });
      this.isSavingProduct = false;
    });
  }

  private createVariants(productId: string): void {
    const calls = this.variants.map(v => {
      v.sofaId = productId;

      // Only calculate price from components if variant is in components mode
      if (v.pricingMode === 'components') {
        const sumPrice = v.components.reduce((acc, comp) => acc + (comp.price || 0), 0);
        v.price = sumPrice;
      }
      // For custom pricing mode, ensure the price is preserved
      else if (v.pricingMode === 'custom' && v.customPrice !== undefined) {
        v.price = v.customPrice;
      }

      return this.variantService.createVariant(v);
    });
    forkJoin(calls).subscribe(ids => {
      this.sofaProductService.updateProductVariants(productId, ids).subscribe(() => {
        this.draftService.clear();
        this.router.navigate(['/prodotti']);
      });
    });
  }

  shouldShowProductFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowVariantFieldError(fieldValue: any): boolean {
    return this.variantFormSubmitted && !this.variantFormValid && !fieldValue;
  }

  shouldShowComponentFieldError(fieldValue: any): boolean {
    return this.componentFormSubmitted && !this.componentFormValid && !fieldValue?.trim();
  }

  removeImage(): void {
    // Delete all images from Firebase Storage
    if (this.newSofaProduct.photoUrl && this.newSofaProduct.photoUrl.length > 0) {
      const deletePromises = this.newSofaProduct.photoUrl.map(url =>
        this.uploadService.deleteImage(url)
      );

      forkJoin(deletePromises).subscribe({
        next: () => {
          console.log('All images deleted from Firebase Storage');
        },
        error: (error) => {
          console.error('Error deleting images:', error);
        },
      });
    }

    this.selectedFiles = [];
    this.imagePreviews = [];
    this.newSofaProduct.photoUrl = [];
    this.mainImageIndex = null;
    this.isUploading = false;
    this.uploadComplete = false;
  }

  onFileSelect(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      // Limit to maximum 3 images
      const filesToProcess = Array.from(files).slice(0, 3) as File[];
      this.selectedFiles = filesToProcess;
      this.imagePreviews = [];

      // Create previews for all selected files
      filesToProcess.forEach((file: File, index: number) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews[index] = e.target.result;
        };
        reader.readAsDataURL(file);
      });

      this.mainImageIndex = 0;

      // Upload all images immediately
      this.uploadMultipleImagesImmediately(filesToProcess);
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

        // Reload supplier and add the new one to the selected list
        this.supplierService.getSuppliers().subscribe((supplier) => {
          this.availableSuppliers = supplier;

          // Find the newly added supplier (it should be the one with the same name)
          const addedSupplier = supplier.find(
            (s) => s.name === this.newSupplier.name
          );
          if (addedSupplier) {
            // Add to selected supplier if any
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

  private uploadMultipleImagesImmediately(files: File[]): void {
    // Genera un ID temporaneo per il prodotto se non esiste
    const tempProductId = this.newSofaProduct.id || `temp_${Date.now()}`;

    this.isUploading = true;
    this.uploadComplete = false;

    // Upload all files in parallel
    const uploadPromises = files.map(file =>
      this.uploadService.uploadProductImage(file, tempProductId)
    );

    forkJoin(uploadPromises).subscribe({
      next: (results) => {
        // Extract download URLs from results
        const downloadUrls = results
          .filter(result => result.downloadURL)
          .map(result => result.downloadURL!);

        if (downloadUrls.length > 0) {
          this.newSofaProduct.photoUrl = downloadUrls;
          this.uploadComplete = true;
          this.isUploading = false;
          if (this.mainImageIndex === null) {
            this.mainImageIndex = 0;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: `${downloadUrls.length} immagini caricate con successo`,
          });
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadComplete = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il caricamento delle immagini',
        });
        console.error('Error uploading images:', error);
      }
    });
  }

  private uploadImageImmediately(file: File): void {
    this.uploadMultipleImagesImmediately([file]);
  }

  setMainImage(index: number): void {
    if (index < 0) return;

    const bringToFront = <T>(arr: T[] | undefined): T[] => {
      if (!arr || index >= arr.length) return arr || [];
      const copy = [...arr];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    };

    this.imagePreviews = bringToFront(this.imagePreviews);
    this.selectedFiles = bringToFront(this.selectedFiles);
    this.newSofaProduct.photoUrl = bringToFront(this.newSofaProduct.photoUrl);
    this.mainImageIndex = 0;
  }

  onImagesReorder(event: any): void {
    const from = event?.dragIndex;
    const to = event?.dropIndex;
    if (from === undefined || to === undefined) return;

    const move = <T>(arr: T[] | undefined) => {
      if (!arr || from < 0 || from >= arr.length || to < 0 || to > arr.length) return;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
    };

    move(this.imagePreviews);
    move(this.selectedFiles);
    move(this.newSofaProduct.photoUrl);
    this.mainImageIndex = 0;
  }

  onImageDragStart(index: number): void {
    this.draggedImageIndex = index;
  }

  onImageDragEnd(): void {
    this.draggedImageIndex = null;
    this.dragOverIndex = null;
  }

  onImageDragEnter(index: number): void {
    if (this.draggedImageIndex !== null && this.draggedImageIndex !== index) {
      this.dragOverIndex = index;
    }
  }

  onImageDragLeave(): void {
    this.dragOverIndex = null;
  }

  onImageDrop(targetIndex: number): void {
    if (this.draggedImageIndex === null) return;
    if (targetIndex === this.draggedImageIndex) {
      this.onImageDragEnd();
      return;
    }

    const from = this.draggedImageIndex;
    const to = targetIndex;

    const move = <T>(arr: T[] | undefined) => {
      if (!arr || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
    };

    move(this.imagePreviews);
    move(this.selectedFiles);
    move(this.newSofaProduct.photoUrl);
    this.mainImageIndex = 0;
    this.onImageDragEnd();
  }

  public getComponentsByType(type: string): ComponentModel[] {
    const lowerType = type.toLowerCase();

    if (!this.componentsByTypeCache.has(lowerType)) {
      const componentType = this.getComponentTypeFromString(type);

      const filtered = this.availableComponents.filter(c =>
        c.type === componentType
      );
      this.componentsByTypeCache.set(lowerType, filtered);
    }

    return this.componentsByTypeCache.get(lowerType) || [];
  }

  private getComponentTypeFromString(type: string): ComponentType | undefined {
    const typeMap: { [key: string]: ComponentType } = {
      'fusto': ComponentType.FUSTO,
      'gomma': ComponentType.GOMMA,
      'rete': ComponentType.RETE,
      'materasso': ComponentType.MATERASSO,
      'imbottitura_cuscinetti': ComponentType.IMBOTTITURA_CUSCINETTI,
      'ferro_schienale': ComponentType.FERRO_SCHIENALE,
      'tappezzeria': ComponentType.TAPPEZZERIA,
      'piedini': ComponentType.PIEDINI,
      'ferramenta': ComponentType.FERRAMENTA,
      'varie': ComponentType.VARIE,
      'imballo': ComponentType.IMBALLO,
      'scatola': ComponentType.SCATOLA,
      'tela_marchiata': ComponentType.TELA_MARCHIATA,
      'trasporto': ComponentType.TRASPORTO,
    };
    return typeMap[type.toLowerCase()];
  }

  onComponentSelected(type: string, component: any): void {
    console.log(`Componente ${type} selezionato:`, component);
  }

  formatComponentName(component: ComponentModel): string {
    if (!component) return '';

    const sofaTypeLabel = component.sofaType
      ? this.getSofaTypeDisplayName(component.sofaType, component.sofaTypeCustomName)
      : '';
    const hasSofaType = !!sofaTypeLabel.trim();
    const key = this.buildNameMeasureKey(component);

    let base = component.name;

    if (hasSofaType) {
      base += ` (${sofaTypeLabel})`;
    }

    if (!this.duplicateNameMeasureKeys.has(key)) {
      return base;
    }

    const supplierName = this.getSupplierNameForComponent(component);
    if (supplierName) {
      if (hasSofaType) {
        return `${component.name} (${sofaTypeLabel}) (${supplierName})`;
      } else {
        return `${component.name} (${supplierName})`;
      }
    }

    return base;
  }


  getComponentTypeDisplayName(type: ComponentType): string {
    const typeNames: { [key in ComponentType]: string } = {
      [ComponentType.FUSTO]: 'Fusto',
      [ComponentType.GOMMA]: 'Gomma',
      [ComponentType.RETE]: 'Rete',
      [ComponentType.MATERASSO]: 'Materasso',
      [ComponentType.FERRO_SCHIENALE]: 'Ferro Schienale',
      [ComponentType.IMBOTTITURA_CUSCINETTI]: 'Imbottitura Cuscinetti',
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

  getSofaTypeDisplayName(type: SofaType | null, customName?: string): string {
    if (!type) return '';
    if (type === SofaType.CUSTOM) {
      const cleaned = (customName || '').trim();
      if (cleaned) return cleaned;
    }
    const map: Record<SofaType, string> = {
      [SofaType.DIVANO_3_PL_MAXI]: 'Divano 3 PL Maxi',
      [SofaType.DIVANO_3_PL]: 'Divano 3 PL',
      [SofaType.DIVANO_2_PL]: 'Divano 2 PL',
      [SofaType.CHAISE_LONGUE]: 'Chaise Longue',
      [SofaType.POUF_50_X_50]: 'Pouf 50 x 50',
      [SofaType.POUF_60_X_60]: 'Pouf 60 x 60',
      [SofaType.POUF_70_X_70]: 'Pouf 70 x 70',
      [SofaType.ELEMENTO_SENZA_BRACCIOLO]: 'Elemento senza bracciolo',
      [SofaType.ELEMENTO_CON_BRACCIOLO]: 'Elemento con bracciolo',
      [SofaType.POLTRONA_90_CM]: 'Poltrona 90 cm',
      [SofaType.POLTRONA_80_CM]: 'Poltrona 80 cm',
      [SofaType.POLTRONA_70_CM]: 'Poltrona 70 cm',
      [SofaType.CUSTOM]: 'Custom',
    };
    return map[type] ?? String(type);
  }

  getVariantDisplayName(variant?: Variant | null): string {
    if (!variant) return '';
    if (variant.longName === SofaType.CUSTOM) {
      return (variant.customName || '').trim() || 'Custom';
    }
    return this.getSofaTypeDisplayName(variant.longName);
  }

  getGroupedComponents() {
    const map = new Map<string, { item: ComponentModel, qty: number }>();
    for (const c of this.selectedVariant!.components) {
      const key = c.id ?? c.name;
      if (!map.has(key)) {
        map.set(key, { item: c, qty: 1 });
      } else {
        map.get(key)!.qty++;
      }
    }
    return Array.from(map.values());
  }

  // Add helper methods
  isCustomPricingMode(): boolean {
    return this.selectedPricingMode === 'custom';
  }

  isCustomVariantType(): boolean {
    return this.newVariant.longName === SofaType.CUSTOM;
  }

  isComponentsPricingMode(): boolean {
    return this.selectedPricingMode === 'components';
  }

  shouldShowComponentsSection(): boolean {
    return this.selectedVariant?.pricingMode === 'components';
  }

  shouldShowCustomPriceWarning(): boolean {
    return this.selectedVariant?.pricingMode === 'custom';
  }

  // Helper to reset all component selections
  private resetComponentSelections(): void {
    this.selectedFusto = undefined;
    this.selectedGomma = undefined;
    this.selectedRete = undefined;
    this.selectedMaterasso = undefined;
    this.selectedFerroSchienale = undefined;
    this.selectedImballo = undefined;
    this.selectedScatola = undefined;
    this.selectedPiedini = undefined;
    this.selectedTelaMarchiata = undefined;
    this.selectedTrasporto = undefined;
    this.piediniQty = 1;
    this.ferramentaList = [];
    this.varieList = [];
    this.tappezzeriaList = [];
    this.imbottituraCuscinettiList = [];
  }

  // Helper to populate component selections from existing components
  private populateComponentSelections(components: ComponentModel[]): void {
    const compsByType = new Map<string, ComponentModel[]>();
    components.forEach(comp => {
      if (comp.type === undefined || comp.type === null) return;

      // Convert ComponentType enum to string for mapping
      let typeString = '';
      switch (comp.type) {
        case ComponentType.FUSTO:
          typeString = 'fusto';
          break;
        case ComponentType.GOMMA:
          typeString = 'gomma';
          break;
        case ComponentType.RETE:
          typeString = 'rete';
          break;
        case ComponentType.MATERASSO:
          typeString = 'materasso';
          break;
        case ComponentType.IMBOTTITURA_CUSCINETTI:
          typeString = 'imbottitura_cuscinetti';
          break;
        case ComponentType.TAPPEZZERIA:
          typeString = 'tappezzeria';
          break;
        case ComponentType.PIEDINI:
          typeString = 'piedini';
          break;
        case ComponentType.FERRAMENTA:
          typeString = 'ferramenta';
          break;
        case ComponentType.VARIE:
          typeString = 'varie';
          break;
        case ComponentType.IMBALLO:
          typeString = 'imballo';
          break;
        case ComponentType.SCATOLA:
          typeString = 'scatola';
          break;
        case ComponentType.TELA_MARCHIATA:
          typeString = 'tela_marchiata';
          break;
        case ComponentType.TRASPORTO:
          typeString = 'trasporto';
          break;
        default:
          return; // Skip unknown types
      }

      if (!compsByType.has(typeString)) compsByType.set(typeString, []);
      compsByType.get(typeString)?.push(comp);
    });

    this.selectedFusto = this.findMatchingComponent('fusto', compsByType);
    this.selectedGomma = this.findMatchingComponent('gomma', compsByType);
    this.selectedRete = this.findMatchingComponent('rete', compsByType);
    this.selectedMaterasso = this.findMatchingComponent('materasso', compsByType);
    this.selectedFerroSchienale = this.findMatchingComponent('ferro_schienale', compsByType);
    this.selectedImballo = this.findMatchingComponent('imballo', compsByType);
    this.selectedScatola = this.findMatchingComponent('scatola', compsByType);
    this.selectedTelaMarchiata = this.findMatchingComponent('tela_marchiata', compsByType);
    this.selectedTrasporto = this.findMatchingComponent('trasporto', compsByType);

    const piedini = compsByType.get('piedini');
    if (piedini?.length) {
      this.selectedPiedini = piedini[0];
      this.piediniQty = piedini.length;
    }

    this.ferramentaList = compsByType.get('ferramenta') || [];
    this.varieList = compsByType.get('varie') || [];
    this.tappezzeriaList = compsByType.get('tappezzeria') || [];
    this.imbottituraCuscinettiList = compsByType.get('imbottitura_cuscinetti') || [];
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

  hasSelectedComponents(): boolean {
    return !!(
      this.selectedFusto ||
      this.selectedGomma ||
      this.selectedRete ||
      this.selectedPiedini ||
      this.selectedMaterasso ||
      this.selectedFerroSchienale ||
      this.selectedImballo ||
      this.selectedScatola ||
      this.selectedTelaMarchiata ||
      this.selectedTrasporto ||
      this.imbottituraCuscinettiList.length > 0 ||
      this.ferramentaList.length > 0 ||
      this.varieList.length > 0 ||
      this.tappezzeriaList.length > 0
    );
  }

  getMissingRequiredComponents(): string[] {
    return this.hasSelectedComponents() ? [] : ['almeno un componente'];
  }

  removeComponentFromVariant(component: ComponentModel): void {
    if (!this.selectedVariant) return;

    const isSame = (a: ComponentModel | undefined, b: ComponentModel) =>
      !!a && ((a.id && b.id && a.id === b.id) || (!a.id && !b.id && a.name === b.name));

    const before = this.selectedVariant.components.length;
    this.selectedVariant.components = this.selectedVariant.components.filter(c => !isSame(c, component));

    if (before === this.selectedVariant.components.length) return;

    this.selectedVariant.updatePrice();

    if (isSame(this.selectedFusto, component)) this.selectedFusto = undefined;
    if (isSame(this.selectedGomma, component)) this.selectedGomma = undefined;
    if (isSame(this.selectedRete, component)) this.selectedRete = undefined;
    if (isSame(this.selectedMaterasso, component)) this.selectedMaterasso = undefined;
    if (isSame(this.selectedFerroSchienale, component)) this.selectedFerroSchienale = undefined;
    if (isSame(this.selectedImballo, component)) this.selectedImballo = undefined;
    if (isSame(this.selectedScatola, component)) this.selectedScatola = undefined;
    if (isSame(this.selectedTelaMarchiata, component)) this.selectedTelaMarchiata = undefined;
    if (isSame(this.selectedTrasporto, component)) this.selectedTrasporto = undefined;

    if (isSame(this.selectedPiedini, component)) {
      this.selectedPiedini = undefined;
      this.piediniQty = 1;
    }

    this.ferramentaList = this.ferramentaList.filter(c => !isSame(c, component));
    this.varieList = this.varieList.filter(c => !isSame(c, component));
    this.tappezzeriaList = this.tappezzeriaList.filter(c => !isSame(c, component));
    this.imbottituraCuscinettiList = this.imbottituraCuscinettiList.filter(c => !isSame(c, component));

    this.componentQuantities.clear();
    this.selectedVariant.components.forEach(c => {
      const key = c.id || c.name;
      this.componentQuantities.set(key, (this.componentQuantities.get(key) || 0) + 1);
    });

    this.messageService.add({
      severity: 'info',
      summary: 'Componente rimosso',
      detail: `${this.getVariantDisplayName(this.selectedVariant)} aggiornato`
    });
  }

  private getDraftSnapshot(): AddProductDraft {
    const selectedVariantIndex = this.selectedVariant
      ? this.variants.findIndex(v => v === this.selectedVariant)
      : null;

    const id = (c: any | undefined) => c?.id ?? null;

    return {
      currentStep: this.currentStep,
      newSofaProduct: {
        id: this.newSofaProduct.id,
        name: this.newSofaProduct.name,
        description: this.newSofaProduct.description,
        photoUrl: this.newSofaProduct.photoUrl || [],
        seduta: this.newSofaProduct.seduta,
        schienale: this.newSofaProduct.schienale,
        meccanica: this.newSofaProduct.meccanica,
        materasso: this.newSofaProduct.materasso
      },
      variants: this.variants.map(v => ({
        id: v.id,
        sofaId: v.sofaId,
        longName: v.longName,
        price: v.price,
        seatsCount: v.seatsCount,
        mattressWidth: v.mattressWidth,
        openDepth: v.openDepth,
        closedDepth: v.closedDepth,
        height: v.height,
        pricingMode: v.pricingMode,
        customPrice: v.customPrice,
        customName: v.customName,
        components: (v.components || []).map((c: any) => c?.id ?? null)
      })),
      selections: {
        selectedVariantIndex,
        selectedFustoId: id(this.selectedFusto),
        selectedGommaId: id(this.selectedGomma),
        selectedReteId: id(this.selectedRete),
        selectedMaterassoId: id(this.selectedMaterasso),
        selectedFerroSchienaleId: id(this.selectedFerroSchienale),
        selectedImballoId: id(this.selectedImballo),
        selectedScatolaId: id(this.selectedScatola),
        selectedTelaMarchiataId: id(this.selectedTelaMarchiata),
        selectedTrasportoId: id(this.selectedTrasporto),
        selectedPiediniId: id(this.selectedPiedini),
        piediniQty: this.piediniQty ?? null,
        ferramentaIds: (this.ferramentaList || []).map(id),
        varieIds: (this.varieList || []).map(id),
        tappezzeriaIds: (this.tappezzeriaList || []).map(id),
        imbottituraCuscinettiIds: (this.imbottituraCuscinettiList || []).map(id),
      },
      ui: {
        selectedPricingMode: this.selectedPricingMode,
        customVariantPrice: this.customVariantPrice,
        customVariantName: this.customVariantName,
        editingVariantIndex: this.editingVariantIndex
      }
    };
  }

  private applyDraft(d: AddProductDraft) {
    this.currentStep = d.currentStep ?? 0;
    this.newSofaProduct.name = d.newSofaProduct?.name ?? '';
    this.newSofaProduct.description = d.newSofaProduct?.description ?? '';
    this.newSofaProduct.photoUrl = d.newSofaProduct?.photoUrl ?? [];
    this.newSofaProduct.seduta = d.newSofaProduct?.seduta ?? '';
    this.newSofaProduct.schienale = d.newSofaProduct?.schienale ?? '';
    this.newSofaProduct.meccanica = d.newSofaProduct?.meccanica ?? '';
    this.newSofaProduct.materasso = d.newSofaProduct?.materasso ?? '';
    if ((this.newSofaProduct.photoUrl?.length || 0) > 0) {
      this.mainImageIndex = 0;
    }

    this.variants = (d.variants || []).map(v => {
      const openDepth = v.openDepth ?? 0;
      const closedDepth = v.closedDepth ?? (typeof (v as any).depth === 'number' ? (v as any).depth : undefined);
      const variant = new Variant(
        v.id ?? '',
        v.sofaId ?? '',
        (v.longName as SofaType) ?? SofaType.DIVANO_3_PL,
        v.price ?? 0,
        [],
        v.seatsCount,
        v.mattressWidth,
        openDepth,
        closedDepth,
        v.height,
        undefined,
        v.pricingMode ?? 'components',
        v.customPrice,
        v.customName
      );

      if (variant.pricingMode === 'custom' && typeof variant.customPrice === 'number') {
        variant.price = variant.customPrice;
      }
      return variant;
    });

    this.selectedPricingMode = d.ui?.selectedPricingMode ?? 'components';
    this.customVariantPrice = d.ui?.customVariantPrice ?? 0;
    this.customVariantName = d.ui?.customVariantName ?? '';
    this.editingVariantIndex = d.ui?.editingVariantIndex ?? -1;

    const mapById = (ids?: (string | null)[]) =>
      (ids || [])
        .map(x => this.availableComponents.find(c => c.id === x))
        .filter(Boolean) as ComponentModel[];

    const sel = (d.selections || {}) as AddProductDraft['selections'];
    this.selectedVariant = (sel.selectedVariantIndex != null && sel.selectedVariantIndex >= 0)
      ? this.variants[sel.selectedVariantIndex] ?? undefined
      : undefined;

    this.selectedFusto = this.availableComponents.find(c => c.id === sel.selectedFustoId);
    this.selectedGomma = this.availableComponents.find(c => c.id === sel.selectedGommaId);
    this.selectedRete = this.availableComponents.find(c => c.id === sel.selectedReteId);
    this.selectedMaterasso = this.availableComponents.find(c => c.id === sel.selectedMaterassoId);
    this.selectedFerroSchienale = this.availableComponents.find(c => c.id === sel.selectedFerroSchienaleId);
    this.selectedImballo = this.availableComponents.find(c => c.id === sel.selectedImballoId);
    this.selectedScatola = this.availableComponents.find(c => c.id === sel.selectedScatolaId);
    this.selectedTelaMarchiata = this.availableComponents.find(c => c.id === sel.selectedTelaMarchiataId);
    this.selectedTrasporto = this.availableComponents.find(c => c.id === sel.selectedTrasportoId);
    this.selectedPiedini = this.availableComponents.find(c => c.id === sel.selectedPiediniId);
    this.piediniQty = sel.piediniQty ?? null;

    this.ferramentaList = mapById(sel.ferramentaIds);
    this.varieList = mapById(sel.varieIds);
    this.tappezzeriaList = mapById(sel.tappezzeriaIds);
    this.imbottituraCuscinettiList = mapById(sel.imbottituraCuscinettiIds);

    d.variants?.forEach((v, idx) => {
      const ids = (v.components || []).filter(Boolean) as string[];
      if (ids.length) {
        this.variants[idx].components = ids
          .map(cid => this.availableComponents.find(c => c.id === cid))
          .filter(Boolean) as ComponentModel[];

        if (this.variants[idx].pricingMode === 'components') {
          this.variants[idx].updatePrice();
        }
      }
    });
  }

  private autosaveIfChanged() {
    try {
      const snapshot = this.getDraftSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized !== this.lastSerialized) {
        this.draftService.save(snapshot);
        this.lastSerialized = serialized;
      }
    } catch {
    }
  }
}
