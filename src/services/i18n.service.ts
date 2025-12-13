import { Injectable } from '@angular/core';

interface I18nData {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
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
          rivestimento: 'Rivestimento',
          prezzo: 'Prezzo',
          servizio: 'Servizio',
          serviziAggiuntivi: 'Servizi Aggiuntivi',
          modello: 'Modello',
          consegna: 'Consegna',
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
          rivestimento: 'Upholstery',
          prezzo: 'Price',
          servizio: 'Service',
          serviziAggiuntivi: 'Additional Services',
          modello: 'Model',
          consegna: 'Delivery',
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
          rivestimento: 'Revetement',
          prezzo: 'Prix',
          servizio: 'Service',
          serviziAggiuntivi: 'Services Supplementaires',
          modello: 'Modele',
          consegna: 'Livraison',
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
          rivestimento: 'Bezug',
          prezzo: 'Preis',
          servizio: 'Service',
          serviziAggiuntivi: 'Zusaetzliche Services',
          modello: 'Modell',
          consegna: 'Lieferung',
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
          rivestimento: 'Revestimiento',
          prezzo: 'Precio',
          servizio: 'Servicio',
          serviziAggiuntivi: 'Servicios Adicionales',
          modello: 'Modelo',
          consegna: 'Entrega',
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
          rivestimento: 'Revestimento',
          prezzo: 'Preco',
          servizio: 'Servico',
          serviziAggiuntivi: 'Servicos Adicionais',
          modello: 'Modelo',
          consegna: 'Entrega',
        },
        messages: {
          noRivestimento: 'Nenhum revestimento configurado para esta variante',
        },
      },
    },
  };

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

    staticTranslations['Scheda Tecnica'] = this.translate('listino.techSpecs.title', lang);
    staticTranslations['Caratteristica'] = this.translate('listino.techSpecs.characteristic', lang);
    staticTranslations['Dettaglio'] = this.translate('listino.techSpecs.detail', lang);
    staticTranslations['Seduta'] = this.translate('listino.techSpecs.seduta', lang);
    staticTranslations['Schienale'] = this.translate('listino.techSpecs.schienale', lang);
    staticTranslations['Meccanica'] = this.translate('listino.techSpecs.meccanica', lang);
    staticTranslations['Materasso'] = this.translate('listino.techSpecs.materasso', lang);

    staticTranslations['Rivestimento'] = this.translate('listino.pricing.rivestimento', lang);
    staticTranslations['Prezzo'] = this.translate('listino.pricing.prezzo', lang);
    staticTranslations['Servizio'] = this.translate('listino.pricing.servizio', lang);
    staticTranslations['Servizi Aggiuntivi'] = this.translate('listino.pricing.serviziAggiuntivi', lang);
    staticTranslations['Modello'] = this.translate('listino.pricing.modello', lang);
    staticTranslations['Consegna'] = this.translate('listino.pricing.consegna', lang);

    staticTranslations['Materassi Extra a Scelta'] = this.translate('listino.extras.materassi', lang);
    staticTranslations['Meccanismi Extra a Scelta'] = this.translate('listino.extras.meccanismi', lang);

    staticTranslations['Nessun rivestimento configurato per questa variante'] =
      this.translate('listino.messages.noRivestimento', lang);

    return staticTranslations;
  }
}
