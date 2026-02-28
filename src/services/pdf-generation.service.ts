import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SofaProduct } from '../models/sofa-product.model';
import { Variant } from '../models/variant.model';
import { Rivestimento } from '../models/rivestimento.model';
import { SofaType } from '../models/sofa-type.model';
import { TranslationService } from './translation/translation.service';
import { I18nService } from './translation/fixed-translation.service';
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
  private headerLogoUrl = '/sofaform-logo.png';

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
    delivery: number,
    headerLogoUrl?: string
  ): void {
    this.productData = product;
    this.variantsData = variants;
    this.rivestimentiByVariant = rivestimentiByVariant;
    this.extraMattressesData = extraMattresses;
    this.extraMechanismsData = extraMechanisms;
    this.markupPerc = markup;
    this.deliveryCost = delivery;
    this.headerLogoUrl = headerLogoUrl || '/sofaform-logo.png';
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
    const candidates = this.buildLogoCandidates();

    for (const url of candidates) {
      const base64 = await this.urlToBase64(url);
      if (base64) return base64;
    }

    console.warn('Impossibile caricare il logo selezionato, uso fallback trasparente');
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }

  private buildLogoCandidates(): string[] {
    const defaultUrl = '/sofaform-logo.png';
    let selected = (this.headerLogoUrl || defaultUrl).replace(/^\.\//, '');

    // Rimuovi il prefisso 'public/' se presente (i file sono serviti dalla root)
    if (selected.startsWith('public/')) {
      selected = '/' + selected.replace(/^public\//, '');
    }

    const trimmed = selected.replace(/^\/+/, '');
    const candidates: string[] = [];

    const pushUnique = (val: string) => {
      if (val && !candidates.includes(val)) candidates.push(val);
    };

    // Prima prova con lo slash iniziale (percorso assoluto)
    pushUnique('/' + trimmed);
    pushUnique(selected);

    // Fallback ai loghi standard
    pushUnique('/logo_sofaform.png');
    pushUnique('/sofaform-logo.png');

    return candidates;
  }

  async generateListinoPdf(
    productName: string,
    languageCode: string = 'it',
    preview = false,
    previewWindow?: Window | null
  ) {
    this.currentLang = languageCode || 'it';
    const staticTranslations = this.i18nService.getListinoTranslations(languageCode);

    const uniqueTexts = new Set<string>();
    const addText = (text?: string | null) => {
      if (text) uniqueTexts.add(text);
    };

    addText(this.productData.name);
    addText(this.productData.description);
    addText(this.productData.seduta);
    addText(this.productData.schienale);
    addText(this.productData.meccanica);
    addText(this.productData.materasso);

    this.variantsData.forEach(v => {
      const variantLabel = this.getVariantLabel(v);
      addText(variantLabel);
    });

    Object.values(this.rivestimentiByVariant).forEach(rivs => {
      rivs.forEach(r => addText(r.rivestimento.name));
    });

    this.extraMattressesData.forEach(extra => addText(extra.name));
    this.extraMechanismsData.forEach(extra => addText(extra.name));

    const textsToTranslate = Array.from(uniqueTexts);

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

    const docDefinition: any = this.createBaseDocDefinition();

    const logoBase64 = await this.getLogoBase64();
    this.addCoverPage(docDefinition, logoBase64);
    this.addCommercialConditionsPage(docDefinition, t);

    docDefinition.content.push({
      stack: [
        { image: logoBase64, fit: [160, 40], alignment: 'center', margin: [0, 0, 0, 8] },
        { text: t(this.productData.name), fontSize: 23, bold: true, color: '#2d3748', alignment: 'center' }
      ],
      margin: [0, 10, 0, 16]
    });




    const productImages = await this.getProductImagesBase64();
    const hasExtras = this.extraMattressesData.length > 0 || this.extraMechanismsData.length > 0;
    await this.addProductImagesWithDescription(docDefinition, t, productImages, !hasExtras);
    await this.addMatrixPricingTable(docDefinition, t);
    if (hasExtras) {
      await this.addExtraServices(docDefinition, t, productImages);
    }

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

  async generateMultiListinoPdf(
    entries: {
      product: SofaProduct;
      variants: Variant[];
      rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] };
      extraMattresses: { name: string; price: number }[];
      extraMechanisms: { name: string; price: number }[];
      markup: number;
      delivery: number;
    }[],
    languageCode: string = 'it',
    preview = false,
    previewWindow?: Window | null
  ) {
    if (!entries || entries.length === 0) return;

    this.currentLang = languageCode || 'it';
    const staticTranslations = this.i18nService.getListinoTranslations(languageCode);

    const uniqueTexts = new Set<string>();
    const addText = (text?: string | null) => { if (text) uniqueTexts.add(text); };

    entries.forEach(entry => {
      addText(entry.product.name);
      addText(entry.product.description);
      addText(entry.product.seduta);
      addText(entry.product.schienale);
      addText(entry.product.meccanica);
      addText(entry.product.materasso);

      entry.variants.forEach(v => addText(this.getVariantLabel(v)));
      Object.values(entry.rivestimentiByVariant || {}).forEach(rivs => rivs.forEach(r => addText(r.rivestimento.name)));
      entry.extraMattresses.forEach(extra => addText(extra.name));
      entry.extraMechanisms.forEach(extra => addText(extra.name));
    });

    let dynamicTranslations: { [key: string]: string } = {};
    if (languageCode !== 'it' && uniqueTexts.size > 0) {
      try {
        dynamicTranslations = await firstValueFrom(this.translationService.translateTexts(Array.from(uniqueTexts), languageCode)) || {};
      } catch (error) {
        console.warn('Dynamic translation failed, using original texts:', error);
        Array.from(uniqueTexts).forEach(t => dynamicTranslations[t] = t);
      }
    } else {
      Array.from(uniqueTexts).forEach(t => dynamicTranslations[t] = t);
    }

    const t = (text: string) => {
      if (staticTranslations[text] !== undefined) return staticTranslations[text];
      return dynamicTranslations[text] || text;
    };

    const docDefinition: any = this.createBaseDocDefinition();
    const logoBase64 = await this.getLogoBase64();
    this.addCoverPage(docDefinition, logoBase64);
    this.addCommercialConditionsPage(docDefinition, t);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      this.productData = entry.product;
      this.variantsData = entry.variants;
      this.rivestimentiByVariant = entry.rivestimentiByVariant || {};
      this.extraMattressesData = entry.extraMattresses || [];
      this.extraMechanismsData = entry.extraMechanisms || [];
      this.markupPerc = entry.markup || 0;
      this.deliveryCost = entry.delivery || 0;

      const productImages = await this.getProductImagesBase64();
      const hasExtras = this.extraMattressesData.length > 0 || this.extraMechanismsData.length > 0;

      docDefinition.content.push({
        stack: [
          { image: logoBase64, fit: [160, 40], alignment: 'center', margin: [0, 0, 0, 8] },
          { text: t(entry.product.name), fontSize: 23, bold: true, color: '#2d3748', alignment: 'center' }
        ],
        margin: [0, 10, 0, 16],
        pageBreak: i === 0 ? undefined : 'before'
      });

      await this.addProductImagesWithDescription(docDefinition, t, productImages, !hasExtras);
      await this.addMatrixPricingTable(docDefinition, t);
      if (hasExtras) {
        await this.addExtraServices(docDefinition, t, productImages);
      }
    }

    const filename = this.getFilename('Multi_Listino', languageCode);
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

  private addCommercialConditionsPage(docDefinition: any, t: (text: string) => string): void {
    docDefinition.content.push({
      stack: [
        { text: t('Condizioni commerciali'), style: 'conditionsTitle', margin: [0, 0, 0, 14] },
        {
          text: [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
            'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
          ].join(''),
          style: 'conditionsBody'
        },
        { text: t('Validità e prezzi'), style: 'conditionsSectionTitle' },
        {
          ul: [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
          ],
          style: 'conditionsBody',
          margin: [0, 0, 0, 6]
        },
        { text: t('Pagamento'), style: 'conditionsSectionTitle' },
        {
          ul: [
            'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
          ],
          style: 'conditionsBody',
          margin: [0, 0, 0, 6]
        },
        { text: t('Consegna e resi'), style: 'conditionsSectionTitle' },
        {
          ul: [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
          ],
          style: 'conditionsBody'
        }
      ],
      margin: [40, 40, 40, 40],
      pageBreak: 'after'
    });
  }

  private createBaseDocDefinition(): any {
    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      defaultStyle: { fontSize: 7, lineHeight: 1.2, color: '#2d3748' },
      styles: {
        coverTitle: { fontSize: 30, bold: true, color: '#1a365d', alignment: 'center' },
        productName: { fontSize: 22, bold: true, color: '#2d3748', alignment: 'center', margin: [0, 0, 0, 13] },
        description: { fontSize: 9, color: '#718096', alignment: 'center', italics: true, margin: [0, 5, 0, 5] },
        matrixHeader: { bold: true, fillColor: '#1a365d', color: '#ffffff', fontSize: 7, alignment: 'center', margin: [3, 5, 3, 5] },
        matrixCell: { fontSize: 6, alignment: 'center', margin: [3, 3, 3, 3] },
        variantCell: { fontSize: 6, bold: true, alignment: 'left', margin: [8, 3, 3, 3], color: '#1a365d' },
        priceCell: { fontSize: 6, alignment: 'center', margin: [3, 3, 3, 3], bold: true, color: '#1a365d' },
        techSpecs: { fontSize: 8, margin: [0, 10, 0, 10] },
        small: { fontSize: 5, color: '#718096', alignment: 'center' },
        conditionsTitle: { fontSize: 16, bold: true, color: '#1a365d', alignment: 'center' },
        conditionsSectionTitle: { fontSize: 9, bold: true, color: '#1a365d', margin: [0, 12, 0, 6] },
        conditionsBody: { fontSize: 7, color: '#2d3748', alignment: 'left', lineHeight: 1.35 },
        quoteMark: { fontSize: 40, bold: true, color: '#000000', lineHeight: 0.8 },
        quoteText: { fontSize: 10, color: '#4a5568', italics: true, alignment: 'left' }
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [{ text: `${currentPage} / ${pageCount}`, style: 'small', margin: [0, 10, 0, 0] }]
      }),
      content: []
    };
  }

  private addCoverPage(docDefinition: any, logoBase64: string): void {
    const PAGE_H = 595.28;
    const V_MARGINS = 60;
    const LOGO_MAX_W = 500;
    const LOGO_MAX_H = 200;
    const available = PAGE_H - V_MARGINS;

    const spacerTop = Math.max(0, Math.floor((available - LOGO_MAX_H) / 2));
    const spacerBottom = Math.max(0, available - LOGO_MAX_H - spacerTop);

    docDefinition.content.push({
      table: {
        widths: ['*'],
        heights: [spacerTop, LOGO_MAX_H, spacerBottom],
        body: [
          [{ text: '' }],
          [{
            image: logoBase64,
            fit: [LOGO_MAX_W, LOGO_MAX_H],
            alignment: 'center',
            margin: [0, 0, 0, 0],
          }],
        ]
      },
      layout: 'noBorders',
      pageBreak: 'after'
    });
  }


  private async getProductImagesBase64(): Promise<string[]> {
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

    return images;
  }

  private async addProductImagesWithDescription(
    docDefinition: any,
    t: (text: string) => string,
    images: string[],
    showAllImages: boolean
  ): Promise<void> {
    if (images.length === 0) return;

    const R = 16 / 9;
    const largeW = showAllImages ? 260 : 320;
    const largeH = Math.round(largeW / R);
    const smallW = 120;
    const smallH = Math.round(smallW / R);

    const betweenCols = showAllImages ? 20 : 16;

    const leftSide = {
      width: showAllImages ? '45%' : '58%',
      stack: [
        { image: images[0], fit: [largeW, largeH], alignment: 'center' }
      ]
    };

    const extraImagesStack = showAllImages && images.length > 1 ? {
      width: '17%',
      stack: [
        images[1] ? { image: images[1], fit: [smallW, smallH], alignment: 'center' } : { text: '' },
        images[2] ? { image: images[2], fit: [smallW, smallH], alignment: 'center', margin: [0, 12, 0, 0] } : { text: '' }
      ]
    } : null;

    const techSpecs = [
      ['Seduta', this.productData.seduta],
      ['Schienale', this.productData.schienale],
      ['Meccanica', this.productData.meccanica],
      ['Materasso', this.productData.materasso]
    ].filter(spec => spec[1]);

    const techSpecStack = techSpecs.length > 0
      ? {
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
                        margin: [0, 6, 0, 6],
                        fontSize: 10
                      },
                      {}
                    ],
                    ...techSpecs.map(([label, value]) => [
                      {
                        text: t(label || ''),
                        bold: true,
                        fontSize: 8,
                        color: '#1a365d',
                        fillColor: '#f7fafc',
                        margin: [5, 5, 5, 5]
                      },
                      {
                        text: t(value || ''),
                        fontSize: 7,
                        color: '#4a5568',
                        margin: [5, 5, 5, 5]
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
        margin: [0, 0, 0, 0]
      }
      : { text: '' };

    docDefinition.content.push({
      columns: showAllImages && extraImagesStack ? [
        leftSide,
        extraImagesStack,
        { width: '38%', stack: [techSpecStack] }
      ] : [
        leftSide,
        { width: '42%', stack: [techSpecStack] }
      ],
      columnGap: betweenCols,
      alignment: 'center',
      margin: [0, 0, 0, 20]
    });
  }




  private async addMatrixPricingTable(docDefinition: any, t: (text: string) => string): Promise<void> {
    const allRivestimenti = new Map<string, Rivestimento>();
    Object.values(this.rivestimentiByVariant).forEach(rivs => {
      rivs.forEach(r => { allRivestimenti.set(r.rivestimento.id, r.rivestimento); });
    });

    const rivestimentiArray = Array.from(allRivestimenti.values());
    if (rivestimentiArray.length === 0 || this.variantsData.length === 0) return;

    const totalCols = rivestimentiArray.length + 1;
    const variantColWidth = '20%';
    const rivestimentoColWidth = `${80 / rivestimentiArray.length}%`;

    const headerRow: any[] = [{ text: t('Modello'), style: 'matrixHeader' }];
    rivestimentiArray.forEach(riv => headerRow.push({ text: t(riv.name), style: 'matrixHeader' }));

    const tableBody: any[] = [headerRow];

    this.variantsData.forEach(variant => {
      const variantLabel = this.getVariantLabel(variant);
      const translatedVariantName = t(variantLabel);
      const row: any[] = [{ text: translatedVariantName, style: 'variantCell' }];
      const variantRivestimenti = this.rivestimentiByVariant[variant.id] || [];

      rivestimentiArray.forEach(rivestimento => {
        const variantRiv = variantRivestimenti.find(vr => vr.rivestimento.id === rivestimento.id);
        if (variantRiv) {
          const rivestimentoCost = variantRiv.rivestimento.mtPrice * variantRiv.metri;
          const totalPrice = variant.price + rivestimentoCost + this.deliveryCost;
          const finalPrice = this.applyMarkup(totalPrice, this.markupPerc);

          row.push({ text: this.formatCurrency(finalPrice), style: 'priceCell', fillColor: '#f7fafc' });
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
      margin: [0, 0, 0, 15]
    });
  }

  private async addExtraServices(
    docDefinition: any,
    t: (text: string) => string,
    images: string[]
  ): Promise<void> {
    const hasMattresses = this.extraMattressesData.length > 0;
    const hasMechanisms = this.extraMechanismsData.length > 0;
    if (!hasMattresses && !hasMechanisms) return;

    const isSingleTable = hasMattresses !== hasMechanisms;
    const columnWidth = hasMattresses && hasMechanisms ? '50%' : '60%';
    const tables: any[] = [];
    const extraImages = images.slice(1, 3);

    if (isSingleTable) {
      if (hasMattresses) {
        tables.push({
          width: columnWidth,
          ...this.buildExtrasSection(this.extraMattressesData, t('Materassi Extra'), t)
        });
      } else {
        tables.push({
          width: columnWidth,
          ...this.buildExtrasSection(this.extraMechanismsData, t('Meccanismi Extra'), t)
        });
      }

      const imagesColumn = {
        width: '40%',
        stack: [
          extraImages[0] ? { image: extraImages[0], fit: [260, 140], alignment: 'center' } : { text: '' },
          extraImages[1] ? { image: extraImages[1], fit: [260, 140], alignment: 'center', margin: [0, 12, 0, 0] } : { text: '' }
        ]
      };

      docDefinition.content.push({
        columns: [...tables, imagesColumn],
        columnGap: 16,
        margin: [0, 0, 0, 6],
        pageBreak: 'before',
        unbreakable: true
      });
    } else {
      if (hasMattresses) {
        tables.push({
          width: columnWidth,
          ...this.buildExtrasSection(this.extraMattressesData, t('Materassi Extra'), t, extraImages[0])
        });
      }

      if (hasMechanisms) {
        tables.push({
          width: columnWidth,
          ...this.buildExtrasSection(this.extraMechanismsData, t('Meccanismi Extra'), t, extraImages[1])
        });
      }

      docDefinition.content.push({
        columns: tables,
        columnGap: 16,
        margin: [0, 0, 0, 6],
        pageBreak: 'before',
        unbreakable: true
      });
    }

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

  private buildExtrasSection(
    items: { name: string; price: number }[],
    title: string,
    t: (text: string) => string,
    image?: string
  ) {
    return {
      stack: [
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            keepWithHeaderRows: 1,
            dontBreakRows: true,
            body: [
              [
                { text: title, style: 'matrixHeader' },
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
        },
        image ? {
          image,
          fit: [260, 140],
          alignment: 'center',
          margin: [0, 12, 0, 0]
        } : { text: '' }
      ]
    };
  }

  private applyMarkup(amount: number, perc: number): number {
    const factor = (100 - perc) / 100;
    return factor > 0 ? amount / factor : amount;
  }

  private formatCurrency(value: number): string {
    const formatted = new Intl.NumberFormat(this.currentLang || 'it', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    // Replace narrow/no-break spaces that pdfMake's default font can't render.
    return formatted.replace(/[\u202F\u00A0]/g, ' ');
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

  private getVariantBaseLabel(name?: SofaType | string): string {
    if (!name) return '';
    const value = String(name);
    const map: Record<SofaType, string> = {
      [SofaType.DIVANO_3_PL_MAXI]: 'Divano 3 PL Maxi',
      [SofaType.DIVANO_3_PL]: 'Divano 3 PL',
      [SofaType.DIVANO_2_PL]: 'Divano 2 PL',
      [SofaType.CHAISE_LONGUE]: 'Chaise Longue',
      [SofaType.POUF_50_X_50]: 'Pouf 50 x 50',
      [SofaType.POUF_60_X_60]: 'Pouf 60 x 60',
      [SofaType.POUF_70_X_70]: 'Pouf 70 x 70',
      [SofaType.ELEMENTO_SENZA_BRACCIOLO]: 'Elemento senza bracciolo',
      [SofaType.ELEMENTO_CON_BRACCIOLO]: 'Elemento con bracciolo',
      [SofaType.POLTRONA_90_CM]: 'Poltrona 90 cm',
      [SofaType.POLTRONA_80_CM]: 'Poltrona 80 cm',
      [SofaType.POLTRONA_70_CM]: 'Poltrona 70 cm',
      [SofaType.CUSTOM]: 'Custom',
    };

    if (map[value as SofaType]) {
      return map[value as SofaType];
    }

    if (value.includes('_')) {
      return this.formatVariantName(value);
    }

    return value;
  }

  private getVariantLabel(variant: Variant): string {
    if (variant.longName === SofaType.CUSTOM) {
      const customName = (variant.customName || '').trim();
      if (customName) return customName;
    }
    return this.getVariantBaseLabel(variant.longName);
  }
}
