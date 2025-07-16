import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule, NgForm } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table'; // Add Table module
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect'; // Add this import

// Add these imports for Firebase Storage types
import { UploadTask, UploadTaskSnapshot } from '@angular/fire/storage';

import { SofaProduct } from '../../../models/sofa-product.model';
import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { Variant } from '../../../models/variant.model';
import { Rivestimento } from '../../../models/rivestimento.model';
import { RivestimentoType } from '../../../models/rivestimento-type.model';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { ComponentTypeService } from '../../../services/component-type.service';
import { ComponentType } from '../../../models/component-type.model';
import { PhotoUploadService } from '../../../services/upload.service';
import { Component as ComponentModel } from '../../../models/component.model';
import { ComponentService } from '../../../services/component.service';

// Interfaccia per i componenti raggruppati
interface GroupedComponent {
  component: ComponentModel;
  quantity: number;
  totalPrice: number;
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
    MultiSelectModule, // Add this to imports
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  @ViewChild('productForm') productForm?: NgForm;

  products: SofaProduct[] = [];
  productVariants: Map<string, Variant[]> = new Map();
  componentTypeMap = new Map<string, string>();
  showMarkupDialog = false;
  selectedProduct?: SofaProduct;
  markupPercentage = 30;
  isBrowser: boolean;

  // Rivestimento properties
  availableRivestimenti: Rivestimento[] = [];
  selectedRivestimento?: Rivestimento;
  selectedRivestimentoType: RivestimentoType | null = null;
  metersOfRivestimento: number = 1;
  rivestimentoTypes = Object.values(RivestimentoType);
  showRivestimentoDialog = false;

  // Variant expansion
  expandedVariants: Set<string> = new Set();

  // Image properties
  productImages: Map<string, string> = new Map();
  imageLoadErrors: Set<string> = new Set();

  // Aggiungi queste proprietà
  showEditProductDialog: boolean = false;
  editingProduct?: SofaProduct;
  uploadingNewImage: boolean = false;
  uploadProgress: number = 0;
  saving: boolean = false;

  // Aggiungi queste nuove proprietà per la gestione locale delle immagini
  tempImageFile?: File;
  tempImageUrl?: string;
  imageRemoved: boolean = false;

  // Aggiungi questa proprietà per gestire la modalità di caricamento
  isUploadMode: boolean = false;

  @ViewChild('fileUpload') fileUpload?: any;
  @ViewChild('hiddenFileInput') hiddenFileInput?: ElementRef;

  // Add new properties for variant editing
  editingVariantIndex: number = -1;
  newVariant: Variant = new Variant('', '', '', 0);
  availableComponents: ComponentModel[] = [];
  selectedComponentForVariant?: ComponentModel;
  componentQuantityForVariant: number = 1;

  // Add properties for component management in edit mode
  showAddComponentDialog: boolean = false;
  currentEditingVariant?: Variant;

  // Add properties for component selection dialog
  showVariantComponentsDialog: boolean = false;
  variantComponentsDialogTitle: string = '';

  // Component selections for new variant (same as aggiungi-prodotto)
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
  selectedRivestimentiForVariant: Rivestimento[] = [];
  rivestimentiList: Rivestimento[] = [];

  // Add cache for component types
  private componentsByTypeCache = new Map<string, ComponentModel[]>();

  constructor(
    private router: Router,
    private sofaProductService: SofaProductService,
    private componentTypeService: ComponentTypeService,
    private variantService: VariantService,
    private rivestimentoService: RivestimentoService,
    private uploadService: PhotoUploadService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
    private componentService: ComponentService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadProducts();
      this.loadRivestimenti();
      this.loadComponentTypes();
      this.loadAvailableComponents();
      this.loadRivestimentiList(); // Add this
    }
  }

  // Add method to load rivestimenti
  loadRivestimentiList(): void {
    this.rivestimentoService.getRivestimenti().subscribe((rivestimenti) => {
      this.rivestimentiList = rivestimenti;
      this.cdr.detectChanges();
    });
  }

  // Add method to load available components
  loadAvailableComponents(): void {
    this.componentService.getComponents().subscribe((components) => {
      this.availableComponents = components;
      this.componentsByTypeCache.clear(); // Clear cache when components change
      console.log('Loaded components:', components.map(c => ({ name: c.name, type: c.type })));
      this.cdr.detectChanges();
    });
  }

  // Add missing method
  loadComponentTypes(): void {
    this.componentTypeService.getComponentTypes().subscribe((types) => {
      types.forEach((type) => {
        this.componentTypeMap.set(type.id, type.name);
      });
      this.cdr.detectChanges();
    });
  }

  loadRivestimenti(): void {
    this.rivestimentoService.getRivestimenti().subscribe((r) => {
      this.availableRivestimenti = r;
      this.cdr.detectChanges();
    });
  }

  loadProducts(): void {
    this.sofaProductService.getSofaProducts().subscribe((products) => {
      this.products = products;
      // Load variants
      products.forEach((product) => {
        this.variantService
          .getVariantsBySofaId(product.id)
          .subscribe((variants) => {
            this.productVariants.set(product.id, variants);
            this.cdr.detectChanges();
          });
      });
      this.cdr.detectChanges();
    });
  }

  trackById(_: number, item: SofaProduct) {
    return item.id;
  }

  getProductVariants(productId: string): Variant[] {
    return this.productVariants.get(productId) || [];
  }

  getTotalPrice(productId: string): number {
    const variants = this.getProductVariants(productId);
    if (!variants.length) return 0;
    return variants.reduce((sum, v) => sum + v.price, 0);
  }

  getProductImageUrl(productId: string): string | null {
    const product = this.products.find((p) => p.id === productId);
    return product?.photoUrl || null;
  }

  hasProductImage(productId: string): boolean {
    const url = this.getProductImageUrl(productId);
    const has = !!url && !this.imageLoadErrors.has(productId);
    console.log(`Product ${productId} has image:`, has);
    return has;
  }

  onImageError(productId: string): void {
    this.imageLoadErrors.add(productId);
    this.cdr.detectChanges();
  }

  getDefaultImage(): string {
    return 'assets/images/no-image-placeholder.png';
  }

  generaListino(product: SofaProduct) {
    this.selectedProduct = product;
    this.showRivestimentoDialog = true;
    this.cdr.detectChanges(); // Force change detection
  }

  selectRivestimento() {
    if (!this.selectedRivestimento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Seleziona un rivestimento',
      });
      return;
    }
    if (this.metersOfRivestimento <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Inserisci la quantità di metri di rivestimento',
      });
      return;
    }
    this.showRivestimentoDialog = false;
    this.showMarkupDialog = true;
    this.cdr.detectChanges(); // Force change detection
  }

  generateWithMarkup() {
    if (this.selectedProduct) {
      const variants = this.getProductVariants(this.selectedProduct.id);
      this.exportPdf(this.selectedProduct, variants, this.markupPercentage);
    }
    this.showMarkupDialog = false;
    this.cdr.detectChanges(); // Force change detection
  }

  cancelRivestimento() {
    this.showRivestimentoDialog = false;
    this.selectedRivestimento = undefined;
    this.metersOfRivestimento = 1;
    this.cdr.detectChanges(); // Force change detection
  }

  cancelMarkup() {
    this.showMarkupDialog = false;
    this.cdr.detectChanges(); // Force change detection
  }

  calculateRivestimentoCost(): number {
    return this.selectedRivestimento
      ? this.selectedRivestimento.mtPrice * this.metersOfRivestimento
      : 0;
  }

  private exportPdf(
    product: SofaProduct,
    variants: Variant[],
    markupPerc: number
  ) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(18);
    doc.text(`Listino: ${product.name}`, 40, 20);

    let y = 40;
    doc.setFontSize(12);

    // Aggiungi i nuovi campi se presenti
    if (product.seduta) {
      doc.text(`Seduta: ${product.seduta}`, 40, y);
      y += 16;
    }
    if (product.schienale) {
      doc.text(`Schienale: ${product.schienale}`, 40, y);
      y += 16;
    }
    if (product.meccanica) {
      doc.text(`Meccanica: ${product.meccanica}`, 40, y);
      y += 16;
    }
    if (product.materasso) {
      doc.text(`Materasso: ${product.materasso}`, 40, y);
      y += 16;
    }

    doc.setFontSize(14);

    const rivestimentoCost = this.calculateRivestimentoCost();

    const rows: string[][] = [];
    variants.forEach((variant) => {
      rows.push([`Variante: ${variant.longName}`, '', '', '']);
      variant.components.forEach((component) => {
        rows.push([
          component.name,
          '1',
          component.price.toFixed(2),
          component.price.toFixed(2),
        ]);
      });
      if (this.selectedRivestimento) {
        rows.push([
          `Rivestimento: ${this.selectedRivestimento.code || 'N/A'}`,
          `${this.metersOfRivestimento} mt`,
          this.selectedRivestimento.mtPrice.toFixed(2),
          rivestimentoCost.toFixed(2),
        ]);
      }
      const baseTotal = variant.price + rivestimentoCost;
      const markupFactor = (100 - markupPerc) / 100;
      const finalTotal =
        markupFactor > 0 ? baseTotal / markupFactor : baseTotal;
      rows.push([
        'Totale variante (con ricarico)',
        '',
        '',
        finalTotal.toFixed(2),
      ]);
      rows.push(['', '', '', '']);
    });

    autoTable(doc, {
      head: [['Componente', 'Quantità', 'Prezzo cad.', 'Subtotale']],
      body: rows,
      startY: y + 10,
      theme: 'striped',
      margin: { left: 40, right: 40 },
    });

    doc.save(`Listino_${product.name.replace(/\s+/g, '_')}.pdf`);
  }

  // Modifica il metodo esistente per aprire il dialogo invece di navigare
  editProduct(product: SofaProduct) {
    // Non naviga più, apre il dialogo
    this.openEditDialog(product);
  }

  // Enhanced openEditDialog method
  openEditDialog(product: SofaProduct, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Crea una copia profonda del prodotto per non modificare quello originale
    this.editingProduct = new SofaProduct(
      product.id,
      product.name,
      product.description,
      [...product.variants],
      product.photoUrl,
      product.seduta,
      product.schienale,
      product.meccanica,
      product.materasso
    );

    // Load variants for this product
    this.variantService.getVariantsBySofaId(product.id).subscribe((variants) => {
      this.editingProduct!.variants = variants.map((v) => v.id);
      // Store variants separately for editing
      this.editingVariants = [...variants];
      this.cdr.detectChanges();
    });

    // Reset image editing variables
    this.tempImageFile = undefined;
    this.tempImageUrl = undefined;
    this.imageRemoved = false;
    this.uploadingNewImage = false;
    this.uploadProgress = 0;

    // Reset variant editing
    this.editingVariantIndex = -1;
    this.newVariant = new Variant('', '', '', 0);

    this.showEditProductDialog = true;
    this.cdr.detectChanges();
  }

  // Add property to store variants being edited
  editingVariants: Variant[] = [];

  // Variant management methods
  addVariantToProduct(): void {
    if (!this.newVariant.longName.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Il nome della variante è obbligatorio',
      });
      return;
    }

    // If we're editing, update the existing variant
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

    // For new variants, open component selection dialog
    this.variantComponentsDialogTitle = `Configura componenti per "${this.newVariant.longName}"`;
    this.resetVariantComponentSelections();
    this.showVariantComponentsDialog = true;
  }

  // Reset component selections for variant
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

  // Cancel variant components dialog
  cancelVariantComponentsDialog(): void {
    this.showVariantComponentsDialog = false;
    this.resetVariantComponentSelections();
  }

  // Validate required components for variant
  validateVariantComponents(): string[] {
    const missingComponents = [];
    if (!this.selectedFusto) missingComponents.push('Fusto');
    if (!this.selectedGomma) missingComponents.push('Gomma');
    if (!this.selectedPiedini) missingComponents.push('Piedini');
    if (!this.selectedMeccanismo) missingComponents.push('Meccanismo');
    if (!this.selectedMaterasso) missingComponents.push('Materasso');
    if (!this.ferramentaList || this.ferramentaList.length === 0) missingComponents.push('Ferramenta');
    if (!this.selectedImballo) missingComponents.push('Imballo');
    if (!this.selectedRivestimentiForVariant || this.selectedRivestimentiForVariant.length === 0) {
      missingComponents.push('Rivestimenti');
    }
    return missingComponents;
  }

  // Apply components to new variant and add it
  applyComponentsToNewVariant(): void {
    const missingComponents = this.validateVariantComponents();

    if (missingComponents.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Componenti mancanti',
        detail: `È necessario selezionare: ${missingComponents.join(', ')}`,
        life: 5000
      });
      return;
    }

    // Create components array
    const components: ComponentModel[] = [];

    // Add single components
    [this.selectedFusto, this.selectedGomma, this.selectedMeccanismo,
    this.selectedMaterasso, this.selectedImballo, this.selectedScatola]
      .forEach(c => c && components.push(c));

    // Add piedini with quantity
    if (this.selectedPiedini) {
      for (let i = 0; i < Math.max(2, this.piediniQty); i++) {
        components.push(this.selectedPiedini);
      }
    }

    // Add multi-select components
    this.ferramentaList.forEach(c => components.push(c));
    this.varieList.forEach(c => components.push(c));

    // Add rivestimenti as components
    this.selectedRivestimentiForVariant.forEach(r => {
      components.push(new ComponentModel(
        r.id,
        `Rivestimento ${r.type}${r.code ? ` (${r.code})` : ''}`,
        r.mtPrice,
        [],
        'rivestimento'
      ));
    });

    // Create the new variant with components
    const variant = new Variant(
      '',
      this.editingProduct!.id,
      this.newVariant.longName,
      0, // Price will be calculated
      components,
      this.newVariant.seatsCount,
      this.newVariant.mattressWidth
    );

    // Calculate price
    variant.updatePrice();

    // Add to variants list
    this.editingVariants.push(variant);

    // Reset form
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

  // Get components by type (same logic as aggiungi-prodotto)
  getComponentsByType(type: string): ComponentModel[] {
    const lowerType = type.toLowerCase();

    if (!this.componentsByTypeCache.has(lowerType)) {
      // Cache miss - filter the components and store in cache
      const filtered = this.availableComponents.filter(c => {
        // Ensure c.type exists and matches (case-insensitive)
        return c.type && c.type.toLowerCase() === lowerType;
      });
      this.componentsByTypeCache.set(lowerType, filtered);
      
      // Debug logging to help troubleshoot
      console.log(`Filtering components for type '${type}':`, {
        totalComponents: this.availableComponents.length,
        filteredComponents: filtered.length,
        availableTypes: this.availableComponents.map(c => c.type).filter(t => t),
        filtered: filtered.map(c => ({ name: c.name, type: c.type }))
      });
    }

    return this.componentsByTypeCache.get(lowerType) || [];
  }



  // Component selection handler
  onVariantComponentSelected(type: string, component: any): void {
    console.log(`Componente ${type} selezionato per variante:`, component);
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

  // Add missing methods for variant expansion
  isVariantExpanded(variantId: string): boolean {
    return this.expandedVariants.has(variantId);
  }

  toggleVariantExpansion(variantId: string): void {
    if (this.expandedVariants.has(variantId)) {
      this.expandedVariants.delete(variantId);
    } else {
      this.expandedVariants.add(variantId);
    }
    this.cdr.detectChanges();
  }

  // Add missing method for grouping components
  getGroupedComponents(variant: Variant): GroupedComponent[] {
    const componentMap = new Map<string, GroupedComponent>();

    variant.components.forEach((component) => {
      const key = `${component.id}-${component.name}`;
      if (componentMap.has(key)) {
        const existing = componentMap.get(key)!;
        existing.quantity++;
        existing.totalPrice += component.price;
      } else {
        componentMap.set(key, {
          component: component,
          quantity: 1,
          totalPrice: component.price,
        });
      }
    });

    return Array.from(componentMap.values());
  }

  // Add missing method for component type names
  getComponentTypeName(typeId: string): string {
    return this.componentTypeMap.get(typeId) || 'Tipo sconosciuto';
  }

  // Add missing method for delete product
  deleteProduct(event: Event, product: SofaProduct): void {
    event.stopPropagation();

    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il prodotto "${product.name}"?`,
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.sofaProductService.deleteSofaProduct(product.id).subscribe({
          next: () => {
            this.products = this.products.filter((p) => p.id !== product.id);
            this.productVariants.delete(product.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Prodotto eliminato',
              detail: `Il prodotto "${product.name}" è stato eliminato con successo`,
            });
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Errore durante l\'eliminazione del prodotto',
            });
          },
        });
      },
    });
  }

  // Add missing property and methods for edit dialog
  get editProductDialogTitle(): string {
    return this.editingProduct ? `Modifica Prodotto: ${this.editingProduct.name}` : 'Modifica Prodotto';
  }

  onEditDialogHide(): void {
    this.editingProduct = undefined;
    this.editingVariants = [];
    this.tempImageFile = undefined;
    this.tempImageUrl = undefined;
    this.imageRemoved = false;
    this.uploadingNewImage = false;
    this.uploadProgress = 0;
    this.isUploadMode = false;
    this.editingVariantIndex = -1;
    this.newVariant = new Variant('', '', '', 0);
  }

  // Add missing properties and methods for image handling
  get currentImageToShow(): string | undefined {
    if (this.tempImageUrl) {
      return this.tempImageUrl;
    }
    return this.editingProduct?.photoUrl;
  }

  get shouldShowImagePlaceholder(): boolean {
    return !this.editingProduct?.photoUrl && !this.tempImageUrl && !this.imageRemoved;
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
        this.isUploadMode = false;
        this.cdr.detectChanges();
      },
    });
  }

  triggerFileInput(): void {
    if (this.hiddenFileInput) {
      this.hiddenFileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Seleziona un file immagine valido',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'L\'immagine deve essere inferiore a 5MB',
      });
      return;
    }

    this.tempImageFile = file;
    this.imageRemoved = false;

    // Create preview URL
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

  // Add the missing method that was referenced but not implemented
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
      },
    });
  }

  // Component management for variants
  openAddComponentToVariant(variant: Variant): void {
    this.currentEditingVariant = variant;
    this.selectedComponentForVariant = undefined;
    this.componentQuantityForVariant = 1;
    this.showAddComponentDialog = true;
  }

  addComponentToVariant(): void {
    if (!this.selectedComponentForVariant || !this.currentEditingVariant) return;

    // Add the component the specified number of times
    for (let i = 0; i < this.componentQuantityForVariant; i++) {
      this.currentEditingVariant.components.push({ ...this.selectedComponentForVariant });
    }

    this.currentEditingVariant.updatePrice();
    this.showAddComponentDialog = false;
    this.cdr.detectChanges();

    this.messageService.add({
      severity: 'success',
      summary: 'Componente aggiunto',
      detail: `${this.selectedComponentForVariant.name} aggiunto alla variante`,
    });
  }

  removeComponentFromVariant(variant: Variant, componentIndex: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler rimuovere questo componente?',
      header: 'Conferma rimozione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        variant.components.splice(componentIndex, 1);
        variant.updatePrice();
        this.cdr.detectChanges();
      },
    });
  }

  cancelAddComponent(): void {
    this.showAddComponentDialog = false;
    this.currentEditingVariant = undefined;
    this.selectedComponentForVariant = undefined;
    this.componentQuantityForVariant = 1;
  }

  // Enhanced save method
  saveProductChanges() {
    if (!this.editingProduct) return;

    this.saving = true;

    // Function to save variants after product is saved
    const saveVariants = () => {
      if (this.editingVariants.length === 0) {
        this.completeSave();
        return;
      }

      // Save all variants
      const variantSavePromises = this.editingVariants.map((variant) => {
        variant.sofaId = this.editingProduct!.id;
        if (variant.id) {
          // Update existing variant
          return this.variantService.updateVariant(variant.id, variant).toPromise();
        } else {
          // Create new variant
          return this.variantService.createVariant(variant).toPromise();
        }
      });

      Promise.all(variantSavePromises)
        .then((variantIds) => {
          // Update product with variant IDs
          const newVariantIds = variantIds.filter((id) => id).map((id) => id as string);
          const existingVariantIds = this.editingVariants.filter((v) => v.id).map((v) => v.id);
          this.editingProduct!.variants = [...existingVariantIds, ...newVariantIds];

          this.completeSave();
        })
        .catch((error) => {
          console.error('Error saving variants:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Errore durante il salvataggio delle varianti',
          });
          this.saving = false;
          this.cdr.detectChanges();
        });
    };

    // Function to complete the save process
    const completeProductSave = () => {
      this.sofaProductService
        .updateSofaProduct(this.editingProduct!.id, this.editingProduct!)
        .subscribe(
          () => {
            saveVariants();
          },
          (error) => {
            console.error('Errore durante il salvataggio:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Si è verificato un errore durante il salvataggio delle modifiche',
            });
            this.saving = false;
            this.cdr.detectChanges();
          }
        );
    };

    // Handle image changes first, then save product
    if (this.imageRemoved) {
      if (this.editingProduct.photoUrl) {
        this.editingProduct.photoUrl = undefined;
      }
      completeProductSave();
    } else if (this.tempImageFile) {
      const uploadTask = this.uploadService.uploadProductImage(
        this.tempImageFile,
        this.editingProduct.id
      );

      uploadTask.subscribe({
        next: (progress) => {
          this.uploadProgress = Math.round(progress.progress || 0);

          if (progress.downloadURL && progress.progress >= 100) {
            this.editingProduct!.photoUrl = progress.downloadURL;
            completeProductSave();
          }
        },
        error: (error) => {
          console.error('Errore upload:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: "Impossibile caricare l'immagine",
          });
          this.saving = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      completeProductSave();
    }
  }

  private completeSave(): void {
    // Update the product in the local list
    const index = this.products.findIndex((p) => p.id === this.editingProduct!.id);
    if (index !== -1) {
      this.products[index] = { ...this.editingProduct! };
    }

    // Update the variants in the local cache
    this.productVariants.set(this.editingProduct!.id, [...this.editingVariants]);

    this.messageService.add({
      severity: 'success',
      summary: 'Prodotto Aggiornato',
      detail: 'Modifiche salvate con successo',
    });

    this.showEditProductDialog = false;
    this.saving = false;
    this.cdr.detectChanges();
  }
}
