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
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';


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
import { ExtraMeccanismo } from '../../../models/extra-meccanismo.model';
import { PdfGenerationService } from '../../../services/pdf-generation.service';
import { TranslationService, LanguageOption } from '../../../services/translation/translation.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { SofaType } from '../../../models/sofa-type.model';

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
    TagModule,
    DividerModule,
    CheckboxModule
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
  @ViewChild('variantFormSection') variantFormSection?: ElementRef<HTMLElement>;

  products: SofaProduct[] = [];
  productVariants: Map<string, Variant[]> = new Map();
  componentTypeMap = new Map<ComponentType, string>();
  expandedVariants: Set<string> = new Set();
  productImages: Map<string, string> = new Map();
  imageLoadErrors: Set<string> = new Set();

  // Translation
  availableLanguages: LanguageOption[] = [];
  selectedLanguage: LanguageOption = { code: 'it', name: 'Italiano', flag: '🇮🇹' };
  isTranslating = false;

  // Header image selection for PDF
  availableHeaderImages: { name: string; description: string; url: string }[] = [];
  selectedHeaderImage: { name: string; description: string; url: string } | null = null;

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
  variantRivestimentiIncluded: { [variantId: string]: { [rivestimentoId: string]: boolean } } = {};

  // New property for uniform meters application
  uniformMetersForVariant: { [variantId: string]: number } = {};

  uniformCoverMeters = 0;

  // Product editing
  editingProduct?: SofaProduct;
  editingVariants: Variant[] = [];
  editingVariantIndex = -1;
  newVariant: Variant = new Variant('', '', SofaType.DIVANO_3_PL, 0);

  // Extra options
  extraMattresses: ExtraMattress[] = [];
  extraMattressesForListino: ExtraMattress[] = [];
  extraMechanisms: ExtraMeccanismo[] = [];
  extraMechanismsForListino: ExtraMeccanismo[] = [];
  deliveryPrice?: number;
  deliveryPriceListino: number = 0;   // Local state for listino flow

  // Image handling for multiple images
  tempImageFiles: (File | null)[] = [];
  tempImageUrls: string[] = [];
  tempImagePreviews: string[] = [];
  imagesRemoved: boolean[] = [];
  imagesChanged: boolean[] = [];
  isUploadMode = false;
  uploadingNewImages = false;
  uploadProgress = 0;
  saving = false;

  showPdfTemplate = false;

  // Component management
  availableComponents: ComponentModel[] = [];
  selectedComponentForVariant?: ComponentModel;
  componentQuantityForVariant = 1;
  currentEditingVariant?: Variant;
  variantComponentsDialogTitle = '';
  searchTerm = '';

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
  sofaTypeOptions = [
    { label: 'Divano 3 PL Maxi', value: SofaType.DIVANO_3_PL_MAXI },
    { label: 'Divano 3 PL', value: SofaType.DIVANO_3_PL },
    { label: 'Divano 2 PL', value: SofaType.DIVANO_2_PL },
    { label: 'Custom', value: SofaType.CUSTOM },
  ];

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
    private pdfService: PdfGenerationService,
    private translationService: TranslationService
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
      this.availableLanguages = this.translationService.getAvailableLanguages();
      this.initializeHeaderImages();
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
    this.componentTypeMap.set(ComponentType.FERRO_SCHIENALE, 'Ferro Schienale');
    this.componentTypeMap.set(ComponentType.IMBOTTITURA_CUSCINETTI, 'Imbottitura Cuscinetti');
    this.componentTypeMap.set(ComponentType.TAPPEZZERIA, 'Tappezzeria');
    this.componentTypeMap.set(ComponentType.TELA_MARCHIATA, 'Tela Marchiata');
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

  get filteredProducts(): SofaProduct[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p => p.name?.toLowerCase().includes(term));
  }

  getProductVariants(productId: string): Variant[] {
    return this.productVariants.get(productId) || [];
  }

  getProductImageUrl(productId: string): string | null {
    const product = this.products.find(p => p.id === productId);
    if (product?.photoUrl) {
      // Return first image if it's an array, or the string if it's legacy
      return Array.isArray(product.photoUrl) ? product.photoUrl[0] || null : product.photoUrl;
    }
    return null;
  }

  getProductImages(productId: string): string[] {
    const product = this.products.find(p => p.id === productId);
    if (product?.photoUrl) {
      return Array.isArray(product.photoUrl) ? product.photoUrl : [product.photoUrl];
    }
    return [];
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
      [...(product.meccanismiExtra || [])],
      product.deliveryPrice,
      product.ricarico
    );

    this.extraMattressesForListino = [...(product.materassiExtra as any as ExtraMattress[]) || []];
    this.extraMechanismsForListino = [...(product.meccanismiExtra as any as ExtraMeccanismo[]) || []];
    this.deliveryPriceListino = product.deliveryPrice ?? 0;
    this.markupPercentage = product.ricarico ?? 30;

    // Reset rivestimenti selections
    this.variantRivestimentiSelections = {};
    this.variantRivestimentiMeters = {};
    this.variantRivestimentiIncluded = {};
    this.selectedRivestimentiForListino = [];

    // Initialize and load existing rivestimenti for each variant
    const variants = this.getProductVariants(product.id);

    try {
      for (const variant of variants) {
        // Initialize empty arrays
        this.variantRivestimentiSelections[variant.id] = [];
        this.variantRivestimentiMeters[variant.id] = {};
        this.variantRivestimentiIncluded[variant.id] = {};

        // Load existing rivestimenti from database
        const existingRivestimenti = await this.variantService.loadVariantRivestimenti(variant.id);

        if (existingRivestimenti && existingRivestimenti.length > 0) {
          // Populate selections and meters from database
          this.variantRivestimentiSelections[variant.id] = existingRivestimenti.map(item => item.rivestimento);

          existingRivestimenti.forEach(item => {
            this.variantRivestimentiMeters[variant.id][item.rivestimento.id] = item.metri;
            this.variantRivestimentiIncluded[variant.id][item.rivestimento.id] = true;
          });
        }
      }
    } catch (error) {
      console.error('Error loading existing rivestimenti:', error);
      // Initialize with empty arrays if loading fails
      variants.forEach(variant => {
        this.variantRivestimentiSelections[variant.id] = [];
        this.variantRivestimentiMeters[variant.id] = {};
        this.variantRivestimentiIncluded[variant.id] = {};
      });
    }

    this.showRivestimentoDialog = true;

    // Prevent body scroll when dialog is open
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }

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
    if (!this.variantRivestimentiIncluded[variantId]) {
      this.variantRivestimentiIncluded[variantId] = {};
    }

    // Add meters for newly selected rivestimenti (preserve existing meters)
    selectedRivestimenti.forEach(r => {
      if (!this.variantRivestimentiMeters[variantId][r.id]) {
        this.variantRivestimentiMeters[variantId][r.id] = 0.1;
      }
      if (this.variantRivestimentiIncluded[variantId][r.id] === undefined) {
        this.variantRivestimentiIncluded[variantId][r.id] = true;
      }
    });

    // Remove meters for deselected rivestimenti
    const selectedIds = new Set(selectedRivestimenti.map(r => r.id));
    Object.keys(this.variantRivestimentiMeters[variantId]).forEach(rivestimentoId => {
      if (!selectedIds.has(rivestimentoId)) {
        delete this.variantRivestimentiMeters[variantId][rivestimentoId];
        delete this.variantRivestimentiIncluded[variantId][rivestimentoId];
      }
    });

    this.cdr.detectChanges();
  }

  async confirmRivestimentiSelection(): Promise<void> {
    // Convert variant selections to the expected format and save to database
    this.selectedRivestimentiForListino = [];
    const rivestimentiMap = new Map<string, { rivestimento: Rivestimento; metri: number }>();

    try {
      // Save rivestimenti for each variant to database
      for (const variantId of Object.keys(this.variantRivestimentiSelections)) {
        const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
        const variantRivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];

        rivestimenti.forEach(r => {
          const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;

          if (meters > 0 && this.isVariantRivestimentoIncluded(variantId, r.id)) {
            variantRivestimentiData.push({ rivestimento: r, metri: meters });

            // Aggregate for listino - combine meters for same rivestimento across variants
            const existing = rivestimentiMap.get(r.id);
            if (existing) {
              existing.metri += meters;
            } else {
              rivestimentiMap.set(r.id, { rivestimento: r, metri: meters });
            }
          }
        });
      }

      // Convert map to array for listino
      this.selectedRivestimentiForListino = Array.from(rivestimentiMap.values());

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
    await this.processListinoGeneration(false);
  }

  async previewListinoPdf() {
    const previewWindow = this.isBrowser ? window.open('', '_blank') : null;

    if (previewWindow && !previewWindow.closed) {
      previewWindow.document.open();
      const loadingHtml = `
        <!DOCTYPE html>
        <html lang="it">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Generazione listino</title>
            <style>
              :root {
                --bg: #f7fafc;
                --card: #ffffff;
                --accent: #1a365d;
                --muted: #4a5568;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: radial-gradient(circle at 20% 20%, #edf2f7 0, #f7fafc 45%, #e2e8f0 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                color: var(--accent);
              }
              .card {
                width: min(520px, 90vw);
                background: var(--card);
                box-shadow: 0 20px 60px rgba(26, 54, 93, 0.15);
                border-radius: 18px;
                padding: 32px 28px;
                text-align: center;
                border: 1px solid #e2e8f0;
              }
              .pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 14px;
                border-radius: 999px;
                background: #ebf4ff;
                color: #1e429f;
                font-weight: 600;
                font-size: 12px;
                letter-spacing: 0.3px;
                text-transform: uppercase;
              }
              .spinner {
                width: 64px;
                height: 64px;
                margin: 28px auto 18px;
                border-radius: 50%;
                border: 6px solid #cbd5e0;
                border-top-color: var(--accent);
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              h1 {
                margin: 0 0 10px;
                font-size: 22px;
                letter-spacing: -0.2px;
              }
              p {
                margin: 0;
                color: var(--muted);
                font-size: 14px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="pill">PDF</div>
              <div class="spinner" aria-label="Caricamento"></div>
              <h1>Generazione del listino in corso</h1>
              <p>Stiamo preparando il PDF. Questa finestra si aggiorner&agrave; automaticamente quando il file &egrave; pronto.</p>
            </div>
          </body>
        </html>
      `;
      previewWindow.document.write(loadingHtml);
      previewWindow.document.close();
    }

    await this.processListinoGeneration(true, previewWindow as Window | null);
  }

  private async processListinoGeneration(preview: boolean, previewWindow?: Window | null) {
    if (!this.selectedProduct) {
      this.showMarkupDialog = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      this.messageService.add({
        severity: 'info',
        summary: preview ? 'Anteprima PDF' : 'Generazione PDF',
        detail: 'Generazione listino in corso'
      });

      // Save rivestimenti for each variant
      for (const variantId of Object.keys(this.variantRivestimentiSelections)) {
        const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
        const variantRivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];

        rivestimenti.forEach(r => {
          const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
          if (meters > 0) {
            variantRivestimentiData.push({ rivestimento: r, metri: meters });
          }
        });

        if (variantRivestimentiData.length > 0) {
          await this.variantService.saveVariantRivestimenti(variantId, variantRivestimentiData);
        }
      }

      // Save updated product
      const updatedProduct: SofaProduct = {
        ...this.selectedProduct,
        materassiExtra: [...this.extraMattressesForListino],
        meccanismiExtra: [...this.extraMechanismsForListino],
        deliveryPrice: this.deliveryPriceListino,
        ricarico: this.markupPercentage
      };

      await firstValueFrom(this.sofaProductService.updateSofaProduct(updatedProduct.id, updatedProduct));

      // Generate PDF with translation if needed
      this.showPdfTemplate = true;
      this.cdr.detectChanges();
      await new Promise(res => setTimeout(res, 100));

      // Prepare rivestimenti data organized by variant for PDF
      const rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] } = {};

      Object.keys(this.variantRivestimentiSelections).forEach(variantId => {
        const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
        const variantRivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];

        rivestimenti.forEach(r => {
          const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
          if (meters > 0 && this.isVariantRivestimentoIncluded(variantId, r.id)) {
            variantRivestimentiData.push({ rivestimento: r, metri: meters });
          }
        });

        if (variantRivestimentiData.length > 0) {
          rivestimentiByVariant[variantId] = variantRivestimentiData;
        }
      });

      // Set data and generate PDF with selected language
      this.pdfService.setListinoData(
        updatedProduct,
        this.getProductVariants(updatedProduct.id),
        rivestimentiByVariant,
        this.extraMattressesForListino,
        this.extraMechanismsForListino,
        this.markupPercentage,
        this.deliveryPriceListino
      );

      await this.pdfService.generateListinoPdf(updatedProduct.name, this.selectedLanguage.code, preview, previewWindow);
      this.showPdfTemplate = false;
      this.cdr.detectChanges();

      // Update local product copy
      const productIndex = this.products.findIndex(p => p.id === updatedProduct.id);
      if (productIndex !== -1) {
        this.products[productIndex] = { ...updatedProduct };
      }

      this.resetListinoWizard();

      this.messageService.add({
        severity: preview ? 'info' : 'success',
        summary: preview ? 'Anteprima aperta' : 'PDF Generato',
        detail: preview ? 'Anteprima del listino aperta in una nuova scheda' : 'Listino generato e dati salvati con successo'
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

  // Set uniform meters for all rivestimenti in a variant
  applyUniformMetersToVariant(variantId: string): void {
    if (!variantId || !this.uniformMetersForVariant[variantId]) return;

    const uniformMeters = Math.max(0.1, this.uniformMetersForVariant[variantId] || 0.1);
    const rivestimenti = this.variantRivestimentiSelections[variantId] || [];

    if (!this.variantRivestimentiMeters[variantId]) {
      this.variantRivestimentiMeters[variantId] = {};
    }

    // Apply uniform meters to all rivestimenti in this variant
    rivestimenti.forEach(r => {
      this.variantRivestimentiMeters[variantId][r.id] = uniformMeters;
    });

    this.cdr.detectChanges();

    this.messageService.add({
      severity: 'success',
      summary: 'Metri applicati',
      detail: `${uniformMeters} metri applicati a tutti i rivestimenti`
    });
  }

  // Get uniform meters value for variant
  getUniformMetersForVariant(variantId: string): number {
    return this.uniformMetersForVariant[variantId] || 1;
  }

  // Set uniform meters value for variant
  setUniformMetersForVariant(variantId: string, meters: number): void {
    if (!variantId) return;
    this.uniformMetersForVariant[variantId] = Math.max(0.1, meters || 0.1);
  }

  private resetListinoWizard(): void {
    this.selectedProduct = undefined;
    this.selectedRivestimentiForListino = [];
    this.extraMattressesForListino = [];
    this.extraMechanismsForListino = [];
    this.deliveryPriceListino = 0;
    this.markupPercentage = 30;
    this.variantRivestimentiSelections = {};
    this.variantRivestimentiMeters = {};
    this.variantRivestimentiIncluded = {};
    this.uniformMetersForVariant = {};
    this.selectedVariantForRivestimento = undefined;
    // Reset header image selection to default
    this.selectedHeaderImage = this.availableHeaderImages[0] || null;
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
      (product.meccanismiExtra as any) || [],
      product.deliveryPrice,
      product.ricarico
    );

    this.extraMattresses = (product.materassiExtra as any as ExtraMattress[]) || [];
    this.extraMechanisms = (product.meccanismiExtra as any as ExtraMeccanismo[]) || [];
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
    this.tempImageFiles = [];
    this.tempImageUrls = [];
    this.tempImagePreviews = [];
    this.imagesRemoved = [];
    this.imagesChanged = [];
    this.uploadingNewImages = false;
    this.uploadProgress = 0;
    this.editingVariantIndex = -1;
    this.newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);

    // Initialize arrays based on current product images
    if (this.editingProduct?.photoUrl) {
      const images = Array.isArray(this.editingProduct.photoUrl)
        ? this.editingProduct.photoUrl
        : [this.editingProduct.photoUrl];

      this.tempImageUrls = [...images];
      this.imagesRemoved = new Array(images.length).fill(false);
      this.imagesChanged = new Array(images.length).fill(false);
    }
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

    // Get associated variants for deletion
    const variants = this.getProductVariants(this.productToDelete.id);

    // Delete the product (the service will handle image deletion automatically)
    this.sofaProductService.deleteSofaProduct(this.productToDelete.id).subscribe({
      next: () => {
        // After product deletion, delete all associated variants
        if (variants.length > 0) {
          const variantDeletions = variants.map(variant =>
            this.variantService.deleteVariant(variant.id)
          );

          // Use forkJoin to wait for all variant deletions
          forkJoin(variantDeletions).subscribe({
            next: () => {
              console.log(`Deleted ${variants.length} variants associated with product ${this.productToDelete!.name}`);
            },
            error: (error) => {
              console.error('Error deleting some variants:', error);
              this.messageService.add({
                severity: 'warn',
                summary: 'Attenzione',
                detail: 'Prodotto eliminato ma potrebbero esserci problemi con l\'eliminazione delle varianti'
              });
            }
          });
        }

        // Update local state
        this.products = this.products.filter(p => p.id !== this.productToDelete!.id);
        this.productVariants.delete(this.productToDelete!.id);

        const imageCount = this.productToDelete!.photoUrl?.length || 0;
        this.messageService.add({
          severity: 'success',
          summary: 'Prodotto eliminato',
          detail: `Il prodotto "${this.productToDelete!.name}" è stato eliminato${variants.length > 0 ? ` insieme a ${variants.length} varianti` : ''}${imageCount > 0 ? ` e ${imageCount} immagini` : ''}`
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
  get currentImagesToShow(): string[] {
    const result: string[] = [];

    // Start with existing product images or temp URLs
    let baseImages: string[] = [];
    if (this.tempImageUrls.length > 0) {
      baseImages = [...this.tempImageUrls];
    } else if (this.editingProduct?.photoUrl) {
      baseImages = Array.isArray(this.editingProduct.photoUrl)
        ? [...this.editingProduct.photoUrl]
        : [this.editingProduct.photoUrl];
    }

    // Build final array considering removals and previews
    const maxLength = Math.max(baseImages.length, this.tempImagePreviews.length);

    for (let i = 0; i < maxLength; i++) {
      // Skip if image is marked as removed
      if (this.imagesRemoved[i]) {
        continue;
      }

      // Use preview if available (new/changed image)
      if (this.tempImagePreviews[i]) {
        result.push(this.tempImagePreviews[i]);
      } else if (baseImages[i]) {
        result.push(baseImages[i]);
      }
    }

    return result;
  }

  get shouldShowImagePlaceholder(): boolean {
    return this.currentImagesToShow.length === 0;
  }

  // Get image at specific index for editing
  getImageAtIndex(index: number): string | undefined {
    const images = this.currentImagesToShow;
    return images[index];
  }

  // Check if image at index is removed
  isImageRemoved(index: number): boolean {
    return this.imagesRemoved[index] || false;
  }

  showImageUpload(): void {
    this.isUploadMode = true;
    this.cdr.detectChanges();
  }

  removeProductImage(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler rimuovere questa immagine del prodotto?',
      header: 'Conferma rimozione',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'btn-confirm',
      rejectButtonStyleClass: 'btn-cancel',
      accept: () => {
        this.imagesRemoved[index] = true;
        this.imagesChanged[index] = true;
        this.cdr.detectChanges();

        this.messageService.add({
          severity: 'success',
          summary: 'Immagine rimossa',
          detail: 'Immagine sarà eliminata dal database al salvataggio'
        });
      }
    });
  }

  triggerFileInput(index?: number): void {
    // Create file input manually for better control
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.multiple = index === undefined; // Allow multiple only when adding new images

    fileInput.addEventListener('change', (event: any) => {
      this.onFileSelected(event, index);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  private ensureImageSlot(index: number): void {
    while (this.tempImageFiles.length <= index) {
      this.tempImageFiles.push(null);
      this.imagesChanged.push(false);
      this.imagesRemoved.push(false);
      this.tempImagePreviews.push('');
      this.tempImageUrls.push('');
    }
  }

  private getAvailableImageSlots(maxImages: number): number[] {
    const available: number[] = [];
    for (let i = 0; i < maxImages; i++) {
      const hasTempFile = !!this.tempImageFiles[i];
      const hasPreview = !!this.tempImagePreviews[i];
      const hasUrl = !!this.tempImageUrls[i];
      const isRemoved = this.imagesRemoved[i] === true;
      if (isRemoved || (!hasTempFile && !hasPreview && !hasUrl)) {
        available.push(i);
      }
    }
    return available;
  }

  onFileSelected(event: any, index?: number): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 3;
    const isReplacing = index !== undefined;
    const availableSlots = isReplacing ? [index as number] : this.getAvailableImageSlots(maxImages);
    let limitReached = false;

    // Process all selected files
    for (const file of Array.from(files) as File[]) {
      if (!isReplacing && availableSlots.length === 0) {
        limitReached = true;
        break;
      }

      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Seleziona solo file immagine validi'
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'L\'immagine deve essere inferiore a 5MB'
        });
        continue;
      }

      const targetIndex = isReplacing ? (index as number) : (availableSlots.shift() as number);
      if (targetIndex === undefined) {
        limitReached = true;
        break;
      }

      this.ensureImageSlot(targetIndex);
      this.imagesRemoved[targetIndex] = false;
      this.tempImageFiles[targetIndex] = file;
      this.imagesChanged[targetIndex] = true;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tempImagePreviews[targetIndex!] = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }

    if (!isReplacing && limitReached) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limite raggiunto',
        detail: 'Puoi caricare massimo 3 immagini'
      });
    }

    this.isUploadMode = false;
  }

  cancelImageUpload(): void {
    this.isUploadMode = false;
    // Reset temporary image data
    this.tempImageFiles = [];
    this.tempImagePreviews = [];
    this.imagesChanged = [];
    this.cdr.detectChanges();
  }

  cancelEditProduct(): void {
    this.showEditProductDialog = false;
    this.onEditDialogHide();
  }

  // === Variant Management ===
  addVariantToProduct(): void {
    if (!this.newVariant.longName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Il nome della variante è obbligatorio'
      });
      return;
    }

    if (this.newVariant.longName === SofaType.CUSTOM && !this.newVariant.customName?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Inserisci il nome della variante custom'
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
        this.newVariant.mattressWidth,
        this.newVariant.depth,
        this.newVariant.height,
        undefined,
        undefined,
        undefined,
        this.newVariant.longName === SofaType.CUSTOM ? this.newVariant.customName : undefined
      );
      this.editingVariants[this.editingVariantIndex] = variant;
      this.editingVariantIndex = -1;
      this.newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);
      this.cdr.detectChanges();
      return;
    }

    this.variantComponentsDialogTitle = `Configura componenti per "${this.getVariantLabel(this.newVariant)}"`;
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
      this.newVariant.mattressWidth,
      this.newVariant.depth,
      this.newVariant.height,
      undefined,
      undefined,
      undefined,
      this.newVariant.longName === SofaType.CUSTOM ? this.newVariant.customName : undefined
    );

    variant.updatePrice();
    this.editingVariants.push(variant);
    this.newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);
    this.showVariantComponentsDialog = false;
    this.resetVariantComponentSelections();

    this.messageService.add({
      severity: 'success',
      summary: 'Variante aggiunta',
      detail: `Variante "${this.getVariantLabel(variant)}" aggiunta con successo`
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
      variant.mattressWidth,
      variant.depth,
      variant.height,
      undefined,
      undefined,
      undefined,
      variant.customName
    );
    this.editingVariantIndex = index;
    this.cdr.detectChanges();
    this.scrollToVariantForm();
  }

  cancelVariantEdit(): void {
    this.editingVariantIndex = -1;
    this.newVariant = new Variant('', '', SofaType.DIVANO_3_PL, 0);
  }

  private scrollToVariantForm(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const el = this.variantFormSection?.nativeElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  deleteVariantFromProduct(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questa variante?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'btn-confirm',
      rejectButtonStyleClass: 'btn-cancel',
      accept: () => {
        this.editingVariants.splice(index, 1);
        if (this.editingVariantIndex === index) {
          this.cancelVariantEdit();
        } else if (this.editingVariantIndex > index) {
          this.editingVariantIndex--;
        }
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

  addNewExtraMechanism(): void {
    this.extraMechanisms.push(new ExtraMeccanismo('', 0));
    this.cdr.detectChanges();
  }

  addNewExtraMechanismForListino(): void {
    this.extraMechanismsForListino.push(new ExtraMeccanismo('', 0));
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
    this.selectedProduct.meccanismiExtra = [...this.extraMechanismsForListino];
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
    this.editingProduct.meccanismiExtra = this.extraMechanisms as any;
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

    // Handle multiple image updates
    const hasImageChanges = this.imagesChanged.some(changed => changed) ||
      this.imagesRemoved.some(removed => removed) ||
      this.tempImageFiles.some(file => file);

    if (!hasImageChanges) {
      completeProductSave();
      return;
    }

    // Initialize photoUrl array if not exists
    if (!this.editingProduct.photoUrl) {
      this.editingProduct.photoUrl = [];
    }

    let uploadPromises: Promise<void>[] = [];
    let deletePromises: Promise<void>[] = [];
    let uploadProgress = 0;
    const totalUploads = this.tempImageFiles.filter(file => file).length;

    // Build new image array based on current state
    const newPhotoUrls: string[] = [];

    // Process each image slot
    for (let i = 0; i < Math.max(this.tempImageFiles.length, this.tempImageUrls.length); i++) {
      if (this.imagesRemoved[i]) {
        // Delete removed image from Firebase Storage
        if (this.tempImageUrls[i]) {
          const deletePromise = new Promise<void>((resolve, reject) => {
            this.uploadService.deleteImage(this.tempImageUrls[i]).subscribe({
              next: () => {
                console.log(`Image deleted from Storage: ${this.tempImageUrls[i]}`);
                resolve();
              },
              error: (err) => {
                console.error(`Error deleting image from Storage: ${this.tempImageUrls[i]}`, err);
                // Don't reject - continue even if deletion fails
                resolve();
              }
            });
          });
          deletePromises.push(deletePromise);
        }
        continue; // Skip removed images from new array
      } else if (this.tempImageFiles[i] && this.imagesChanged[i]) {
        // Upload new image for this index
        const file = this.tempImageFiles[i];
        if (!file) continue; // Skip null files

        // If we're replacing an existing image, delete the old one
        if (this.tempImageUrls[i]) {
          const deletePromise = new Promise<void>((resolve, reject) => {
            this.uploadService.deleteImage(this.tempImageUrls[i]).subscribe({
              next: () => {
                console.log(`Old image deleted from Storage: ${this.tempImageUrls[i]}`);
                resolve();
              },
              error: (err) => {
                console.error(`Error deleting old image from Storage: ${this.tempImageUrls[i]}`, err);
                // Don't reject - continue even if deletion fails
                resolve();
              }
            });
          });
          deletePromises.push(deletePromise);
        }

        const uploadPromise = new Promise<void>((resolve, reject) => {
          const uploadTask = this.uploadService.uploadProductImage(file, this.editingProduct!.id);
          uploadTask.subscribe({
            next: progress => {
              uploadProgress += (progress.progress || 0) / totalUploads;
              this.uploadProgress = Math.round(uploadProgress);

              if (progress.downloadURL && progress.progress >= 100) {
                newPhotoUrls[i] = progress.downloadURL;
                resolve();
              }
            },
            error: err => {
              console.error('Errore upload:', err);
              reject(err);
            }
          });
        });
        uploadPromises.push(uploadPromise);
      } else if (this.tempImageUrls[i] && !this.imagesRemoved[i] && !this.imagesChanged[i]) {
        // Keep existing image
        newPhotoUrls[i] = this.tempImageUrls[i];
      }
    }

    // Handle both uploads and deletions
    const allPromises = [...uploadPromises, ...deletePromises];

    if (allPromises.length > 0) {
      Promise.all(allPromises)
        .then(() => {
          // Clean up undefined values and assign to product
          this.editingProduct!.photoUrl = newPhotoUrls.filter(url => url);
          if (this.editingProduct!.photoUrl.length === 0) {
            this.editingProduct!.photoUrl = undefined;
          }
          completeProductSave();
        })
        .catch(err => {
          console.error('Errore durante le operazioni su immagini:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore durante le operazioni sulle immagini'
          });
          this.saving = false;
          this.cdr.detectChanges();
        });
    } else {
      // No uploads or deletions needed, just update the URL array
      this.editingProduct!.photoUrl = newPhotoUrls.filter(url => url);
      if (this.editingProduct!.photoUrl.length === 0) {
        this.editingProduct!.photoUrl = undefined;
      }
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
    // Restore body scroll when dialog is hidden
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }

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
    const sofaTypeLabel = component.sofaType ? this.getSofaTypeDisplayName(component.sofaType) : '';

    const key = this.buildNameMeasureKey(component);

    let base = component.name;

    if (!this.duplicateNameMeasureKeys.has(key)) return base;
    const supplier = this.getSupplierName(component);

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
    // Return empty array if variant has no components (custom pricing)
    if (!variant.components || variant.components.length === 0) {
      return [];
    }

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
    // Return empty array if variant has no components
    if (!variant.components || variant.components.length === 0) {
      return [];
    }

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

  // Add helper methods for variant display
  isCustomPricingVariant(variant: Variant): boolean {
    return variant.pricingMode === 'custom';
  }

  hasComponentsToShow(variant: Variant): boolean {
    return variant.components && variant.components.length > 0;
  }

  removeGroupedComponent(variant: Variant, group: EditGroupedComponent): void {
    this.confirmationService.confirm({
      message: group.quantity > 1
        ? `Rimuovere tutte le ${group.quantity} occorrenze di "${group.component.name}"?`
        : `Rimuovere il componente "${group.component.name}"?`,
      header: 'Conferma rimozione',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'btn-confirm',
      rejectButtonStyleClass: 'btn-cancel',
      accept: () => {
        // Remove components locally - sort indices in descending order to avoid index shifting
        const sortedIndices = [...group.indices].sort((a, b) => b - a);
        sortedIndices.forEach(index => {
          variant.components.splice(index, 1);
        });

        // Update price after removal
        variant.updatePrice();

        // Show success message for local change
        this.messageService.add({
          severity: 'success',
          summary: 'Componente rimosso',
          detail: `${group.component.name} rimosso dalla variante (modifiche non salvate)`
        });

        // Only trigger change detection for local changes
        this.cdr.detectChanges();
      }
    });
  }

  // === Private Utilities ===
  private areComponentsEqual(a: ComponentModel, b: ComponentModel): boolean {
    if (a === b) return true;
    return a.id === b.id && a.name === b.name && a.price === b.price &&
      a.sofaType === b.sofaType && a.type === b.type && this.sameSupplier(a, b);
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
    const sofaType = c.sofaType ? this.getSofaTypeDisplayName(c.sofaType).toLowerCase() : '';
    return `${name}|${sofaType}`;
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

  getSofaTypeLabel(type: SofaType | null): string {
    if (!type) return '';
    const map: Record<SofaType, string> = {
      [SofaType.DIVANO_3_PL_MAXI]: 'Divano 3 PL Maxi',
      [SofaType.DIVANO_3_PL]: 'Divano 3 PL',
      [SofaType.DIVANO_2_PL]: 'Divano 2 PL',
      [SofaType.CUSTOM]: 'Custom',
    };
    return map[type] ?? String(type);
  }

  private getSofaTypeDisplayName(type: SofaType | null): string {
    if (!type) return '';
    const map: Record<SofaType, string> = {
      [SofaType.DIVANO_3_PL_MAXI]: 'Divano 3 PL Maxi',
      [SofaType.DIVANO_3_PL]: 'Divano 3 PL',
      [SofaType.DIVANO_2_PL]: 'Divano 2 PL',
      [SofaType.CUSTOM]: 'Custom',
    };
    return map[type] ?? String(type);
  }

  getVariantLabel(variant?: Variant | null): string {
    if (!variant) return '';
    if (variant.longName === SofaType.CUSTOM) {
      return (variant.customName || '').trim() || 'Custom';
    }
    return this.getSofaTypeLabel(variant.longName);
  }

  isCustomVariantType(): boolean {
    return this.newVariant.longName === SofaType.CUSTOM;
  }

  cancelRivestimento() {
    this.showRivestimentoDialog = false;
    this.resetListinoWizard();

    // Restore body scroll
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }

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
      if (this.variantRivestimentiIncluded[variantId]) {
        delete this.variantRivestimentiIncluded[variantId][rivestimentoId];
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

  isVariantRivestimentoIncluded(variantId: string, rivestimentoId: string): boolean {
    if (!variantId || !rivestimentoId) return true;
    const included = this.variantRivestimentiIncluded[variantId]?.[rivestimentoId];
    return included ?? true;
  }

  setVariantRivestimentoIncluded(variantId: string, rivestimentoId: string, included: boolean): void {
    if (!variantId || !rivestimentoId) return;
    if (!this.variantRivestimentiIncluded[variantId]) {
      this.variantRivestimentiIncluded[variantId] = {};
    }
    this.variantRivestimentiIncluded[variantId][rivestimentoId] = included;
    this.cdr.detectChanges();
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
        if (this.isVariantRivestimentoIncluded(variantId, r.id)) {
          total += r.mtPrice * meters;
        }
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
      if (!this.isVariantRivestimentoIncluded(variantId, r.id)) {
        return sum;
      }
      return sum + (r.mtPrice * meters);
    }, 0);
  }

  canProceedRivestimenti(): boolean {
    return Object.keys(this.variantRivestimentiSelections).some(variantId => {
      const rivestimenti = this.variantRivestimentiSelections[variantId] || [];
      return rivestimenti.some(r => {
        const meters = this.variantRivestimentiMeters[variantId]?.[r.id] || 0;
        return meters > 0 && this.isVariantRivestimentoIncluded(variantId, r.id);
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
    const mattressesTotal = this.extraMattressesForListino.reduce((sum, m) => sum + (m.price || 0), 0);
    const mechanismsTotal = this.extraMechanismsForListino.reduce((sum, m) => sum + (m.price || 0), 0);
    return mattressesTotal + mechanismsTotal;
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('it-IT');
  }

  private initializeHeaderImages(): void {
    // Initialize with two identical options pointing to the current default header image
    // This matches the current PDF generation behavior
    const defaultHeaderImageUrl = 'assets/images/default-header-image.png'; // Update this path to match your actual header image

    this.availableHeaderImages = [
      {
        name: 'Logo Aziendale Standard',
        description: 'Logo principale dell\'azienda per il listino',
        url: defaultHeaderImageUrl
      },
      {
        name: 'Logo Aziendale Alternativo',
        description: 'Versione alternativa del logo aziendale',
        url: defaultHeaderImageUrl
      }
    ];

    // Set default selection to first option
    this.selectedHeaderImage = this.availableHeaderImages[0];
  }
}
