import React, { useState } from 'react';
import { StockMovement } from '../../types';
import { useStock } from '../../context/StockContext';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  User,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DeleteMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
  onSuccess?: (message: string) => void;
}

export const DeleteMovementModal: React.FC<DeleteMovementModalProps> = ({
  isOpen,
  onClose,
  movement,
  onSuccess
}) => {
  const { excluirLancamento } = useStock();
  const [selectedReason, setSelectedReason] = useState<string>('Quantidade digitada errada');
  const [customReason, setCustomReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !movement) return null;

  const quickReasons = [
    'Quantidade digitada errada',
    'Item incorreto selecionado',
    'Lançamento duplicado / em dobro',
    'Desistência da retirada',
    'Outro motivo'
  ];

  const handleConfirmDelete = () => {
    setIsProcessing(true);
    setErrorMsg('');

    const motivoFinal = selectedReason === 'Outro motivo' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    const res = excluirLancamento(movement.id, motivoFinal);
    setIsProcessing(false);

    if (res.success) {
      if (onSuccess) {
        onSuccess(res.message);
      }
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">
                Correção de Estoque
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                Excluir Lançamento Errado
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Item details card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {movement.itemCodigo}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {movement.itemNome}
                </h3>
                <span className="text-xs text-slate-400">
                  Categoria: {movement.tipoItem}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Lançado:</span>
                <span className="text-lg font-black text-rose-400 font-mono">
                  -{movement.quantidadeContagem} {movement.unidade}(s)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  ({movement.totalUnidades.toLocaleString('pt-BR')} unidades)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Registrado por: <strong className="text-slate-200">{movement.usuarioNome}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(movement.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>

          {/* Automatic Stock Restoration Explanation Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Como o sistema irá corrigir as informações:</span>
            </div>
            <ul className="text-slate-300 space-y-1.5 pl-6 list-disc text-xs leading-relaxed">
              <li>
                O saldo físico de <strong className="text-white">{movement.itemNome}</strong> receberá imediatamente <strong className="text-emerald-400">+{movement.quantidadeContagem} {movement.unidade}(s)</strong> ({movement.totalUnidades.toLocaleString('pt-BR')} un) de volta ao estoque.
              </li>
              <li>
                Este lançamento indevido será removido do registro para não distorcer relatórios e histórico.
              </li>
              <li>
                As contagens do sistema ficarão 100% corretas e alinhadas com o galpão.
              </li>
            </ul>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Motivo da exclusão / correção:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickReasons.map(r => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 text-white border-rose-500/60 ring-2 ring-rose-500/20'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {selectedReason === 'Outro motivo' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Descreva o que ocorreu no lançamento..."
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Voltar / Manter Lançamento
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isProcessing}
            className="w-full sm:w-1/2 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir e Devolver ao Estoque</span>
          </button>
        </div>
      </div>
    </div>
  );
};
