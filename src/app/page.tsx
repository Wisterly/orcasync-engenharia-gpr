'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TabNovaCompatibilizacao } from '@/components/TabNovaCompatibilizacao';
import { TabBancoContratos } from '@/components/TabBancoContratos';
import { TabMesaDePara } from '@/components/TabMesaDePara';
import { TabDicionarioRegras } from '@/components/TabDicionarioRegras';
import { UploadModal } from '@/components/UploadModal';
import {
  ContractSheet,
  MatchingResult,
  ConversionProject,
  SynonymGroup,
  DeParaRule,
  BudgetItem,
} from '@/types/budget';
import { createDemoBudgets } from '@/lib/demoData';
import { performAutomatedMatching } from '@/lib/matchingEngine';
import {
  getStoredContracts,
  saveContractToStorage,
  deleteContractFromStorage,
  getStoredDeParaRules,
  saveDeParaRule,
  deleteDeParaRule,
  getStoredSynonymGroups,
  saveSynonymGroups,
  getStoredHistory,
  saveProjectToHistory,
} from '@/lib/storage';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'nova' | 'banco' | 'mesa' | 'dicionario'>('nova');
  const [sourceContract, setSourceContract] = useState<ContractSheet | null>(null);
  const [targetContract, setTargetContract] = useState<ContractSheet | null>(null);
  const [availableContracts, setAvailableContracts] = useState<ContractSheet[]>([]);
  const [matches, setMatches] = useState<MatchingResult[]>([]);

  // Execution Calibration Options
  const [requireSameUnit, setRequireSameUnit] = useState<boolean>(true);
  const [useTechnicalEquivalence, setUseTechnicalEquivalence] = useState<boolean>(true);
  const [preserveLiveFormulas, setPreserveLiveFormulas] = useState<boolean>(true);

  // Persistence States
  const [synonymGroups, setSynonymGroups] = useState<SynonymGroup[]>([]);
  const [deParaRules, setDeParaRules] = useState<DeParaRule[]>([]);
  const [history, setHistory] = useState<ConversionProject[]>([]);

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedContracts = getStoredContracts();
    const loadedRules = getStoredDeParaRules();
    const loadedSynonyms = getStoredSynonymGroups();
    const loadedHistory = getStoredHistory();

    const demo = createDemoBudgets();

    // If no contracts are saved yet, initialize with demo base contract
    if (loadedContracts.length === 0) {
      saveContractToStorage(demo.targetContract);
      setAvailableContracts([demo.targetContract]);
    } else {
      setAvailableContracts(loadedContracts);
    }

    if (loadedRules.length === 0) {
      demo.defaultDeParaRules.forEach(r => saveDeParaRule(r));
      setDeParaRules(demo.defaultDeParaRules);
    } else {
      setDeParaRules(loadedRules);
    }

    setSynonymGroups(loadedSynonyms);
    setHistory(loadedHistory);
  }, []);

  // Quick Demo Loader
  const handleLoadDemo = () => {
    setIsLoadingDemo(true);
    const demo = createDemoBudgets();
    
    // Set contracts
    setSourceContract(demo.sourceContract);
    setTargetContract(demo.targetContract);

    // Run automated matching immediately
    const initialMatches = performAutomatedMatching(
      demo.sourceContract.items,
      demo.targetContract.items,
      {
        requireSameUnit: true,
        useTechnicalEquivalence: true,
        synonymGroups,
        deParaRules,
      }
    );

    setMatches(initialMatches);

    // Save project into history
    const project: ConversionProject = {
      id: `proj-${Date.now()}`,
      title: 'Compatibilização Alpha ➔ Master GPR (Demonstração)',
      sourceContract: demo.sourceContract,
      targetContract: demo.targetContract,
      matches: initialMatches,
      requireSameUnit: true,
      useTechnicalEquivalence: true,
      preserveLiveFormulas: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProjectToHistory(project);
    setHistory(getStoredHistory());

    setIsLoadingDemo(false);
    // Switch to Mesa De-Para directly so the user can test the matches and Excel download immediately!
    setActiveTab('mesa');
  };

  // Automated Matching Execution
  const handleExecuteMatching = () => {
    if (!sourceContract || !targetContract) return;

    setIsProcessing(true);

    setTimeout(() => {
      const generatedMatches = performAutomatedMatching(
        sourceContract.items,
        targetContract.items,
        {
          requireSameUnit,
          useTechnicalEquivalence,
          synonymGroups,
          deParaRules,
        }
      );

      setMatches(generatedMatches);

      // Save to history
      const project: ConversionProject = {
        id: `proj-${Date.now()}`,
        title: `Migração ${sourceContract.title} ➔ ${targetContract.company}`,
        sourceContract,
        targetContract,
        matches: generatedMatches,
        requireSameUnit,
        useTechnicalEquivalence,
        preserveLiveFormulas,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveProjectToHistory(project);
      setHistory(getStoredHistory());

      setIsProcessing(false);
      setActiveTab('mesa');
    }, 450);
  };

  // Load from History
  const handleLoadHistoryProject = (project: ConversionProject) => {
    setSourceContract(project.sourceContract);
    setTargetContract(project.targetContract);
    setMatches(project.matches);
    setRequireSameUnit(project.requireSameUnit);
    setUseTechnicalEquivalence(project.useTechnicalEquivalence);
    setPreserveLiveFormulas(project.preserveLiveFormulas);
    setActiveTab('mesa');
  };

  // Save new Base Contract
  const handleSaveContract = (contract: ContractSheet) => {
    saveContractToStorage(contract);
    setAvailableContracts(getStoredContracts());
    if (!targetContract) {
      setTargetContract(contract);
    }
  };

  // Delete Contract
  const handleDeleteContract = (contractId: string) => {
    if (confirm('Tem certeza que deseja excluir esta planilha mestre do banco de contratos?')) {
      deleteContractFromStorage(contractId);
      setAvailableContracts(getStoredContracts());
      if (targetContract?.id === contractId) {
        setTargetContract(null);
      }
    }
  };

  // Add / Save De-Para Memory
  const handleSaveDeParaMemory = (sourceTerm: string, targetItem: BudgetItem) => {
    if (!sourceTerm || !targetItem) return;
    const rule: DeParaRule = {
      id: `rule-${Date.now()}`,
      sourceTerm,
      targetCode: targetItem.code || '',
      targetDescription: targetItem.description,
      targetUnit: targetItem.unit,
      createdAt: new Date().toISOString(),
    };
    saveDeParaRule(rule);
    setDeParaRules(getStoredDeParaRules());
  };

  const handleDeleteDeParaRule = (ruleId: string) => {
    deleteDeParaRule(ruleId);
    setDeParaRules(getStoredDeParaRules());
  };

  const handleAddSynonymTerm = (groupId: string, term: string) => {
    const updated = synonymGroups.map(g => {
      if (g.id === groupId && !g.terms.includes(term.toLowerCase())) {
        return { ...g, terms: [...g.terms, term.toLowerCase()] };
      }
      return g;
    });
    setSynonymGroups(updated);
    saveSynonymGroups(updated);
  };

  const handleAddSynonymGroup = (category: string, initialTerms: string[]) => {
    const newGroup: SynonymGroup = {
      id: `syn-${Date.now()}`,
      category,
      terms: initialTerms.map(t => t.toLowerCase()),
    };
    const updated = [...synonymGroups, newGroup];
    setSynonymGroups(updated);
    saveSynonymGroups(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C]">
      {/* Global Luxury Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contractsCount={availableContracts.length}
        onOpenNewContractModal={() => setIsNewContractModalOpen(true)}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        hasActiveMatches={matches.length > 0}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'nova' && (
          <TabNovaCompatibilizacao
            sourceContract={sourceContract}
            setSourceContract={setSourceContract}
            targetContract={targetContract}
            setTargetContract={setTargetContract}
            availableContracts={availableContracts}
            requireSameUnit={requireSameUnit}
            setRequireSameUnit={setRequireSameUnit}
            useTechnicalEquivalence={useTechnicalEquivalence}
            setUseTechnicalEquivalence={setUseTechnicalEquivalence}
            preserveLiveFormulas={preserveLiveFormulas}
            setPreserveLiveFormulas={setPreserveLiveFormulas}
            onExecuteMatching={handleExecuteMatching}
            isProcessing={isProcessing}
            history={history}
            onLoadHistoryProject={handleLoadHistoryProject}
            onOpenNewContractModal={() => setIsNewContractModalOpen(true)}
          />
        )}

        {activeTab === 'banco' && (
          <TabBancoContratos
            contracts={availableContracts}
            onOpenNewContractModal={() => setIsNewContractModalOpen(true)}
            onDeleteContract={handleDeleteContract}
            onSelectForMatching={(contract) => {
              setTargetContract(contract);
              setActiveTab('nova');
            }}
          />
        )}

        {activeTab === 'mesa' && (
          sourceContract && targetContract && matches.length > 0 ? (
            <TabMesaDePara
              sourceContract={sourceContract}
              targetContract={targetContract}
              matches={matches}
              setMatches={setMatches}
              preserveLiveFormulas={preserveLiveFormulas}
              onSaveDeParaMemory={handleSaveDeParaMemory}
            />
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-[#D4AF37]">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white">
                Mesa de Compatibilização Aguardando Orçamentos
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Para visualizar e gerenciar o De-Para, anexe um orçamento anterior na Aba 1 ou clique no botão de Demonstração no topo.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleLoadDemo}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black font-semibold text-xs shadow-md shadow-[#FF6B00]/20"
                >
                  Carregar Dados de Demonstração com Fórmulas Vivas
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'dicionario' && (
          <TabDicionarioRegras
            synonymGroups={synonymGroups}
            onAddSynonymTerm={handleAddSynonymTerm}
            onAddSynonymGroup={handleAddSynonymGroup}
            deParaRules={deParaRules}
            onDeleteDeParaRule={handleDeleteDeParaRule}
            onAddDeParaRule={(rule) => {
              saveDeParaRule(rule);
              setDeParaRules(getStoredDeParaRules());
            }}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-[#1C1F28] py-4 px-6 bg-[#0E0F12] text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-400 font-sans">OrçaSync</span>
          <span className="text-gray-600">|</span>
          <span className="text-[#FF6B00] font-sans">Engenharia GPR</span>
          <span className="text-gray-600 font-mono text-[10px] ml-2">SISTEMA INTELIGENTE DE COMPATIBILIZAÇÃO E MIGRAÇÃO</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-emerald-400">● Motor de Fórmulas Vivas Ativo</span>
          <span>ExcelJS Engine v4.4</span>
        </div>
      </footer>

      {/* Modal: New Base Contract */}
      <UploadModal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        onSaveContract={handleSaveContract}
      />
    </div>
  );
}
