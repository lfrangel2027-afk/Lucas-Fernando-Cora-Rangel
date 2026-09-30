import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { CategoryType } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Search,
  FileText,
  Boxes,
  Layers,
  AlertTriangle,
  CheckCircle,
  Database,
  ArrowUpDown,
  Sparkles,
  Zap,
  Info,
  Filter
} from 'lucide-react';

export const DelphiView: React.FC = () => {
  const {
    delphiData,
    exportarDelphi,
    exportarDelphiPDF,
    playAudioFeedback
  } = useStock();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ativo' | 'zerado'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [codeFormat, setCodeFormat] = useState<'codigo' | 'nome' | 'ambos'>('codigo');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedWithHeader, setCopiedWithHeader] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc' | 'code'>('default');

  // Categories present in data
  const categories = useMemo(() => {
    const set = new Set(delphiData.map(d => d.tipo));
    return Array.from(set).sort();
  }, [delphiData]);

  // Filtered and sorted Delphi items
  const processedData = useMemo(() => {
    let list = delphiData.filter(d => {
      // Stock status filter
      if (filterType === 'ativo' && d.quantidade === 0) return false;
      if (filterType === 'zerado' && d.quantidade > 0) return false;

      // Category filter
      if (categoryFilter !== 'all' && d.tipo !== categoryFilter) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          d.codigo.toLowerCase().includes(q) ||
          d.nomeItem.toLowerCase().includes(q) ||
          d.tipo.toLowerCase().includes(q) ||
          (d.descricao && d.descricao.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sortOrder === 'asc') {
      list = [...list].sort((a, b) => a.quantidade - b.quantidade);
    } else if (sortOrder === 'desc') {
      list = [...list].sort((a, b) => b.quantidade - a.quantidade);
    } else if (sortOrder === 'code') {
      list = [...list].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }

    return list;
  }, [delphiData, filterType, categoryFilter, searchTerm, sortOrder]);

  const totalPecasDelphi = useMemo(() => {
    return delphiData.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [delphiData]);

  const totalPecasFiltradas = useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [processedData]);

  // Helper to format the display code based on user's preference
  const getDisplayCode = (row: { codigo: string; nomeItem: string }) => {
    if (codeFormat === 'nome') return row.nomeItem;
    if (codeFormat === 'ambos') return `${row.codigo} · ${row.nomeItem}`;
    return row.codigo;
  };

  // Copy raw 2-column text format (Código \t Quantidade \n) for direct paste into Delphi / Excel
  const handleCopyDelphiText = (includeHeader = false) => {
    const rows = processedData.map(d => `${getDisplayCode(d)}\t${d.quantidade}`);
    const textToCopy = includeHeader
      ? `Código\tQuantidade\n${rows.join('\n')}`
      : rows.join('\n');

    navigator.clipboard.writeText(textToCopy);
    if (includeHeader) {
      setCopiedWithHeader(true);
      setTimeout(() => setCopiedWithHeader(false), 2500);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
    playAudioFeedback('Dados do Delphi copiados! Pronto para colar no sistema.');
  };

  const handleCopySingle = (code: string, quantidade: number) => {
    navigator.clipboard.writeText(`${code}\t${quantidade}`);
    setCopiedItem(code);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Módulo de Integração</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3" />
                Sincronização 100% Automática
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Delphi — Quantidade Total de Peças
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Informações calculadas automaticamente a partir da contagem física no estoque (Código e Quantidade em Peças).
            </p>
          </div>
        </div>

        {/* Action Buttons: Copiar, Excel, CSV, PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Copy for Delphi */}
          <button
            onClick={() => handleCopyDelphiText(false)}
            className="h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
            title="Copiar todas as 2 colunas para colar direto no Delphi ou Excel (Ctrl+V)"
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Copiado para o Delphi!' : 'Copiar para o Delphi'}</span>
          </button>

          {/* Copy with header */}
          <button
            onClick={() => handleCopyDelphiText(true)}
            className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Copiar com a linha de cabeçalho 'Código | Quantidade'"
          >
            {copiedWithHeader ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">c/ Cabeçalho</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportarDelphi('xlsx')}
            className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Baixar planilha Delphi (.xlsx) de 2 colunas"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportarDelphi('csv')}
            className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Baixar arquivo delimitado CSV (.csv)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={exportarDelphiPDF}
            className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Baixar relatório Delphi em PDF de 2 colunas"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Real-time sync explanation card */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-start sm:items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 block">
              Alimentação Automática em Tempo Real
            </span>
            <span className="text-amber-200/90 leading-relaxed block text-[11px] sm:text-xs">
              As quantidades abaixo são calculadas multiplicando a <strong>contagem física de paletes/fardos</strong> pelo <strong>múltiplo de peças</strong>. Qualquer reposição de bancada, retirada ou ajuste físico atualiza os dados do Delphi instantaneamente.
            </span>
          </div>
        </div>
        <div className="shrink-0 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-200 font-mono text-[11px]">
          Quantidade = Contagem × Múltiplo
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Total de Códigos</span>
            <Boxes className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-2xl font-black text-white">
            {delphiData.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            SKUs no layout Delphi
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1.5">
            <span>Total Peças no Delphi</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-black text-emerald-400 truncate">
            {totalPecasDelphi.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalPecasFiltradas !== totalPecasDelphi ? `${totalPecasFiltradas.toLocaleString('pt-BR')} no filtro atual` : 'Peças computadas'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Com Estoque Ativo</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono text-2xl font-black text-blue-400">
            {delphiData.filter(d => d.quantidade > 0).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Itens com quantidade &gt; 0
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-rose-300 mb-1.5">
            <span>Itens Zerados (0)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-400">
            {delphiData.filter(d => d.quantidade === 0).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Quantidade 0 no Delphi
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-md">
        {/* Row 1: Search, Stock Filter & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ex: BR-COR95057), nome da caixa (ex: 12, PM1) ou categoria..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stock Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({delphiData.length})
              </button>
              <button
                onClick={() => setFilterType('ativo')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterType === 'ativo' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Com Estoque ({delphiData.filter(d => d.quantidade > 0).length})
              </button>
              <button
                onClick={() => setFilterType('zerado')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterType === 'zerado' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Zerados ({delphiData.filter(d => d.quantidade === 0).length})
              </button>
            </div>

            {/* Sort button */}
            <button
              onClick={() => {
                if (sortOrder === 'default') setSortOrder('desc');
                else if (sortOrder === 'desc') setSortOrder('asc');
                else if (sortOrder === 'asc') setSortOrder('code');
                else setSortOrder('default');
              }}
              className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Alternar ordenação"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {sortOrder === 'desc'
                  ? 'Maior Quantidade'
                  : sortOrder === 'asc'
                  ? 'Menor Quantidade'
                  : sortOrder === 'code'
                  ? 'Código (A-Z)'
                  : 'Ordem Padrão'}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter & Format Selector for Col 1 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80">
          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
            <span className="text-slate-500 flex items-center gap-1 mr-1 shrink-0 font-medium">
              <Filter className="w-3 h-3 text-slate-400" />
              Categoria:
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Col 1 Format Toggle (Código vs Nome vs Ambos) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
            <span className="text-[11px] text-slate-500 px-1.5 hidden lg:inline">Exibir na Coluna 1:</span>
            <button
              onClick={() => setCodeFormat('codigo')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                codeFormat === 'codigo' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibe o código SKU (ex: BR-COR95057) - Formato Padrão Delphi"
            >
              Código SKU
            </button>
            <button
              onClick={() => setCodeFormat('nome')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                codeFormat === 'nome' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibe o nome do item/caixa (ex: 12, 25, PM1, V3)"
            >
              Nome / Caixa
            </button>
            <button
              onClick={() => setCodeFormat('ambos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                codeFormat === 'ambos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibe Código SKU + Nome da Caixa"
            >
              Código + Nome
            </button>
          </div>
        </div>
      </div>

      {/* The 2-Column Delphi Table (Exact replica of user reference image) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Estrutura Delphi (2 Colunas)</span>
            <span className="text-xs text-slate-400">· Exibindo {processedData.length} registros</span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cálculo 100% automático:</span>
            <span className="text-slate-300">Contagem × Múltiplo de peças</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 sm:px-6 text-xs font-bold text-slate-300 uppercase tracking-wider w-1/2 border-r border-slate-800">
                  Código
                </th>
                <th className="py-3 px-4 sm:px-6 text-xs font-bold text-slate-300 uppercase tracking-wider w-1/2 text-right">
                  Quantidade
                </th>
                <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16">
                  Copiar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-sm">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum código encontrado com o filtro atual.
                  </td>
                </tr>
              ) : (
                processedData.map((row, idx) => {
                  const isZero = row.quantidade === 0;
                  const displayCode = getDisplayCode(row);
                  const isCopied = copiedItem === displayCode;

                  return (
                    <tr
                      key={row.codigo}
                      className={`hover:bg-slate-800/50 transition-colors group ${
                        idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-950/40'
                      }`}
                    >
                      {/* Column 1: Código */}
                      <td className="py-2.5 px-4 sm:px-6 text-white font-bold tracking-tight border-r border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm select-all">{displayCode}</span>
                          {codeFormat === 'codigo' && (
                            <span className="text-[10px] font-sans text-slate-400 group-hover:text-slate-300 transition-colors">
                              {row.nomeItem} <span className="text-slate-600 hidden md:inline">({row.tipo})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Quantidade Total em Peças */}
                      <td className="py-2.5 px-4 sm:px-6 text-right">
                        <span
                          className={`text-sm font-bold select-all ${
                            isZero ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {row.quantidade}
                        </span>
                        {row.contagem > 0 && (
                          <span className="text-[10px] font-sans text-slate-500 ml-2 hidden sm:inline">
                            ({row.contagem} {row.contagem === 1 ? 'vol' : 'vols'} × {row.multiplo})
                          </span>
                        )}
                      </td>

                      {/* Quick row copy button */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleCopySingle(displayCode, row.quantidade)}
                          title={`Copiar "${displayCode}\t${row.quantidade}"`}
                          className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Formato exato pronto para upload ou colagem no sistema Delphi.</span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span>Total SKUs: <strong className="text-white">{processedData.length}</strong></span>
            <span>·</span>
            <span>Peças: <strong className="text-emerald-400">{processedData.reduce((a, c) => a + c.quantidade, 0).toLocaleString('pt-BR')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
