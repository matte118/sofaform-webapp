import { Component } from './component.model';
import { Rivestimento } from './rivestimento.model';
import { SofaType } from './sofa-type.model';

export type PricingMode = 'components' | 'custom';

export class Variant {
  public id: string;
  public sofaId: string;
  public longName: SofaType;
  public price: number;
  public components: Component[];
  public seatsCount?: number;
  public mattressWidth?: number;
  public rivestimenti?: { rivestimento: Rivestimento; metri: number }[];
  public pricingMode: PricingMode;
  public customPrice?: number;

  constructor(
    id: string,
    sofaId: string,
    longName: SofaType,
    price: number,
    components: Component[] = [],
    seatsCount?: number,
    mattressWidth?: number,
    rivestimenti?: { rivestimento: Rivestimento; metri: number }[],
    pricingMode: PricingMode = 'components',
    customPrice?: number
  ) {
    this.id = id;
    this.sofaId = sofaId;
    this.longName = longName;
    this.components = components;
    this.seatsCount = seatsCount;
    this.mattressWidth = mattressWidth;
    this.rivestimenti = rivestimenti;
    this.pricingMode = pricingMode;
    this.customPrice = customPrice;
    
    // Set price correctly based on mode
    if (pricingMode === 'custom' && customPrice !== undefined) {
      this.price = customPrice;
    } else {
      this.price = price;
      this.updatePrice();
    }
  }

  // Calculate price from components only (for database storage)
  calculatePriceFromComponents(): number {
    return this.components.reduce((sum, component) => sum + component.price, 0);
  }

  // Calculate rivestimento cost for local use (PDF generation)
  calculateRivestimentoCost(meters: number): number {
    if (!this.rivestimenti || this.rivestimenti.length === 0) {
      return 0;
    }
    return this.rivestimenti.reduce((sum, rivestimento) => sum + (rivestimento.metri * meters), 0);
  }

  // Calculate total price with rivestimenti for local use (PDF generation)
  calculateTotalPriceWithRivestimenti(meters: number): number {
    return this.price + this.calculateRivestimentoCost(meters);
  }

  updatePrice(): void {
    if (this.pricingMode === 'custom' && this.customPrice !== undefined) {
      this.price = this.customPrice;
    } else {
      // Calculate from components
      this.price = this.components.reduce((total, component) => {
        return total + (component.price || 0);
      }, 0);
    }
  }

  setCustomPrice(price: number): void {
    this.pricingMode = 'custom';
    this.customPrice = price;
    this.price = price;
  }

  setComponentsMode(): void {
    this.pricingMode = 'components';
    this.customPrice = undefined;
    this.updatePrice();
  }

  hasComponents(): boolean {
    return this.components && this.components.length > 0;
  }

  isCustomPricing(): boolean {
    return this.pricingMode === 'custom';
  }
}
