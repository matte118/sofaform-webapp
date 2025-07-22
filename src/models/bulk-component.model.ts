import { ComponentType } from './component-type.model';
import { Supplier } from './supplier.model';

export interface BulkComponentFixedData {
  name: string;
  type: ComponentType;
  supplier: Supplier | null;
  
}

export interface BulkComponentVariableData {
  measure: string;
  price: number;
  name?: string;
}

export interface BulkComponentCreation {
  fixedData: BulkComponentFixedData;
  variableData: BulkComponentVariableData[];
}
