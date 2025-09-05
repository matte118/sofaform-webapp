import { Injectable } from '@angular/core';

interface I18nData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  // Complete hardcoded translations for all languages - no HTTP requests needed
  private readonly TRANSLATIONS: { [lang: string]: I18nData } = {
    it: {
      listino: {
        techSpecs: {
          title: "Scheda Tecnica",
          characteristic: "Caratteristica",
          detail: "Dettaglio",
          seduta: "Seduta",
          schienale: "Schienale",
          meccanica: "Meccanica",
          materasso: "Materasso"
        },
        pricing: {
          rivestimento: "Rivestimento",
          prezzo: "Prezzo",
          servizio: "Servizio",
          serviziAggiuntivi: "Servizi Aggiuntivi"
        },
        messages: {
          noRivestimento: "Nessun rivestimento configurato per questa variante"
        }
      }
    },
    en: {
      listino: {
        techSpecs: {
          title: "Technical Specifications",
          characteristic: "Feature",
          detail: "Detail",
          seduta: "Seat",
          schienale: "Backrest",
          meccanica: "Mechanism",
          materasso: "Mattress"
        },
        pricing: {
          rivestimento: "Upholstery",
          prezzo: "Price",
          servizio: "Service",
          serviziAggiuntivi: "Additional Services"
        },
        messages: {
          noRivestimento: "No upholstery configured for this variant"
        }
      }
    },
    fr: {
      listino: {
        techSpecs: {
          title: "Fiche Technique",
          characteristic: "Caractéristique",
          detail: "Détail",
          seduta: "Assise",
          schienale: "Dossier",
          meccanica: "Mécanisme",
          materasso: "Matelas"
        },
        pricing: {
          rivestimento: "Revêtement",
          prezzo: "Prix",
          servizio: "Service",
          serviziAggiuntivi: "Services Supplémentaires"
        },
        messages: {
          noRivestimento: "Aucun revêtement configuré pour cette variante"
        }
      }
    },
    de: {
      listino: {
        techSpecs: {
          title: "Technische Daten",
          characteristic: "Eigenschaft",
          detail: "Detail",
          seduta: "Sitzfläche",
          schienale: "Rückenlehne",
          meccanica: "Mechanismus",
          materasso: "Matratze"
        },
        pricing: {
          rivestimento: "Bezug",
          prezzo: "Preis",
          servizio: "Service",
          serviziAggiuntivi: "Zusätzliche Services"
        },
        messages: {
          noRivestimento: "Kein Bezug für diese Variante konfiguriert"
        }
      }
    },
    es: {
      listino: {
        techSpecs: {
          title: "Ficha Técnica",
          characteristic: "Característica",
          detail: "Detalle",
          seduta: "Asiento",
          schienale: "Respaldo",
          meccanica: "Mecanismo",
          materasso: "Colchón"
        },
        pricing: {
          rivestimento: "Revestimiento",
          prezzo: "Precio",
          servizio: "Servicio",
          serviziAggiuntivi: "Servicios Adicionales"
        },
        messages: {
          noRivestimento: "Ningún revestimiento configurado para esta variante"
        }
      }
    },
    pt: {
      listino: {
        techSpecs: {
          title: "Especificações Técnicas",
          characteristic: "Característica",
          detail: "Detalhe",
          seduta: "Assento",
          schienale: "Encosto",
          meccanica: "Mecanismo",
          materasso: "Colchão"
        },
        pricing: {
          rivestimento: "Revestimento",
          prezzo: "Preço",
          servizio: "Serviço",
          serviziAggiuntivi: "Serviços Adicionais"
        },
        messages: {
          noRivestimento: "Nenhum revestimento configurado para esta variante"
        }
      }
    }
  };
  
  constructor() {}

  /**
   * Get translated text by key path - direct access to hardcoded translations
   */
  translate(key: string, lang: string = 'it'): string {
    const translations = this.TRANSLATIONS[lang] || this.TRANSLATIONS['it'];
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Get all static translations for listino in specified language - synchronous and fast
   */
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
    staticTranslations['Servizi Aggiuntivi'] = this.translate('listino.pricing.serviziAggiuntivi', lang);
    
    // Messages
    staticTranslations['Nessun rivestimento configurato per questa variante'] = this.translate('listino.messages.noRivestimento', lang);
    
    return staticTranslations;
  }
}
