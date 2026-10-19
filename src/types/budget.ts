export interface BudgetItem {
  id: string;
  rowNumber: number;
  itemCode: string; // e.g. "1.1", "2.1.3"
  stageLevel: number; // 1 for "1.0", 2 for "1.1", etc.
  isStageHeader: boolean;
  source?: string; // "SINAPI", "SEINFRA", "ORSE", "PRÓPRIA"
  code?: string; // e.g. "88309", "CPU-102"
  description: string;
  unit: string; // "m²", "m³", "un", "kg", "m", etc.
  quantity: number;
  unitPriceWithoutBDI: number;
  unitPriceWithBDI: number;
  totalPrice: number;
  bdiPercentage: number;
  originalFormula?: string | null;
  cellRefs?: {
    qtyCell?: string;
    unitPriceCell?: string;
    unitPriceBdiCell?: string;
    totalCell?: string;
  };
}

export interface StageGroup {
  itemCode: string;
  title: string;
  rowNumber: number;
  totalCell: string;
  subitemRowNumbers: number[];
  subitemTotalCells: string[];
  subtotal: number;
}

export interface ContractSheet {
  id: string;
  title: string;
  company: string;
  contractNumber: string;
  bdiPercentage: number;
  baseDate?: string;
  items: BudgetItem[];
  stages: StageGroup[];
  totalValueWithBDI: number;
  totalValueWithoutBDI: number;
  itemsWithQuantityCount: number;
  fileName?: string;
  rawWorkbookBuffer?: ArrayBuffer;
  createdAt: string;
}

export type MatchType = 'EXACT' | 'SYNONYM' | 'FUZZY' | 'MANUAL' | 'NONE';

export interface MatchingResult {
  id: string;
  sourceItemId: string;
  sourceItem: BudgetItem;
  targetItemId: string | null;
  targetItem: BudgetItem | null;
  score: number; // 0 to 100
  matchType: MatchType;
  reason: string;
  isConfirmed: boolean;
  adjustedQuantity: number;
  calculatedSubtotal: number;
}

export interface SynonymGroup {
  id: string;
  category: string;
  terms: string[];
}

export interface DeParaRule {
  id: string;
  sourceTerm: string;
  targetCode: string;
  targetDescription: string;
  targetUnit: string;
  createdAt: string;
}

export interface ConversionProject {
  id: string;
  title: string;
  sourceContract: ContractSheet;
  targetContract: ContractSheet;
  matches: MatchingResult[];
  requireSameUnit: boolean;
  useTechnicalEquivalence: boolean;
  preserveLiveFormulas: boolean;
  createdAt: string;
  updatedAt: string;
}
