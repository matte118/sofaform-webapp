import { ComponentType } from './component-type.model';
import { Supplier } from './supplier.model';

export class Component {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public supplier?: Supplier,
    public type?: ComponentType,
  ) {}
}
