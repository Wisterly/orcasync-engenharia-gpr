'use client';

import React, { useState } from 'react';
import {
  Database,
  Building2,
  FileSpreadsheet,
  Plus,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Percent,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';
import { ContractSheet } from '@/types/budget';

interface TabBancoContratosProps {
  contracts: ContractSheet[];
  onOpenNewContractModal: () => void;
  onDeleteContract: (contractId: string) => void;
  onSelectForMatching: (contract: ContractSheet) => void;
}

export const TabBancoContratos: React.FC<TabBancoContratosProps> = ({
  contracts,
  onOpenNewContractModal,
  onDeleteContract,
  onSelectForMatching,
}) => {
  const [selectedContractForPreview, setSelectedContractForPreview] = useState<ContractSheet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const toggleStage = (stageCode: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageCode]: !prev[stageCode],
    }));
  };

  const filteredContracts = contracts.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121316] border border-[#23262E]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-white">Banco de Contratos Base (Planilhas Mestras)</h2>
          </div>
          <p className="text-xs text-gray-400">
            Gerencie as planilhas base oficiais de cada construtora e contrato com proteção de composições e preços.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            onClick={onOpenNewContractModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md shadow-[#FF6B00]/20 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Contrato Base</span>
          </button>
        </div>
      </div>

      {/* Grid of Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => {
          const subitemsCount = contract.items.filter(i => !i.isStageHeader).length;

          return (
            <div
              key={contract.id}
              className="flex flex-col rounded-2xl bg-[#121316] border border-[#23262E] hover:border-amber-500/30 transition-all p-5 shadow-xl relative group"
            >
              {/* Top Meta */}
              <div className="flex items-start justify-between pb-3 border-b border-[#23262E]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{contract.company}</h3>
                    <span className="text-[11px] font-mono text-gray-400">{contract.contractNumber}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteContract(contract.id)}
                  title="Excluir contrato"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Stats */}
              <div className="mt-4 space-y-3 flex-1">
                <h4 className="text-xs font-semibold text-amber-300 line-clamp-2">
                  {contract.title}
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#18191E] border border-[#23262E]">
                    <span className="text-[10px] text-gray-500 block">COMPOSIÇÕES</span>
                    <span className="text-white font-bold">{subitemsCount} itens</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#18191E] border border-[#23262E]">
                    <span className="text-[10px] text-gray-500 block">TAXA BDI</span>
                    <span className="text-amber-400 font-bold">{contract.bdiPercentage.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#18191E] border border-[#23262E] text-xs">
                  <span className="text-[10px] text-gray-500 font-mono block">ÁRVORE DE ETAPAS</span>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-300 font-medium">
                    <FolderTree className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{contract.stages.length} Etapas principais identificadas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#23262E] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedContractForPreview(contract)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#18191E] hover:bg-[#23262E] text-xs font-medium text-gray-200 transition-colors border border-[#2B2F3B]"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Ver Árvore / Itens</span>
                </button>

                <button
                  onClick={() => onSelectForMatching(contract)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black text-xs font-semibold shadow-md shadow-[#FF6B00]/20 hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Usar no De-Para</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal: Tree of Stages & Items */}
      {selectedContractForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#121316] border border-[#2B2F3B] shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#23262E] flex items-center justify-between bg-[#18191E]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[#D4AF37]" />
                  <span>Estrutura Hierárquica do Contrato Base</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedContractForPreview.title} — {selectedContractForPreview.company}
                </p>
              </div>

              <button
                onClick={() => setSelectedContractForPreview(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#23262E] text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-xs font-mono text-gray-400 bg-[#0E0F12] p-3 rounded-xl border border-[#23262E] flex items-center justify-between">
                <span>Total de Itens: {selectedContractForPreview.items.length}</span>
                <span>BDI: {selectedContractForPreview.bdiPercentage.toFixed(2)}%</span>
                <span className="text-amber-400 font-semibold">Composições Fixas e Protegidas</span>
              </div>

              <div className="space-y-3">
                {selectedContractForPreview.stages.map((stage) => {
                  const isExpanded = expandedStages[stage.itemCode] !== false;
                  const stageSubitems = selectedContractForPreview.items.filter(
                    item => !item.isStageHeader && item.itemCode.startsWith(stage.itemCode.replace('.0', ''))
                  );

                  return (
                    <div key={stage.itemCode} className="rounded-xl border border-[#23262E] bg-[#18191E] overflow-hidden">
                      <div
                        onClick={() => toggleStage(stage.itemCode)}
                        className="p-3 bg-[#1F2128] flex items-center justify-between cursor-pointer hover:bg-[#242731] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {stage.itemCode}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {stage.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">
                          {stageSubitems.length} subitens
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="p-3 divide-y divide-[#23262E] text-xs">
                          {stageSubitems.map((subitem) => (
                            <div key={subitem.id} className="py-2.5 flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-amber-300 font-medium">
                                    {subitem.itemCode}
                                  </span>
                                  {subitem.code && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-black/40 text-gray-400 border border-[#2B2F3B]">
                                      {subitem.code}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-500 font-mono">
                                    {subitem.source || 'SINAPI'}
                                  </span>
                                </div>
                                <p className="text-gray-200 text-xs">
                                  {subitem.description}
                                </p>
                              </div>

                              <div className="text-right shrink-0 font-mono">
                                <span className="text-gray-400 block text-[10px]">
                                  {subitem.unit}
                                </span>
                                <span className="text-emerald-400 font-semibold text-xs">
                                  {formatCurrency(subitem.unitPriceWithBDI)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#23262E] bg-[#18191E] flex justify-end">
              <button
                onClick={() => setSelectedContractForPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#23262E] text-xs font-medium text-white hover:bg-[#2B2F3B] transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
