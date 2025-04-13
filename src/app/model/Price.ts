import {CategoryDescription} from "./CategoryDescription";

export interface Price {
  priceInMoney: number;
  pricePerUnit: number;
  unitCount: number;
}

export interface Cell {
  id: number;
  month: string;
  price: Price;
}

export interface FinancialCell {
  id: number;
  month: string;
  value: number;
}

export interface TotalAmount {
  priceInMoney: number
  unitCount: number
}

export interface Categ {
  id: number;
  name: string;
  taxRate: number;
  primaryType: string;
  additionalType: string | null;
  nestingLevel: number;
  position: number;
  totalAmount: TotalAmount;
  cells: Cell[];
  childCategories: Categ[];
  financialResults: FinancialResult[];
  expandable: boolean;
  expanded: boolean;
  hidden: boolean;
  hidePrice: boolean;
  categoryDescription: CategoryDescription | null;
}

export interface FinancialResult {
  financialMetricType: string
  cells: FinancialCell[];
}
