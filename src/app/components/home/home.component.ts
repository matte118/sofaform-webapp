import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SofaProduct } from '../../../models/sofa-product.model';
import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { Variant } from '../../../models/variant.model';

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
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  products: SofaProduct[] = [];
  productVariants: Map<string, Variant[]> = new Map();
  showMarkupDialog = false;
  selectedProduct?: SofaProduct;
  markupPercentage = 30;

  constructor(
    private router: Router,
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.sofaProductService.getSofaProducts().subscribe(products => {
      this.products = products;
      
      // Load variants for each product
      products.forEach(product => {
        this.variantService.getVariantsBySofaId(product.id).subscribe(variants => {
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
    const variants = this.productVariants.get(productId) || [];
    if (variants.length === 0) return 0;
    
    // Return average price of variants as an example
    const total = variants.reduce((sum, variant) => sum + variant.price, 0);
    return total / variants.length;
  }

  generaListino(product: SofaProduct) {
    this.selectedProduct = product;
    this.showMarkupDialog = true;
  }

  generateWithMarkup() {
    if (this.selectedProduct) {
      const variants = this.productVariants.get(this.selectedProduct.id) || [];
      this.exportPdf(this.selectedProduct, variants, this.markupPercentage);
    }
    this.showMarkupDialog = false;
  }

  cancelMarkup() {
    this.showMarkupDialog = false;
  }

  private exportPdf(product: SofaProduct, variants: Variant[], markupPerc: number) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text(`Listino: ${product.name}`, 40, 20);

    const markup = markupPerc / 100;
    
    // Create rows for each variant
    const rows: string[][] = [];
    
    variants.forEach(variant => {
      // Add variant header
      rows.push([
        `Variante: ${variant.longName}`,
        '',
        '',
        ''
      ]);
      
      // Add components
      variant.components.forEach(component => {
        const componentPrice = component.price * (1 + markup);
        rows.push([
          component.name,
          '1', // Quantity is always 1 in this model
          componentPrice.toFixed(2),
          componentPrice.toFixed(2)
        ]);
      });
      
      // Add variant total
      const variantTotal = variant.price;
      rows.push([
        'Totale variante',
        '',
        '',
        variantTotal.toFixed(2)
      ]);
      
      // Add spacer
      rows.push(['', '', '', '']);
    });

    const head = [['Componente', 'Quantità', 'Prezzo cad.', 'Subtotale']];

    autoTable(doc, {
      head,
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 40, right: 40 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 50;

    // Calculate grand total across all variants
    const grandTotal = variants.reduce((sum, variant) => sum + variant.price, 0);

    doc.setFontSize(14);
    doc.text(`Totale Prodotto: € ${grandTotal.toFixed(2)}`, 40, finalY + 20);

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
          this.products = this.products.filter(p => p.id !== product.id);
          this.cdr.detectChanges();
        });
      }
    });
  }
}
