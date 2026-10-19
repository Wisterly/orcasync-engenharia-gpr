import { BudgetItem, MatchingResult, MatchType, SynonymGroup, DeParaRule } from '@/types/budget';
import { DEFAULT_SYNONYM_GROUPS } from './synonyms';

// Normalize text for comparison
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s²³]/g, ' ') // keep alphanumeric and powers
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize units
export function normalizeUnit(unit: string): string {
  if (!unit) return '';
  const u = unit.toLowerCase().trim().replace(/[^a-z0-9²³]/g, '');
  if (['m2', 'm²', 'metroquadrado'].includes(u)) return 'm²';
  if (['m3', 'm³', 'metrocubico'].includes(u)) return 'm³';
  if (['m', 'metro', 'ml', 'metrolinar'].includes(u)) return 'm';
  if (['un', 'und', 'unid', 'unidade', 'pc', 'pç', 'peca', 'peça', 'cj', 'conj', 'kit'].includes(u)) return 'un';
  if (['kg', 'quilo', 'quilograma'].includes(u)) return 'kg';
  if (['t', 'ton', 'tonelada'].includes(u)) return 't';
  if (['vb', 'verba', 'gl', 'global', 'serv', 'servico'].includes(u)) return 'vb';
  if (['pt', 'pto', 'ponto'].includes(u)) return 'pt';
  if (['h', 'hr', 'hora'].includes(u)) return 'h';
  if (['mes', 'mês'].includes(u)) return 'mês';
  return u;
}

const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'com', 'para', 'por', 'sobre', 'a', 'o', 'as', 'os', 'e', 'ou',
  'um', 'uma', 'uns', 'umas', 'inclusive', 'sem', 'sob', 'tipo',
  'padrao', 'fornecimento', 'aplicacao', 'instalacao', 'execucao', 'uso'
]);

export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Find synonym equivalents for a word or phrase
export function getSynonymTerms(term: string, groups: SynonymGroup[]): Set<string> {
  const results = new Set<string>();
  const normTerm = normalizeText(term);

  for (const group of groups) {
    const normGroupTerms = group.terms.map(t => normalizeText(t));
    const matched = normGroupTerms.some(t => normTerm.includes(t) || t.includes(normTerm));
    if (matched) {
      normGroupTerms.forEach(t => results.add(t));
    }
  }

  return results;
}

export interface CandidateEvaluation {
  targetItem: BudgetItem;
  score: number;
  matchType: MatchType;
  reason: string;
}

export function evaluateItemMatch(
  sourceItem: BudgetItem,
  targetItem: BudgetItem,
  options: {
    requireSameUnit: boolean;
    useTechnicalEquivalence: boolean;
    synonymGroups: SynonymGroup[];
    deParaRules: DeParaRule[];
  }
): { score: number; matchType: MatchType; reason: string } {
  // 1. Check learned De-Para rules first
  for (const rule of options.deParaRules) {
    const normSource = normalizeText(sourceItem.description);
    const normTarget = normalizeText(targetItem.description);
    const normRuleSource = normalizeText(rule.sourceTerm);

    if (
      (normSource.includes(normRuleSource) || (targetItem.code && targetItem.code === rule.targetCode)) &&
      normTarget.includes(normalizeText(rule.targetDescription).slice(0, 15))
    ) {
      return {
        score: 100,
        matchType: 'EXACT',
        reason: `Memória De-Para aprovada anteriormente: "${rule.sourceTerm}" ➔ [${targetItem.code || ''}] ${targetItem.description.slice(0, 40)}...`,
      };
    }
  }

  // 2. Unit check
  const sourceUnitNorm = normalizeUnit(sourceItem.unit);
  const targetUnitNorm = normalizeUnit(targetItem.unit);
  const unitsMatch = sourceUnitNorm === targetUnitNorm && sourceUnitNorm !== '';

  if (options.requireSameUnit && !unitsMatch) {
    return {
      score: 0,
      matchType: 'NONE',
      reason: `Unidade incompatível (${sourceItem.unit} ≠ ${targetItem.unit})`,
    };
  }

  const normSource = normalizeText(sourceItem.description);
  const normTarget = normalizeText(targetItem.description);

  // Exact match
  if (normSource === normTarget) {
    return {
      score: 100,
      matchType: 'EXACT',
      reason: 'Descrição idêntica à composição do novo contrato',
    };
  }

  // Code match (e.g. SINAPI code match)
  if (sourceItem.code && targetItem.code && sourceItem.code.trim() === targetItem.code.trim()) {
    return {
      score: 98,
      matchType: 'EXACT',
      reason: `Código de composição idêntico: ${sourceItem.code}`,
    };
  }

  const sourceKeywords = extractKeywords(sourceItem.description);
  const targetKeywords = extractKeywords(targetItem.description);

  if (sourceKeywords.length === 0 || targetKeywords.length === 0) {
    return { score: 0, matchType: 'NONE', reason: 'Palavras-chave insuficientes para análise' };
  }

  // Direct keyword overlap
  let directMatches = 0;
  for (const sk of sourceKeywords) {
    if (targetKeywords.includes(sk)) {
      directMatches++;
    }
  }

  let synonymMatches = 0;
  const synonymReasons: string[] = [];

  if (options.useTechnicalEquivalence) {
    for (const sk of sourceKeywords) {
      const synSet = getSynonymTerms(sk, options.synonymGroups);
      if (synSet.size > 0) {
        for (const tk of targetKeywords) {
          if (sk !== tk && (synSet.has(tk) || Array.from(synSet).some(s => tk.includes(s) || s.includes(tk)))) {
            synonymMatches++;
            synonymReasons.push(`"${sk}" ≈ "${tk}"`);
            break;
          }
        }
      }
    }
  }

  // Calculate composite score
  const totalKeywords = Math.max(sourceKeywords.length, targetKeywords.length);
  const matchRatio = (directMatches * 1.0 + synonymMatches * 0.9) / totalKeywords;
  
  let baseScore = Math.min(100, Math.round(matchRatio * 90));

  // Unit bonus / penalty
  if (unitsMatch) {
    baseScore = Math.min(100, baseScore + 10);
  } else if (!unitsMatch && sourceUnitNorm && targetUnitNorm) {
    baseScore = Math.max(0, baseScore - 15);
  }

  // Substring inclusion bonus
  if (normTarget.includes(normSource) || normSource.includes(normTarget)) {
    baseScore = Math.min(100, baseScore + 15);
  }

  // Determine MatchType and detailed reason
  let matchType: MatchType = 'NONE';
  let reason = '';

  if (baseScore >= 80) {
    matchType = 'EXACT';
    reason = directMatches > 2
      ? `Alta precisão semântica (${directMatches} termos coincidentes)`
      : `Equivalência direta forte com compatibilidade de unidade (${targetItem.unit})`;
  } else if (baseScore >= 45 || synonymMatches > 0) {
    matchType = 'SYNONYM';
    if (synonymReasons.length > 0) {
      reason = `Equivalência técnica detectada: ${synonymReasons.slice(0, 2).join(', ')}`;
    } else {
      reason = `Aproximação técnica por palavras-chave (${directMatches} termos coincidentes)`;
    }
  } else if (baseScore >= 25) {
    matchType = 'FUZZY';
    reason = `Similaridade parcial (${baseScore}%). Recomenda-se validação técnica.`;
  } else {
    matchType = 'NONE';
    reason = 'Nenhuma correspondência com índice de confiança suficiente.';
  }

  return { score: baseScore, matchType, reason };
}

// Find top candidates for a given source item
export function findTopCandidates(
  sourceItem: BudgetItem,
  targetItems: BudgetItem[],
  options: {
    requireSameUnit: boolean;
    useTechnicalEquivalence: boolean;
    synonymGroups: SynonymGroup[];
    deParaRules: DeParaRule[];
  },
  limit: number = 5
): CandidateEvaluation[] {
  // Only evaluate actionable target items (not stage headers)
  const candidatePool = targetItems.filter(item => !item.isStageHeader);

  const evaluations: CandidateEvaluation[] = candidatePool.map(targetItem => {
    const evaluation = evaluateItemMatch(sourceItem, targetItem, options);
    return {
      targetItem,
      score: evaluation.score,
      matchType: evaluation.matchType,
      reason: evaluation.reason,
    };
  });

  evaluations.sort((a, b) => b.score - a.score);
  return evaluations.slice(0, limit);
}

// Perform automated matching for the entire budget
export function performAutomatedMatching(
  sourceItems: BudgetItem[],
  targetItems: BudgetItem[],
  options: {
    requireSameUnit: boolean;
    useTechnicalEquivalence: boolean;
    synonymGroups?: SynonymGroup[];
    deParaRules?: DeParaRule[];
  }
): MatchingResult[] {
  const synonymGroups = options.synonymGroups || DEFAULT_SYNONYM_GROUPS;
  const deParaRules = options.deParaRules || [];

  // Filter only items with quantity > 0 and not stage headers
  const activeSourceItems = sourceItems.filter(item => !item.isStageHeader && item.quantity > 0);

  const results: MatchingResult[] = [];

  for (const sourceItem of activeSourceItems) {
    const candidates = findTopCandidates(sourceItem, targetItems, {
      requireSameUnit: options.requireSameUnit,
      useTechnicalEquivalence: options.useTechnicalEquivalence,
      synonymGroups,
      deParaRules,
    });

    const bestCandidate = candidates.length > 0 && candidates[0].score >= 25 ? candidates[0] : null;

    if (bestCandidate && bestCandidate.targetItem) {
      const calculatedSubtotal = sourceItem.quantity * (bestCandidate.targetItem.unitPriceWithBDI || bestCandidate.targetItem.totalPrice);
      results.push({
        id: `match-${sourceItem.id}`,
        sourceItemId: sourceItem.id,
        sourceItem,
        targetItemId: bestCandidate.targetItem.id,
        targetItem: bestCandidate.targetItem,
        score: bestCandidate.score,
        matchType: bestCandidate.matchType,
        reason: bestCandidate.reason,
        isConfirmed: bestCandidate.score >= 80,
        adjustedQuantity: sourceItem.quantity,
        calculatedSubtotal,
      });
    } else {
      results.push({
        id: `match-${sourceItem.id}`,
        sourceItemId: sourceItem.id,
        sourceItem,
        targetItemId: null,
        targetItem: null,
        score: 0,
        matchType: 'NONE',
        reason: 'Nenhuma composição correspondente encontrada na planilha base.',
        isConfirmed: false,
        adjustedQuantity: sourceItem.quantity,
        calculatedSubtotal: 0,
      });
    }
  }

  return results;
}
