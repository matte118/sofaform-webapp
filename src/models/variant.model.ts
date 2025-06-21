import { Component } from './component.model';

export class Variant {
  constructor(
    public id: string,
    public sofaId: string,
    public longName: string,
    public price: number,
    public components: Component[] = [],
    public seatsCount?: number,
    public mattressWidth?: number
  ) {}
}
