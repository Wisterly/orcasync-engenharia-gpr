'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Building2, FileSpreadsheet, X } from 'lucide-react';
import { ContractSheet } from '@/types/budget';
import { parseExcelBudget } from '@/lib/excelEngine';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContract: (contract: ContractSheet) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSaveContract,
}) => {
  const [company, setCompany] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [bdiPercentage, setBdiPercentage] = useState('25.50');
  const [title, setTitle] = useState('');
  const [uploadedContract, setUploadedContract] = useState<ContractSheet | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelBudget(buffer, file.name, true);
      setUploadedContract(parsed);
      if (!title) setTitle(parsed.title);
      if (!company) setCompany(parsed.company);
      if (!contractNumber) setContractNumber(parsed.contractNumber);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na leitura do arquivo';
      alert(`Erro ao ler a planilha: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedContract) {
      alert('Por favor, anexe a planilha orçamentária base em Excel (.xlsx).');
      return;
    }

    const bdi = parseFloat(bdiPercentage.replace(',', '.')) || 25.5;

    const finalContract: ContractSheet = {
      ...uploadedContract,
      title: title.trim() || uploadedContract.title,
      company: company.trim() || uploadedContract.company,
      contractNumber: contractNumber.trim() || uploadedContract.contractNumber,
      bdiPercentage: bdi,
    };

    onSaveContract(finalContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#121316] border border-[#2B2F3B] shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 border-b border-[#23262E] flex items-center justify-between bg-[#18191E]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base font-bold text-white">
              Cadastrar Novo Contrato Base (Planilha Mestra)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#23262E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Planilha Base Oficial (.xlsx):
            </label>

            {uploadedContract ? (
              <div className="p-3.5 rounded-xl bg-[#18191E] border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-semibold text-white">{uploadedContract.fileName}</h5>
                    <span className="text-[10px] font-mono text-gray-400">
                      {uploadedContract.items.length} itens identificados
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUploadedContract(null)}
                  className="text-xs text-gray-400 hover:text-red-400"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed border-[#2B2F3B] hover:border-[#D4AF37] bg-[#18191E]/40 hover:bg-[#18191E] cursor-pointer text-center space-y-2 transition-all"
              >
                <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto" />
                <p className="text-xs font-medium text-gray-300">
                  {isProcessing ? 'Lendo e analisando colunas...' : 'Clique para selecionar a planilha (.xlsx)'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Reconhece automaticamente hierarquia, colunas e fórmulas
                </p>
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

          {/* Details */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Nome / Título do Contrato:
            </label>
            <input
              type="text"
              placeholder="Ex: Contrato Executivo 2026 - Construtora Alfa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Empresa Contratada:
              </label>
              <input
                type="text"
                placeholder="Ex: Construtora Alfa S/A"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Número do Contrato:
              </label>
              <input
                type="text"
                placeholder="Ex: CT-2026/015"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Percentual de B.D.I. Oficial (%):
            </label>
            <input
              type="text"
              placeholder="25.50"
              value={bdiPercentage}
              onChange={(e) => setBdiPercentage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!uploadedContract}
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black rounded-xl hover:opacity-95 shadow-md disabled:opacity-50"
            >
              Salvar Contrato Base
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
