'use client';

import React from 'react';
import { FileSpreadsheet, Eye, Sparkles, CheckCircle2, UploadCloud } from 'lucide-react';
import { ContractSheet } from '@/types/budget';

interface ExcelThumbnailCoverProps {
  contract: ContractSheet;
  onAttachClick?: () => void;
  onPreviewClick?: () => void;
  isDragOver?: boolean;
}

export const ExcelThumbnailCover: React.FC<ExcelThumbnailCoverProps> = ({
  contract,
  onAttachClick,
  onPreviewClick,
  isDragOver = false,
}) => {
  const hasSpreadsheet = contract.items && contract.items.length > 0;

  // Extract the first 5 visible items for realistic miniature table preview
  const previewItems = hasSpreadsheet ? contract.items.slice(0, 6) : [];

  if (!hasSpreadsheet) {
    return (
      <div
        onClick={onAttachClick}
        className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center overflow-hidden group ${
          isDragOver
            ? 'border-[#FF6B00] bg-[#FF6B00]/10 scale-[1.01]'
            : 'border-[#2B2F3B] hover:border-[#D4AF37] bg-[#16171D]/80 hover:bg-[#18191E]'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-amber-400 transition-all shadow-md">
          <UploadCloud className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
          Anexar Planilha Base (.xlsx)
        </h4>
        <p className="text-[11px] text-gray-400 mt-1 max-w-[220px]">
          Arraste a planilha aqui ou clique para buscar no computador/celular
        </p>
        <span className="mt-2.5 px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#107C41]/20 text-emerald-400 border border-[#107C41]/30">
          Aguardando Arquivo Excel
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onPreviewClick}
      className={`relative w-full h-48 rounded-xl border transition-all cursor-pointer overflow-hidden group select-none shadow-xl flex flex-col justify-between ${
        isDragOver
          ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/50'
          : 'border-[#2B2F3B] hover:border-amber-500/50 bg-[#0E0F13]'
      }`}
      title="Clique para visualizar em tela cheia"
    >
      {/* Excel Sheet Miniature Window Header */}
      <div className="bg-[#12141A] px-3 py-1.5 border-b border-[#23262E] flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          {/* Microsoft Excel Badge */}
          <div className="flex items-center justify-center w-5 h-5 rounded bg-[#107C41] text-white font-extrabold text-[10px] shadow-sm">
            X
          </div>
          <span className="text-[11px] font-bold text-gray-200 truncate max-w-[170px]">
            {contract.fileName || `${contract.company}.xlsx`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>BASE ATIVA</span>
          </span>
          <div className="hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-[#D4AF37] text-[10px] font-mono font-bold">
            <Eye className="w-3 h-3" />
            <span>Ver</span>
          </div>
        </div>
      </div>

      {/* Realistic Miniature Excel Grid */}
      <div className="relative flex-1 p-2 bg-[#0C0D11] overflow-hidden text-[9px] font-mono leading-tight">
        {/* Subtle grid background */}
        <div className="w-full border border-[#1F222A] rounded bg-[#121318] overflow-hidden shadow-inner">
          
          {/* Excel Column Letters Header: A, B, C, D */}
          <div className="grid grid-cols-12 bg-[#181A22] border-b border-[#242833] text-[#7E8597] font-semibold py-0.5 text-center text-[8px]">
            <div className="col-span-1 border-r border-[#242833]">#</div>
            <div className="col-span-2 border-r border-[#242833]">A (ITEM)</div>
            <div className="col-span-6 border-r border-[#242833]">B (COMPOSIÇÃO)</div>
            <div className="col-span-1 border-r border-[#242833]">C (UN)</div>
            <div className="col-span-2">D (VALOR)</div>
          </div>

          {/* Rows */}
          {previewItems.map((item, idx) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 py-1 px-1 border-b border-[#1E212A] items-center ${
                item.isStageHeader
                  ? 'bg-[#1D202A] text-amber-300 font-bold'
                  : idx % 2 === 0
                  ? 'bg-[#12141A] text-gray-300'
                  : 'bg-[#0F1015] text-gray-400'
              }`}
            >
              <div className="col-span-1 text-gray-600 text-center text-[8px] font-mono">
                {idx + 1}
              </div>
              <div className="col-span-2 font-bold truncate text-[8px] px-1 text-amber-400/90">
                {item.itemCode}
              </div>
              <div className="col-span-6 truncate px-1 text-[8px] font-sans">
                {item.description}
              </div>
              <div className="col-span-1 text-center text-[8px]">
                {item.unit || '-'}
              </div>
              <div className="col-span-2 text-right text-emerald-400 text-[8px] pr-1">
                {item.isStageHeader
                  ? 'SOMA()'
                  : item.unitPriceWithBDI
                  ? `R$ ${item.unitPriceWithBDI.toFixed(0)}`
                  : '0,00'}
              </div>
            </div>
          ))}
        </div>

        {/* Glossy gradient reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.03] pointer-events-none" />
      </div>

      {/* Miniature Sheet Footer Bar */}
      <div className="bg-[#12141A] px-3 py-1.5 border-t border-[#23262E] flex items-center justify-between text-[10px] font-mono text-gray-400 z-10">
        <div className="flex items-center gap-1">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#107C41]" />
          <span className="text-gray-300">{contract.items.length} itens</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">{contract.stages.length} etapas</span>
        </div>
        <span className="text-[9px] text-gray-500 font-sans">
          BDI: {contract.bdiPercentage.toFixed(1)}%
        </span>
      </div>

      {/* Hover Overlay Hint */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px] z-20">
        <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
          <Eye className="w-3.5 h-3.5" />
          <span>Abrir Planilha</span>
        </span>
      </div>
    </div>
  );
};
