'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BookmarkCheck,
  ChevronDown,
  Layers,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BudgetItem, ContractSheet, MatchingResult, MatchType } from '@/types/budget';
import { generateAutomatedExcelFile } from '@/lib/excelEngine';

interface TabMesaDeParaProps {
  sourceContract: ContractSheet;
  targetContract: ContractSheet;
  matches: MatchingResult[];
  setMatches: React.Dispatch<React.SetStateAction<MatchingResult[]>>;
  preserveLiveFormulas: boolean;
  onSaveDeParaMemory: (sourceTerm: string, targetItem: BudgetItem) => void;
}

export const TabMesaDePara: React.FC<TabMesaDeParaProps> = ({
  sourceContract,
  targetContract,
  matches,
  setMatches,
  preserveLiveFormulas,
  onSaveDeParaMemory,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CONFIRMED' | 'ATTENTION' | 'UNMATCHED'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Available target items for manual selection (excluding headers)
  const availableTargetItems = useMemo(() => {
    return targetContract.items.filter(i => !i.isStageHeader);
  }, [targetContract]);

  // KPIs
  const totalItemsCount = matches.length;
  const confirmedCount = matches.filter(m => m.isConfirmed && m.targetItemId).length;
  const attentionCount = matches.filter(m => !m.isConfirmed && m.targetItemId && m.score < 80).length;
  const unmatchedCount = matches.filter(m => !m.targetItemId).length;

  const totalOriginalFinancial = sourceContract.totalValueWithBDI;
  const totalMigratedFinancial = matches.reduce((sum, m) => {
    if (!m.targetItem) return sum;
    const unitPrice = m.targetItem.unitPriceWithBDI || m.targetItem.totalPrice;
    return sum + (m.adjustedQuantity * unitPrice);
  }, 0);

  const precisionIndex = totalItemsCount > 0
    ? Math.round(((confirmedCount * 1.0 + attentionCount * 0.7) / totalItemsCount) * 100)
    : 0;

  const financialDifference = totalMigratedFinancial - totalOriginalFinancial;
  const financialDiffPercentage = totalOriginalFinancial > 0
    ? (financialDifference / totalOriginalFinancial) * 100
    : 0;

  // Toggle Confirm
  const handleToggleConfirm = (matchId: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const nextState = !m.isConfirmed;
        if (nextState && m.targetItem) {
          onSaveDeParaMemory(m.sourceItem.description, m.targetItem);
        }
        return { ...m, isConfirmed: nextState };
      }
      return m;
    }));
  };

  // Change Target Item
  const handleSelectTargetItem = (matchId: string, newTargetItem: BudgetItem) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const calcSub = m.adjustedQuantity * (newTargetItem.unitPriceWithBDI || newTargetItem.totalPrice);
        return {
          ...m,
          targetItemId: newTargetItem.id,
          targetItem: newTargetItem,
          score: 100,
          matchType: 'MANUAL' as MatchType,
          reason: 'Ajustado manualmente pelo engenheiro',
          isConfirmed: true,
          calculatedSubtotal: calcSub,
        };
      }
      return m;
    }));
    onSaveDeParaMemory(
      matches.find(m => m.id === matchId)?.sourceItem.description || '',
      newTargetItem
    );
    setActiveDropdownIndex(null);
  };

  // Adjust Quantity
  const handleQuantityChange = (matchId: string, newQuantityStr: string) => {
    const parsed = parseFloat(newQuantityStr.replace(',', '.'));
    const validQty = isNaN(parsed) ? 0 : parsed;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const unitPrice = m.targetItem ? (m.targetItem.unitPriceWithBDI || m.targetItem.totalPrice) : 0;
        return {
          ...m,
          adjustedQuantity: validQty,
          calculatedSubtotal: validQty * unitPrice,
        };
      }
      return m;
    }));
  };

  // Download Excel with Live Formulas
  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateAutomatedExcelFile(targetContract, matches, {
        preserveLiveFormulas,
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#D4AF37', '#10B981'],
      });

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Orcamento_Compatibilizado_${targetContract.company.replace(/[^a-zA-Z0-9]/g, '_')}_GPR.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na geração do arquivo';
      alert(`Erro ao gerar a planilha Excel: ${message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter items
  const filteredMatches = matches.filter(m => {
    if (filterType === 'CONFIRMED' && !m.isConfirmed) return false;
    if (filterType === 'ATTENTION' && (m.isConfirmed || !m.targetItemId || m.score >= 80)) return false;
    if (filterType === 'UNMATCHED' && m.targetItemId) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const inSource = m.sourceItem.description.toLowerCase().includes(q) || m.sourceItem.itemCode.includes(q);
      const inTarget = m.targetItem?.description.toLowerCase().includes(q) || m.targetItem?.code?.includes(q);
      return inSource || inTarget;
    }

    return true;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* 1. TOP CARDS (KPIs Financeiros e Técnicos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Itens Processados */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#23262E] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>ITENS PROCESSADOS</span>
            <Layers className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {totalItemsCount} de {sourceContract.itemsWithQuantityCount}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ({Math.round((totalItemsCount / (sourceContract.itemsWithQuantityCount || 1)) * 100)}%)
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {confirmedCount} confirmados • {attentionCount} requerem atenção
          </p>
        </div>

        {/* Card 2: Precisão Automática */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#23262E] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>ÍNDICE DE COMPATIBILIZAÇÃO</span>
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-300 font-mono">
              {precisionIndex}%
            </span>
            <span className="text-xs text-gray-400">confiança semântica</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1F2128] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] to-[#10B981]"
              style={{ width: `${precisionIndex}%` }}
            />
          </div>
        </div>

        {/* Card 3: Comparativo Financeiro */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#23262E] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>COMPARATIVO COM BDI</span>
            {financialDifference >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {formatCurrency(totalMigratedFinancial)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-500">Antigo: {formatCurrency(totalOriginalFinancial)}</span>
            <span className={`font-semibold ${financialDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {financialDifference >= 0 ? '+' : ''}{financialDiffPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Botão Dourado de Exportação */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#18191E] to-[#121316] border border-amber-500/30 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-medium">
            <span>EXPORTAÇÃO EXCEL</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={isDownloading || totalItemsCount === 0}
            className="w-full mt-2 py-3 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] via-[#D4AF37] to-[#F39C12] text-black font-extrabold text-xs tracking-wider uppercase hover:opacity-95 shadow-lg shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>GERANDO FÓRMULAS...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>BAIXAR EXCEL (.XLSX)</span>
              </>
            )}
          </button>
          <span className="text-[10px] text-gray-500 text-center mt-1">
            Fórmulas vivas de soma e BDI inclusas
          </span>
        </div>

      </div>

      {/* 2. BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121316] border border-[#23262E]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              filterType === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:text-white bg-[#18191E]'
            }`}
          >
            Todos os Itens ({matches.length})
          </button>

          <button
            onClick={() => setFilterType('CONFIRMED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              filterType === 'CONFIRMED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white bg-[#18191E]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirmados ({confirmedCount})</span>
          </button>

          <button
            onClick={() => setFilterType('ATTENTION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              filterType === 'ATTENTION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:text-white bg-[#18191E]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Sinônimos / Atenção ({attentionCount})</span>
          </button>

          <button
            onClick={() => setFilterType('UNMATCHED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              filterType === 'UNMATCHED'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-gray-400 hover:text-white bg-[#18191E]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Sem Correspondência ({unmatchedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Filtrar por descrição ou código..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] w-full sm:w-64"
          />
        </div>
      </div>

      {/* 3. SUPER TABELA COMPARATIVA LADO A LADO (SPLIT-VIEW) */}
      <div className="rounded-2xl bg-[#121316] border border-[#23262E] overflow-hidden shadow-2xl">
        
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-2 p-4 bg-[#18191E] border-b border-[#23262E] text-xs font-bold text-gray-300 uppercase tracking-wider">
          <div className="col-span-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Orçamento Anterior (Origem)</span>
          </div>

          <div className="col-span-2 text-center flex items-center justify-center gap-1">
            <span>Conector Inteligente</span>
          </div>

          <div className="col-span-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Novo Contrato Base (Destino)</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 lowercase">
              subtotal c/ BDI
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#1F2128]">
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Nenhum item corresponde ao filtro selecionado.
            </div>
          ) : (
            filteredMatches.map((match) => {
              const hasTarget = !!match.targetItem;
              const isMatchExact = match.score >= 80;
              const isMatchAttention = match.score >= 40 && match.score < 80;

              return (
                <div
                  key={match.id}
                  className={`grid grid-cols-12 gap-3 p-4 items-center transition-colors ${
                    match.isConfirmed
                      ? 'bg-[#151821]/40 hover:bg-[#151821]'
                      : 'hover:bg-[#18191E]'
                  }`}
                >
                  
                  {/* LADO ESQUERDO: Orçamento Anterior */}
                  <div className="col-span-12 lg:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#18191E] text-amber-300 border border-[#2B2F3B]">
                        Item {match.sourceItem.itemCode}
                      </span>
                      {match.sourceItem.code && (
                        <span className="text-[10px] font-mono text-gray-500">
                          {match.sourceItem.code}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-500">
                        ({match.sourceItem.source || 'ANTIGO'})
                      </span>
                    </div>

                    <p className="text-xs text-gray-200 font-medium line-clamp-2 leading-relaxed">
                      {match.sourceItem.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                      <span>
                        Qtd Original: <strong className="text-white">{match.sourceItem.quantity.toFixed(2)}</strong> {match.sourceItem.unit}
                      </span>
                      <span>•</span>
                      <span>
                        Total: {formatCurrency(match.sourceItem.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* CENTRO: Conector Inteligente & Badge de Confiança */}
                  <div className="col-span-12 lg:col-span-2 flex flex-col items-center justify-center gap-2 py-2 border-y lg:border-y-0 lg:border-x border-[#23262E] px-2 text-center">
                    {/* Badge */}
                    <div className="flex items-center gap-1.5">
                      {isMatchExact ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{match.score}% MATCH</span>
                        </span>
                      ) : isMatchAttention ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{match.score}% SINÔNIMO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>SEM MATCH</span>
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <span className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                      {match.reason}
                    </span>

                    {/* Confirmation Checkmark Button */}
                    {hasTarget && (
                      <button
                        onClick={() => handleToggleConfirm(match.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          match.isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-[#18191E] text-gray-400 hover:text-white border border-[#2B2F3B] hover:border-emerald-500/40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{match.isConfirmed ? 'Confirmado' : 'Confirmar Vínculo'}</span>
                      </button>
                    )}
                  </div>

                  {/* LADO DIREITO: Planilha do Novo Contrato */}
                  <div className="col-span-12 lg:col-span-5 space-y-2">
                    {hasTarget && match.targetItem ? (
                      <div className="p-3 rounded-xl bg-[#18191E] border border-[#2B2F3B] space-y-2 relative">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#121316] text-emerald-400 border border-emerald-500/30">
                              Item {match.targetItem.itemCode}
                            </span>
                            {match.targetItem.code && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#121316] text-gray-300 border border-[#2B2F3B]">
                                SINAPI {match.targetItem.code}
                              </span>
                            )}
                          </div>

                          {/* Dropdown Toggle to switch item */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdownIndex(activeDropdownIndex === match.id ? null : match.id)}
                              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium underline"
                            >
                              <span>Trocar</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownIndex === match.id && (
                              <div className="absolute right-0 top-6 z-50 w-96 max-h-80 overflow-y-auto rounded-xl bg-[#121316] border border-[#D4AF37]/40 shadow-2xl p-2 space-y-1">
                                <p className="text-[10px] font-mono text-gray-400 px-2 py-1 border-b border-[#23262E]">
                                  Selecione a composição do novo contrato:
                                </p>
                                {availableTargetItems.map((candidate) => (
                                  <div
                                    key={candidate.id}
                                    onClick={() => handleSelectTargetItem(match.id, candidate)}
                                    className="p-2 rounded-lg hover:bg-[#18191E] cursor-pointer transition-colors text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-amber-300 font-bold">{candidate.itemCode} ({candidate.code})</span>
                                      <span className="text-emerald-400 font-mono">{formatCurrency(candidate.unitPriceWithBDI)}</span>
                                    </div>
                                    <p className="text-gray-300 text-[11px] line-clamp-2">{candidate.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-200 font-medium line-clamp-2 leading-relaxed">
                          {match.targetItem.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#23262E] items-center text-xs font-mono">
                          {/* Unit Price */}
                          <div>
                            <span className="text-[10px] text-gray-500 block">UNIT. C/ BDI</span>
                            <span className="text-gray-300 font-semibold">
                              {formatCurrency(match.targetItem.unitPriceWithBDI)}
                            </span>
                          </div>

                          {/* Editable Quantity */}
                          <div>
                            <span className="text-[10px] text-amber-400 block font-sans">QUANTITATIVO</span>
                            <input
                              type="number"
                              step="0.01"
                              value={match.adjustedQuantity}
                              onChange={(e) => handleQuantityChange(match.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs font-mono font-bold bg-[#121316] border border-[#2B2F3B] rounded-lg text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Live Subtotal */}
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block">SUBTOTAL</span>
                            <span className="text-emerald-400 font-bold text-xs">
                              {formatCurrency(match.calculatedSubtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                        <span className="text-xs text-red-400">
                          Nenhuma composição vinculada a este item
                        </span>
                        
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdownIndex(activeDropdownIndex === match.id ? null : match.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#18191E] text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-colors"
                          >
                            + Selecionar Composição
                          </button>

                          {activeDropdownIndex === match.id && (
                            <div className="absolute right-0 top-7 z-50 w-96 max-h-80 overflow-y-auto rounded-xl bg-[#121316] border border-[#D4AF37]/40 shadow-2xl p-2 space-y-1">
                              <p className="text-[10px] font-mono text-gray-400 px-2 py-1 border-b border-[#23262E]">
                                Selecione a composição do novo contrato:
                              </p>
                              {availableTargetItems.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  onClick={() => handleSelectTargetItem(match.id, candidate)}
                                  className="p-2 rounded-lg hover:bg-[#18191E] cursor-pointer transition-colors text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-amber-300 font-bold">{candidate.itemCode} ({candidate.code})</span>
                                    <span className="text-emerald-400 font-mono">{formatCurrency(candidate.unitPriceWithBDI)}</span>
                                  </div>
                                  <p className="text-gray-300 text-[11px] line-clamp-2">{candidate.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
