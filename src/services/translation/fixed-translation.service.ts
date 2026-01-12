import { Injectable } from '@angular/core';

interface I18nData {
  [key: string]: any;
}

export const LISTINO_STATIC_LABELS: ReadonlyArray<string> = [
  'Scheda Tecnica',
  'Caratteristica',
  'Dettaglio',
  'Seduta',
  'Schienale',
  'Meccanica',
  'Materasso',
  'Rivestimento',
  'Prezzo',
  'Servizio',
  'Materassi Extra',
  'Meccanismi Extra',
  'Modello',
  'Consegna',
  'Divano 3 PL Maxi',
  'Divano 3 PL',
  'Divano 2 PL',
  'Nessun rivestimento configurato per questa variante'
];

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly TRANSLATIONS: { [lang: string]: I18nData } = {
    it: {
      listino: {
        techSpecs: {
          title: 'Scheda Tecnica',
          characteristic: 'Caratteristica',
          detail: 'Dettaglio',
          seduta: 'Seduta',
          schienale: 'Schienale',
          meccanica: 'Meccanica',
          materasso: 'Materasso',
        },
        extras: {
          materassi: 'Materassi Extra a Scelta',
          meccanismi: 'Meccanismi Extra a Scelta',
        },
        pricing: {
          rivestimento: "Rivestimento",
          prezzo: "Prezzo",
          servizio: "Servizio",
          materassiExtra: "Materassi Extra",
          meccanismiExtra: "Meccanismi Extra",
          modello: "Modello",
          consegna: "Consegna"
        },
        sofaTypes: {
          divano3PlMaxi: "Divano 3 PL Maxi",
          divano3Pl: "Divano 3 PL",
          divano2Pl: "Divano 2 PL"
        },
        messages: {
          noRivestimento: 'Nessun rivestimento configurato per questa variante',
        },
      },
    },
    en: {
      listino: {
        techSpecs: {
          title: 'Technical Specifications',
          characteristic: 'Feature',
          detail: 'Detail',
          seduta: 'Seat',
          schienale: 'Backrest',
          meccanica: 'Mechanism',
          materasso: 'Mattress',
        },
        extras: {
          materassi: 'Optional Extra Mattresses',
          meccanismi: 'Optional Extra Mechanisms',
        },
        pricing: {
          rivestimento: "Upholstery",
          prezzo: "Price",
          servizio: "Service",
          materassiExtra: "Extra Mattresses",
          meccanismiExtra: "Extra Mechanisms",
          modello: "Model",
          consegna: "Delivery"
        },
        sofaTypes: {
          divano3PlMaxi: "3-sleeper sofa bed Maxi",
          divano3Pl: "3-sleeper sofa bed",
          divano2Pl: "2-sleeper sofa bed"
        },
        messages: {
          noRivestimento: 'No upholstery configured for this variant',
        },
      },
    },
    fr: {
      listino: {
        techSpecs: {
          title: 'Fiche Technique',
          characteristic: 'Caracteristique',
          detail: 'Detail',
          seduta: 'Assise',
          schienale: 'Dossier',
          meccanica: 'Mecanisme',
          materasso: 'Matelas',
        },
        extras: {
          materassi: 'Matelas supplementaires au choix',
          meccanismi: 'Mecanismes supplementaires au choix',
        },
        pricing: {
          rivestimento: "Revêtement",
          prezzo: "Prix",
          servizio: "Service",
          materassiExtra: "Matelas Supplémentaires",
          meccanismiExtra: "Mécanismes Supplémentaires",
          modello: "Modèle",
          consegna: "Livraison"
        },
        sofaTypes: {
          divano3PlMaxi: "Canapé-lit 3 couchages Maxi",
          divano3Pl: "Canapé-lit 3 couchages",
          divano2Pl: "Canapé-lit 2 couchages"
        },
        messages: {
          noRivestimento: 'Aucun revetement configure pour cette variante',
        },
      },
    },
    de: {
      listino: {
        techSpecs: {
          title: 'Technische Daten',
          characteristic: 'Eigenschaft',
          detail: 'Detail',
          seduta: 'Sitzflaeche',
          schienale: 'Rueckenlehne',
          meccanica: 'Mechanismus',
          materasso: 'Matratze',
        },
        extras: {
          materassi: 'Optionale Zusatzmatratzen',
          meccanismi: 'Optionale Zusatzmechanismen',
        },
        pricing: {
          rivestimento: "Bezug",
          prezzo: "Preis",
          servizio: "Service",
          materassiExtra: "Zusätzliche Matratzen",
          meccanismiExtra: "Zusätzliche Mechanismen",
          modello: "Modell",
          consegna: "Lieferung"
        },
        sofaTypes: {
          divano3PlMaxi: "Schlafsofa 3 Schlafplätze Maxi",
          divano3Pl: "Schlafsofa 3 Schlafplätze",
          divano2Pl: "Schlafsofa 2 Schlafplätze"
        },
        messages: {
          noRivestimento: 'Kein Bezug fuer diese Variante konfiguriert',
        },
      },
    },
    es: {
      listino: {
        techSpecs: {
          title: 'Ficha Tecnica',
          characteristic: 'Caracteristica',
          detail: 'Detalle',
          seduta: 'Asiento',
          schienale: 'Respaldo',
          meccanica: 'Mecanismo',
          materasso: 'Colchon',
        },
        extras: {
          materassi: 'Colchones extra opcionales',
          meccanismi: 'Mecanismos extra opcionales',
        },
        pricing: {
          rivestimento: "Revestimiento",
          prezzo: "Precio",
          servizio: "Servicio",
          materassiExtra: "Colchones Adicionales",
          meccanismiExtra: "Mecanismos Adicionales",
          modello: "Modelo",
          consegna: "Entrega"
        },
        sofaTypes: {
          divano3PlMaxi: "Sofá cama 3 plazas Maxi",
          divano3Pl: "Sofá cama 3 plazas",
          divano2Pl: "Sofá cama 2 plazas"
        },
        messages: {
          noRivestimento: 'Ningun revestimiento configurado para esta variante',
        },
      },
    },
    pt: {
      listino: {
        techSpecs: {
          title: 'Especificacoes Tecnicas',
          characteristic: 'Caracteristica',
          detail: 'Detalhe',
          seduta: 'Assento',
          schienale: 'Encosto',
          meccanica: 'Mecanismo',
          materasso: 'Colchao',
        },
        extras: {
          materassi: 'Colchoes extra opcionais',
          meccanismi: 'Mecanismos extra opcionais',
        },
        pricing: {
          rivestimento: "Revestimento",
          prezzo: "Preço",
          servizio: "Serviço",
          materassiExtra: "Colchões Adicionais",
          meccanismiExtra: "Mecanismos Adicionais",
          modello: "Modelo",
          consegna: "Entrega"
        },
        sofaTypes: {
          divano3PlMaxi: "Sofá-cama 3 lugares Maxi",
          divano3Pl: "Sofá-cama 3 lugares",
          divano2Pl: "Sofá-cama 2 lugares"
        },
        messages: {
          noRivestimento: 'Nenhum revestimento configurado para esta variante',
        },
      },
    },
  };

  constructor() { }

  /**
   * Get translated text by key path - direct access to hardcoded translations
   */
  translate(key: string, lang: string = 'it'): string {
    const translations = this.TRANSLATIONS[lang] || this.TRANSLATIONS['it'];

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    return typeof value === 'string' ? value : key;
  }

  getListinoTranslations(lang: string): { [key: string]: string } {
    const staticTranslations: { [key: string]: string } = {};

    // Technical specifications
    staticTranslations['Scheda Tecnica'] = this.translate('listino.techSpecs.title', lang);
    staticTranslations['Caratteristica'] = this.translate('listino.techSpecs.characteristic', lang);
    staticTranslations['Dettaglio'] = this.translate('listino.techSpecs.detail', lang);
    staticTranslations['Seduta'] = this.translate('listino.techSpecs.seduta', lang);
    staticTranslations['Schienale'] = this.translate('listino.techSpecs.schienale', lang);
    staticTranslations['Meccanica'] = this.translate('listino.techSpecs.meccanica', lang);
    staticTranslations['Materasso'] = this.translate('listino.techSpecs.materasso', lang);

    // Pricing section
    staticTranslations['Rivestimento'] = this.translate('listino.pricing.rivestimento', lang);
    staticTranslations['Prezzo'] = this.translate('listino.pricing.prezzo', lang);
    staticTranslations['Servizio'] = this.translate('listino.pricing.servizio', lang);
    staticTranslations['Materassi Extra'] = this.translate('listino.pricing.materassiExtra', lang);
    staticTranslations['Meccanismi Extra'] = this.translate('listino.pricing.meccanismiExtra', lang);
    staticTranslations['Modello'] = this.translate('listino.pricing.modello', lang);
    staticTranslations['Consegna'] = this.translate('listino.pricing.consegna', lang);

    // Sofa types
    staticTranslations['Divano 3 PL Maxi'] = this.translate('listino.sofaTypes.divano3PlMaxi', lang);
    staticTranslations['Divano 3 PL'] = this.translate('listino.sofaTypes.divano3Pl', lang);
    staticTranslations['Divano 2 PL'] = this.translate('listino.sofaTypes.divano2Pl', lang);

    // Messages
    staticTranslations['Nessun rivestimento configurato per questa variante'] = this.translate('listino.messages.noRivestimento', lang);

    return staticTranslations;
  }
}
