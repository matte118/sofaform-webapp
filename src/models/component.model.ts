import { ComponentType } from "./component-type.model";
import { Supplier } from "./supplier.model";

export class Component {
  constructor(
    public id: string,
    public categoryId: string,
    public name: string,
    public suppliers: Supplier[] = [],
    public componentModels: ComponentType[] = []
  ) {}
}