import { Component } from './component.model';

export class Variant {
  constructor(
    public id: string,
    public sofaId: string,
    public longName: string,
    public price: number = 0,
    public components: Component[] = [],
    public seatsCount?: number,
    public mattressWidth?: number
  ) {}

  // Calculate price from components
  calculatePriceFromComponents(): number {
    return this.components.reduce((sum, component) => sum + component.price, 0);
  }

  // Update price based on current components
  updatePrice(): void {
    this.price = this.calculatePriceFromComponents();
  }
}
