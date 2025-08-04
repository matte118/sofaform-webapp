import { ApplicationRef } from '@angular/core';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';


import { SofaProduct } from '../../../models/sofa-product.model';
import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { Variant } from '../../../models/variant.model';
import { Rivestimento } from '../../../models/rivestimento.model';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { ComponentType } from '../../../models/component-type.model';
import { PhotoUploadService } from '../../../services/upload.service';
import { Component as ComponentModel } from '../../../models/component.model';
import { ComponentService } from '../../../services/component.service';
import { ExtraMattress } from '../../../models/extra-mattress.model';
import { PdfGenerationService } from '../../../services/pdf-generation.service';
import { firstValueFrom } from 'rxjs';

interface GroupedComponent {
  component: ComponentModel;
  quantity: number;
  totalPrice: number;
}

interface EditGroupedComponent {
  component: ComponentModel;
  quantity: number;
  indices: number[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    FormsModule,
    ConfirmDialogModule,
    DropdownModule,
    ToastModule,
    FileUploadModule,
    ProgressBarModule,
    TableModule,
    InputTextModule,
    InputTextareaModule,
    TooltipModule,
    MultiSelectModule,
    FloatLabelModule,
    InputNumberModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  @ViewChild('productForm') productForm?: NgForm;
  @ViewChild('fileUpload') fileUpload?: any;
  @ViewChild('hiddenFileInput') hiddenFileInput?: ElementRef;

  products: SofaProduct[] = [];
  productVariants: Map<string, Variant[]> = new Map();
  componentTypeMap = new Map<ComponentType, string>();
  expandedVariants: Set<string> = new Set();
  productImages: Map<string, string> = new Map();
  imageLoadErrors: Set<string> = new Set();

  // Dialog states
  showMarkupDialog = false;
  showRivestimentoDialog = false;
  showEditProductDialog = false;
  showAddComponentDialog = false;
  showVariantComponentsDialog = false;
  showListinoExtraMattressDialog = false;

  displayConfirmDelete = false;
  productToDelete?: SofaProduct;

  // Selected data
  selectedProduct?: SofaProduct;
  markupPercentage = 30;

  // Rivestimenti management
  availableRivestimenti: Rivestimento[] = [];
  tempRivestimentiSelection: Rivestimento[] = [];
  metersPerRivestimento: { [rivestimentoId: string]: number } = {};
  selectedRivestimentiForListino: { rivestimento: Rivestimento; metri: number }[] = [];
  selectedRivestimentiForVariant: Rivestimento[] = [];
  rivestimentiList: Rivestimento[] = [];
  selectedVariantForRivestimento?: Variant;

  // New properties for per-variant rivestimenti selection
  variantRivestimentiSelections: { [variantId: string]: Rivestimento[] } = {};
  variantRivestimentiMeters: { [variantId: string]: { [rivestimentoId: string]: number } } = {};

  uniformCoverMeters = 0;

  // Product editing
  editingProduct?: SofaProduct;
  editingVariants: Variant[] = [];
  editingVariantIndex = -1;
  newVariant: Variant = new Variant('', '', '', 0);

  // Extra options
  extraMattresses: ExtraMattress[] = [];
  extraMattressesForListino: ExtraMattress[] = [];
  deliveryPrice?: number;
  deliveryPriceListino: number = 0;   // Local state for listino flow

  // Image handling
  tempImageFile?: File;
  tempImageUrl?: string;
  imageRemoved = false;
  isUploadMode = false;
  uploadingNewImage = false;
  uploadProgress = 0;
  saving = false;

  showPdfTemplate = false;

  // Component management
  availableComponents: ComponentModel[] = [];
  selectedComponentForVariant?: ComponentModel;
  componentQuantityForVariant = 1;
  currentEditingVariant?: Variant;
  variantComponentsDialogTitle = '';

  // Component selections for variant
  selectedFusto?: ComponentModel;
  selectedGomma?: ComponentModel;
  selectedMeccanismo?: ComponentModel;
  selectedMaterasso?: ComponentModel;
  selectedImballo?: ComponentModel;
  selectedScatola?: ComponentModel;
  selectedPiedini?: ComponentModel;
  piediniQty = 2;
  piediniQuantityOptions: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16];
  ferramentaList: ComponentModel[] = [];
  varieList: ComponentModel[] = [];

  // Caching
  private componentsByTypeCache = new Map<string, ComponentModel[]>();
  private componentNameMeasureCount = new Map<string, number>();
  private duplicateNameMeasureKeys = new Set<string>();

  isBrowser: boolean;

  constructor(
    private appRef: ApplicationRef,
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private rivestimentoService: RivestimentoService,
    private uploadService: PhotoUploadService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
    private componentService: ComponentService,
    private zone: NgZone,
    private pdfService: PdfGenerationService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadProducts();
      this.loadRivestimenti();
      this.loadComponentTypes();
      this.loadAvailableComponents();
      this.loadRivestimentiList();
    }
  }

  // === Data Loading ===
  loadProducts(): void {
    this.sofaProductService.getSofaProducts().subscribe(products => {
      this.products = products;
      products.forEach(product => {
        this.variantService.getVariantsBySofaId(product.id).subscribe(variants => {
          this.productVariants.set(product.id, variants);
          this.rebuildDuplicateIndex();
          this.cdr.detectChanges();
        });
      });
      this.cdr.detectChanges();
    });
    this.products.map((product) => {
      console.log(product)
    });
  }

  loadRivestimenti(): void {
    this.rivestimentoService.getRivestimenti().subscribe(r => {
      this.availableRivestimenti = r;
      this.cdr.detectChanges();
    });
  }

  loadRivestimentiList(): void {
    this.rivestimentoService.getRivestimenti().subscribe(r => {
      this.rivestimentiList = r;
      this.cdr.detectChanges();
    });
  }

  loadComponentTypes(): void {
    this.componentTypeMap.set(ComponentType.FUSTO, 'Fusto');
    this.componentTypeMap.set(ComponentType.GOMMA, 'Gomma');
    this.componentTypeMap.set(ComponentType.RETE, 'Rete');
    this.componentTypeMap.set(ComponentType.MATERASSO, 'Materasso');
    this.componentTypeMap.set(ComponentType.PIEDINI, 'Piedini');
    this.componentTypeMap.set(ComponentType.FERRAMENTA, 'Ferramenta');
    this.componentTypeMap.set(ComponentType.VARIE, 'Varie');
    this.componentTypeMap.set(ComponentType.IMBALLO, 'Imballo');
    this.componentTypeMap.set(ComponentType.SCATOLA, 'Scatola');
    this.componentTypeMap.set(ComponentType.TELA_MARCHIATA, 'Tela Marchiata');
    this.componentTypeMap.set(ComponentType.TRASPORTO, 'Trasporto');
    this.cdr.detectChanges();
  }

  loadAvailableComponents(): void {
    this.componentService.getComponents().subscribe(components => {
      this.availableComponents = components;
      this.rebuildDuplicateIndex();
      this.componentsByTypeCache.clear();
      this.cdr.detectChanges();
    });
  }

  // === Utility Methods ===
  trackById(_: number, item: SofaProduct) {
    return item.id;
  }

  getProductVariants(productId: string): Variant[] {
    return this.productVariants.get(productId) || [];
  }

  getProductImageUrl(productId: string): string | null {
    return this.products.find(p => p.id === productId)?.photoUrl || null;
  }

  hasProductImage(productId: string): boolean {
    return !!this.getProductImageUrl(productId) && !this.imageLoadErrors.has(productId);
  }

  onImageError(productId: string): void {
    this.imageLoadErrors.add(productId);
    this.cdr.detectChanges();
  }

  getDefaultImage(): string {
    return 'assets/images/no-image-placeholder.png';
  }

  // === Rivestimenti Management ===
  async generaListino(product: SofaProduct) {
    // Create a deep clone to work with a copy, not the original reference
    this.selectedProduct = new SofaProduct(
      product.id,
      product.name,
      product.description,
      [...product.variants],
      product.photoUrl,
      product.seduta,
      product.schienale,
      product.meccanica,
      product.materasso,
      [...(product.materassiExtra || [])],
      product.deliveryPrice,
      product.ricarico
    );

    this.extraMattressesForListino = [...(product.materassiExtra as any as ExtraMattress[]) || []];
    this.deliveryPriceListino = product.deliveryPrice ?? 0;
    this.markupPercentage = product.ricarico ?? 30;

    // Reset rivestimenti selections
    this.variantRivestimentiSelections = {};
    this.variantRivestimentiMeters = {};
    this.selectedRivestimentiForListino = [];

    // Initialize and load existing rivestimenti for each variant
    const variants = this.getProductVariants(product.id);

    try {
      for (const variant of variants) {
        // Initialize empty arrays
        this.variantRivestimentiSelections[variant.id] = [];
        this.variantRivestimentiMeters[variant.id] = {};

        // Load existing rivestimenti from database
        const existingRivestimenti = await this.variantService.loadVariantRivestimenti(variant.id);

        if (existingRivestimenti && existingRivestimenti.length > 0) {
          // Populate selections and meters from database
          this.variantRivestimentiSelections[variant.id] = existingRivestimenti.map(item => item.rivestimento);

          existingRivestimenti.forEach(item => {
            this.variantRivestimentiMeters[variant.id][item.rivestimento.id] = item.metri;
          });
        }
      }
    } catch (error) {
      console.error('Error loading existing rivestimenti:', error);
      // Initialize with empty arrays if loading fails
      variants.forEach(variant => {
        this.variantRivestimentiSelections[variant.id] = [];
        this.variantRivestimentiMeters[variant.id] = {};
      });
    }

    this.showRivestimentoDialog = true;
    this.cdr.detectChanges();
  }

  // Add multiple rivestimenti to variant
  onVariantRivestimentiChange(variantId: string, selectedRivestimenti: Rivestimento[]): void {
    if (!variantId) return;

    // Update the selections
    this.variantRivestimentiSelections[variantId] = [...selectedRivestimenti];

    // Initialize meters for new rivestimenti
    if (!this.variantRivestimentiMeters[variantId]) {
      this.variantRivestimentiMeters[variantId] = {};
    }

    // Add meters for newly selected rivestimenti (preserve existing meters)
    selectedRivestimenti.forEach(r => {
      if (!this.variantRivestimentiMeters[variantId][r.id]) {
        this.variantRivestimentiMeters[variantId][r.id] = 0.1;
      }
    });

    // Remove meters for deselected rivestimenti
    const selectedIds = new Set(selectedRivestimenti.map(r => r.id));
    Object.keys(this.variantRivestimentiMeters[variantId]).forEach(rivestimentoId => {
      if (!selectedIds.has(rivestimentoId)) {
        delete this.variantRivestimentiMeters[variantId][rivestimentoId];
      }
    });

    this.cdr.detectChanges();
  }

  async confirmRivestimentiSelection(): Promise<void> {
    // Convert variant selections to the expected format and save to database
    this.selectedRivestimentiForListino = [];

    try {
      // Save rivestimenti for each variant to database
      for (const variantId of Object.keys(this.variantRivestimentiSelections)) {
        const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
        const variantRivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];

        rivestimenti.forEach(r => {
          const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;

          if (meters > 0) {
            variantRivestimentiData.push({ rivestimento: r, metri: meters });

            // Add to listino data
            const existing = this.selectedRivestimentiForListino.find(item => item.rivestimento.id === r.id);
            if (existing) {
              existing.metri += meters;
            } else {
              this.selectedRivestimentiForListino.push({ rivestimento: r, metri: meters });
            }
          }
        });
      }

      if (!this.selectedRivestimentiForListino.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Specifica i metri per almeno un rivestimento'
        });
        return;
      }

      this.showRivestimentoDialog = false;
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error saving rivestimenti:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore durante il salvataggio dei rivestimenti'
      });
    }
  }

  // === Markup and PDF Generation ===
  async generateWithMarkup() {
    if (!this.selectedProduct) {
      this.showMarkupDialog = false;
      this.cdr.detectChanges();
      return;
    }

    const variants = this.getProductVariants(this.selectedProduct.id);

    try {
      // Show loading state
      this.messageService.add({
        severity: 'info',
        summary: 'Generazione PDF',
        detail: 'Generazione del listino in corso...'
      });

      // 1. ✅ ADESSO salviamo tutto nel database

      // Salva i rivestimenti per ogni variante
      for (const variantId of Object.keys(this.variantRivestimentiSelections)) {
        const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
        const variantRivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];

        rivestimenti.forEach(r => {
          const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
          if (meters > 0) {
            variantRivestimentiData.push({ rivestimento: r, metri: meters });
          }
        });

        // Salva nel database solo ora
        if (variantRivestimentiData.length > 0) {
          await this.variantService.saveVariantRivestimenti(variantId, variantRivestimentiData);
        }
      }

      // Salva il prodotto aggiornato
      const updatedProduct: SofaProduct = {
        ...this.selectedProduct,
        materassiExtra: [...this.extraMattressesForListino],
        deliveryPrice: this.deliveryPriceListino,
        ricarico: this.markupPercentage
      };

      await firstValueFrom(this.sofaProductService.updateSofaProduct(updatedProduct.id, updatedProduct));

      // 2. Generate PDF
      this.showPdfTemplate = true;
      this.cdr.detectChanges();
      await new Promise(res => setTimeout(res, 100));

      this.pdfService.setListinoData(
        updatedProduct,
        this.getProductVariants(updatedProduct.id),
        this.selectedRivestimentiForListino,
        this.extraMattressesForListino,
        this.markupPercentage,
        this.deliveryPriceListino
      );

      await this.pdfService.generateListinoPdf(updatedProduct.name);
      this.showPdfTemplate = false;
      this.cdr.detectChanges();

      // 3. Update local product copy
      const productIndex = this.products.findIndex(p => p.id === updatedProduct.id);
      if (productIndex !== -1) {
        this.products[productIndex] = { ...updatedProduct };
      }

      this.resetListinoWizard();

      this.messageService.add({
        severity: 'success',
        summary: 'PDF Generato',
        detail: 'Listino generato e dati salvati con successo'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Errore durante la generazione del PDF'
      });
    }

    this.showMarkupDialog = false;
    this.cdr.detectChanges();
  }

  private resetListinoWizard(): void {
    this.selectedProduct = undefined;
    this.selectedRivestimentiForListino = [];
    this.extraMattressesForListino = [];
    this.deliveryPriceListino = 0;
    this.markupPercentage = 30;
    this.variantRivestimentiSelections = {};
    this.variantRivestimentiMeters = {};
  }

  cancelMarkup() {
    this.showMarkupDialog = false;
    this.resetListinoWizard();
    this.cdr.detectChanges();
  }

  getVariantFinalPrice(variant: Variant): number {
    const markupFactor = (100 - this.markupPercentage) / 100;
    const base = variant.price +
      this.overallRivestimentiCost() +
      (this.deliveryPriceListino || 0);
    return markupFactor > 0 ? base / markupFactor : base;
  }

  // === Product Editing ===
  editProduct(product: SofaProduct) {
    this.openEditDialog(product);
  }

  isContinueDisabled(): boolean {
    if (!this.selectedProduct) {
      return true;
    }
    const variants = this.getProductVariants(this.selectedProduct.id);
    return variants.some(v => !(this.variantRivestimentiSelections[v.id]?.length > 0));
  }

  openEditDialog(product: SofaProduct, event?: Event) {
    if (event) event.stopPropagation();

    this.editingProduct = new SofaProduct(
      product.id,
      product.name,
      product.description,
      [...product.variants],
      product.photoUrl,
      product.seduta,
      product.schienale,
      product.meccanica,
      product.materasso,
      (product.materassiExtra as any) || [],
      product.deliveryPrice,
      product.ricarico
    );

    this.extraMattresses = (product.materassiExtra as any as ExtraMattress[]) || [];
    this.deliveryPrice = product.deliveryPrice;

    this.variantService.getVariantsBySofaId(product.id).subscribe(variants => {
      this.editingProduct!.variants = variants.map(v => v.id);
      this.editingVariants = [...variants];
      this.cdr.detectChanges();
    });

    this.resetEditDialog();
    this.showEditProductDialog = true;
    this.cdr.detectChanges();
  }

  private resetEditDialog(): void {
    this.tempImageFile = undefined;
    this.tempImageUrl = undefined;
    this.imageRemoved = false;
    this.uploadingNewImage = false;
    this.uploadProgress = 0;
    this.editingVariantIndex = -1;
    this.newVariant = new Variant('', '', '', 0);
  }

  onDeleteClick(product: SofaProduct, event: Event) {
    event.stopPropagation();
    this.productToDelete = product;
    this.displayConfirmDelete = true;
  }

  rejectDelete() {
    this.displayConfirmDelete = false;
    this.productToDelete = undefined;
  }

  confirmDelete() {
    if (!this.productToDelete) return;

    this.sofaProductService.deleteSofaProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== this.productToDelete!.id);
        this.productVariants.delete(this.productToDelete!.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Prodotto eliminato',
          detail: `Il prodotto "${this.productToDelete!.name}" è stato eliminato`
        });
        this.displayConfirmDelete = false;
        this.productToDelete = undefined;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante l\'eliminazione del prodotto'
        });
        this.displayConfirmDelete = false;
        this.productToDelete = undefined;
        this.cdr.detectChanges();
      }
    });
  }


  get editProductDialogTitle(): string {
    return this.editingProduct ? `Modifica Prodotto: ${this.editingProduct.name}` : 'Modifica Prodotto';
  }

  onEditDialogHide(): void {
    this.editingProduct = undefined;
    this.editingVariants = [];
    this.resetEditDialog();
    this.isUploadMode = false;
  }

  // === Image Management ===
  get currentImageToShow(): string | undefined {
    return this.tempImageUrl || this.editingProduct?.photoUrl;
  }

  get shouldShowImagePlaceholder(): boolean {
    return !this.tempImageUrl && !this.editingProduct?.photoUrl;
  }

  showImageUpload(): void {
    this.isUploadMode = true;
    this.cdr.detectChanges();
  }

  removeProductImage(): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler rimuovere l\'immagine del prodotto?',
      header: 'Conferma rimozione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.imageRemoved = true;
        this.tempImageFile = undefined;
        this.tempImageUrl = undefined;
        if (this.editingProduct) this.editingProduct.photoUrl = undefined;
        this.isUploadMode = false;
        this.cdr.detectChanges();
      }
    });
  }

  triggerFileInput(): void {
    this.hiddenFileInput?.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Seleziona un file immagine valido'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'L\'immagine deve essere inferiore a 5MB'
      });
      return;
    }

    this.tempImageFile = file;
    this.imageRemoved = false;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.tempImageUrl = e.target.result;
      this.isUploadMode = false;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  cancelImageUpload(): void {
    this.isUploadMode = false;
    this.tempImageFile = undefined;
    this.tempImageUrl = undefined;
    this.cdr.detectChanges();
  }

  cancelEditProduct(): void {
    this.showEditProductDialog = false;
    this.onEditDialogHide();
  }

  // === Variant Management ===
  addVariantToProduct(): void {
    if (!this.newVariant.longName.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Il nome della variante è obbligatorio'
      });
      return;
    }

    if (this.editingVariantIndex >= 0) {
      const variant = new Variant(
        this.editingVariants[this.editingVariantIndex].id,
        this.editingProduct!.id,
        this.newVariant.longName,
        this.newVariant.price || 0,
        this.editingVariants[this.editingVariantIndex].components,
        this.newVariant.seatsCount,
        this.newVariant.mattressWidth
      );
      this.editingVariants[this.editingVariantIndex] = variant;
      this.editingVariantIndex = -1;
      this.newVariant = new Variant('', '', '', 0);
      this.cdr.detectChanges();
      return;
    }

    this.variantComponentsDialogTitle = `Configura componenti per "${this.newVariant.longName}"`;
    this.resetVariantComponentSelections();
    this.showVariantComponentsDialog = true;
  }

  resetVariantComponentSelections(): void {
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
    this.selectedRivestimentiForVariant = [];
  }

  cancelVariantComponentsDialog(): void {
    this.showVariantComponentsDialog = false;
    this.resetVariantComponentSelections();
  }

  validateVariantComponents(): string[] {
    const missing: string[] = [];
    if (!this.selectedFusto) missing.push('Fusto');
    if (!this.selectedGomma) missing.push('Gomma');
    if (!this.selectedPiedini) missing.push('Piedini');
    if (!this.selectedMeccanismo) missing.push('Meccanismo');
    if (!this.selectedMaterasso) missing.push('Materasso');
    if (!this.ferramentaList.length) missing.push('Ferramenta');
    if (!this.selectedImballo) missing.push('Imballo');
    if (!this.selectedRivestimentiForVariant.length) missing.push('Rivestimenti');
    return missing;
  }

  applyComponentsToNewVariant(): void {
    const missing = this.validateVariantComponents();
    if (missing.length) {
      this.messageService.add({
        severity: 'error',
        summary: 'Componenti mancanti',
        detail: `È necessario selezionare: ${missing.join(', ')}`,
        life: 5000
      });
      return;
    }

    const components: ComponentModel[] = [];
    [this.selectedFusto, this.selectedGomma, this.selectedMeccanismo,
    this.selectedMaterasso, this.selectedImballo, this.selectedScatola]
      .forEach(c => c && components.push(c));

    if (this.selectedPiedini) {
      for (let i = 0; i < Math.max(2, this.piediniQty); i++) {
        components.push(this.selectedPiedini);
      }
    }

    this.ferramentaList.forEach(c => components.push(c));
    this.varieList.forEach(c => components.push(c));

    this.selectedRivestimentiForVariant.forEach(r => {
      components.push(new ComponentModel(
        r.id,
        `Rivestimento ${r.mtPrice}${r.id ? ` (${r.id})` : ''}`,
        r.mtPrice,
        undefined,
        undefined,
        undefined
      ));
    });

    const variant = new Variant(
      '',
      this.editingProduct!.id,
      this.newVariant.longName,
      0,
      components,
      this.newVariant.seatsCount,
      this.newVariant.mattressWidth
    );

    variant.updatePrice();
    this.editingVariants.push(variant);
    this.newVariant = new Variant('', '', '', 0);
    this.showVariantComponentsDialog = false;
    this.resetVariantComponentSelections();

    this.messageService.add({
      severity: 'success',
      summary: 'Variante aggiunta',
      detail: `Variante "${variant.longName}" aggiunta con successo`
    });
    this.cdr.detectChanges();
  }

  editVariantInProduct(index: number): void {
    const variant = this.editingVariants[index];
    this.newVariant = new Variant(
      variant.id,
      variant.sofaId,
      variant.longName,
      variant.price,
      [...variant.components],
      variant.seatsCount,
      variant.mattressWidth
    );
    this.editingVariantIndex = index;
  }

  deleteVariantFromProduct(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questa variante?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.editingVariants.splice(index, 1);
        this.cdr.detectChanges();
      }
    });
  }

  // === Component Management ===
  getComponentsByType(type: string): ComponentModel[] {
    const componentType = this.getComponentTypeFromString(type);
    if (componentType === undefined) return [];

    const key = type.toLowerCase();
    if (!this.componentsByTypeCache.has(key)) {
      const filtered = this.availableComponents.filter(c => c.type === componentType);
      this.componentsByTypeCache.set(key, filtered);
    }
    return this.componentsByTypeCache.get(key) || [];
  }

  private getComponentTypeFromString(type: string): ComponentType | undefined {
    const map: { [k: string]: ComponentType } = {
      'fusto': ComponentType.FUSTO,
      'gomma': ComponentType.GOMMA,
      'rete': ComponentType.RETE,
      'materasso': ComponentType.MATERASSO,
      'piedini': ComponentType.PIEDINI,
      'ferramenta': ComponentType.FERRAMENTA,
      'varie': ComponentType.VARIE,
      'imballo': ComponentType.IMBALLO,
      'scatola': ComponentType.SCATOLA,
      'meccanismo': ComponentType.RETE,
    };
    return map[type.toLowerCase()];
  }

  getComponentTypeName(type: ComponentType): string {
    return this.componentTypeMap.get(type) || 'Tipo sconosciuto';
  }

  openAddComponentToVariant(variant: Variant): void {
    this.currentEditingVariant = variant;
    this.selectedComponentForVariant = undefined;
    this.componentQuantityForVariant = 1;
    this.showAddComponentDialog = true;
  }

  addComponentToVariant(): void {
    if (!this.selectedComponentForVariant || !this.currentEditingVariant) return;

    for (let i = 0; i < this.componentQuantityForVariant; i++) {
      this.currentEditingVariant.components.push({ ...this.selectedComponentForVariant });
    }
    this.currentEditingVariant.updatePrice();
    this.showAddComponentDialog = false;
    this.cdr.detectChanges();
    this.messageService.add({
      severity: 'success',
      summary: 'Componente aggiunto',
      detail: `${this.selectedComponentForVariant.name} aggiunto alla variante`
    });
  }

  cancelAddComponent(): void {
    this.showAddComponentDialog = false;
    this.currentEditingVariant = undefined;
    this.selectedComponentForVariant = undefined;
    this.componentQuantityForVariant = 1;
  }

  // === Extra Mattress Management ===
  addNewExtraMattress(): void {
    this.extraMattresses.push(new ExtraMattress('', 0));
    this.cdr.detectChanges();
  }

  addNewExtraMattressForListino(): void {
    this.extraMattressesForListino.push(new ExtraMattress('', 0));
    this.cdr.detectChanges();
  }

  cancelExtraMattressListino(): void {
    this.showListinoExtraMattressDialog = false;
    this.resetListinoWizard();
    this.cdr.detectChanges();
  }

  proceedExtraMattressListino(): void {
    if (!this.selectedProduct) {
      this.showListinoExtraMattressDialog = false;
      this.cdr.detectChanges();
      return;
    }

    // Update only the in-memory copy, don't save to database yet
    this.selectedProduct.materassiExtra = [...this.extraMattressesForListino];
    // Delivery price remains in deliveryPriceListino local state

    // Close extra mattress dialog and open markup dialog
    this.showListinoExtraMattressDialog = false;
    this.showMarkupDialog = true;
    this.cdr.detectChanges();
  }

  // === Save Operations ===
  saveProductChanges() {
    if (!this.editingProduct) return;
    this.saving = true;

    this.editingProduct.materassiExtra = this.extraMattresses as any;
    this.editingProduct.deliveryPrice = this.deliveryPrice;

    const saveVariants = () => {
      if (!this.editingVariants.length) {
        this.completeSave();
        return;
      }

      const promises = this.editingVariants.map(variant => {
        variant.sofaId = this.editingProduct!.id;
        return variant.id
          ? this.variantService.updateVariant(variant.id, variant).toPromise()
          : this.variantService.createVariant(variant).toPromise();
      });

      Promise.all(promises)
        .then(ids => {
          const newIds = ids.filter(id => id).map(id => id as string);
          const existingIds = this.editingVariants.filter(v => v.id).map(v => v.id);
          this.editingProduct!.variants = [...existingIds, ...newIds];
          this.completeSave();
        })
        .catch(err => {
          console.error('Error saving variants:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore durante il salvataggio delle varianti'
          });
          this.saving = false;
          this.cdr.detectChanges();
        });
    };

    const completeProductSave = () => {
      this.sofaProductService.updateSofaProduct(this.editingProduct!.id, this.editingProduct!)
        .subscribe(
          () => saveVariants(),
          (error) => {
            console.error('Errore durante il salvataggio:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Errore durante il salvataggio delle modifiche'
            });
            this.saving = false;
            this.cdr.detectChanges();
          }
        );
    };

    if (this.imageRemoved) {
      if (this.editingProduct.photoUrl) this.editingProduct.photoUrl = undefined;
      completeProductSave();
    } else if (this.tempImageFile) {
      const uploadTask = this.uploadService.uploadProductImage(this.tempImageFile, this.editingProduct.id);
      uploadTask.subscribe({
        next: progress => {
          this.uploadProgress = Math.round(progress.progress || 0);
          if (progress.downloadURL && progress.progress >= 100) {
            this.editingProduct!.photoUrl = progress.downloadURL;
            completeProductSave();
          }
        },
        error: err => {
          console.error('Errore upload:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile caricare l\'immagine'
          });
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      completeProductSave();
    }
  }

  private completeSave(): void {
    const idx = this.products.findIndex(p => p.id === this.editingProduct!.id);
    if (idx !== -1) this.products[idx] = { ...this.editingProduct! };
    this.productVariants.set(this.editingProduct!.id, [...this.editingVariants]);
    this.messageService.add({
      severity: 'success',
      summary: 'Prodotto Aggiornato',
      detail: 'Modifiche salvate con successo'
    });
    this.showEditProductDialog = false;
    this.saving = false;
    this.cdr.detectChanges();
  }

  // === Display Utilities ===
  onVariantComponentSelected(type: string, component: any): void { }

  onRivestimentoHide(): void {
    // Se abbiamo almeno un rivestimento con metri > 0, procediamo al dialog successivo
    if (this.canProceedRivestimenti()) {
      // NgZone per evitare errori di ChangeDetection fuori dal contesto Angular
      this.zone.run(() => {
        this.showListinoExtraMattressDialog = true;
        this.cdr.detectChanges();
      });
    } else {
      // Altrimenti resettiamo lo wizard
      this.resetListinoWizard();
    }
  }


  formatComponentName(component: ComponentModel): string {
    if (!component) return '';
    const hasMeasure = !!component.measure?.trim();
    const key = this.buildNameMeasureKey(component);
    let base = component.name;
    if (hasMeasure) base += ` (${component.measure})`;
    if (!this.duplicateNameMeasureKeys.has(key)) return base;
    const supplier = this.getSupplierName(component);
    if (supplier) {
      return hasMeasure ? `${component.name} (${component.measure}) (${supplier})` : `${component.name} (${supplier})`;
    }
    return base;
  }

  isVariantExpanded(variantId: string): boolean {
    return this.expandedVariants.has(variantId);
  }

  toggleVariantExpansion(variantId: string): void {
    this.expandedVariants.has(variantId)
      ? this.expandedVariants.delete(variantId)
      : this.expandedVariants.add(variantId);
    this.cdr.detectChanges();
  }

  getGroupedComponents(variant: Variant): GroupedComponent[] {
    const map = new Map<string, GroupedComponent>();
    variant.components.forEach(c => {
      const key = `${c.id}-${c.name}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity++;
        existing.totalPrice += c.price;
      } else {
        map.set(key, { component: c, quantity: 1, totalPrice: c.price });
      }
    });
    return Array.from(map.values());
  }

  getEditGroupedComponents(variant: Variant): EditGroupedComponent[] {
    const groups: EditGroupedComponent[] = [];
    variant.components.forEach((comp, idx) => {
      const found = groups.find(g => this.areComponentsEqual(g.component, comp));
      if (found) {
        found.quantity++;
        found.indices.push(idx);
      } else {
        groups.push({ component: comp, quantity: 1, indices: [idx] });
      }
    });
    return groups;
  }

  removeGroupedComponent(variant: Variant, group: EditGroupedComponent): void {
    this.confirmationService.confirm({
      message: group.quantity > 1
        ? `Rimuovere tutte le ${group.quantity} occorrenze di "${group.component.name}"?`
        : `Rimuovere il componente "${group.component.name}"?`,
      header: 'Conferma rimozione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        variant.components = variant.components.filter((_, i) => !group.indices.includes(i));
        variant.updatePrice();
        this.cdr.detectChanges();
      }
    });
  }

  // === Private Utilities ===
  private areComponentsEqual(a: ComponentModel, b: ComponentModel): boolean {
    if (a === b) return true;
    return a.id === b.id && a.name === b.name && a.price === b.price &&
      a.measure === b.measure && a.type === b.type && this.sameSupplier(a, b);
  }

  private sameSupplier(a: ComponentModel, b: ComponentModel): boolean {
    const supA = a.supplier;
    const supB = b.supplier;

    if (!supA && !supB) return true;
    if (!supA || !supB) return false;

    return supA.id === supB.id && supA.name === supB.name;
  }

  private buildNameMeasureKey(c: ComponentModel): string {
    const name = (c.name || '').trim().toLowerCase();
    const measure = (c.measure || '').trim().toLowerCase();
    return `${name}|${measure}`;
  }

  private rebuildDuplicateIndex(): void {
    this.componentNameMeasureCount.clear();
    this.duplicateNameMeasureKeys.clear();
    const all: ComponentModel[] = [
      ...this.availableComponents,
      ...Array.from(this.productVariants.values()).flatMap(vs => vs.flatMap(v => v.components || [])),
    ];
    for (const c of all) {
      if (!c) continue;
      const key = this.buildNameMeasureKey(c);
      this.componentNameMeasureCount.set(key, (this.componentNameMeasureCount.get(key) || 0) + 1);
    }
    for (const [key, count] of this.componentNameMeasureCount.entries()) {
      if (count > 1) this.duplicateNameMeasureKeys.add(key);
    }
  }

  private getSupplierName(c: ComponentModel): string | undefined {
    if (!c?.supplier) return undefined;
    return c.supplier.name;
  }

  cancelRivestimento() {
    this.showRivestimentoDialog = false;
    this.resetListinoWizard();
    this.cdr.detectChanges();
  }

  overallRivestimentiCost(): number {
    return this.getTotalRivestimentiCost();
  }

  // Add rivestimento to variant - kept for compatibility but updated
  addRivestimentoToVariant(variantId: string, rivestimento: Rivestimento): void {
    if (!rivestimento || !variantId) return;

    if (!this.variantRivestimentiSelections[variantId]) {
      this.variantRivestimentiSelections[variantId] = [];
    }

    // Check if rivestimento already exists
    const exists = this.variantRivestimentiSelections[variantId].some(r => r.id === rivestimento.id);
    if (!exists) {
      this.variantRivestimentiSelections[variantId].push(rivestimento);

      // Initialize meters if not exists
      if (!this.variantRivestimentiMeters[variantId]) {
        this.variantRivestimentiMeters[variantId] = {};
      }
      this.variantRivestimentiMeters[variantId][rivestimento.id] = 0.1;

      this.cdr.detectChanges();
    }
  }

  // Remove rivestimento from variant
  removeRivestimentoFromVariant(variantId: string, rivestimentoId: string): void {
    if (this.variantRivestimentiSelections[variantId]) {
      this.variantRivestimentiSelections[variantId] = this.variantRivestimentiSelections[variantId]
        .filter(r => r.id !== rivestimentoId);

      if (this.variantRivestimentiMeters[variantId]) {
        delete this.variantRivestimentiMeters[variantId][rivestimentoId];
      }

      this.cdr.detectChanges();
    }
  }

  // Get rivestimenti for specific variant
  getVariantRivestimenti(variantId: string): Rivestimento[] {
    if (!variantId) return [];
    return this.variantRivestimentiSelections[variantId] || [];
  }

  // Get meters for variant rivestimento
  getVariantRivestimentoMeters(variantId: string, rivestimentoId: string): number {
    if (!variantId || !rivestimentoId) return 0.1;
    return this.variantRivestimentiMeters[variantId]?.[rivestimentoId] || 0.1;
  }

  // Set meters for variant rivestimento
  setVariantRivestimentoMeters(variantId: string, rivestimentoId: string, meters: number): void {
    if (!variantId || !rivestimentoId) return;

    if (!this.variantRivestimentiMeters[variantId]) {
      this.variantRivestimentiMeters[variantId] = {};
    }
    this.variantRivestimentiMeters[variantId][rivestimentoId] = Math.max(0.1, meters || 0.1);
    this.cdr.detectChanges();
  }

  // Calculate total rivestimenti cost for all variants
  getTotalRivestimentiCost(): number {
    let total = 0;
    Object.keys(this.variantRivestimentiSelections).forEach(variantId => {
      const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
      rivestimenti.forEach(r => {
        const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
        total += r.mtPrice * meters;
      });
    });
    return total;
  }

  // Calculate rivestimenti cost for specific variant
  getVariantRivestimentiCost(variantId: string): number {
    if (!variantId) return 0;

    const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
    return rivestimenti.reduce((sum, r) => {
      const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
      return sum + (r.mtPrice * meters);
    }, 0);
  }

  canProceedRivestimenti(): boolean {
    return Object.keys(this.variantRivestimentiSelections).some(variantId => {
      const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
      return rivestimenti.some(r => {
        const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
        return meters > 0;
      });
    });
  }

  getVariantTotalWithMarkup(variant: Variant): number {
    const baseTotal = this.getVariantBaseTotal(variant);
    const markupFactor = (100 - this.markupPercentage) / 100;
    return markupFactor > 0 ? baseTotal / markupFactor : baseTotal;
  }

  getVariantBaseTotal(variant: Variant): number {
    return variant.price + this.getRivestimentiTotal() + this.deliveryPriceListino;
  }

  getRivestimentiTotal(): number {
    return this.selectedRivestimentiForListino.reduce((sum, r) => sum + r.rivestimento.mtPrice * r.metri, 0);
  }

  getExtraMattressesTotal(): number {
    return this.extraMattressesForListino.reduce((sum, m) => sum + (m.price || 0), 0);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('it-IT');
  }
}