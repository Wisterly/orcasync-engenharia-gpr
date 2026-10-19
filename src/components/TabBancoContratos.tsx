'use client';

import React, { useState, useRef } from 'react';
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
  Search,
  CheckCircle2,
  UploadCloud,
  FileUp,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ContractSheet } from '@/types/budget';
import { ExcelThumbnailCover } from './ExcelThumbnailCover';
import { parseExcelBudget } from '@/lib/excelEngine';

interface TabBancoContratosProps {
  contracts: ContractSheet[];
  onOpenNewContractModal: () => void;
  onDeleteContract: (contractId: string) => void;
  onSelectForMatching: (contract: ContractSheet) => void;
  onUpdateContractSpreadsheet: (contractId: string, updatedContract: ContractSheet) => void;
}

export const TabBancoContratos: React.FC<TabBancoContratosProps> = ({
  contracts,
  onOpenNewContractModal,
  onDeleteContract,
  onSelectForMatching,
  onUpdateContractSpreadsheet,
}) => {
  const [selectedContractForPreview, setSelectedContractForPreview] = useState<ContractSheet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [dragOverContractId, setDragOverContractId] = useState<string | null>(null);
  const [activeUploadContractId, setActiveUploadContractId] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Hidden file input for card attachments
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleStage = (stageCode: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageCode]: !prev[stageCode],
    }));
  };

  // Open file selector targeting a specific contract
  const triggerFileInput = (contractId: string) => {
    setActiveUploadContractId(contractId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process uploaded or dropped Excel file for a specific contract card
  const handleFileForContract = async (contractId: string, file: File) => {
    try {
      setIsProcessingFile(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelBudget(buffer, file.name, true);

      // Find the contract being updated
      const existing = contracts.find(c => c.id === contractId);
      if (!existing) return;

      const updatedContract: ContractSheet = {
        ...existing,
        items: parsed.items,
        stages: parsed.stages,
        totalValueWithBDI: parsed.totalValueWithBDI,
        totalValueWithoutBDI: parsed.totalValueWithoutBDI,
        itemsWithQuantityCount: parsed.itemsWithQuantityCount,
        fileName: file.name,
        rawWorkbookBuffer: buffer,
      };

      onUpdateContractSpreadsheet(contractId, updatedContract);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao processar arquivo';
      alert(`Erro ao ler a planilha Excel: ${message}`);
    } finally {
      setIsProcessingFile(false);
      setActiveUploadContractId(null);
      setDragOverContractId(null);
    }
  };

  // Handle standard input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadContractId) {
      handleFileForContract(activeUploadContractId, file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, contractId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContractId(contractId);
  };

  const handleDragLeave = (e: React.DragEvent, contractId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverContractId === contractId) {
      setDragOverContractId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, contractId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContractId(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileForContract(contractId, file);
    }
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
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* Hidden input for attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121316] border border-[#23262E] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-white">Banco de Contratos Base (Planilhas Mestras)</h2>
          </div>
          <p className="text-xs text-gray-400">
            Cada card representa um contrato oficial. Anexe a planilha base (.xlsx) para exibir a foto de capa em miniatura e utilizá-la na compatibilização.
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
              className="pl-9 pr-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] w-56"
            />
          </div>

          <button
            onClick={onOpenNewContractModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md shadow-[#FF6B00]/20 hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Card de Contrato</span>
          </button>
        </div>
      </div>

      {/* Grid of Contract Cards with Excel Cover Thumbnails and Attach Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => {
          const hasSpreadsheet = contract.items && contract.items.length > 0;
          const subitemsCount = hasSpreadsheet ? contract.items.filter(i => !i.isStageHeader).length : 0;
          const isDragOver = dragOverContractId === contract.id;
          const isCurrentLoading = isProcessingFile && activeUploadContractId === contract.id;

          return (
            <div
              key={contract.id}
              onDragOver={(e) => handleDragOver(e, contract.id)}
              onDragLeave={(e) => handleDragLeave(e, contract.id)}
              onDrop={(e) => handleDrop(e, contract.id)}
              className={`flex flex-col rounded-2xl bg-[#121316] border transition-all p-5 shadow-2xl relative group ${
                isDragOver
                  ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/40 bg-[#16171E]'
                  : 'border-[#23262E] hover:border-amber-500/40'
              }`}
            >
              {/* Card Top Information */}
              <div className="flex items-start justify-between pb-3 border-b border-[#23262E] mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{contract.company}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                      <span>{contract.contractNumber}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">BDI {contract.bdiPercentage.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteContract(contract.id)}
                  title="Excluir card de contrato"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 mb-3">
                {contract.title}
              </h4>

              {/* FOTO DE CAPA: MINIATURA REALISTA DA PLANILHA EXCEL */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5 px-0.5">
                  <span className="flex items-center gap-1 font-semibold text-gray-300">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#107C41]" />
                    <span>Capa da Planilha Base</span>
                  </span>
                  {hasSpreadsheet && (
                    <span className="text-[10px] text-emerald-400">100% Compatibilizável</span>
                  )}
                </div>

                <ExcelThumbnailCover
                  contract={contract}
                  isDragOver={isDragOver}
                  onAttachClick={() => triggerFileInput(contract.id)}
                  onPreviewClick={() => setSelectedContractForPreview(contract)}
                />
              </div>

              {/* CAIXA DE ANEXO DE ARQUIVO EXCEL / BOTÃO DE BUSCAR NO COMPUTADOR OU CELULAR */}
              <div className="p-3 rounded-xl bg-[#18191E] border border-[#2B2F3B] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{hasSpreadsheet ? 'Substituir / Atualizar Planilha' : 'Anexar Planilha Base'}</span>
                  </span>
                  {isCurrentLoading && (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Lendo...
                    </span>
                  )}
                </div>

                {/* Dropzone Area & Button */}
                <div
                  onClick={() => triggerFileInput(contract.id)}
                  className="p-2.5 rounded-lg border border-dashed border-[#3A3F4E] hover:border-amber-400 bg-[#121316] hover:bg-[#15171F] cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileUp className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] truncate">
                      {hasSpreadsheet ? 'Arraste novo .xlsx ou clique aqui' : 'Arraste .xlsx ou abra o diretório'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput(contract.id);
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#242833] hover:bg-amber-500/20 text-[#D4AF37] text-[10px] font-bold font-mono border border-amber-500/30 hover:border-amber-400 transition-all shrink-0"
                  >
                    Anexar Arquivo
                  </button>
                </div>
              </div>

              {/* Contract Stats Summary */}
              {hasSpreadsheet && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
                  <div className="p-2 rounded-lg bg-[#18191E] border border-[#23262E] text-center">
                    <span className="text-[9px] text-gray-500 block uppercase">Composições</span>
                    <span className="text-white font-bold">{subitemsCount} itens</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18191E] border border-[#23262E] text-center">
                    <span className="text-[9px] text-gray-500 block uppercase">Etapas</span>
                    <span className="text-amber-400 font-bold">{contract.stages.length} grupos</span>
                  </div>
                </div>
              )}

              {/* Card Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#23262E] flex items-center gap-2">
                {hasSpreadsheet && (
                  <button
                    onClick={() => setSelectedContractForPreview(contract)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#18191E] hover:bg-[#23262E] text-xs font-medium text-gray-200 transition-colors border border-[#2B2F3B]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Ver Itens</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectForMatching(contract)}
                  disabled={!hasSpreadsheet}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    hasSpreadsheet
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md shadow-[#FF6B00]/20 hover:opacity-90'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
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
                  <FileSpreadsheet className="w-5 h-5 text-[#107C41]" />
                  <span>Planilha Base Oficial do Contrato</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedContractForPreview.title} — {selectedContractForPreview.company} ({selectedContractForPreview.fileName || 'Base Oficial'})
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
              <div className="text-xs font-mono text-gray-300 bg-[#0E0F12] p-3 rounded-xl border border-[#23262E] flex items-center justify-between">
                <span>Composições Disponíveis: {selectedContractForPreview.items.length}</span>
                <span>BDI Oficial: {selectedContractForPreview.bdiPercentage.toFixed(2)}%</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Composições e Preços Bloqueados contra Alteração
                </span>
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
            <div className="p-4 border-t border-[#23262E] bg-[#18191E] flex items-center justify-between">
              <button
                onClick={() => triggerFileInput(selectedContractForPreview.id)}
                className="px-3.5 py-2 rounded-xl bg-[#23262E] hover:bg-[#2B2F3B] text-xs font-medium text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-2"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Substituir Planilha deste Contrato</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedContractForPreview(null)}
                  className="px-4 py-2 rounded-xl bg-[#23262E] text-xs font-medium text-white hover:bg-[#2B2F3B] transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    onSelectForMatching(selectedContractForPreview);
                    setSelectedContractForPreview(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black text-xs font-semibold shadow-md"
                >
                  Usar na Compatibilização
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
