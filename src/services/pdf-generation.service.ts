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

  constructor() { }

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
    this.productData = product;
    this.variantsData = variants;
    this.rivestimentiData = rivestimenti;
    this.extrasData = extras;
    this.markupPerc = markup;
    this.deliveryCost = delivery;
  }

  /**
   * Converte un'immagine da URL a base64
   */
  private async urlToBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Errore nella conversione immagine'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Impossibile caricare l\'immagine:', error);
      return null;
    }
  }

  /**
   * Genera e scarica il PDF sfruttando pdfmake
   */
  async generateListinoPdf(productName: string) {
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [30, 30, 30, 30],
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.3,
        color: '#333333'
      },
      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#2c5aa0',
          margin: [0, 0, 0, 5],
          alignment: 'center'
        },
        productName: {
          fontSize: 18,
          bold: true,
          color: '#444444',
          margin: [0, 0, 0, 15],
          alignment: 'center'
        },
        description: {
          fontSize: 12,
          color: '#666666',
          margin: [0, 0, 0, 20],
          alignment: 'center',
          italics: true
        },
        sectionHeader: {
          fontSize: 16,
          bold: true,
          color: '#2c5aa0',
          margin: [0, 25, 0, 15]
        },
        variantHeader: {
          fontSize: 14,
          bold: true,
          color: '#2c5aa0',
          margin: [0, 20, 0, 10],
          fillColor: '#f8f9fa',
          padding: [10, 8, 10, 8]
        },
        tableHeader: {
          bold: true,
          fillColor: '#e3f2fd',
          color: '#1976d2',
          fontSize: 11,
          margin: [5, 8, 5, 8]
        },
        tableCell: {
          margin: [5, 6, 5, 6],
          fontSize: 10
        },
        priceBox: {
          fillColor: '#f5f5f5',
          margin: [0, 15, 0, 0]
        },
        deliveryBox: {
          fillColor: '#fff3e0',
          margin: [0, 15, 0, 0]
        },
        totalPrice: {
          fontSize: 16,
          bold: true,
          color: '#2c5aa0'
        },
        small: {
          fontSize: 9,
          color: '#888888'
        }
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: `Pagina ${currentPage} di ${pageCount}`,
            style: 'small',
            alignment: 'center',
            margin: [0, 10, 0, 0]
          }
        ]
      }),
      content: []
    };

    // Header principale
    docDefinition.content.push(
      { text: 'LISTINO PREZZI', style: 'title' },
      { text: this.productData.name, style: 'productName' }
    );

    // Descrizione prodotto (se presente)
    if (this.productData.description) {
      docDefinition.content.push({
        text: this.productData.description,
        style: 'description'
      });
    }

    // Foto prodotto (se presente)
    if (this.productData.photoUrl) {
      const imageBase64 = await this.urlToBase64(this.productData.photoUrl);
      if (imageBase64) {
        docDefinition.content.push({
          image: imageBase64,
          width: 200,
          alignment: 'center',
          margin: [0, 0, 0, 25]
        });
      }
    }

    // Scheda Tecnica moderna
    docDefinition.content.push({ text: 'Scheda Tecnica', style: 'sectionHeader' });

    const techSpecs = [
      ['Seduta', this.productData.seduta || 'N/D'],
      ['Schienale', this.productData.schienale || 'N/D'],
      ['Meccanica', this.productData.meccanica || 'N/D'],
      ['Materasso', this.productData.materasso || 'N/D']
    ].filter(spec => spec[1] !== 'N/D'); // Mostra solo le specifiche disponibili

    if (techSpecs.length > 0) {
      docDefinition.content.push({
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Caratteristica', style: 'tableHeader' },
              { text: 'Dettaglio', style: 'tableHeader' }
            ],
            ...techSpecs.map(spec => [
              { text: spec[0], style: 'tableCell', bold: true },
              { text: spec[1], style: 'tableCell' }
            ])
          ]
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#e3f2fd' : (rowIndex % 2 === 0 ? '#fafafa' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0'
        },
        margin: [0, 0, 0, 30]
      });
    }

    // Varianti con rivestimenti
    this.variantsData.forEach((variant, index) => {
      if (index > 0) {
        docDefinition.content.push({ text: '', pageBreak: 'before' });
      }

      // Header variante
      docDefinition.content.push({
        text: variant.longName,
        style: 'variantHeader'
      });

      // Tabella rivestimenti (solo prezzi finali)
      const rivestimentiBody: any[] = [
        [
          { text: 'Rivestimento', style: 'tableHeader' },
          { text: 'Prezzo', style: 'tableHeader', alignment: 'right' }
        ]
      ];

      this.rivestimentiData.forEach(r => {
        const totalPrice = r.rivestimento.mtPrice * r.metri;
        rivestimentiBody.push([
          { text: r.rivestimento.name, style: 'tableCell' },
          {
            text: `€ ${totalPrice.toFixed(2)}`,
            style: 'tableCell',
            alignment: 'right',
            bold: true
          }
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: ['70%', '30%'],
          body: rivestimentiBody
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#e3f2fd' : (rowIndex % 2 === 0 ? '#fafafa' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0'
        },
        margin: [0, 0, 0, 20]
      });

      // Box prezzi (senza consegna)
      const baseTotal = variant.price + this.sumRivestimenti();
      const totalWithMarkup = this.applyMarkup(baseTotal, this.markupPerc);
      const markupAmount = totalWithMarkup - baseTotal;

      docDefinition.content.push({
        table: {
          widths: ['60%', '40%'],
          body: [
            [
              { text: 'Subtotale variante:', style: 'tableCell' },
              { text: `€ ${baseTotal.toFixed(2)}`, style: 'tableCell', alignment: 'right' }
            ],
            [
              { text: `Ricarico (${this.markupPerc}%):`, style: 'tableCell' },
              { text: `€ ${markupAmount.toFixed(2)}`, style: 'tableCell', alignment: 'right' }
            ],
            [
              { text: 'TOTALE VARIANTE:', style: 'tableCell', bold: true, color: '#2c5aa0' },
              {
                text: `€ ${totalWithMarkup.toFixed(2)}`,
                style: ['tableCell', 'totalPrice'],
                alignment: 'right'
              }
            ]
          ]
        },
        style: 'priceBox',
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 2 ? '#e8f5e8' : '#f5f5f5',
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0'
        },
        margin: [0, 10, 0, 0]
      });

      // Box consegna separato
      if (this.deliveryCost > 0) {
        docDefinition.content.push({
          table: {
            widths: ['60%', '40%'],
            body: [
              [
                {
                  text: '🚛 Costo Consegna:',
                  style: 'tableCell',
                  bold: true,
                  color: '#f57c00'
                },
                {
                  text: `€ ${this.deliveryCost.toFixed(2)}`,
                  style: 'tableCell',
                  alignment: 'right',
                  bold: true,
                  color: '#f57c00'
                }
              ]
            ]
          },
          style: 'deliveryBox',
          layout: {
            fillColor: () => '#fff3e0',
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ffb74d',
            vLineColor: () => '#ffb74d'
          },
          margin: [0, 10, 0, 20]
        });
      }
    });

    // Materassi Extra (se presenti)
    if (this.extrasData.length > 0) {
      docDefinition.content.push({
        text: 'Materassi Extra Disponibili',
        style: 'sectionHeader'
      });

      const extrasBody: any[] = [
        [
          { text: 'Materasso', style: 'tableHeader' },
          { text: 'Prezzo', style: 'tableHeader', alignment: 'right' }
        ]
      ];

      this.extrasData.forEach(extra => {
        extrasBody.push([
          { text: extra.name, style: 'tableCell' },
          {
            text: `€ ${extra.price.toFixed(2)}`,
            style: 'tableCell',
            alignment: 'right',
            bold: true
          }
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: ['70%', '30%'],
          body: extrasBody
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#e3f2fd' : (rowIndex % 2 === 0 ? '#fafafa' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0'
        },
        margin: [0, 0, 0, 20]
      });
    }

    // Genera e scarica il PDF
    const filename = this.getFilename(productName);
    pdfMake.createPdf(docDefinition).download(filename);
  }

  private sumRivestimenti(): number {
    return this.rivestimentiData.reduce((sum, r) => sum + (r.rivestimento.mtPrice * r.metri), 0);
  }

  private applyMarkup(amount: number, perc: number): number {
    const factor = (100 - perc) / 100;
    return factor > 0 ? amount / factor : amount;
  }

  getFilename(productName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanName = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Listino_${cleanName}_${timestamp}.pdf`;
  }
}