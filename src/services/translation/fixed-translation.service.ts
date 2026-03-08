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
  'Nessun rivestimento configurato per questa variante',
  'Condizioni commerciali',
  'Il presente listino e riservato ai clienti professionali e sostituisce eventuali versioni precedenti salvo diversi accordi scritti.',
  'Validita e prezzi',
  'I prezzi sono espressi in euro e si intendono al netto di eventuali promozioni o accordi personalizzati.',
  "L'azienda si riserva il diritto di aggiornare il listino in qualsiasi momento, comunicando tempestivamente eventuali variazioni.",
  'Le immagini e le descrizioni hanno valore illustrativo e possono subire modifiche tecniche non sostanziali.',
  'Pagamento',
  "Le condizioni di pagamento vengono concordate in fase d'ordine e riportate nella conferma commerciale.",
  'Eventuali ritardi di pagamento possono comportare la sospensione delle forniture successive.',
  'Consegna e resi',
  "I tempi di consegna sono indicativi e decorrono dalla conferma d'ordine e dalla disponibilita dei materiali.",
  'Eventuali contestazioni devono essere comunicate entro i termini previsti dalle condizioni generali di vendita.'
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
        conditions: {
          title: 'Condizioni commerciali',
          intro: 'Il presente listino e riservato ai clienti professionali e sostituisce eventuali versioni precedenti salvo diversi accordi scritti.',
          validityTitle: 'Validita e prezzi',
          validityBullet1: 'I prezzi sono espressi in euro e si intendono al netto di eventuali promozioni o accordi personalizzati.',
          validityBullet2: "L'azienda si riserva il diritto di aggiornare il listino in qualsiasi momento, comunicando tempestivamente eventuali variazioni.",
          validityBullet3: 'Le immagini e le descrizioni hanno valore illustrativo e possono subire modifiche tecniche non sostanziali.',
          paymentTitle: 'Pagamento',
          paymentBullet1: "Le condizioni di pagamento vengono concordate in fase d'ordine e riportate nella conferma commerciale.",
          paymentBullet2: 'Eventuali ritardi di pagamento possono comportare la sospensione delle forniture successive.',
          deliveryTitle: 'Consegna e resi',
          deliveryBullet1: "I tempi di consegna sono indicativi e decorrono dalla conferma d'ordine e dalla disponibilita dei materiali.",
          deliveryBullet2: 'Eventuali contestazioni devono essere comunicate entro i termini previsti dalle condizioni generali di vendita.',
        }
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
        conditions: {
          title: 'Commercial conditions',
          intro: 'This price list is reserved for professional customers and supersedes any previous versions unless otherwise agreed in writing.',
          validityTitle: 'Validity and prices',
          validityBullet1: 'Prices are expressed in euro and are net of any promotions or customized agreements.',
          validityBullet2: 'The company reserves the right to update the price list at any time, promptly communicating any changes.',
          validityBullet3: 'Images and descriptions are for illustrative purposes and may be subject to non-substantial technical changes.',
          paymentTitle: 'Payment',
          paymentBullet1: 'Payment terms are agreed during order confirmation and reported in the commercial confirmation.',
          paymentBullet2: 'Any payment delays may result in suspension of subsequent supplies.',
          deliveryTitle: 'Delivery and returns',
          deliveryBullet1: 'Delivery times are indicative and start from order confirmation and material availability.',
          deliveryBullet2: 'Any claims must be reported within the deadlines set by the general sales conditions.',
        }
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
        conditions: {
          title: 'Conditions commerciales',
          intro: 'Ce tarif est reserve aux clients professionnels et remplace toute version precedente sauf accord ecrit different.',
          validityTitle: 'Validite et prix',
          validityBullet1: "Les prix sont exprimes en euros et s'entendent hors promotions eventuelles ou accords personnalises.",
          validityBullet2: 'La societe se reserve le droit de mettre a jour le tarif a tout moment, en communiquant rapidement toute modification.',
          validityBullet3: 'Les images et descriptions sont fournies a titre indicatif et peuvent subir des modifications techniques non substantielles.',
          paymentTitle: 'Paiement',
          paymentBullet1: 'Les conditions de paiement sont convenues lors de la commande et indiquees dans la confirmation commerciale.',
          paymentBullet2: 'Tout retard de paiement peut entrainer la suspension des fournitures suivantes.',
          deliveryTitle: 'Livraison et retours',
          deliveryBullet1: 'Les delais de livraison sont indicatifs et courent a partir de la confirmation de commande et de la disponibilite des materiaux.',
          deliveryBullet2: 'Toute reclamation doit etre communiquee dans les delais prevus par les conditions generales de vente.',
        }
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
        conditions: {
          title: 'Geschaeftsbedingungen',
          intro: 'Diese Preisliste ist professionellen Kunden vorbehalten und ersetzt alle vorherigen Versionen, sofern nicht schriftlich anders vereinbart.',
          validityTitle: 'Gueltigkeit und Preise',
          validityBullet1: 'Alle Preise sind in Euro angegeben und verstehen sich ohne etwaige Aktionen oder individuelle Vereinbarungen.',
          validityBullet2: 'Das Unternehmen behaelt sich das Recht vor, die Preisliste jederzeit zu aktualisieren und Aenderungen umgehend mitzuteilen.',
          validityBullet3: 'Bilder und Beschreibungen dienen nur zur Veranschaulichung und koennen geringfuegige technische Aenderungen enthalten.',
          paymentTitle: 'Zahlung',
          paymentBullet1: 'Die Zahlungsbedingungen werden bei der Bestellung vereinbart und in der Auftragsbestaetigung angegeben.',
          paymentBullet2: 'Zahlungsverzoegerungen koennen zur Aussetzung nachfolgender Lieferungen fuehren.',
          deliveryTitle: 'Lieferung und Rueckgaben',
          deliveryBullet1: 'Lieferzeiten sind unverbindlich und beginnen mit Auftragsbestaetigung und Materialverfuegbarkeit.',
          deliveryBullet2: 'Beanstandungen muessen innerhalb der in den allgemeinen Verkaufsbedingungen vorgesehenen Fristen gemeldet werden.',
        }
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
        conditions: {
          title: 'Condiciones comerciales',
          intro: 'Esta lista de precios esta reservada a clientes profesionales y sustituye cualquier version anterior salvo acuerdo escrito diferente.',
          validityTitle: 'Validez y precios',
          validityBullet1: 'Los precios se expresan en euros y se entienden netos de promociones eventuales o acuerdos personalizados.',
          validityBullet2: 'La empresa se reserva el derecho de actualizar la lista de precios en cualquier momento, comunicando rapidamente cualquier cambio.',
          validityBullet3: 'Las imagenes y descripciones son ilustrativas y pueden sufrir modificaciones tecnicas no sustanciales.',
          paymentTitle: 'Pago',
          paymentBullet1: 'Las condiciones de pago se acuerdan durante el pedido y se indican en la confirmacion comercial.',
          paymentBullet2: 'Cualquier retraso en el pago puede implicar la suspension de suministros posteriores.',
          deliveryTitle: 'Entrega y devoluciones',
          deliveryBullet1: 'Los plazos de entrega son orientativos y comienzan con la confirmacion del pedido y la disponibilidad de materiales.',
          deliveryBullet2: 'Cualquier reclamacion debe comunicarse dentro de los plazos previstos por las condiciones generales de venta.',
        }
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
        conditions: {
          title: 'Condicoes comerciais',
          intro: 'Esta tabela de precos e reservada a clientes profissionais e substitui quaisquer versoes anteriores, salvo acordo escrito em contrario.',
          validityTitle: 'Validade e precos',
          validityBullet1: 'Os precos sao expressos em euros e consideram-se liquidos de eventuais promocoes ou acordos personalizados.',
          validityBullet2: 'A empresa reserva-se o direito de atualizar a tabela de precos a qualquer momento, comunicando prontamente quaisquer alteracoes.',
          validityBullet3: 'As imagens e descricoes tem finalidade ilustrativa e podem sofrer alteracoes tecnicas nao substanciais.',
          paymentTitle: 'Pagamento',
          paymentBullet1: 'As condicoes de pagamento sao acordadas na fase do pedido e indicadas na confirmacao comercial.',
          paymentBullet2: 'Eventuais atrasos de pagamento podem implicar a suspensao de fornecimentos seguintes.',
          deliveryTitle: 'Entrega e devolucoes',
          deliveryBullet1: 'Os prazos de entrega sao indicativos e contam a partir da confirmacao do pedido e da disponibilidade de materiais.',
          deliveryBullet2: 'Eventuais reclamacoes devem ser comunicadas dentro dos prazos previstos nas condicoes gerais de venda.',
        }
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

    // Commercial conditions
    staticTranslations['Condizioni commerciali'] = this.translate('listino.conditions.title', lang);
    staticTranslations['Il presente listino e riservato ai clienti professionali e sostituisce eventuali versioni precedenti salvo diversi accordi scritti.'] = this.translate('listino.conditions.intro', lang);
    staticTranslations['Validita e prezzi'] = this.translate('listino.conditions.validityTitle', lang);
    staticTranslations['I prezzi sono espressi in euro e si intendono al netto di eventuali promozioni o accordi personalizzati.'] = this.translate('listino.conditions.validityBullet1', lang);
    staticTranslations["L'azienda si riserva il diritto di aggiornare il listino in qualsiasi momento, comunicando tempestivamente eventuali variazioni."] = this.translate('listino.conditions.validityBullet2', lang);
    staticTranslations['Le immagini e le descrizioni hanno valore illustrativo e possono subire modifiche tecniche non sostanziali.'] = this.translate('listino.conditions.validityBullet3', lang);
    staticTranslations['Pagamento'] = this.translate('listino.conditions.paymentTitle', lang);
    staticTranslations["Le condizioni di pagamento vengono concordate in fase d'ordine e riportate nella conferma commerciale."] = this.translate('listino.conditions.paymentBullet1', lang);
    staticTranslations['Eventuali ritardi di pagamento possono comportare la sospensione delle forniture successive.'] = this.translate('listino.conditions.paymentBullet2', lang);
    staticTranslations['Consegna e resi'] = this.translate('listino.conditions.deliveryTitle', lang);
    staticTranslations["I tempi di consegna sono indicativi e decorrono dalla conferma d'ordine e dalla disponibilita dei materiali."] = this.translate('listino.conditions.deliveryBullet1', lang);
    staticTranslations['Eventuali contestazioni devono essere comunicate entro i termini previsti dalle condizioni generali di vendita.'] = this.translate('listino.conditions.deliveryBullet2', lang);

    return staticTranslations;
  }
}
