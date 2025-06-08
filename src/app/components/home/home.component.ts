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
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    FormsModule
  ],
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
    private productService: ProductService
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
      // Genera ed esporta il PDF
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

    // Genera la tabella (ritorna void)
    autoTable(doc, {
      startY: 30,
      head,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 40, right: 40 }
    });

    // Prendi la coordinata Y in fondo alla tabella
    const finalY = (doc as any).lastAutoTable?.finalY ?? 50;

    // Calcola e scrivi il totale
    const totale = rows
      .map(r => parseFloat(r[3]))
      .reduce((sum, val) => sum + val, 0);

    doc.setFontSize(14);
    doc.text(`Totale: € ${totale.toFixed(2)}`, 40, finalY + 20);

    doc.save(`Listino_${product.nome.replace(/\s+/g, '_')}.pdf`);
  }
}
