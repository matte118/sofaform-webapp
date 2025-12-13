import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { TranslationService } from './translation.service';
import { I18nService } from './i18n.service';
import { firstValueFrom } from 'rxjs';

(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({ providedIn: 'root' })
export class PdfGenerationService {
  private productData!: SofaProduct;
  private variantsData: Variant[] = [];
  private rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] } = {};
  private extraMattressesData: { name: string; price: number }[] = [];
  private extraMechanismsData: { name: string; price: number }[] = [];
  private markupPerc = 0;
  private deliveryCost = 0;
  private currentLang = 'it';

  constructor(
    private translationService: TranslationService,
    private i18nService: I18nService
  ) { }

  setListinoData(
    product: SofaProduct,
    variants: Variant[],
    rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] },
    extraMattresses: { name: string; price: number }[],
    extraMechanisms: { name: string; price: number }[],
    markup: number,
    delivery: number
  ): void {
    this.productData = product;
    this.variantsData = variants;
    this.rivestimentiByVariant = rivestimentiByVariant;
    this.extraMattressesData = extraMattresses;
    this.extraMechanismsData = extraMechanisms;
    this.markupPerc = markup;
    this.deliveryCost = delivery;
  }

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
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  async generateListinoPdf(
    productName: string,
    languageCode: string = 'it',
    preview = false,
    previewWindow?: Window | null
  ) {
    this.currentLang = languageCode || 'it';
    const staticTranslations = this.i18nService.getListinoTranslations(languageCode);

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

    this.extraMattressesData.forEach(extra => { if (extra.name) textsToTranslate.push(extra.name); });
    this.extraMechanismsData.forEach(extra => { if (extra.name) textsToTranslate.push(extra.name); });

    let dynamicTranslations: { [key: string]: string } = {};
    if (languageCode !== 'it' && textsToTranslate.length > 0) {
      try {
        dynamicTranslations = await firstValueFrom(this.translationService.translateTexts(textsToTranslate, languageCode)) || {};
      } catch (error) {
        console.warn('Dynamic translation failed, using original texts:', error);
        textsToTranslate.forEach(t => dynamicTranslations[t] = t);
      }
    } else {
      textsToTranslate.forEach(t => dynamicTranslations[t] = t);
    }

    const t = (text: string) => {
      if (staticTranslations[text] !== undefined) return staticTranslations[text];
      return dynamicTranslations[text] || text;
    };

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      defaultStyle: { fontSize: 9, lineHeight: 1.2, color: '#2d3748' },
      styles: {
        coverTitle: { fontSize: 32, bold: true, color: '#1a365d', alignment: 'center' },
        productName: { fontSize: 24, bold: true, color: '#2d3748', alignment: 'center', margin: [0, 0, 0, 15] },
        description: { fontSize: 11, color: '#718096', alignment: 'center', italics: true, margin: [0, 5, 0, 5] },
        matrixHeader: { bold: true, fillColor: '#1a365d', color: '#ffffff', fontSize: 9, alignment: 'center', margin: [3, 6, 3, 6] },
        matrixCell: { fontSize: 8, alignment: 'center', margin: [3, 4, 3, 4] },
        variantCell: { fontSize: 8, bold: true, alignment: 'left', margin: [8, 4, 3, 4], color: '#1a365d' },
        priceCell: { fontSize: 8, alignment: 'center', margin: [3, 4, 3, 4], bold: true, color: '#38a169' },
        techSpecs: { fontSize: 10, margin: [0, 10, 0, 10] },
        small: { fontSize: 7, color: '#718096', alignment: 'center' },

        quoteMark: { fontSize: 42, bold: true, color: '#000000', lineHeight: 0.8 },
        quoteText: { fontSize: 12, color: '#4a5568', italics: true, alignment: 'left' }
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [{ text: `${currentPage} / ${pageCount}`, style: 'small', margin: [0, 10, 0, 0] }]
      }),
      content: []
    };

    const logoBase64 = await this.getLogoBase64();
    const PAGE_H = 595.28;
    const V_MARGINS = 60;
    const IMG_H = 250;
    const available = PAGE_H - V_MARGINS;

    const EPS = 5;
    const spacerTop = Math.max(0, Math.floor((available - IMG_H - EPS) / 2));
    const spacerBottom = Math.max(0, available - IMG_H - EPS - spacerTop);

    docDefinition.content.push({
      table: {
        widths: ['*'],
        heights: [spacerTop, IMG_H, spacerBottom],
        body: [
          [{ text: '' }],
          [{
            image: logoBase64,
            width: 500,
            height: IMG_H,
            alignment: 'center',
            margin: [0, 0, 0, 0],
          }],
        ]
      },
      layout: 'noBorders',
      pageBreak: 'after'
    });

    docDefinition.content.push({
      text: t(this.productData.name),
      style: 'productName',
      margin: [0, 20, 0, 30] // Increased bottom margin from 15 to 30
    });




    await this.addProductImagesWithDescription(docDefinition, t);
    await this.addMatrixPricingTable(docDefinition, t);
    if (this.extraMattressesData.length > 0 || this.extraMechanismsData.length > 0) await this.addExtraServices(docDefinition, t);

    const filename = this.getFilename(productName, languageCode);
    const pdfInstance = pdfMake.createPdf(docDefinition);

    if (preview) {
      pdfInstance.getBlob(blob => {
        const url = URL.createObjectURL(blob);

        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = url;
          previewWindow.focus();
          return;
        }

        try {
          window.open(url, '_blank');
        } catch (openError) {
          console.warn('PDF preview blocked; cannot open new window.', openError);
        }
      });
      return;
    }

    pdfInstance.download(filename);
  }


  private async addProductImagesWithDescription(docDefinition: any, t: (text: string) => string): Promise<void> {
    const images: string[] = [];

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

    const R = 16 / 9;
    const largeW = 280, largeH = Math.round(largeW / R);
    const smallW = 132, smallH = Math.round(smallW / R);

    const innerGap = 10;
    const betweenCols = -100;

    const leftSide = {
      width: '45%',
      stack: [
        { image: images[0], width: largeW, height: largeH, alignment: 'left' }
      ]
    };

    const columnA = {
      width: '36%',
      stack: images.length === 2 ? [
        { text: '', margin: [0, 0, 0, largeH - smallH] },
        images[1] ? { image: images[1], width: smallW, height: smallH, alignment: 'center' } : { text: '' }
      ] : [
        images[1] ? { image: images[1], width: smallW, height: smallH, margin: [0, 0, 0, innerGap], alignment: 'center' } : { text: '' },
        images[2] ? { image: images[2], width: smallW, height: smallH, alignment: 'center' } : { text: '' }
      ]
    };

    const techSpecs = [
      ['Seduta', this.productData.seduta],
      ['Schienale', this.productData.schienale],
      ['Meccanica', this.productData.meccanica],
      ['Materasso', this.productData.materasso]
    ].filter(spec => spec[1]);

    const techSpecStack = techSpecs.length > 0
      ? {
        width: '64%',
        // Usa una tabella per controllare meglio l'allineamento verticale
        table: {
          widths: ['*'],
          heights: [largeH], // Stessa altezza dell'immagine grande
          body: [[
            {
              stack: [{
                table: {
                  headerRows: 1,
                  widths: ['35%', '65%'],
                  body: [
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
              }],
              alignment: 'bottom' // Allinea al fondo!
            }
          ]]
        },
        layout: 'noBorders',
        margin: [6, 0, 0, 0]
      }
      : { width: '64%', text: '' };

    const rightSide = {
      width: '55%',
      columns: [
        columnA,
        techSpecStack
      ],
      columnGap: 6
    };

    docDefinition.content.push({
      columns: [leftSide, rightSide],
      columnGap: betweenCols,
      margin: [0, 0, 0, 50]
    });
  }




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
      const row: any[] = [{ text: this.formatVariantName(t(variant.longName)), style: 'variantCell' }];
      const variantRivestimenti = this.rivestimentiByVariant[variant.id] || [];

      rivestimentiArray.forEach(rivestimento => {
        const variantRiv = variantRivestimenti.find(vr => vr.rivestimento.id === rivestimento.id);
        if (variantRiv) {
          const rivestimentoCost = variantRiv.rivestimento.mtPrice * variantRiv.metri;
          const totalPrice = variant.price + rivestimentoCost + this.deliveryCost;
          const finalPrice = this.applyMarkup(totalPrice, this.markupPerc);

          row.push({ text: this.formatCurrency(finalPrice), style: 'priceCell', fillColor: '#f0fff4' });
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

  private async addExtraServices(docDefinition: any, t: (text: string) => string): Promise<void> {
    const hasMattresses = this.extraMattressesData.length > 0;
    const hasMechanisms = this.extraMechanismsData.length > 0;
    if (!hasMattresses && !hasMechanisms) return;

    const columnWidth = hasMattresses && hasMechanisms ? '50%' : '*';
    const tables: any[] = [];

    if (hasMattresses) {
      tables.push({
        width: columnWidth,
        ...this.buildExtrasTable(this.extraMattressesData, t('Materassi Extra a Scelta'), t)
      });
    }

    if (hasMechanisms) {
      tables.push({
        width: columnWidth,
        ...this.buildExtrasTable(this.extraMechanismsData, t('Meccanismi Extra a Scelta'), t)
      });
    }

    docDefinition.content.push({
      columns: tables,
      columnGap: 16,
      margin: [0, 0, 0, 6]
    });

    if (this.deliveryCost > 0) {
      docDefinition.content.push({
        text: `${t('Consegna')}: ${this.formatCurrency(this.deliveryCost)}`,
        style: 'matrixCell',
        bold: true,
        alignment: 'left',
        margin: [0, 6, 0, 0],
        color: '#1a365d'
      });
    }
  }

  private buildExtrasTable(items: { name: string; price: number }[], title: string, t: (text: string) => string) {
    return {
      table: {
        headerRows: 1,
        widths: ['70%', '30%'],
        body: [
          [
            { text: title.toUpperCase(), style: 'matrixHeader' },
            { text: t('Prezzo'), style: 'matrixHeader' }
          ],
          ...items.map(extra => ([
            { text: t(extra.name), style: 'matrixCell', alignment: 'left' },
            { text: this.formatCurrency(extra.price), style: 'priceCell' }
          ]))
        ]
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1.5 : 1),
        vLineWidth: () => 1,
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6
      }
    };
  }

  private applyMarkup(amount: number, perc: number): number {
    const factor = (100 - perc) / 100;
    return factor > 0 ? amount / factor : amount;
  }

  private formatCurrency(value: number): string {
    const roundedValue = Math.ceil(value);
    return new Intl.NumberFormat(this.currentLang || 'it', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(roundedValue);
  }

  getFilename(productName: string, languageCode: string = 'it'): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanName = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const langSuffix = languageCode !== 'it' ? `_${languageCode.toUpperCase()}` : '';
    return `Listino_${cleanName}${langSuffix}_${timestamp}.pdf`;
  }

  private formatVariantName(name?: string): string {
    if (!name) return '';
    return name
      .split('_')
      .filter(Boolean)
      .map(part => {
        const lower = part.toLowerCase();
        if (lower === 'pl') return 'PL';
        if (/^\d+$/.test(part)) return part;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }
}
