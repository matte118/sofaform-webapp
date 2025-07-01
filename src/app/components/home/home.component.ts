import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';

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
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
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
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadProducts();
      this.loadRivestimenti();
      this.loadComponentTypes();
    }
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

    const rivestimentoCost = this.calculateRivestimentoCost();

    const rows: string[][] = [];
    variants.forEach((variant) => {
      rows.push([`Variante: ${variant.longName}`, '', '', '']);
      variant.components.forEach((component) => {
        // Nessun ricarico sulle componenti
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
      // Calcolo prezzo finale con ricarico solo sul totale
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
      startY: 30,
      theme: 'striped',
      margin: { left: 40, right: 40 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 50;

    doc.setFontSize(14);
    doc.save(`Listino_${product.name.replace(/\s+/g, '_')}.pdf`);
  }

  editProduct(product: SofaProduct) {
    this.router.navigate(['/modifica-prodotto', product.id]);
  }

  deleteProduct(event: Event, product: SofaProduct) {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo prodotto?',
      accept: () => {
        this.sofaProductService.deleteSofaProduct(product.id).subscribe(() => {
          this.products = this.products.filter((p) => p.id !== product.id);
          this.cdr.detectChanges();
        });
      },
    });
  }

  toggleVariantExpansion(variantId: string): void {
    console.log('Toggling variant expansion for:', variantId);
    if (this.expandedVariants.has(variantId)) {
      this.expandedVariants.delete(variantId);
      console.log('Collapsed variant:', variantId);
    } else {
      this.expandedVariants.add(variantId);
      console.log('Expanded variant:', variantId);
    }
    console.log(
      'Current expanded variants:',
      Array.from(this.expandedVariants)
    );
    this.cdr.detectChanges();
  }

  isVariantExpanded(variantId: string): boolean {
    const isExpanded = this.expandedVariants.has(variantId);
    return isExpanded;
  }

  loadComponentTypes(): void {
    this.componentTypeService
      .getComponentTypes()
      .subscribe((types: ComponentType[]) => {
        this.componentTypeMap = new Map(types.map((t) => [t.id, t.name]));
        this.cdr.detectChanges();
      });
  }

  getComponentTypeName(typeId?: string): string {
    return typeId ? this.componentTypeMap.get(typeId) ?? '' : '';
  }
}
