'use client';

import React from 'react';
import { Layers, Sparkles, Database, ArrowRightLeft, BookOpen, PlusCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'nova' | 'banco' | 'mesa' | 'dicionario';
  setActiveTab: (tab: 'nova' | 'banco' | 'mesa' | 'dicionario') => void;
  contractsCount: number;
  onOpenNewContractModal: () => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  hasActiveMatches: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  contractsCount,
  onOpenNewContractModal,
  onLoadDemo,
  isLoadingDemo,
  hasActiveMatches,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#23262E]">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Official Branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Geometric Gold/Orange Icon */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#D4AF37] p-[1.5px] shadow-lg shadow-[#FF6B00]/15">
              <div className="w-full h-full bg-[#121316] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>

            {/* Official Title */}
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#F39C12] bg-clip-text text-transparent drop-shadow-sm font-sans">
                OrçaSync
              </span>
              <span className="text-gray-500 font-light text-xl select-none">|</span>
              <span className="text-xl font-bold tracking-tight text-[#FF6B00] font-sans drop-shadow-sm">
                Engenharia GPR
              </span>
            </div>
            
            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/20 ml-2">
              PRO v2.6
            </span>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center p-1 bg-[#121316] border border-[#23262E] rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('nova')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 shrink-0 ${
                activeTab === 'nova'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold shadow-md shadow-[#FF6B00]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1C23]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Início & Nova Compatibilização</span>
            </button>

            <button
              onClick={() => setActiveTab('banco')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 shrink-0 ${
                activeTab === 'banco'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold shadow-md shadow-[#FF6B00]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1C23]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Banco de Contratos Base</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40 text-amber-200">
                {contractsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mesa')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 shrink-0 ${
                activeTab === 'mesa'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold shadow-md shadow-[#FF6B00]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1C23]'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Mesa de Compatibilização (De-Para)</span>
              {hasActiveMatches && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('dicionario')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 shrink-0 ${
                activeTab === 'dicionario'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold shadow-md shadow-[#FF6B00]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1C23]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Dicionário & Regras</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Demo Button */}
            <button
              onClick={onLoadDemo}
              disabled={isLoadingDemo}
              title="Carrega instantaneamente orçamento antigo e novo contrato com fórmulas vivas"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#18191E] hover:bg-[#23262E] text-amber-400 border border-amber-500/30 hover:border-amber-400 transition-all shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">Carregar Dados de Demonstração</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* + Novo Contrato Base Button */}
            <button
              onClick={onOpenNewContractModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold hover:opacity-90 transition-opacity shadow-md shadow-[#FF6B00]/20"
            >
              <PlusCircle className="w-3.5 h-3.5 text-black" />
              <span className="hidden md:inline">+ Novo Contrato Base</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
