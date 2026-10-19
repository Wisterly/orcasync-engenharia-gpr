import { ContractSheet, DeParaRule, SynonymGroup, ConversionProject } from '@/types/budget';
import { DEFAULT_SYNONYM_GROUPS } from './synonyms';

const STORAGE_KEYS = {
  CONTRACTS: 'orcasync_contracts_v1',
  DE_PARA_RULES: 'orcasync_depara_rules_v1',
  SYNONYMS: 'orcasync_synonyms_v1',
  PROJECT_HISTORY: 'orcasync_history_v1',
};

export function getStoredContracts(): ContractSheet[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load contracts from localStorage', err);
    return [];
  }
}

export function saveContractToStorage(contract: ContractSheet): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredContracts();
    const filtered = existing.filter(c => c.id !== contract.id);
    // Don't store raw binary buffer in localStorage
    const toStore = { ...contract, rawWorkbookBuffer: undefined };
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify([toStore, ...filtered]));
  } catch (err) {
    console.error('Failed to save contract to localStorage', err);
  }
}

export function deleteContractFromStorage(contractId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredContracts();
    const filtered = existing.filter(c => c.id !== contractId);
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete contract from localStorage', err);
  }
}

export function getStoredDeParaRules(): DeParaRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DE_PARA_RULES);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load De-Para rules', err);
    return [];
  }
}

export function saveDeParaRule(rule: DeParaRule): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredDeParaRules();
    const filtered = existing.filter(r => r.sourceTerm.toLowerCase() !== rule.sourceTerm.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.DE_PARA_RULES, JSON.stringify([rule, ...filtered]));
  } catch (err) {
    console.error('Failed to save De-Para rule', err);
  }
}

export function deleteDeParaRule(ruleId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredDeParaRules();
    const filtered = existing.filter(r => r.id !== ruleId);
    localStorage.setItem(STORAGE_KEYS.DE_PARA_RULES, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete De-Para rule', err);
  }
}

export function getStoredSynonymGroups(): SynonymGroup[] {
  if (typeof window === 'undefined') return DEFAULT_SYNONYM_GROUPS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYNONYMS);
    return data ? JSON.parse(data) : DEFAULT_SYNONYM_GROUPS;
  } catch (err) {
    console.error('Failed to load synonym groups', err);
    return DEFAULT_SYNONYM_GROUPS;
  }
}

export function saveSynonymGroups(groups: SynonymGroup[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SYNONYMS, JSON.stringify(groups));
  } catch (err) {
    console.error('Failed to save synonym groups', err);
  }
}

export function getStoredHistory(): ConversionProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load history', err);
    return [];
  }
}

export function saveProjectToHistory(project: ConversionProject): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getStoredHistory();
    const cleanProject = {
      ...project,
      sourceContract: { ...project.sourceContract, rawWorkbookBuffer: undefined },
      targetContract: { ...project.targetContract, rawWorkbookBuffer: undefined },
    };
    const updated = [cleanProject, ...history.filter(h => h.id !== project.id)].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.PROJECT_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history', err);
  }
}
