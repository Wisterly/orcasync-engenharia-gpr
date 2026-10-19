'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  BookmarkCheck,
  Search,
  Sparkles,
  Tag,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { SynonymGroup, DeParaRule } from '@/types/budget';

interface TabDicionarioRegrasProps {
  synonymGroups: SynonymGroup[];
  onAddSynonymTerm: (groupId: string, term: string) => void;
  onAddSynonymGroup: (category: string, initialTerms: string[]) => void;
  deParaRules: DeParaRule[];
  onDeleteDeParaRule: (ruleId: string) => void;
  onAddDeParaRule: (rule: DeParaRule) => void;
}

export const TabDicionarioRegras: React.FC<TabDicionarioRegrasProps> = ({
  synonymGroups,
  onAddSynonymTerm,
  onAddSynonymGroup,
  deParaRules,
  onDeleteDeParaRule,
  onAddDeParaRule,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'synonyms' | 'depara'>('synonyms');
  const [synonymSearch, setSynonymSearch] = useState('');
  const [newTermInputs, setNewTermInputs] = useState<Record<string, string>>({});

  // New Group Form State
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupCategory, setNewGroupCategory] = useState('');
  const [newGroupTerms, setNewGroupTerms] = useState('');

  // New Manual De-Para Rule Form State
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [ruleSource, setRuleSource] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleUnit, setRuleUnit] = useState('m²');

  const filteredGroups = synonymGroups.filter(g =>
    g.category.toLowerCase().includes(synonymSearch.toLowerCase()) ||
    g.terms.some(t => t.toLowerCase().includes(synonymSearch.toLowerCase()))
  );

  const handleAddTerm = (groupId: string) => {
    const term = (newTermInputs[groupId] || '').trim();
    if (!term) return;
    onAddSynonymTerm(groupId, term);
    setNewTermInputs(prev => ({ ...prev, [groupId]: '' }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupCategory.trim()) return;
    const terms = newGroupTerms.split(',').map(t => t.trim()).filter(Boolean);
    onAddSynonymGroup(newGroupCategory.trim(), terms.length > 0 ? terms : [newGroupCategory.trim()]);
    setNewGroupCategory('');
    setNewGroupTerms('');
    setShowNewGroupModal(false);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleSource.trim() || !ruleDesc.trim()) return;
    onAddDeParaRule({
      id: `rule-${Date.now()}`,
      sourceTerm: ruleSource.trim(),
      targetCode: ruleCode.trim(),
      targetDescription: ruleDesc.trim(),
      targetUnit: ruleUnit.trim(),
      createdAt: new Date().toISOString(),
    });
    setRuleSource('');
    setRuleCode('');
    setRuleDesc('');
    setShowNewRuleModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121316] border border-[#23262E]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-white">Dicionário de Engenharia Civil & Memória De-Para</h2>
          </div>
          <p className="text-xs text-gray-400">
            Configure sinônimos técnicos e gerencie correspondências aprovadas que o OrçaSync memoriza para os próximos orçamentos.
          </p>
        </div>

        {/* Subtabs Switch */}
        <div className="flex items-center p-1 bg-[#18191E] border border-[#2B2F3B] rounded-xl">
          <button
            onClick={() => setActiveSubTab('synonyms')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'synonyms'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sinônimos Técnicos ({synonymGroups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('depara')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'depara'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Memória Aprendida ({deParaRules.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Sinônimos Técnicos da Construção Civil */}
      {activeSubTab === 'synonyms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar sinônimo ou categoria..."
                value={synonymSearch}
                onChange={(e) => setSynonymSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs bg-[#121316] border border-[#2B2F3B] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] w-full"
              />
            </div>

            <button
              onClick={() => setShowNewGroupModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#18191E] hover:bg-[#23262E] text-amber-300 border border-amber-500/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Grupo de Sinônimos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl bg-[#121316] border border-[#23262E] p-5 space-y-4 hover:border-amber-500/30 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#23262E]">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#D4AF37]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        {group.category}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">
                      {group.terms.length} termos
                    </span>
                  </div>

                  {/* Terms Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.terms.map((term, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#18191E] text-gray-200 border border-[#2B2F3B]"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Term Input */}
                <div className="pt-3 border-t border-[#23262E] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar sinônimo..."
                    value={newTermInputs[group.id] || ''}
                    onChange={(e) => setNewTermInputs({ ...newTermInputs, [group.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTerm(group.id)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleAddTerm(group.id)}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-[#D4AF37] hover:bg-amber-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Memória De-Para Aprendida */}
      {activeSubTab === 'depara' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Lightbulb className="w-4 h-4" />
              <span>
                Correspondências memorizadas têm 100% de prioridade nos próximos orçamentos convertidos.
              </span>
            </div>

            <button
              onClick={() => setShowNewRuleModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar Regra De-Para Manual</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#121316] border border-[#23262E] overflow-hidden shadow-xl">
            {deParaRules.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                Nenhuma correspondência salva na memória ainda. Quando você confirma um item na Mesa De-Para, ele é registrado aqui automaticamente.
              </div>
            ) : (
              <div className="divide-y divide-[#1F2128]">
                {deParaRules.map((rule) => (
                  <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#18191E]/50 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          DE: {rule.sourceTerm}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          PARA: {rule.targetCode || 'SINAPI'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {rule.targetDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(rule.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        onClick={() => onDeleteDeParaRule(rule.id)}
                        title="Remover regra"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Synonym Group */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-md rounded-2xl bg-[#121316] border border-[#2B2F3B] p-6 space-y-4 shadow-2xl animate-scaleUp"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#D4AF37]" />
              <span>Novo Grupo de Sinônimos Técnicos</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Nome da Categoria de Engenharia:
              </label>
              <input
                type="text"
                placeholder="Ex: Instalações Hidrossanitárias"
                value={newGroupCategory}
                onChange={(e) => setNewGroupCategory(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Termos Equivalentes (separados por vírgula):
              </label>
              <textarea
                placeholder="Ex: tubulação, tubo pvc, esgoto, água fria, encanamento"
                rows={3}
                value={newGroupTerms}
                onChange={(e) => setNewGroupTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewGroupModal(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black rounded-xl"
              >
                Salvar Grupo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New De-Para Manual Rule */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRule}
            className="w-full max-w-lg rounded-2xl bg-[#121316] border border-[#2B2F3B] p-6 space-y-4 shadow-2xl animate-scaleUp"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-emerald-400" />
              <span>Nova Regra de Memória De-Para</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Termo no Orçamento de Origem (Planilha A):
              </label>
              <input
                type="text"
                placeholder="Ex: Reboco paulista em parede"
                value={ruleSource}
                onChange={(e) => setRuleSource(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Código Alvo (ex: SINAPI):
                </label>
                <input
                  type="text"
                  placeholder="87529"
                  value={ruleCode}
                  onChange={(e) => setRuleCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Unidade:
                </label>
                <input
                  type="text"
                  placeholder="m²"
                  value={ruleUnit}
                  onChange={(e) => setRuleUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Descrição Exata no Contrato de Destino (Planilha B):
              </label>
              <textarea
                placeholder="Ex: Emboço ou massa única para paredes internas, com argamassa traço 1:2:8..."
                rows={2}
                value={ruleDesc}
                onChange={(e) => setRuleDesc(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#18191E] border border-[#2B2F3B] rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRuleModal(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF6B00] to-[#D4AF37] text-black rounded-xl"
              >
                Salvar Regra
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
