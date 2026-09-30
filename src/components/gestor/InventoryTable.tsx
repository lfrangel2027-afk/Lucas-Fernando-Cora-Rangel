import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { StockItem, ItemCoverageAnalysis } from '../../types';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Minus,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Upload,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Monitor,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  Zap,
  Calendar,
  Clock,
  Eye,
  FileText,
  Database,
  Lock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { SecondaryManagerLockModal } from './SecondaryManagerLockModal';

interface InventoryTableProps {
  onEditItem: (item: StockItem) => void;
  onAddNewItem: () => void;
  onOpenWithdraw: (item: StockItem) => void;
  onOpenImport: () => void;
  onOpenDelphi?: () => void;
}

type SortField = 'index' | 'codigo' | 'descricao' | 'contagem' | 'estoqueTotal' | 'diasCobertura' | 'mediaUso' | 'status';
type SortDirection = 'asc' | 'desc';
type ViewFormat = 'completa' | 'almoxarifado' | 'cards';

export const InventoryTable: React.FC<InventoryTableProps> = ({
  onEditItem,
  onAddNewItem,
  onOpenWithdraw,
  onOpenImport,
  onOpenDelphi
}) => {
  const {
    items,
    ajustarContagem,
    excluirItem,
    exportarPlanilha,
    exportarInventarioPDF,
    exportarDelphi,
    resetarDadosOriginais,
    kpis,
    coverageAnalyses,
    canModifyData,
    isMainManager
  } = useStock();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'zerado' | 'baixo' | 'normal'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [editingCountId, setEditingCountId] = useState<string | null>(null);
  const [tempCountVal, setTempCountVal] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockActionTitle, setLockActionTitle] = useState('');

  // View format: 'completa' (All columns + Coverage), 'almoxarifado' (physical), 'cards' (mobile touch cards)
  const [viewFormat, setViewFormat] = useState<ViewFormat>('completa');
  const [isCompactDensity, setIsCompactDensity] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Map coverage analysis by item key/code/id
  const coverageMap = useMemo(() => {
    const map = new Map<string, ItemCoverageAnalysis>();
    coverageAnalyses.forEach(ca => {
      if (ca.itemId) map.set(ca.itemId, ca);
      if (ca.codigo) map.set(ca.codigo.toLowerCase().trim(), ca);
      map.set(ca.nomeItem.toLowerCase().trim(), ca);
    });
    return map;
  }, [coverageAnalyses]);

  // Suppliers list
  const suppliers = useMemo(() => {
    const set = new Set(items.map(i => i.fornecedor));
    return Array.from(set).sort();
  }, [items]);

  // Types list
  const types = useMemo(() => {
    const set = new Set(items.map(i => i.tipo));
    return Array.from(set).sort();
  }, [items]);

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    const filtered = items.filter(item => {
      // Status filter
      if (filterStatus === 'zerado' && item.contagem !== 0) return false;
      if (filterStatus === 'baixo' && (item.contagem === 0 || item.contagem > 2)) return false;
      if (filterStatus === 'normal' && item.contagem <= 2) return false;

      // Type filter
      if (filterType !== 'all' && item.tipo !== filterType) return false;

      // Supplier filter
      if (filterSupplier !== 'all' && item.fornecedor !== filterSupplier) return false;

      // Coverage bucket filter
      if (filterBucket !== 'all') {
        const ca = coverageMap.get(item.id) || coverageMap.get(item.codigo.toLowerCase().trim()) || coverageMap.get(item.nomeItem.toLowerCase().trim());
        if (!ca || ca.bucket !== filterBucket) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = item.codigo.toLowerCase().includes(q);
        const matchesName = item.nomeItem.toLowerCase().includes(q);
        const matchesDesc = item.descricao.toLowerCase().includes(q);
        const matchesSupplier = item.fornecedor.toLowerCase().includes(q);
        return matchesCode || matchesName || matchesDesc || matchesSupplier;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      const covA = coverageMap.get(a.id) || coverageMap.get(a.codigo.toLowerCase().trim()) || coverageMap.get(a.nomeItem.toLowerCase().trim());
      const covB = coverageMap.get(b.id) || coverageMap.get(b.codigo.toLowerCase().trim()) || coverageMap.get(b.nomeItem.toLowerCase().trim());

      switch (sortField) {
        case 'codigo':
          comparison = a.codigo.localeCompare(b.codigo);
          break;
        case 'descricao':
          comparison = a.descricao.localeCompare(b.descricao);
          break;
        case 'contagem':
          comparison = a.contagem - b.contagem;
          break;
        case 'estoqueTotal':
          comparison = (a.contagem * a.multiplo) - (b.contagem * b.multiplo);
          break;
        case 'diasCobertura':
          const diasA = covA?.diasCobertura ?? 999;
          const diasB = covB?.diasCobertura ?? 999;
          comparison = diasA - diasB;
          break;
        case 'mediaUso':
          const usoA = covA?.mediaUsoDiario ?? 0;
          const usoB = covB?.mediaUsoDiario ?? 0;
          comparison = usoA - usoB;
          break;
        case 'status':
          const statusOrder = (it: StockItem) => it.contagem === 0 ? 0 : it.contagem <= 2 ? 1 : 2;
          comparison = statusOrder(a) - statusOrder(b);
          break;
        case 'index':
        default:
          comparison = 0;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, filterStatus, filterType, filterSupplier, filterBucket, search, sortField, sortDirection, coverageMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStartEditCount = (item: StockItem) => {
    setEditingCountId(item.id);
    setTempCountVal(String(item.contagem));
  };

  const handleSaveCount = (item: StockItem) => {
    const num = parseInt(tempCountVal, 10);
    if (!isNaN(num) && num >= 0) {
      ajustarContagem(item.id, num, 'Ajuste manual pela tabela de inventário');
    }
    setEditingCountId(null);
  };

  const handleQuickDelta = (item: StockItem, delta: number) => {
    const newCount = Math.max(0, item.contagem + delta);
    ajustarContagem(item.id, newCount, delta > 0 ? 'Entrada / Adição de Pallet/Fardo' : 'Ajuste / Retirada');
  };

  const getBucketBadge = (ca?: ItemCoverageAnalysis) => {
    if (!ca) return null;
    switch (ca.bucket) {
      case '0_a_3':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>0 a 3 dias</span>
          </span>
        );
      case '3_1_a_5':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 whitespace-nowrap">
            <Clock className="w-2.5 h-2.5" />
            <span>3,1 a 5 dias</span>
          </span>
        );
      case '5_1_a_14':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap">
            <span>5,1 a 14 dias</span>
          </span>
        );
      case '14_1_a_21':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 whitespace-nowrap">
            <span>14,1 a 21 dias</span>
          </span>
        );
      case 'acima_21_1':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>&gt; 21 dias</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        {/* Row 1: Search & Primary Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar código, descrição ou item (ex: BR-COR, 12, PM1, SLAM, Klabin)..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Action buttons (Import, Export, New Item) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Import Button */}
            <button
              onClick={onOpenImport}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Importar planilha Excel (.xlsx, .xls) ou CSV (.csv)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar Planilha</span>
            </button>

            {/* Export Dropdown Group */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Exportar planilha"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportMenuOpen && (
                <div
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                  className="absolute right-0 top-11 z-30 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                    Exportar
                  </div>

                  <button
                    onClick={() => {
                      exportarInventarioPDF();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Relatório em PDF (.pdf)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportarPlanilha('xlsx');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Planilha Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportarPlanilha('csv');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Arquivo CSV (.csv)</span>
                  </button>

                  <div className="border-t border-slate-800 my-1" />
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-400" />
                    <span>Layout Delphi</span>
                  </div>

                  <button
                    onClick={() => {
                      exportarDelphi('xlsx');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block leading-tight text-white">Planilha Delphi (.xlsx)</span>
                      <span className="text-[10px] text-amber-300/80 font-normal">2 colunas: Código & Peças</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Delphi view shortcut button */}
            {onOpenDelphi && (
              <button
                onClick={onOpenDelphi}
                className="h-10 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Abrir tabela e exportação Delphi (2 Colunas com cálculo automático)"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Delphi</span>
                <span className="hidden sm:inline text-[9px] bg-amber-500/20 px-1 py-0.5 rounded text-amber-200 uppercase font-black">Auto</span>
              </button>
            )}

            {/* New Item Button */}
            <button
              onClick={onAddNewItem}
              className="h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Item</span>
            </button>
          </div>
        </div>

        {/* Row 2: View Format Mode Switcher (Completa vs Almoxarifado vs Cards Mobile) & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* View Format Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setViewFormat('completa')}
              title="Exibe todas as informações: Estoque físico + Média/dia + Dias de cobertura de insumos"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewFormat === 'completa'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>Visão Completa do Site</span>
              <span className="hidden xl:inline text-[10px] text-amber-400 font-normal">(Estoque + Cobertura)</span>
            </button>

            <button
              onClick={() => setViewFormat('almoxarifado')}
              title="Exibe apenas os dados de contagem física do almoxarifado"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewFormat === 'almoxarifado'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Estoque Físico</span>
            </button>

            <button
              onClick={() => setViewFormat('cards')}
              title="Otimizado para celular / tablets com botões grandes de toque"
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewFormat === 'cards'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Modo Cartões (Mobile)</span>
            </button>
          </div>

          {/* Density & Count Summary */}
          <div className="flex items-center gap-3">
            {viewFormat !== 'cards' && (
              <button
                onClick={() => setIsCompactDensity(!isCompactDensity)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline hidden sm:block"
                title="Alternar altura das linhas para ver mais itens de uma vez"
              >
                {isCompactDensity ? 'Modo Linhas Normais' : 'Modo Linhas Compactas'}
              </button>
            )}

            <span className="text-slate-400">
              Mostrando <strong className="text-white">{processedItems.length}</strong> de <strong className="text-white">{items.length}</strong> itens
            </span>
          </div>
        </div>

        {/* Row 3: Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Filtrar:</span>

          {/* Quick status segmented controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({items.length})
            </button>

            <button
              onClick={() => setFilterStatus('zerado')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                filterStatus === 'zerado'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Zerados ({kpis.itensZerados})</span>
            </button>

            <button
              onClick={() => setFilterStatus('baixo')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === 'baixo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Baixo ({kpis.itensBaixos})</span>
            </button>
          </div>

          {/* Type filter dropdown */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Tipos ({types.length})</option>
            {types.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Supplier filter dropdown */}
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Fornecedores</option>
            {suppliers.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Coverage Bucket filter */}
          <select
            value={filterBucket}
            onChange={e => setFilterBucket(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as Faixas de Cobertura</option>
            <option value="0_a_3">0 a 3 dias (Crítico)</option>
            <option value="3_1_a_5">3,1 a 5 dias (Alerta)</option>
            <option value="5_1_a_14">5,1 a 14 dias (Atenção)</option>
            <option value="14_1_a_21">14,1 a 21 dias (Estável)</option>
            <option value="acima_21_1">Acima de 21,1 dias (Seguro)</option>
          </select>

          {(search || filterStatus !== 'all' || filterType !== 'all' || filterSupplier !== 'all' || filterBucket !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('all');
                setFilterType('all');
                setFilterSupplier('all');
                setFilterBucket('all');
              }}
              className="text-amber-400 hover:text-amber-300 text-xs underline ml-auto font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Render Format 1 & 2: Table View (Full Site View or Almoxarifado View) */}
      {viewFormat !== 'cards' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 select-none text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-2 w-8 text-center text-slate-500">#</th>

                  {/* Frozen/Sticky Código column */}
                  <th
                    onClick={() => handleSort('codigo')}
                    className="py-3 px-3 whitespace-nowrap cursor-pointer hover:text-white transition-colors sticky left-0 bg-slate-950 z-20 shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código</span>
                      {sortField === 'codigo' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Descrição */}
                  <th
                    onClick={() => handleSort('descricao')}
                    className="py-3 px-3 min-w-[220px] cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Descrição</span>
                      {sortField === 'descricao' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 whitespace-nowrap">Fornecedor</th>
                  <th className="py-3 px-3 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-3 whitespace-nowrap">Item</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Múltiplo</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Unidade</th>

                  {/* Physical Count Column */}
                  <th
                    onClick={() => handleSort('contagem')}
                    className="py-3 px-3 text-center whitespace-nowrap bg-amber-500/15 text-amber-300 border-x border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors font-bold"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Contagem Física</span>
                      {sortField === 'contagem' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-300" /> : <ArrowDown className="w-3 h-3 text-amber-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-amber-400/60" />
                      )}
                    </div>
                  </th>

                  {/* Total Units in Pieces */}
                  <th
                    onClick={() => handleSort('estoqueTotal')}
                    className="py-3 px-3 text-right whitespace-nowrap font-bold text-white cursor-pointer hover:text-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Estoque Total</span>
                      {sortField === 'estoqueTotal' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  {/* Extra Columns shown in 'Visão Completa do Site' */}
                  {viewFormat === 'completa' && (
                    <>
                      {/* Daily Usage */}
                      <th
                        onClick={() => handleSort('mediaUso')}
                        className="py-3 px-3 text-right whitespace-nowrap bg-blue-500/10 text-blue-300 border-x border-blue-500/20 cursor-pointer hover:text-white"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Média Uso/Dia</span>
                          {sortField === 'mediaUso' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-300" /> : <ArrowDown className="w-3 h-3 text-blue-300" />
                          )}
                        </div>
                      </th>

                      {/* Coverage Days */}
                      <th
                        onClick={() => handleSort('diasCobertura')}
                        className="py-3 px-3 text-center whitespace-nowrap bg-indigo-500/15 text-indigo-300 border-r border-indigo-500/30 cursor-pointer hover:text-white font-bold"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Dias Cobertura</span>
                          {sortField === 'diasCobertura' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-300" /> : <ArrowDown className="w-3 h-3 text-indigo-300" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-indigo-400/60" />
                          )}
                        </div>
                      </th>

                      {/* Procurement Bracket */}
                      <th className="py-3 px-3 text-center whitespace-nowrap">Faixa Insumos</th>
                    </>
                  )}

                  {/* Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-3 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {processedItems.length === 0 ? (
                  <tr>
                    <td colSpan={viewFormat === 'completa' ? 15 : 12} className="py-12 text-center text-slate-500">
                      Nenhum item corresponde aos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  processedItems.map((item, index) => {
                    const isZero = item.contagem === 0;
                    const isLow = item.contagem > 0 && item.contagem <= 2;
                    const totalPecas = item.contagem * item.multiplo;
                    const ca = coverageMap.get(item.id) || coverageMap.get(item.codigo.toLowerCase().trim()) || coverageMap.get(item.nomeItem.toLowerCase().trim());
                    const rowPadding = isCompactDensity ? 'py-1.5 px-3' : 'py-2.5 px-3';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isZero
                            ? 'bg-rose-950/20 text-rose-200'
                            : isLow
                            ? 'bg-amber-950/10'
                            : ''
                        }`}
                      >
                        {/* # */}
                        <td className={`${rowPadding} text-center text-slate-500 font-mono text-[11px]`}>
                          {index + 1}
                        </td>

                        {/* Código (Frozen / Sticky on left) */}
                        <td className={`${rowPadding} font-mono font-bold text-amber-400 whitespace-nowrap sticky left-0 bg-slate-900/95 z-10 shadow-sm border-r border-slate-800/50`}>
                          {item.codigo}
                        </td>

                        {/* Descrição */}
                        <td className={`${rowPadding} text-slate-200 text-xs`}>
                          <div className="line-clamp-2 max-w-sm" title={item.descricao}>
                            {item.descricao}
                          </div>
                        </td>

                        {/* Fornecedor */}
                        <td className={`${rowPadding} text-slate-400 whitespace-nowrap text-[11px]`}>
                          {item.fornecedor}
                        </td>

                        {/* Tipo */}
                        <td className={`${rowPadding} text-slate-300 whitespace-nowrap`}>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-medium">
                            {item.tipo}
                          </span>
                        </td>

                        {/* Nome do item */}
                        <td className={`${rowPadding} font-bold text-white whitespace-nowrap`}>
                          {item.nomeItem}
                        </td>

                        {/* Múltiplo */}
                        <td className={`${rowPadding} text-right font-mono text-slate-300 whitespace-nowrap tabular-nums`}>
                          {item.multiplo.toLocaleString('pt-BR')}
                        </td>

                        {/* Unidade */}
                        <td className={`${rowPadding} text-center text-slate-400 whitespace-nowrap`}>
                          {item.unidadeContagem}
                        </td>

                        {/* Contagem Física com botões rápidos */}
                        <td className={`${rowPadding} text-center whitespace-nowrap bg-amber-500/5 border-x border-amber-500/20`}>
                          {editingCountId === item.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={tempCountVal}
                                onChange={e => setTempCountVal(e.target.value)}
                                onBlur={() => handleSaveCount(item)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveCount(item);
                                  if (e.key === 'Escape') setEditingCountId(null);
                                }}
                                autoFocus
                                className="w-16 h-7 text-center font-mono font-bold text-xs bg-slate-950 border border-amber-500 text-white rounded focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveCount(item)}
                                className="text-[10px] px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleQuickDelta(item, -1)}
                                disabled={item.contagem <= 0}
                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 flex items-center justify-center transition-colors"
                                title="Diminuir 1 volume"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleStartEditCount(item)}
                                className={`px-2.5 py-0.5 rounded font-mono font-black text-sm min-w-[36px] tabular-nums transition-all hover:ring-1 hover:ring-amber-400 ${
                                  isZero
                                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                                    : isLow
                                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-white'
                                }`}
                                title="Clique para digitar a quantidade"
                              >
                                {item.contagem}
                              </button>

                              <button
                                onClick={() => handleQuickDelta(item, 1)}
                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                                title="Adicionar 1 volume"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Estoque Total em Peças */}
                        <td className={`${rowPadding} text-right font-mono font-bold text-slate-100 whitespace-nowrap tabular-nums`}>
                          {isZero ? (
                            <span className="text-rose-400 font-semibold">0 un</span>
                          ) : (
                            `${totalPecas.toLocaleString('pt-BR')} un`
                          )}
                        </td>

                        {/* Extra columns for 'Visão Completa do Site' */}
                        {viewFormat === 'completa' && (
                          <>
                            {/* Média Uso/Dia */}
                            <td className={`${rowPadding} text-right font-mono text-blue-300 whitespace-nowrap tabular-nums bg-blue-500/5 border-x border-blue-500/20`}>
                              {ca && ca.mediaUsoDiario > 0 ? (
                                <span>{ca.mediaUsoDiario.toLocaleString('pt-BR')} /dia</span>
                              ) : (
                                <span className="text-slate-500 text-[10px] italic">Sem uso reg.</span>
                              )}
                            </td>

                            {/* Dias de Cobertura */}
                            <td className={`${rowPadding} text-center font-mono whitespace-nowrap tabular-nums bg-indigo-500/5 border-r border-indigo-500/20`}>
                              {isZero ? (
                                <span className="text-rose-400 font-bold text-xs">0 dias</span>
                              ) : !ca || ca.diasCobertura === 999 ? (
                                <span className="text-slate-500 text-[10px] italic">Sem consumo</span>
                              ) : (
                                <span
                                  className={`font-black text-sm ${
                                    ca.diasCobertura <= 3
                                      ? 'text-rose-400'
                                      : ca.diasCobertura <= 5
                                      ? 'text-orange-400'
                                      : ca.diasCobertura <= 14
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {ca.diasCobertura} <span className="text-[10px] font-normal text-slate-400">dias</span>
                                </span>
                              )}
                            </td>

                            {/* Faixa Procurement / Insumos */}
                            <td className={`${rowPadding} text-center whitespace-nowrap`}>
                              {getBucketBadge(ca)}
                            </td>
                          </>
                        )}

                        {/* Status */}
                        <td className={`${rowPadding} text-center whitespace-nowrap`}>
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 border border-rose-500/40 text-rose-300">
                              ZERADO
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                              BAIXO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                              REGULAR
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className={`${rowPadding} text-right whitespace-nowrap`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenWithdraw(item)}
                              title="Registrar Retirada"
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors"
                            >
                              Retirar
                            </button>

                            <button
                              onClick={() => onEditItem(item)}
                              title="Editar detalhes do item"
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Excluir item"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Mostrando <strong className="text-white">{processedItems.length}</strong> de <strong className="text-white">{items.length}</strong> itens cadastrados
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Zerados: <strong className="text-rose-300">{kpis.itensZerados}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Baixo Estoque: <strong className="text-amber-300">{kpis.itensBaixos}</strong></span>
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja restaurar a planilha original com todos os itens da foto?')) {
                    resetarDadosOriginais();
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 ml-2 transition-colors"
                title="Restaurar dados padrão da foto"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Render Format 3: Mobile Touch Cards Mode (Otimizado para Celular) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {processedItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              Nenhum item corresponde aos filtros selecionados.
            </div>
          ) : (
            processedItems.map(item => {
              const isZero = item.contagem === 0;
              const isLow = item.contagem > 0 && item.contagem <= 2;
              const totalPecas = item.contagem * item.multiplo;
              const ca = coverageMap.get(item.id) || coverageMap.get(item.codigo.toLowerCase().trim()) || coverageMap.get(item.nomeItem.toLowerCase().trim());

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isZero
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isLow
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Top Bar of Card: Code, Type and Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-400 text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {item.codigo}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                        {item.tipo}
                      </span>
                    </div>

                    {isZero ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/25 border border-rose-500/40 text-rose-300">
                        ZERADO
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 border border-amber-500/40 text-amber-300">
                        BAIXO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                        OK
                      </span>
                    )}
                  </div>

                  {/* Item Description & Name */}
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">
                      {item.nomeItem}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                      {item.descricao}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Fornecedor: {item.fornecedor} · Múlt: {item.multiplo.toLocaleString('pt-BR')} un
                    </div>
                  </div>

                  {/* Physical Count with Giant Steppers for Easy Thumb Touch */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Contagem Física
                      </div>
                      <div className="text-xs text-slate-300">
                        {item.unidadeContagem}s no galpão
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickDelta(item, -1)}
                        disabled={item.contagem <= 0}
                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleStartEditCount(item)}
                        className={`min-w-[48px] h-10 px-2 rounded-xl font-mono text-lg font-black flex items-center justify-center border ${
                          isZero
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-white border-slate-700'
                        }`}
                      >
                        {item.contagem}
                      </button>

                      <button
                        onClick={() => handleQuickDelta(item, 1)}
                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Calculated Stock & Coverage Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Total em Peças</span>
                      <span className="font-mono text-sm font-black text-white">
                        {totalPecas.toLocaleString('pt-BR')} un
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Cobertura Insumos</span>
                      {isZero ? (
                        <span className="font-mono text-sm font-black text-rose-400">0 dias</span>
                      ) : !ca || ca.diasCobertura === 999 ? (
                        <span className="text-[11px] text-slate-400 italic">Sem consumo</span>
                      ) : (
                        <span className="font-mono text-sm font-black text-amber-400">
                          {ca.diasCobertura} dias
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Retirar & Edit/Delete */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => onOpenWithdraw(item)}
                      className="flex-1 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Retirar Material</span>
                    </button>

                    <button
                      onClick={() => onEditItem(item)}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      title="Editar Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center transition-colors"
                      title="Excluir Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Confirmation Modal for Delete Item */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Excluir Item do Estoque?</h3>
            <p className="text-xs text-slate-400">
              Esta ação removerá este item da lista de inventário.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  excluirItem(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
