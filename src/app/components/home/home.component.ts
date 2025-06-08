import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProductModel } from '../../../models/product.model';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';  // <-- import funzionale
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
  products: ProductModel[] = [];
  showMarkupDialog = false;
  selectedProduct?: ProductModel;
  markupPercentage = 30;

  constructor(
    private router: Router,
    private productService: ProductService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  trackByName(_: number, item: ProductModel) {
    return item.nome;
  }

  generaListino(product: ProductModel) {
    this.selectedProduct = product;
    this.showMarkupDialog = true;
  }

  generateWithMarkup() {
    if (this.selectedProduct) {
      this.exportPdf(this.selectedProduct, this.markupPercentage);
    }
    this.showMarkupDialog = false;
  }

  cancelMarkup() {
    this.showMarkupDialog = false;
  }

  private exportPdf(product: ProductModel, markupPerc: number) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text(`Listino: ${product.nome}`, 40, 20);

    const markup = markupPerc / 100;
    const rows = product.componenti.map(c => {
      const prezzoRicalcolato = c.prezzo * (1 + markup);
      const subtotal = prezzoRicalcolato * c.quantita;
      return [
        c.nome + (c.variante ? ` (${c.variante})` : ''),
        c.quantita.toString(),
        prezzoRicalcolato.toFixed(2),
        subtotal.toFixed(2)
      ];
    });

    const head = [['Componente', 'Quantità', 'Prezzo cad.', 'Subtotale']];

    // Chiamata “funzionale” al plugin
    autoTable(doc, {
      head,
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 40, right: 40 }
    });

    // Recupera la coordinata Y in fondo alla tabella
    const finalY = (doc as any).lastAutoTable?.finalY ?? 50;

    // Calcola e scrivi il totale
    const totale = rows
      .map(r => parseFloat(r[3]))
      .reduce((sum, val) => sum + val, 0);

    doc.setFontSize(14);
    doc.text(`Totale: € ${totale.toFixed(2)}`, 40, finalY + 20);

    doc.save(`Listino_${product.nome.replace(/\s+/g, '_')}.pdf`);
  }

  editProduct(product: ProductModel) {
    this.router.navigate(['/modifica-prodotto', product.nome]);
  }

  deleteProduct(event: Event, product: ProductModel) {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo prodotto?',
      accept: () => {
        this.productService.deleteProduct(product.nome);
      }
    });
  }
}
