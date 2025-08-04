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
    public rivestimenti: Rivestimento[] = [],
  ) {}

  // Calculate price from components
  calculatePriceFromComponents(): number {
    return this.components.reduce((sum, component) => sum + component.price, 0);
  }

  // Calculate price from rivestimenti
  calculatePriceFromRivestimenti(): number {
    return this.rivestimenti.reduce((sum, rivestimento) => sum + rivestimento.mtPrice, 0);
  }

  // Calculate total price from components and rivestimenti
  calculateTotalPrice(): number {
    return this.calculatePriceFromComponents() + this.calculatePriceFromRivestimenti();
  }

  // Update price based on current components and rivestimenti
  updatePrice(): void {
    this.price = this.calculateTotalPrice();
  }
}
