import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { ExtraMattress } from '../models/extra-mattress.model';
import { TranslationService } from './translation.service';
import { I18nService } from './i18n.service';

// Inizializza il Virtual File System per i font
(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({ providedIn: 'root' })
export class PdfGenerationService {
  // --- Proprietà interne per l'adapter ---
  private productData!: SofaProduct;
  private variantsData: Variant[] = [];
  private rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] } = {};
  private extrasData: ExtraMattress[] = [];
  private markupPerc = 0;
  private deliveryCost = 0;

  constructor(
    private translationService: TranslationService,
    private i18nService: I18nService
  ) { }

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
      // Fallback trasparente
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Genera e scarica il PDF con layout aggiornato
   */
  async generateListinoPdf(productName: string, languageCode: string = 'it') {
    // 1) Traduzioni statiche
    const staticTranslations = this.i18nService.getListinoTranslations(languageCode);

    // 2) Raccogli testi dinamici da tradurre
    const textsToTranslate: string[] = [];
    if (this.productData.name) textsToTranslate.push(this.productData.name);
    if (this.productData.description) textsToTranslate.push(this.productData.description);

    if (this.productData.seduta) textsToTranslate.push(this.productData.seduta);
    if (this.productData.schienale) textsToTranslate.push(this.productData.schienale);
    if (this.productData.meccanica) textsToTranslate.push(this.productData.meccanica);
    if (this.productData.materasso) textsToTranslate.push(this.productData.materasso);

    this.variantsData.forEach(v => { if (v.longName) textsToTranslate.push(v.longName); });

    const uniqueRivestimenti = new Set<string>();
    Object.values(this.rivestimentiByVariant).forEach(rivs => {
      rivs.forEach(r => { if (r.rivestimento.name) uniqueRivestimenti.add(r.rivestimento.name); });
    });
    textsToTranslate.push(...Array.from(uniqueRivestimenti));

    this.extrasData.forEach(extra => { if (extra.name) textsToTranslate.push(extra.name); });

    // 3) Traduzioni dinamiche
    let dynamicTranslations: { [key: string]: string } = {};
    if (languageCode !== 'it' && textsToTranslate.length > 0) {
      try {
        dynamicTranslations = await this.translationService.translateTexts(textsToTranslate, languageCode).toPromise() || {};
      } catch (error) {
        console.warn('Dynamic translation failed, using original texts:', error);
        textsToTranslate.forEach(t => dynamicTranslations[t] = t);
      }
    } else {
      textsToTranslate.forEach(t => dynamicTranslations[t] = t);
    }

    // 4) Funzione t()
    const t = (text: string) => {
      if (staticTranslations[text] !== undefined) return staticTranslations[text];
      return dynamicTranslations[text] || text;
    };

    // DocDefinition
    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [30, 30, 30, 30],
      defaultStyle: { fontSize: 9, lineHeight: 1.2, color: '#2d3748' },
      styles: {
        coverTitle: { fontSize: 32, bold: true, color: '#1a365d', alignment: 'center' },
        productName: { fontSize: 24, bold: true, color: '#2d3748', alignment: 'center', margin: [0, 10, 0, 15] },
        description: { fontSize: 11, color: '#718096', alignment: 'center', italics: true, margin: [0, 5, 0, 5] },
        matrixHeader: { bold: true, fillColor: '#1a365d', color: '#ffffff', fontSize: 9, alignment: 'center', margin: [3, 6, 3, 6] },
        matrixCell: { fontSize: 8, alignment: 'center', margin: [3, 4, 3, 4] },
        variantCell: { fontSize: 8, bold: true, alignment: 'left', margin: [8, 4, 3, 4], color: '#1a365d' },
        priceCell: { fontSize: 8, alignment: 'center', margin: [3, 4, 3, 4], bold: true, color: '#38a169' },
        techSpecs: { fontSize: 10, margin: [0, 10, 0, 10] },
        small: { fontSize: 7, color: '#718096', alignment: 'center' },

        // AGGIUNTE per il blocco citazione
        quoteMark: { fontSize: 42, bold: true, color: '#000000', lineHeight: 0.8 },
        quoteText: { fontSize: 12, color: '#4a5568', italics: true, alignment: 'left' }
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [{ text: `${currentPage} / ${pageCount}`, style: 'small', margin: [0, 10, 0, 0] }]
      }),
      content: []
    };

    // PAGINA 1: Cover con logo
    const logoBase64 = await this.getLogoBase64();
    docDefinition.content.push({
      stack: [
        { text: '', margin: [0, 150, 0, 0] },
        { image: logoBase64, width: 400, alignment: 'center' },
        { text: '', margin: [0, 0, 0, 50] },
        { text: t('LISTINO PREZZI'), style: 'coverTitle' }
      ],
      pageBreak: 'after'
    });

    // PAGINA 2: Titolo prodotto + immagini/descrizione + matrice prezzi + servizi extra
    docDefinition.content.push({ text: t(this.productData.name), style: 'productName' });

    await this.addProductImagesWithDescription(docDefinition, t);
    await this.addMatrixPricingTable(docDefinition, t);
    if (this.extrasData.length > 0) await this.addExtraServices(docDefinition, t);

    const filename = this.getFilename(productName, languageCode);
    pdfMake.createPdf(docDefinition).download(filename);
  }

  /**
   * Layout immagini/descrizione:
   * - Sinistra: immagine grande
   * - Destra: due immagini impilate + blocco citazione affiancato
   */
  /**
   * Layout immagini/descrizione:
   * - Sinistra: immagine grande
   * - Destra: due immagini impilate + scheda tecnica affiancata
   */
  private async addProductImagesWithDescription(docDefinition: any, t: (text: string) => string): Promise<void> {
    const images: string[] = [];

    // Colleziona immagini
    if (this.productData.photoUrl && Array.isArray(this.productData.photoUrl)) {
      for (const url of this.productData.photoUrl) {
        const b64 = await this.urlToBase64(url);
        if (b64) images.push(b64);
      }
    } else if (this.productData.photoUrl && typeof this.productData.photoUrl === 'string') {
      const b64 = await this.urlToBase64(this.productData.photoUrl);
      if (b64) images.push(b64);
    }
    if (images.length === 0) return;

    // === Dimensioni 16:9 ===
    const R = 16 / 9;
    const largeW = 280, largeH = Math.round(largeW / R);
    const smallW = 115, smallH = Math.round(smallW / R);

    // Gaps più stretti per avvicinare le colonne
    const innerGap = 10;   // tra le due piccole
    const betweenCols = 4; // SPAZIO RIDOTTO tra immagine grande e colonna destra

    // ---- Sinistra: immagine grande ----
    const leftSide = {
      width: '49%',
      stack: [
        { image: images[0], width: largeW, height: largeH, alignment: 'left' }
      ]
    };

    // ---- Colonna immagini impilate (più stretta) ----
    const columnA = {
      width: '36%', // più stretta per dare più spazio alla tabella
      stack: [
        images[1] ? { image: images[1], width: smallW, height: smallH, margin: [0, 0, 0, innerGap], alignment: 'center' } : { text: '' },
        images[2] ? { image: images[2], width: smallW, height: smallH, alignment: 'center' } : { text: '' }
      ]
    };

    // ---- Dati scheda tecnica ----
    const techSpecs = [
      ['Seduta', this.productData.seduta],
      ['Schienale', this.productData.schienale],
      ['Meccanica', this.productData.meccanica],
      ['Materasso', this.productData.materasso]
    ].filter(spec => spec[1]);

    // ---- Tabella scheda tecnica (più larga) con HEADER ROW ----
    const techSpecStack = techSpecs.length > 0
      ? {
        width: '64%', // PIÙ LARGA della colonna immagini
        stack: [
          {
            table: {
              headerRows: 1,
              widths: ['35%', '65%'],
              body: [
                // HEADER ROW richiesta
                [
                  {
                    text: t('Scheda Tecnica'),
                    colSpan: 2,
                    alignment: 'center',
                    bold: true,
                    color: '#ffffff',
                    fillColor: '#1a365d',
                    margin: [0, 8, 0, 8],
                    fontSize: 12
                  },
                  {}
                ],
                // Righe dati
                ...techSpecs.map(([label, value]) => [
                  {
                    text: t(label || ''),
                    bold: true,
                    fontSize: 10,
                    color: '#1a365d',
                    fillColor: '#f7fafc',
                    margin: [8, 6, 8, 6]
                  },
                  {
                    text: t(value || ''),
                    fontSize: 9,
                    color: '#4a5568',
                    margin: [8, 6, 8, 6]
                  }
                ])
              ]
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 ? 0 : 1),
              vLineWidth: () => 1,
              hLineColor: () => '#e2e8f0',
              vLineColor: () => '#e2e8f0',
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0
            }
          }
        ],
        margin: [6, 0, 0, 0] // micro-gap interno tra colonna immagini e tabella
      }
      : { width: '64%', text: '' };

    // ---- Lato destro con due sotto-colonne: immagini + tabella ----
    const rightSide = {
      width: '51%',
      columns: [
        columnA,
        techSpecStack
      ],
      columnGap: 6 // gap interno tra colonna immagini e tabella
    };

    // ---- Blocco complessivo ----
    docDefinition.content.push({
      columns: [leftSide, rightSide],
      columnGap: betweenCols, // gap tra immagine grande e colonna destra (ridotto)
      margin: [0, 0, 0, 22]
    });
  }


  /**
   * Carica un'immagine quote come base64 (con fallback trasparente)
   */
  private async getQuoteImage(path: string): Promise<string> {
    try {
      const response = await fetch(path);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Errore nel caricamento quote'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Impossibile caricare l\'immagine quote:', error);
      // Trasparente 1x1
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Specifiche tecniche in orizzontale
   */
  private async addTechnicalSpecs(docDefinition: any, t: (text: string) => string): Promise<void> {
    const techSpecs = [
      ['Seduta', this.productData.seduta],
      ['Schienale', this.productData.schienale],
      ['Meccanica', this.productData.meccanica],
      ['Materasso', this.productData.materasso]
    ].filter(spec => spec[1]);

    if (techSpecs.length === 0) return;

    const specColumns: any[] = [];
    techSpecs.forEach(([label, value]) => {
      specColumns.push({
        stack: [
          { text: t(label || ''), bold: true, fontSize: 9, color: '#1a365d' },
          { text: t(value || ''), fontSize: 8, color: '#4a5568', margin: [0, 2, 0, 0] }
        ],
        width: '*'
      });
    });

    docDefinition.content.push({
      columns: specColumns,
      margin: [0, 0, 0, 15],
      style: 'techSpecs'
    });
  }

  /**
   * Tabella matrice (varianti x rivestimenti)
   */
  private async addMatrixPricingTable(docDefinition: any, t: (text: string) => string): Promise<void> {
    const allRivestimenti = new Map<string, Rivestimento>();
    Object.values(this.rivestimentiByVariant).forEach(rivs => {
      rivs.forEach(r => { allRivestimenti.set(r.rivestimento.id, r.rivestimento); });
    });

    const rivestimentiArray = Array.from(allRivestimenti.values());
    if (rivestimentiArray.length === 0 || this.variantsData.length === 0) return;

    const variantColWidth = '25%';
    const rivestimentoColWidth = `${75 / rivestimentiArray.length}%`;

    const headerRow: any[] = [{ text: t('Modello'), style: 'matrixHeader' }];
    rivestimentiArray.forEach(riv => headerRow.push({ text: t(riv.name), style: 'matrixHeader' }));

    const tableBody: any[] = [headerRow];

    this.variantsData.forEach(variant => {
      const row: any[] = [{ text: t(variant.longName), style: 'variantCell' }];
      const variantRivestimenti = this.rivestimentiByVariant[variant.id] || [];

      rivestimentiArray.forEach(rivestimento => {
        const variantRiv = variantRivestimenti.find(vr => vr.rivestimento.id === rivestimento.id);
        if (variantRiv) {
          const rivestimentoCost = variantRiv.rivestimento.mtPrice * variantRiv.metri;
          const totalPrice = variant.price + rivestimentoCost + this.deliveryCost;
          const finalPrice = this.applyMarkup(totalPrice, this.markupPerc);

          row.push({ text: `€ ${finalPrice.toFixed(2)}`, style: 'priceCell', fillColor: '#f0fff4' });
        } else {
          row.push({ text: '-', style: 'matrixCell', color: '#a0aec0' });
        }
      });

      tableBody.push(row);
    });

    const widths = [variantColWidth, ...Array(rivestimentiArray.length).fill(rivestimentoColWidth)];

    docDefinition.content.push({
      table: { headerRows: 1, widths, body: tableBody },
      layout: {
        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 2 : 1),
        vLineWidth: () => 1,
        hLineColor: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? '#1a365d' : '#e2e8f0'),
        vLineColor: () => '#e2e8f0',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      margin: [0, 0, 0, 25]
    });
  }

  /**
   * Servizi aggiuntivi
   */
  private async addExtraServices(docDefinition: any, t: (text: string) => string): Promise<void> {
    if (this.extrasData.length === 0) return;

    // Costruisci il testo del titolo con i prezzi
    const extraTexts: any[] = [];
    this.extrasData.forEach(extra => {
      extraTexts.push(
        { text: t(extra.name), fontSize: 12, bold: true, color: '#1a365d' },
        { text: `: € ${extra.price.toFixed(2)}`, fontSize: 12, bold: true, color: '#38a169' }
      );
    });

    if (this.deliveryCost > 0) {
      if (extraTexts.length > 0) {
        extraTexts.push({ text: ' | ', fontSize: 12, color: '#718096' });
      }
      extraTexts.push(
        { text: t('Consegna'), fontSize: 12, bold: true, color: '#1a365d' },
        { text: `: € ${this.deliveryCost.toFixed(2)}`, fontSize: 12, bold: true, color: '#c05621' }
      );
    }

    docDefinition.content.push({
      stack: [
        {
          text: extraTexts,
          margin: [0, 0, 0, 0],
          alignment: 'left'
        }
      ],
      margin: [0, 15, 0, 0]
    });
  }

  private applyMarkup(amount: number, perc: number): number {
    const factor = (100 - perc) / 100;
    return factor > 0 ? amount / factor : amount;
  }

  getFilename(productName: string, languageCode: string = 'it'): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanName = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const langSuffix = languageCode !== 'it' ? `_${languageCode.toUpperCase()}` : '';
    return `Listino_${cleanName}${langSuffix}_${timestamp}.pdf`;
  }
}
