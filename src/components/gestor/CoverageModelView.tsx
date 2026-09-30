import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useStock } from '../../context/StockContext';
import { CoverageBucketId, ItemCoverageAnalysis } from '../../types';
import { ImportUsageModal } from './ImportUsageModal';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Edit2,
  CheckCircle2,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Table as TableIcon,
  FileText
} from 'lucide-react';

type SortField = 'diasCobertura' | 'nomeItem' | 'estoqueTotal' | 'mediaUso' | 'contagem';
type SortDirection = 'asc' | 'desc';

export const CoverageModelView: React.FC = () => {
  const {
    coverageAnalyses,
    coverageBucketsCount,
    atualizarMediaUso,
    exportarAtaPDF
  } = useStock();

  const [filterBucket, setFilterBucket] = useState<'all' | CoverageBucketId>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportUsageOpen, setIsImportUsageOpen] = useState(false);
  const [copiedAta, setCopiedAta] = useState(false);
  const [showAtaModal, setShowAtaModal] = useState(false);
  const [editingMediaKey, setEditingMediaKey] = useState<string | null>(null);
  const [tempMediaVal, setTempMediaVal] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('diasCobertura');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Bucket configurations
  const bucketsConfig: {
    id: CoverageBucketId;
    label: string;
    description: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    badgeBg: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: '0_a_3',
      label: '0 a 3 dias',
      description: 'Crítico / Ruptura Iminente',
      bgColor: 'bg-rose-950/20',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
    },
    {
      id: '3_1_a_5',
      label: '3,1 a 5 dias',
      description: 'Alerta Alto / Reposição Urgente',
      bgColor: 'bg-orange-950/20',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/40',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      icon: <Clock className="w-4 h-4 text-orange-400" />
    },
    {
      id: '5_1_a_14',
      label: '5,1 a 14 dias',
      description: 'Atenção / Lead Time Fornecedor',
      bgColor: 'bg-amber-950/15',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: <Layers className="w-4 h-4 text-amber-400" />
    },
    {
      id: '14_1_a_21',
      label: '14,1 a 21 dias',
      description: 'Estável / Programado',
      bgColor: 'bg-blue-950/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'acima_21_1',
      label: 'Acima de 21,1 dias',
      description: 'Confortável / Estoque Seguro',
      bgColor: 'bg-emerald-950/15',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    }
  ];

  // Filtered and sorted items
  const sortedAndFilteredList = useMemo(() => {
    const list = coverageAnalyses.filter(item => {
      if (filterBucket !== 'all' && item.bucket !== filterBucket) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.nomeItem.toLowerCase().includes(q) ||
          item.itemKey.toLowerCase().includes(q) ||
          (item.codigo && item.codigo.toLowerCase().includes(q)) ||
          (item.descricao && item.descricao.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'diasCobertura':
          comparison = a.diasCobertura - b.diasCobertura;
          break;
        case 'nomeItem':
          comparison = a.nomeItem.localeCompare(b.nomeItem);
          break;
        case 'estoqueTotal':
          comparison = a.estoqueTotalPecas - b.estoqueTotalPecas;
          break;
        case 'mediaUso':
          comparison = a.mediaUsoDiario - b.mediaUsoDiario;
          break;
        case 'contagem':
          comparison = a.contagemEstoque - b.contagemEstoque;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [coverageAnalyses, filterBucket, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Generate Ata text for Procurement
  const generateAtaText = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    let text = `========================================================\n`;
    text += `ATA DE COBERTURA DE ESTOQUE - PROCUREMENT / INSUMOS\n`;
    text += `Data da Análise: ${today} | Centro de Distribuição: VIX1\n`;
    text += `========================================================\n\n`;

    bucketsConfig.forEach(b => {
      const itemsInBucket = coverageAnalyses.filter(ca => ca.bucket === b.id);
      text += `📌 ${b.label.toUpperCase()} (${b.description.toUpperCase()}) - ${itemsInBucket.length} ITENS:\n`;
      if (itemsInBucket.length === 0) {
        text += `   (Nenhum item nesta faixa)\n\n`;
      } else {
        itemsInBucket.forEach(it => {
          const diasStr = it.diasCobertura === 999 ? 'Sem consumo registrado' : `${it.diasCobertura} dias`;
          text += `   • ${it.nomeItem}: Cobertura de ${diasStr} | Estoque: ${it.estoqueTotalPecas.toLocaleString('pt-BR')} un (${it.contagemEstoque} ${it.unidadeContagem}s) | Média diária: ${it.mediaUsoDiario} un/dia\n`;
        });
        text += `\n`;
      }
    });

    text += `========================================================\n`;
    text += `Resumo: Gerado automaticamente pelo Sistema de Almoxarifado\n`;
    return text;
  }, [coverageAnalyses]);

  const handleCopyAta = () => {
    navigator.clipboard.writeText(generateAtaText);
    setCopiedAta(true);
    setTimeout(() => setCopiedAta(false), 3000);
  };

  const handleStartEditMedia = (item: ItemCoverageAnalysis) => {
    setEditingMediaKey(item.itemKey);
    setTempMediaVal(String(item.mediaUsoDiario));
  };

  const handleSaveMedia = (item: ItemCoverageAnalysis) => {
    const num = parseInt(tempMediaVal, 10);
    if (!isNaN(num) && num >= 0) {
      atualizarMediaUso(item.itemKey, num);
    }
    setEditingMediaKey(null);
  };

  const exportarCoberturaExcel = () => {
    const data = coverageAnalyses.map((ca, idx) => ({
      '#': idx + 1,
      'Item': ca.nomeItem,
      'Código': ca.codigo || '-',
      'Descrição': ca.descricao || '-',
      'Tipo': ca.tipo || '-',
      'Fornecedor': ca.fornecedor || '-',
      'Unidade Contagem': ca.unidadeContagem,
      'Qtd Volumes (Palete/Fardo)': ca.contagemEstoque,
      'Estoque Total (Peças)': ca.estoqueTotalPecas,
      'Média de Uso Diário': ca.mediaUsoDiario,
      'Uso % (Mix)': ca.usoPercentual ? `${ca.usoPercentual}%` : '-',
      'Dias de Cobertura': ca.diasCobertura === 999 ? 'Sem consumo' : ca.diasCobertura,
      'Faixa Procurement / Insumos': ca.bucketLabel
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cobertura Insumos');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `relatorio_cobertura_insumos_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Análise de Cobertura de Estoque
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Previsão de Atendimento & Insumos
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo baseado no estoque atual dividido pelo consumo diário (Dias de Cobertura).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Button to open Import Usage Sheet */}
          <button
            onClick={() => setIsImportUsageOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Importar relação diária de uso e uso%"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Importar Planilha de Uso</span>
          </button>

          {/* Button to view / copy Ata */}
          <button
            onClick={() => setShowAtaModal(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Gerar Ata para Insumos</span>
          </button>

          {/* Button to export Ata PDF */}
          <button
            onClick={exportarAtaPDF}
            className="h-10 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Exportar Ata Semanal formatada em PDF para envio ao time de Insumos"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar Ata (PDF)</span>
          </button>

          {/* Export Coverage report */}
          <button
            onClick={exportarCoberturaExcel}
            className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 5 Procurement Buckets KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {bucketsConfig.map(b => {
          const count = coverageBucketsCount[b.id] || 0;
          const isSelected = filterBucket === b.id;

          return (
            <button
              key={b.id}
              onClick={() => setFilterBucket(isSelected ? 'all' : b.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                b.bgColor
              } ${b.borderColor} ${
                isSelected ? 'ring-2 ring-amber-400 shadow-lg scale-102' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white tracking-wide">{b.label}</span>
                {b.icon}
              </div>

              <div className="my-1">
                <div className={`font-mono text-2xl sm:text-3xl font-black ${b.textColor} tabular-nums`}>
                  {count}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight line-clamp-1 mt-0.5">
                  {b.description}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                <span>{isSelected ? 'Filtro Ativo' : 'Filtrar faixa'}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar with View Mode Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar item (ex: 12, PM1, V3, SIOC, Box 105)..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* View mode toggle (Table desktop vs Cards mobile) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>Tabela (Site)</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cards (Mobile)</span>
            </button>
          </div>

          {filterBucket !== 'all' && (
            <button
              onClick={() => setFilterBucket('all')}
              className="h-9 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Exibindo: <strong>{bucketsConfig.find(b => b.id === filterBucket)?.label}</strong></span>
              <span className="text-amber-400 font-bold ml-1">✕</span>
            </button>
          )}

          <span className="text-slate-400 text-right">
            Mostrando <strong>{sortedAndFilteredList.length}</strong> de <strong>{coverageAnalyses.length}</strong> itens
          </span>
        </div>
      </div>

      {/* View Mode 1: Table (Desktop Site) */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 select-none text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-8 text-center text-slate-500">#</th>

                  {/* Item (Sticky left) */}
                  <th
                    onClick={() => handleSort('nomeItem')}
                    className="py-3 px-3 whitespace-nowrap cursor-pointer hover:text-white sticky left-0 bg-slate-950 z-20 shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item</span>
                      {sortField === 'nomeItem' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 min-w-[200px]">Descrição</th>

                  {/* Estoque Físico */}
                  <th
                    onClick={() => handleSort('contagem')}
                    className="py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Estoque Físico</span>
                      {sortField === 'contagem' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  {/* Estoque Total */}
                  <th
                    onClick={() => handleSort('estoqueTotal')}
                    className="py-3 px-3 text-right whitespace-nowrap cursor-pointer hover:text-white font-bold"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Estoque Total</span>
                      {sortField === 'estoqueTotal' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  {/* Média de Uso Diário */}
                  <th
                    onClick={() => handleSort('mediaUso')}
                    className="py-3 px-3 text-right whitespace-nowrap bg-blue-500/10 text-blue-300 border-x border-blue-500/20 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Média Uso / Dia</span>
                      {sortField === 'mediaUso' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-300" /> : <ArrowDown className="w-3 h-3 text-blue-300" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 text-right whitespace-nowrap">Uso %</th>

                  {/* Dias de Cobertura */}
                  <th
                    onClick={() => handleSort('diasCobertura')}
                    className="py-3 px-4 text-center whitespace-nowrap bg-indigo-500/15 text-indigo-300 border-x border-indigo-500/30 cursor-pointer hover:text-white font-bold"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Dias de Cobertura</span>
                      {sortField === 'diasCobertura' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-300" /> : <ArrowDown className="w-3 h-3 text-indigo-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-indigo-400/60" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 text-center whitespace-nowrap">Classificação Insumos</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sortedAndFilteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      Nenhum item encontrado nesta faixa de cobertura.
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredList.map((item, idx) => {
                    const bucketConf = bucketsConfig.find(b => b.id === item.bucket);
                    const isCritical = item.bucket === '0_a_3';

                    return (
                      <tr
                        key={item.itemKey + idx}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isCritical ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Item (Sticky left) */}
                        <td className="py-2.5 px-3 whitespace-nowrap sticky left-0 bg-slate-900/95 z-10 shadow-sm border-r border-slate-800/50">
                          <div className="font-black text-sm text-white">{item.nomeItem}</div>
                          {item.codigo && (
                            <div className="text-[10px] font-mono text-amber-400">{item.codigo}</div>
                          )}
                        </td>

                        {/* Descricao */}
                        <td className="py-2.5 px-3 text-slate-300">
                          <div className="line-clamp-2 max-w-xs">{item.descricao || item.nomeItem}</div>
                        </td>

                        {/* Estoque Físico */}
                        <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                          <span className="font-bold text-white">{item.contagemEstoque}</span>{' '}
                          <span className="text-[11px] text-slate-400">{item.unidadeContagem}s</span>
                        </td>

                        {/* Estoque Total em Peças */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 whitespace-nowrap tabular-nums">
                          {item.estoqueTotalPecas.toLocaleString('pt-BR')} un
                        </td>

                        {/* Média de Uso Diário */}
                        <td className="py-2 px-3 text-right whitespace-nowrap bg-blue-500/5 border-x border-blue-500/20">
                          {editingMediaKey === item.itemKey ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                value={tempMediaVal}
                                onChange={e => setTempMediaVal(e.target.value)}
                                onBlur={() => handleSaveMedia(item)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveMedia(item);
                                  if (e.key === 'Escape') setEditingMediaKey(null);
                                }}
                                autoFocus
                                className="w-16 h-7 text-right font-mono font-bold text-xs bg-slate-950 border border-blue-400 text-white rounded px-1 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveMedia(item)}
                                className="text-[10px] px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditMedia(item)}
                              title="Clique para ajustar a média de consumo"
                              className="font-mono font-bold text-blue-300 hover:text-white hover:underline text-xs"
                            >
                              {item.mediaUsoDiario.toLocaleString('pt-BR')} /dia
                            </button>
                          )}
                        </td>

                        {/* Uso % */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                          {item.usoPercentual > 0 ? `${item.usoPercentual}%` : '-'}
                        </td>

                        {/* Dias de Cobertura */}
                        <td className="py-2 px-4 text-center whitespace-nowrap bg-indigo-500/5 border-x border-indigo-500/20">
                          {item.diasCobertura === 999 ? (
                            <span className="text-[11px] text-slate-400 italic">Sem consumo</span>
                          ) : (
                            <span
                              className={`font-mono text-base font-black tabular-nums ${
                                bucketConf?.textColor || 'text-white'
                              }`}
                            >
                              {item.diasCobertura}{' '}
                              <span className="text-xs font-normal text-slate-400">dias</span>
                            </span>
                          )}
                        </td>

                        {/* Classificação Insumos */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              bucketConf?.badgeBg || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {bucketConf?.icon}
                            <span>{bucketConf?.label}</span>
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleStartEditMedia(item)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title="Editar consumo diário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode 2: Cards (Mobile Mode) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedAndFilteredList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              Nenhum item encontrado nesta faixa.
            </div>
          ) : (
            sortedAndFilteredList.map((item, idx) => {
              const bucketConf = bucketsConfig.find(b => b.id === item.bucket);
              const isCritical = item.bucket === '0_a_3';

              return (
                <div
                  key={item.itemKey + idx}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isCritical
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">{item.nomeItem}</h3>
                      {item.codigo && (
                        <span className="text-[11px] font-mono text-amber-400">{item.codigo}</span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        bucketConf?.badgeBg || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {bucketConf?.icon}
                      <span>{bucketConf?.label}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {item.descricao || item.nomeItem}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Estoque Físico</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {item.contagemEstoque} {item.unidadeContagem}s
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ({item.estoqueTotalPecas.toLocaleString('pt-BR')} un)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Dias de Cobertura</span>
                      <span
                        className={`font-mono text-base font-black ${
                          bucketConf?.textColor || 'text-white'
                        }`}
                      >
                        {item.diasCobertura === 999 ? 'Sem consumo' : `${item.diasCobertura} dias`}
                      </span>
                    </div>
                  </div>

                  {/* Daily Consumption with edit button */}
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-blue-300 block">Média de Consumo Diário</span>
                      <span className="font-mono font-bold text-white">
                        {item.mediaUsoDiario.toLocaleString('pt-BR')} un/dia
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartEditMedia(item)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                    >
                      Ajustar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Ata Modal / Drawer */}
      {showAtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Ata de Cobertura para Procurement & Insumos
                </h3>
              </div>
              <button
                onClick={() => setShowAtaModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400">
                Este relatório já está formatado com as faixas solicitadas (0 a 3 dias, 3,1 a 5 dias, etc.) para que você copie e envie à equipe de insumos:
              </p>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed selection:bg-amber-500 selection:text-slate-950">
                {generateAtaText}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => setShowAtaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportarAtaPDF}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>Baixar Ata em PDF (.pdf)</span>
                </button>

                <button
                  onClick={handleCopyAta}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                    copiedAta
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {copiedAta ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAta ? 'Texto Copiado!' : 'Copiar Texto da Ata'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Usage Modal */}
      <ImportUsageModal
        isOpen={isImportUsageOpen}
        onClose={() => setIsImportUsageOpen(false)}
      />
    </div>
  );
};
