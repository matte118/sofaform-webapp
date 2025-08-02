import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { ExtraMattress } from '../models/extra-mattress.model';

// Inizializza il Virtual File System per i font
(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {
  // --- Proprietà interne per l'adapter ---
  private productData!: SofaProduct;
  private variantsData: Variant[] = [];
  private rivestimentiData: { rivestimento: Rivestimento; metri: number }[] = [];
  private extrasData: ExtraMattress[] = [];
  private markupPerc = 0;
  private deliveryCost = 0;

  constructor() {}

  /**
   * Configura i dati da usare nel PDF
   */
  setListinoData(
    product: SofaProduct,
    variants: Variant[],
    rivestimenti: { rivestimento: Rivestimento; metri: number }[],
    extras: ExtraMattress[],
    markup: number,
    delivery: number
  ): void {
    this.productData      = product;
    this.variantsData     = variants;
    this.rivestimentiData = rivestimenti;
    this.extrasData       = extras;
    this.markupPerc       = markup;
    this.deliveryCost     = delivery;
  }

  /**
   * Genera e scarica il PDF sfruttando pdfmake
   */
  async generateListinoPdf(productName: string) {
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20],
      defaultStyle: { fontSize: 12 },
      styles: {
        header:      { fontSize: 18, bold: true, color: '#2c5aa0', margin: [0, 0, 0, 10] },
        subheader:   { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fillColor: '#f1f3f4' },
        small:       { fontSize: 10, italics: true }
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: `Pagina ${currentPage} di ${pageCount}`, style: 'small', alignment: 'center' }
        ],
        margin: [0, 0, 0, 10]
      }),
      content: []
    };

    // Header e descrizione
    docDefinition.content.push(
      { text: 'Listino Prezzi', style: 'header', alignment: 'center' },
      { text: this.productData.name, style: 'subheader', alignment: 'center' }
    );
    if (this.productData.description) {
      docDefinition.content.push({ text: this.productData.description, margin: [0, 0, 0, 10] });
    }

    // Scheda Tecnica
    docDefinition.content.push({ text: 'Scheda Tecnica', style: 'subheader' });
    docDefinition.content.push({
      table: {
        widths: ['auto','*'],
        body: [
          ['Seduta',    this.productData.seduta    || '-'],
          ['Schienale', this.productData.schienale || '-'],
          ['Meccanica', this.productData.meccanica || '-'],
          ['Materasso', this.productData.materasso || '-']
        ]
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 20]
    });

    // Varianti
    this.variantsData.forEach((variant, i) => {
      if (i > 0) docDefinition.content.push({ text: '', pageBreak: 'before' });
      docDefinition.content.push({ text: `Variante: ${variant.longName}`, style: 'subheader' });

      // Tabella componenti + rivestimenti + consegna
      const body: any[] = [
        [
          { text: 'Componente',   style: 'tableHeader' },
          { text: 'Qtà',          style: 'tableHeader' },
          { text: 'Prezzo Unit.', style: 'tableHeader' },
          { text: 'Totale',       style: 'tableHeader' }
        ]
      ];
      variant.components.forEach(c => {
        body.push([c.name, '1', `€ ${c.price.toFixed(2)}`, `€ ${c.price.toFixed(2)}`]);
      });
      this.rivestimentiData.forEach(r => {
        body.push([
          `Rivestimento: ${r.rivestimento.name}`,
          `${r.metri} mt`,
          `€ ${r.rivestimento.mtPrice.toFixed(2)}/mt`,
          `€ ${(r.rivestimento.mtPrice * r.metri).toFixed(2)}`
        ]);
      });
      if (this.deliveryCost > 0) {
        body.push(['Costo Consegna','1',`€ ${this.deliveryCost.toFixed(2)}`,`€ ${this.deliveryCost.toFixed(2)}`]);
      }
      docDefinition.content.push({
        table: { widths: ['*','auto','auto','auto'], body },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      });

      // Riepilogo prezzi
      const baseTotal      = variant.price + this.sumRivestimenti() + this.deliveryCost;
      const totalWithMark = this.applyMarkup(baseTotal, this.markupPerc);
      docDefinition.content.push({
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                ['Subtotale:',               `€ ${baseTotal.toFixed(2)}`],
                [`Ricarico (${this.markupPerc}%):`, `€ ${(totalWithMark - baseTotal).toFixed(2)}`],
                [{ text: 'Totale Finale:', bold: true }, { text: `€ ${totalWithMark.toFixed(2)}`, bold: true }]
              ]
            },
            layout: 'noBorders'
          }
        ],
        margin: [0, 0, 0, 20]
      });
    });

    // Materassi Extra
    if (this.extrasData.length) {
      docDefinition.content.push({ text: 'Materassi Extra', style: 'subheader' });
      this.extrasData.forEach(m => {
        docDefinition.content.push({ text: `${m.name}: € ${m.price.toFixed(2)}`, margin: [0, 2, 0, 2] });
      });
    }

    // Scarica il PDF
    const filename = this.getFilename(productName);
    pdfMake.createPdf(docDefinition).download(filename);
  }

  private sumRivestimenti(): number {
    return this.rivestimentiData.reduce((s, r) => s + r.rivestimento.mtPrice * r.metri, 0);
  }

  private applyMarkup(amount: number, perc: number): number {
    const factor = (100 - perc) / 100;
    return factor > 0 ? amount / factor : amount;
  }

  getFilename(productName: string): string {
    const ts    = new Date().toISOString().slice(0,10);
    const clean = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Listino_${clean}_${ts}.pdf`;
  }
}