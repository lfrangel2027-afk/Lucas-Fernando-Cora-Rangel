import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { StockItem } from '../../types';
import { InventoryTable } from './InventoryTable';
import { MovementsLog } from './MovementsLog';
import { UserManagement } from './UserManagement';
import { ItemModal } from './ItemModal';
import { ImportModal } from './ImportModal';
import { CoverageModelView } from './CoverageModelView';
import { ManagerChatView } from './ManagerChatView';
import { DelphiView } from './DelphiView';
import { SecondaryManagerLockModal } from './SecondaryManagerLockModal';
import { QuickWithdrawModal } from '../auxiliar/QuickWithdrawModal';
import {
  Boxes,
  AlertTriangle,
  TrendingDown,
  Layers,
  History,
  Users,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Download,
  ChevronDown,
  Calendar,
  FileText,
  MessageSquare,
  Database,
  KeyRound,
  ShieldAlert,
  Lock
} from 'lucide-react';

interface GestorDashboardProps {
  initialSubTab?: 'tabela' | 'delphi' | 'cobertura' | 'chat' | 'historico' | 'usuarios';
  isWideScreen?: boolean;
}

export const GestorDashboard: React.FC<GestorDashboardProps> = ({
  initialSubTab = 'tabela'
}) => {
  const {
    kpis,
    exportarPlanilha,
    exportarInventarioPDF,
    exportarAtaPDF,
    exportarDelphi,
    exportarDelphiPDF,
    coverageBucketsCount,
    unreadMessagesCount,
    canModifyData,
    isMainManager,
    accessRequests,
    aprovarAcessoSecundario,
    recusarAcessoSecundario
  } = useStock();

  const [subTab, setSubTab] = useState<'tabela' | 'delphi' | 'cobertura' | 'chat' | 'historico' | 'usuarios'>(initialSubTab);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTopExportOpen, setIsTopExportOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [withdrawItem, setWithdrawItem] = useState<StockItem | null>(null);

  // Secondary manager lock modal
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockActionTitle, setLockActionTitle] = useState('');

  // Sync subTab with parent tab changes (from Header or mobile bottom nav)
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleEdit = (item: StockItem) => {
    if (!canModifyData) {
      setLockActionTitle(`Editar material ${item.nomeItem}`);
      setIsLockModalOpen(true);
      return;
    }
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleAddNew = () => {
    if (!canModifyData) {
      setLockActionTitle('Cadastrar novo item no estoque');
      setIsLockModalOpen(true);
      return;
    }
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenImport = () => {
    if (!canModifyData) {
      setLockActionTitle('Importar planilha para alterar o estoque');
      setIsLockModalOpen(true);
      return;
    }
    setIsImportModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Pending Secondary Manager Access Requests (Visible for Main Manager) */}
      {isMainManager && accessRequests.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">
                Solicitação de Liberação de Gestor Secundário ({accessRequests.length})
              </span>
              <span className="text-amber-200">
                O gestor secundário <strong>{accessRequests[0].userName}</strong> pediu liberação: "{accessRequests[0].motivo || 'Alterar/excluir dados'}".
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => aprovarAcessoSecundario(accessRequests[0].id)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              Aprovar & Liberar
            </button>
            <button
              onClick={() => recusarAcessoSecundario(accessRequests[0].id)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {/* Top Welcome & Sub-nav Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Painel Gerencial do Almoxarifado</span>
              {!isMainManager && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gestor Secundário (Consulta & Exportação)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Visão Geral do Estoque, Insumos & Delphi
            </h1>
            <p className="text-xs text-slate-400">
              Conferência de paletes, fardos, cobertura, tabela Delphi automática e relatórios semanais.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Import Button */}
          <button
            onClick={handleOpenImport}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Importar planilha Excel ou CSV"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Importar</span>
            {!canModifyData && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
          </button>

          {/* Export Dropdown Menu (Always 100% accessible to all managers!) */}
          <div className="relative">
            <button
              onClick={() => setIsTopExportOpen(!isTopExportOpen)}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTopExportOpen && (
              <div
                onMouseLeave={() => setIsTopExportOpen(false)}
                className="absolute right-0 top-11 z-30 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in"
              >
                {/* Delphi Module Exports */}
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2.5 py-1 flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>Integração Delphi</span>
                </div>

                <button
                  onClick={() => {
                    exportarDelphi('xlsx');
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="block leading-tight text-white">Planilha Delphi (.xlsx)</span>
                    <span className="text-[10px] text-amber-300/80 font-normal">2 colunas: Código & Quantidade</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportarDelphiPDF();
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="block leading-tight text-white">Relatório Delphi (PDF)</span>
                    <span className="text-[10px] text-rose-300/80 font-normal">Layout 2 colunas para impressão</span>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Relatórios em PDF
                </div>

                <button
                  onClick={() => {
                    exportarAtaPDF();
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="block leading-tight text-white">Ata de Insumos (PDF)</span>
                    <span className="text-[10px] text-rose-300/80 font-normal">Para o time de procurement</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportarInventarioPDF();
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block leading-tight text-white">Estoque Físico (PDF)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Relatório geral de inventário</span>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Planilhas Gerais
                </div>

                <button
                  onClick={() => {
                    exportarPlanilha('xlsx');
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Planilha Completa (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    exportarPlanilha('csv');
                    setIsTopExportOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Arquivo CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-tab pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setSubTab('tabela')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'tabela'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Planilha</span>
            </button>

            {/* Delphi Tab (Requested by user) */}
            <button
              onClick={() => setSubTab('delphi')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'delphi'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Delphi</span>
            </button>

            <button
              onClick={() => setSubTab('cobertura')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'cobertura'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Cobertura</span>
              {coverageBucketsCount['0_a_3'] > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center justify-center border border-rose-500/40">
                  {coverageBucketsCount['0_a_3']}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab('chat')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'chat'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Ocorrências & Fotos</span>
              {unreadMessagesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab('historico')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'historico'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Retiradas ({kpis.totalRetiradasHoje})</span>
            </button>

            <button
              onClick={() => setSubTab('usuarios')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'usuarios'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Usuários</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Itens */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total de Itens</span>
            <Boxes className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
            {kpis.totalItens}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Códigos cadastrados
          </div>
        </div>

        {/* Itens Zerados */}
        <div
          onClick={() => setSubTab('tabela')}
          className={`p-4 rounded-2xl border shadow-md cursor-pointer transition-all ${
            kpis.itensZerados > 0
              ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-300 mb-2">
            <span className="font-bold">Itens Zerados</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">
            {kpis.itensZerados}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1 flex items-center gap-1">
            <span>{kpis.itensZerados === 0 ? 'Nenhum item zerado' : 'Requer reposição urgente!'}</span>
          </div>
        </div>

        {/* Baixo Estoque */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-2">
            <span>Estoque Baixo</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
            {kpis.itensBaixos}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ≤ 2 paletes ou fardos
          </div>
        </div>

        {/* Contagem Física Total */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Paletes & Fardos</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
            {kpis.totalContagem.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Volumes no galpão
          </div>
        </div>

        {/* Peças / Unidades Totais */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total em Peças</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums truncate">
            {kpis.totalEstoquePecas.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unidades computadas
          </div>
        </div>
      </div>

      {/* Sub-tab view render */}
      {subTab === 'tabela' && (
        <InventoryTable
          onEditItem={handleEdit}
          onAddNewItem={handleAddNew}
          onOpenWithdraw={setWithdrawItem}
          onOpenImport={handleOpenImport}
          onOpenDelphi={() => setSubTab('delphi')}
        />
      )}

      {subTab === 'delphi' && <DelphiView />}

      {subTab === 'cobertura' && <CoverageModelView />}

      {subTab === 'chat' && <ManagerChatView />}

      {subTab === 'historico' && <MovementsLog />}

      {subTab === 'usuarios' && <UserManagement />}

      {/* Modal Add / Edit Item */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
      />

      {/* Modal Import Spreadsheet */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Quick Withdraw Modal */}
      {withdrawItem && (
        <QuickWithdrawModal
          item={withdrawItem}
          onClose={() => setWithdrawItem(null)}
        />
      )}

      {/* Secondary Manager Lock Modal */}
      <SecondaryManagerLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        actionTitle={lockActionTitle}
        onUnlockedSuccess={() => {
          if (lockActionTitle.includes('Importar')) {
            setIsImportModalOpen(true);
          } else if (lockActionTitle.includes('Cadastrar')) {
            setIsItemModalOpen(true);
          }
        }}
      />
    </div>
  );
};
