import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { StockMovement } from '../../types';
import { DeleteMovementModal } from '../common/DeleteMovementModal';
import {
  Clock,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  User,
  Monitor,
  Smartphone,
  Trash2
} from 'lucide-react';

export const MovementsLog: React.FC = () => {
  const { movements, users } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (selectedUser !== 'all' && m.usuarioId !== selectedUser) return false;
      if (selectedType !== 'all' && m.tipo !== selectedType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          m.itemNome.toLowerCase().includes(q) ||
          m.itemCodigo.toLowerCase().includes(q) ||
          m.usuarioNome.toLowerCase().includes(q) ||
          (m.motivo && m.motivo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [movements, selectedUser, selectedType, searchTerm]);

  const exportMovementsCSV = () => {
    const headers = ['Data/Hora', 'Tipo', 'Código', 'Item', 'Tipo Material', 'Qtd Retirada/Ajustada', 'Unidade', 'Total Peças', 'Antes', 'Depois', 'Responsável', 'Motivo'];
    const rows = filteredMovements.map(m => [
      `"${new Date(m.dataHora).toLocaleString('pt-BR')}"`,
      `"${m.tipo}"`,
      `"${m.itemCodigo}"`,
      `"${m.itemNome}"`,
      `"${m.tipoItem}"`,
      m.quantidadeContagem,
      `"${m.unidade}"`,
      m.totalUnidades,
      m.contagemAnterior,
      m.contagemNova,
      `"${m.usuarioNome}"`,
      `"${m.motivo || ''}"`
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Histórico de Retiradas e Auditoria</h2>
              <p className="text-xs text-slate-400">
                Acompanhamento completo de quem retirou materiais e conferências feitas no galpão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3 h-3 text-amber-400" />
                <span>Tabela</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Cards</span>
              </button>
            </div>

            <button
              onClick={exportMovementsCSV}
              className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar item ou responsável..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Funcionários ({users.length})</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.role})
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Tipos de Registro</option>
            <option value="retirada">Apenas Retiradas</option>
            <option value="entrada">Apenas Entradas</option>
            <option value="ajuste_contagem">Ajustes de Contagem</option>
          </select>
        </div>
      </div>

      {/* View Mode 1: Table */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3 text-right">Qtd Movimentada</th>
                  <th className="py-3 px-3 text-right">Total Peças</th>
                  <th className="py-3 px-3 text-center">Antes → Depois</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Motivo / Local</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Nenhuma movimentação registrada correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => {
                    const isRetirada = m.tipo === 'retirada';
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(m.dataHora).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isRetirada ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 w-max">
                              <ArrowDownLeft className="w-3 h-3 text-amber-400" />
                              <span>Retirada</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1 w-max">
                              <RotateCcw className="w-3 h-3 text-blue-400" />
                              <span>Ajuste / Entrada</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-white leading-tight">
                            {m.itemNome}
                          </div>
                          <div className="text-[11px] text-amber-400 font-mono">
                            {m.itemCodigo}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                          <span className={isRetirada ? 'text-amber-400' : 'text-emerald-400'}>
                            {isRetirada ? '-' : '+'}{m.quantidadeContagem} {m.unidade.slice(0, 3)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200 whitespace-nowrap tabular-nums">
                          {m.totalUnidades.toLocaleString('pt-BR')} un
                        </td>

                        <td className="py-3 px-3 text-center font-mono whitespace-nowrap tabular-nums text-slate-400">
                          <span>{m.contagemAnterior}</span>
                          <span className="mx-1 text-slate-600">→</span>
                          <span className="text-white font-bold">{m.contagemNova}</span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.usuarioNome}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate" title={m.motivo}>
                          {m.motivo || '-'}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setMovementToDelete(m);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Excluir lançamento errado e corrigir saldo no estoque"
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Excluir</span>
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
        /* View Mode 2: Cards Timeline */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMovements.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            filteredMovements.map(m => {
              const isRetirada = m.tipo === 'retirada';
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(m.dataHora).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isRetirada ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3 text-amber-400" />
                        <span>Retirada</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-blue-400" />
                        <span>Ajuste</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{m.itemNome}</h3>
                    <span className="font-mono text-xs text-amber-400">{m.itemCodigo}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Quantidade</span>
                      <span className={`text-sm font-black ${isRetirada ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isRetirada ? '-' : '+'}{m.quantidadeContagem} {m.unidade}s
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">Total Peças</span>
                      <span className="text-sm font-black text-slate-200">
                        {m.totalUnidades.toLocaleString('pt-BR')} un
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-200 font-medium">{m.usuarioNome}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      {m.contagemAnterior} → {m.contagemNova}
                    </span>
                  </div>

                  {m.motivo && (
                    <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg">
                      Motivo: {m.motivo}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMovementToDelete(m);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Excluir lançamento errado e corrigir saldo no estoque"
                      className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Excluir Lançamento Errado</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Action Success Toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Delete Movement Modal */}
      <DeleteMovementModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMovementToDelete(null);
        }}
        movement={movementToDelete}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setTimeout(() => setSuccessMsg(''), 6000);
        }}
      />
    </div>
  );
};
