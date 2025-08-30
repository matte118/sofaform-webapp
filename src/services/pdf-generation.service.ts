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
  private rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] } = {};
  private extrasData: ExtraMattress[] = [];
  private markupPerc = 0;
  private deliveryCost = 0;

  constructor() { }

  /**
   * Configura i dati da usare nel PDF con rivestimenti organizzati per variante
   */
  setListinoData(
    product: SofaProduct,
    variants: Variant[],
    rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] },
    extras: ExtraMattress[],
    markup: number,
    delivery: number
  ): void {
    this.productData = product;
    this.variantsData = variants;
    this.rivestimentiByVariant = rivestimentiByVariant;
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
   * Converte il logo da base64
   */
  private async getLogoBase64(): Promise<string> {
    try {
      const response = await fetch('/logo_sofaform_pdf.png');
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Errore nel caricamento logo'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Impossibile caricare il logo:', error);
      // Fallback to placeholder if logo fails to load
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Genera e scarica il PDF sfruttando pdfmake
   */
  async generateListinoPdf(productName: string) {
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [35, 35, 35, 35],
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3,
        color: '#2d3748'
      },
      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#1a365d',
          margin: [0, 10, 0, 15],
          alignment: 'center'
        },
        productName: {
          fontSize: 18,
          italics: true,
          color: '#2d3748',
          margin: [0, 15, 0, 15],
          alignment: 'center'
        },
        description: {
          fontSize: 11,
          color: '#718096',
          margin: [0, 0, 0, 20],
          alignment: 'center',
          italics: true,
          lineHeight: 1.4
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#1a365d',
          margin: [0, 20, 0, 12],
          fillColor: '#f7fafc',
          padding: [12, 8, 12, 8]
        },
        variantName: {
          fontSize: 12,
          bold: true,
          color: '#1a365d',
          margin: [0, 15, 0, 5]
        },
        tableHeader: {
          bold: true,
          fillColor: '#4299e1',
          color: '#ffffff',
          fontSize: 10,
          margin: [8, 6, 8, 6]
        },
        tableCell: {
          margin: [8, 4, 8, 4],
          fontSize: 9,
          lineHeight: 1.2
        },
        small: {
          fontSize: 8,
          color: '#a0aec0'
        },
        normal: {
          fontSize: 10,
          color: '#2d3748'
        },
        bold: {
          fontSize: 10,
          bold: true,
          color: '#2d3748'
        },
        italic: {
          fontSize: 10,
          italics: true,
          color: '#4a5568'
        }
      },
      header: (currentPage: number) => {
        if (currentPage > 1) {
          return {
            columns: [
              { text: '', width: '*' },
              {
                text: this.productData.name,
                style: 'small',
                alignment: 'center',
                margin: [0, 12, 0, 0],
                color: '#718096'
              },
              { text: '', width: '*' }
            ]
          };
        }
        return {};
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: `${currentPage} / ${pageCount}`,
            style: 'small',
            alignment: 'center',
            margin: [0, 12, 0, 0]
          }
        ]
      }),
      content: []
    };

    // Logo centrato
    const logoBase64 = await this.getLogoBase64();
    docDefinition.content.push({
      image: logoBase64,
      width: 300,
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });

    // Nome prodotto
    docDefinition.content.push({
      text: this.productData.name,
      style: 'productName'
    });

    // Immagine prodotto se disponibile
    if (this.productData.photoUrl) {
      const imageBase64 = await this.urlToBase64(this.productData.photoUrl);
      if (imageBase64) {
        docDefinition.content.push({
          image: imageBase64,
          width: 220, // Aumentato da 180 a 220
          alignment: 'center',
          margin: [0, 0, 0, 20]
        });
      }
    }

    // Descrizione prodotto
    if (this.productData.description) {
      docDefinition.content.push({
        text: this.productData.description,
        style: 'description'
      });
    }

    // Scheda Tecnica compatta
    const techSpecs = [
      ['Seduta', this.productData.seduta || 'N/D'],
      ['Schienale', this.productData.schienale || 'N/D'],
      ['Meccanica', this.productData.meccanica || 'N/D'],
      ['Materasso', this.productData.materasso || 'N/D']
    ].filter(spec => spec[1] !== 'N/D');

    if (techSpecs.length > 0) {
      docDefinition.content.push(
        { text: 'Scheda Tecnica', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                { text: 'Caratteristica', style: 'tableHeader' },
                { text: 'Dettaglio', style: 'tableHeader' }
              ],
              ...techSpecs.map((spec, index) => [
                {
                  text: spec[0],
                  style: index % 2 === 0 ? 'bold' : 'normal',
                  fillColor: index % 2 === 0 ? '#f8fafc' : '#ffffff'
                },
                {
                  text: spec[1],
                  style: index % 2 === 0 ? 'italic' : 'normal',
                  fillColor: index % 2 === 0 ? '#f8fafc' : '#ffffff'
                }
              ])
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e2e8f0',
            vLineColor: () => '#e2e8f0',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 4,
            paddingBottom: () => 4
          },
          margin: [0, 0, 0, 25]
        }
      );
    }

    // Varianti con rivestimenti specifici per ogni variante
    this.variantsData.forEach((variant, index) => {
      // Nome variante sopra la tabella
      docDefinition.content.push({
        text: variant.longName,
        style: 'variantName'
      });

      // Ottieni i rivestimenti specifici per questa variante
      const variantRivestimenti = this.rivestimentiByVariant[variant.id] || [];

      if (variantRivestimenti.length > 0) {
        // Tabella rivestimenti per questa specifica variante
        const rivestimentiBody: any[] = [
          [
            { text: 'Rivestimento', style: 'tableHeader' },
            { text: 'Prezzo', style: 'tableHeader', alignment: 'right' }
          ]
        ];

        variantRivestimenti.forEach((r, idx) => {
          const rivestimentoCost = r.rivestimento.mtPrice * r.metri;
          const variantTotalPrice = variant.price + rivestimentoCost + this.deliveryCost;
          const finalPrice = this.applyMarkup(variantTotalPrice, this.markupPerc);

          rivestimentiBody.push([
            {
              text: r.rivestimento.name,
              style: 'bold',
              fillColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff'
            },
            {
              text: `€ ${finalPrice.toFixed(2)}`,
              style: idx % 2 === 0 ? 'bold' : 'normal',
              alignment: 'right',
              color: '#38a169',
              fillColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff'
            }
          ]);
        });

        docDefinition.content.push({
          table: {
            widths: ['70%', '30%'],
            body: rivestimentiBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e2e8f0',
            vLineColor: () => '#e2e8f0',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 3,
            paddingBottom: () => 3
          },
          margin: [0, 0, 0, 8]
        });
      } else {
        // Se non ci sono rivestimenti per questa variante, mostra un messaggio
        docDefinition.content.push({
          text: 'Nessun rivestimento configurato per questa variante',
          style: 'italic',
          color: '#718096',
          margin: [0, 0, 0, 8]
        });
      }
    });

    // Sezione finale: Materassi Extra
    const hasExtras = this.extrasData.length > 0;
    const hasDelivery = this.deliveryCost > 0;

    if (hasExtras || hasDelivery) {
      docDefinition.content.push({
        text: 'Servizi Aggiuntivi',
        style: 'sectionHeader'
      });

      const servicesBody: any[] = [
        [
          { text: 'Servizio', style: 'tableHeader' },
          { text: 'Prezzo', style: 'tableHeader', alignment: 'right' }
        ]
      ];

      // Aggiungi materassi extra
      this.extrasData.forEach((extra, idx) => {
        servicesBody.push([
          {
            text: extra.name,
            style: idx % 2 === 0 ? 'bold' : 'italic',
            fillColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff'
          },
          {
            text: `€ ${extra.price.toFixed(2)}`,
            style: idx % 2 === 0 ? 'bold' : 'normal',
            alignment: 'right',
            color: '#38a169',
            fillColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff'
          }
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: ['70%', '30%'],
          body: servicesBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 20]
      });
    }

    // Footer minimalista
    docDefinition.content.push({
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: 515,
          h: 1,
          color: '#4299e1'
        }
      ],
      margin: [0, 15, 0, 0]
    });

    // Genera e scarica il PDF
    const filename = this.getFilename(productName);
    pdfMake.createPdf(docDefinition).download(filename);
  }

  private sumRivestimenti(): number {
    // Calculate total from rivestimentiByVariant structure
    let total = 0;
    Object.values(this.rivestimentiByVariant).forEach((variantRivestimenti: { rivestimento: Rivestimento; metri: number }[]) => {
      total += variantRivestimenti.reduce((sum: number, r: { rivestimento: Rivestimento; metri: number }) => 
        sum + (r.rivestimento.mtPrice * r.metri), 0);
    });
    return total;
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