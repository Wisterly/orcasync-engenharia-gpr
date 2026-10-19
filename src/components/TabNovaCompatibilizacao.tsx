'use client';

import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Sliders,
  History,
  Building2,
  FileCheck,
  Percent,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { ContractSheet, ConversionProject } from '@/types/budget';
import { parseExcelBudget } from '@/lib/excelEngine';

interface TabNovaCompatibilizacaoProps {
  sourceContract: ContractSheet | null;
  setSourceContract: (contract: ContractSheet | null) => void;
  targetContract: ContractSheet | null;
  setTargetContract: (contract: ContractSheet | null) => void;
  availableContracts: ContractSheet[];
  requireSameUnit: boolean;
  setRequireSameUnit: (val: boolean) => void;
  useTechnicalEquivalence: boolean;
  setUseTechnicalEquivalence: (val: boolean) => void;
  preserveLiveFormulas: boolean;
  setPreserveLiveFormulas: (val: boolean) => void;
  onExecuteMatching: () => void;
  isProcessing: boolean;
  history: ConversionProject[];
  onLoadHistoryProject: (project: ConversionProject) => void;
  onOpenNewContractModal: () => void;
}

export const TabNovaCompatibilizacao: React.FC<TabNovaCompatibilizacaoProps> = ({
  sourceContract,
  setSourceContract,
  targetContract,
  setTargetContract,
  availableContracts,
  requireSameUnit,
  setRequireSameUnit,
  useTechnicalEquivalence,
  setUseTechnicalEquivalence,
  preserveLiveFormulas,
  setPreserveLiveFormulas,
  onExecuteMatching,
  isProcessing,
  history,
  onLoadHistoryProject,
  onOpenNewContractModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const contract = await parseExcelBudget(buffer, file.name, false);
      setSourceContract(contract);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao processar arquivo';
      alert(`Erro ao ler a planilha: ${message}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121316] via-[#18191E] to-[#121316] border border-[#23262E] p-6 lg:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-gradient-to-br from-[#FF6B00]/10 to-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor Inteligente de Engenharia Civil & Compatibilização Automática</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Migração de Orçamentos com <span className="gold-gradient-text">Fórmulas Vivas em Excel</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            Transfira os quantitativos executados do contrato anterior para as composições oficiais da nova empresa
            sem alterar descrições, códigos ou preços unitários do contrato base. A exportação gera planilhas com fórmulas reais do Microsoft Excel.
          </p>
        </div>
      </div>

      {/* 3 Large Flow Cards (Passo 1, Passo 2, Passo 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CARD 1: Origem (Orçamento Já Feito) */}
        <div className="flex flex-col rounded-2xl bg-[#121316] border border-[#23262E] hover:border-amber-500/30 transition-all p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#23262E]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-[#D4AF37] text-xs font-mono font-bold border border-amber-500/30">
                01
              </span>
              <h2 className="text-base font-semibold text-white">Orçamento de Origem</h2>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-gray-500" />
          </div>

          <div className="mt-5 flex-1 flex flex-col justify-between space-y-4">
            {sourceContract ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#18191E] border border-emerald-500/30 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-white truncate max-w-[220px]">
                          {sourceContract.title}
                        </h4>
                        <p className="text-xs text-gray-400">{sourceContract.fileName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSourceContract(null)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Trocar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B2F3B] text-xs font-mono">
                    <div className="bg-[#121316] p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">ITENS COM QTD &gt; 0</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {sourceContract.itemsWithQuantityCount} itens
                      </span>
                    </div>
                    <div className="bg-[#121316] p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">VALOR ORIGINAL</span>
                      <span className="text-amber-300 font-bold text-sm">
                        {formatCurrency(sourceContract.totalValueWithBDI)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Planilha lida com sucesso. Todos os itens com quantidade maior que zero estão prontos para o cruzamento.
                </p>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-[#D4AF37]/30 hover:border-[#FF6B00] bg-[#18191E]/50 hover:bg-[#18191E] cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <p className="text-sm font-medium text-white text-center">
                  Anexar Planilha Anterior (.xlsx)
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Arraste o arquivo ou clique para selecionar
                </p>
                <span className="mt-4 px-3 py-1 rounded text-[11px] font-mono bg-[#121316] text-amber-300 border border-[#23262E]">
                  Padrão SINAPI, SEINFRA ou Próprio
                </span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
          </div>
        </div>

        {/* CARD 2: Destino (Seleção do Novo Contrato) */}
        <div className="flex flex-col rounded-2xl bg-[#121316] border border-[#23262E] hover:border-amber-500/30 transition-all p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#23262E]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-[#D4AF37] text-xs font-mono font-bold border border-amber-500/30">
                02
              </span>
              <h2 className="text-base font-semibold text-white">Contrato de Destino</h2>
            </div>
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>

          <div className="mt-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-300">
                Selecione a Planilha Mestra / Novo Contrato:
              </label>

              <select
                value={targetContract?.id || ''}
                onChange={(e) => {
                  const selected = availableContracts.find(c => c.id === e.target.value);
                  setTargetContract(selected || null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191E] border border-[#2B2F3B] text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="">-- Escolha um Contrato Base --</option>
                {availableContracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.company})
                  </option>
                ))}
              </select>

              {targetContract ? (
                <div className="p-4 rounded-xl bg-[#18191E] border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300">
                        {targetContract.company}
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">{targetContract.contractNumber}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      BDI: {targetContract.bdiPercentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B2F3B] text-xs font-mono">
                    <div className="bg-[#121316] p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">TOTAL COMPOSIÇÕES</span>
                      <span className="text-white font-bold text-sm">
                        {targetContract.items.filter(i => !i.isStageHeader).length} itens
                      </span>
                    </div>
                    <div className="bg-[#121316] p-2 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">ETAPAS DETECTADAS</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {targetContract.stages.length} grupos
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#18191E]/40 border border-[#23262E] text-center space-y-2">
                  <p className="text-xs text-gray-400">
                    Nenhum contrato de destino selecionado ainda.
                  </p>
                  <button
                    onClick={onOpenNewContractModal}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 underline"
                  >
                    + Cadastrar nova planilha base de contrato
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-500 leading-normal">
              <strong className="text-amber-400 font-semibold">Regra de Ouro:</strong> As composições, descrições e preços unitários da planilha destino são protegidos contra qualquer alteração.
            </p>
          </div>
        </div>

        {/* CARD 3: Motor de Execução */}
        <div className="flex flex-col rounded-2xl bg-[#121316] border border-[#23262E] hover:border-amber-500/30 transition-all p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#23262E]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-[#D4AF37] text-xs font-mono font-bold border border-amber-500/30">
                03
              </span>
              <h2 className="text-base font-semibold text-white">Motor de Execução</h2>
            </div>
            <Sliders className="w-5 h-5 text-gray-500" />
          </div>

          <div className="mt-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Parâmetros de Calibragem Semântica:
              </label>

              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-[#18191E] border border-[#23262E] hover:border-[#3E4352] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={requireSameUnit}
                  onChange={(e) => setRequireSameUnit(e.target.checked)}
                  className="mt-0.5 rounded border-gray-700 text-[#FF6B00] focus:ring-0 focus:ring-offset-0 bg-[#121316]"
                />
                <div className="text-xs">
                  <span className="font-medium text-gray-200 block">Exigir mesma unidade de medida</span>
                  <span className="text-gray-500 text-[11px]">Evita casamentos incorretos (ex: m² com un ou kg)</span>
                </div>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-[#18191E] border border-[#23262E] hover:border-[#3E4352] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useTechnicalEquivalence}
                  onChange={(e) => setUseTechnicalEquivalence(e.target.checked)}
                  className="mt-0.5 rounded border-gray-700 text-[#FF6B00] focus:ring-0 focus:ring-offset-0 bg-[#121316]"
                />
                <div className="text-xs">
                  <span className="font-medium text-gray-200 block">Equivalência técnica e sinônimos</span>
                  <span className="text-gray-500 text-[11px]">Associa termos de obras (ex: Reboco ≈ Emboço paulista)</span>
                </div>
              </label>

              {/* Checkbox 3 */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-[#18191E] border border-[#23262E] hover:border-[#3E4352] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={preserveLiveFormulas}
                  onChange={(e) => setPreserveLiveFormulas(e.target.checked)}
                  className="mt-0.5 rounded border-gray-700 text-[#FF6B00] focus:ring-0 focus:ring-offset-0 bg-[#121316]"
                />
                <div className="text-xs">
                  <span className="font-medium text-gray-200 block">Fórmulas Dinâmicas no Excel</span>
                  <span className="text-gray-500 text-[11px]">Gera fórmulas vivas (=SUM, multiplicações e BDI)</span>
                </div>
              </label>
            </div>

            {/* Execute Button */}
            <button
              onClick={onExecuteMatching}
              disabled={!sourceContract || !targetContract || isProcessing}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                !sourceContract || !targetContract || isProcessing
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black hover:opacity-95 shadow-[#FF6B00]/25 transform active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>PROCESSANDO EQUIVALÊNCIAS...</span>
                </>
              ) : (
                <>
                  <span>EXECUTAR COMPATIBILIZAÇÃO AUTOMÁTICA</span>
                  <Sparkles className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Histórico de Orçamentos Convertidos */}
      <div className="rounded-2xl bg-[#121316] border border-[#23262E] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#23262E]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base font-semibold text-white">Histórico de Orçamentos Convertidos</h3>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {history.length} conversões salvas
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Nenhuma conversão recente registrada. Execute a compatibilização para salvar no histórico.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#1F2128]">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#18191E]/50 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-amber-400">{item.sourceContract.title}</span>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                    <span className="text-emerald-400">{item.targetContract.company}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono hidden md:block">
                    <span className="text-gray-400 block">ITENS MIGRADOS</span>
                    <span className="text-emerald-400 font-semibold">{item.matches.length} itens</span>
                  </div>

                  <button
                    onClick={() => onLoadHistoryProject(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F2128] hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <span>Abrir na Mesa De-Para</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
