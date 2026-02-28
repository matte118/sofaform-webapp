import { ComponentType } from './component-type.model';
import { Supplier } from './supplier.model';
import { SofaType } from './sofa-type.model';

export class Component {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public supplier?: Supplier,
    public type?: ComponentType,
    public sofaType?: SofaType | null,
    public sofaTypeCustomName?: string,
  ) { }
}
