import { Component } from './component.model';
import { Rivestimento } from './rivestimento.model';

export class Variant {
  constructor(
    public id: string,
    public sofaId: string,
    public longName: string,
    public price: number = 0,
    public components: Component[] = [],
    public seatsCount?: number,
    public mattressWidth?: number,
    public rivestimenti?: Rivestimento[],
  ) { }

  // Calculate price from components only (for database storage)
  calculatePriceFromComponents(): number {
    return this.components.reduce((sum, component) => sum + component.price, 0);
  }

  // Calculate rivestimento cost for local use (PDF generation)
  calculateRivestimentoCost(meters: number): number {
    if (!this.rivestimenti || this.rivestimenti.length === 0) {
      return 0;
    }
    return this.rivestimenti.reduce((sum, rivestimento) => sum + (rivestimento.mtPrice * meters), 0);
  }

  // Calculate total price with rivestimenti for local use (PDF generation)
  calculateTotalPriceWithRivestimenti(meters: number): number {
    return this.price + this.calculateRivestimentoCost(meters);
  }

  // Update price based on components only (for database)
  updatePrice(): void {
    this.price = this.calculatePriceFromComponents();
  }
}
