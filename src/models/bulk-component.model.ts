import { ComponentType } from './component-type.model';
import { Supplier } from './supplier.model';
import { SofaType } from './sofa-type.model';

export interface BulkComponentFixedData {
  name: string;
  type: ComponentType;
  supplier: Supplier | null;
  
}

export interface BulkComponentVariableData {
  sofaType?: SofaType | null;
  price: number;
  name: string;
}

export interface BulkComponentCreation {
  fixedData: BulkComponentFixedData;
  variableData: BulkComponentVariableData[];
}
