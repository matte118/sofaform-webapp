import { ComponentType } from './component-type.model';

export interface BulkComponentFixedData {
  name: string;
  type: ComponentType;
}

export interface BulkComponentVariableData {
  supplier: any;
  measure: string;
  price: number;
}

export interface BulkComponentCreation {
  fixedData: BulkComponentFixedData;
  variableData: BulkComponentVariableData[];
}
