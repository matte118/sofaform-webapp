import { Component } from "./component.model";

export class Variant {
  constructor(
    public id: string,
    public sofaId: string,
    public code: string,
    public longName: string,
    public basePrice: number,
    public components: Component[] = [],
    public seatsCount?: number,
    public mattressWidth?: number
  ) {}
}