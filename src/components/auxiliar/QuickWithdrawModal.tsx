import React, { useState } from 'react';
import { StockItem } from '../../types';
import { useStock } from '../../context/StockContext';
import { X, Minus, Plus, CheckCircle, AlertTriangle, Layers, Package, Volume2 } from 'lucide-react';

interface QuickWithdrawModalProps {
  item: StockItem | null;
  onClose: () => void;
}

export const QuickWithdrawModal: React.FC<QuickWithdrawModalProps> = ({ item, onClose }) => {
  const { retirarItem, playAudioFeedback } = useStock();
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!item) return null;

  const maxAvailable = item.contagem;
  const totalUnits = quantity * item.multiplo;

  const handleIncrement = (amount = 1) => {
    if (quantity + amount <= maxAvailable) {
      setQuantity(prev => prev + amount);
      setErrorMsg('');
    } else {
      setErrorMsg(`Quantidade máxima disponível no momento é ${maxAvailable} ${item.unidadeContagem}s.`);
    }
  };

  const handleDecrement = (amount = 1) => {
    if (quantity - amount >= 1) {
      setQuantity(prev => prev - amount);
      setErrorMsg('');
    }
  };

  const handleConfirm = () => {
    if (quantity <= 0) {
      setErrorMsg('Escolha pelo menos 1 unidade para retirar.');
      return;
    }

    if (quantity > maxAvailable) {
      setErrorMsg(`Estoque insuficiente. Temos apenas ${maxAvailable} ${item.unidadeContagem}s.`);
      return;
    }

    // A retirada se trata sempre de reposição de bancada
    const res = retirarItem(item.id, quantity, 'Reposição de Bancada');
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
                Retirar do Estoque
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                {item.nomeItem}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Item details card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">{item.codigo}</span>
              <span className="text-slate-400">{item.tipo} · {item.fornecedor}</span>
            </div>
            <p className="text-sm font-medium text-slate-200 line-clamp-2">
              {item.descricao}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                1 {item.unidadeContagem} = <strong className="text-white">{item.multiplo.toLocaleString('pt-BR')} unidades</strong>
              </span>
              <span className="font-semibold text-emerald-400">
                Tem no estoque: <span className="font-mono text-sm">{maxAvailable}</span> {item.unidadeContagem}(s)
              </span>
            </div>
          </div>

          {maxAvailable === 0 ? (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <div className="font-bold text-base">ESTOQUE ZERADO!</div>
              <p className="text-xs text-rose-200">
                Não é possível retirar este item pois o estoque atual é 0. Avise o Gestor.
              </p>
            </div>
          ) : (
            <>
              {/* Stepper with giant buttons */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
                  Quantos <span className="text-amber-400 font-bold">{item.unidadeContagem}s</span> você vai retirar?
                </label>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDecrement(1)}
                    disabled={quantity <= 1}
                    className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all text-white flex items-center justify-center border border-slate-700 shadow-lg text-2xl font-bold"
                  >
                    <Minus className="w-7 h-7" />
                  </button>

                  <div className="flex-1 max-w-[180px] h-20 rounded-2xl bg-slate-950 border-2 border-amber-500/50 flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="font-mono text-3xl font-black text-amber-400 tabular-nums">
                      {quantity}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {quantity === 1 ? item.unidadeContagem : `${item.unidadeContagem}s`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleIncrement(1)}
                    disabled={quantity >= maxAvailable}
                    className="w-16 h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all text-slate-950 flex items-center justify-center shadow-lg text-2xl font-bold"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                </div>

                {/* Quick preset buttons for instant 1-tap selection */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 5, 10].map(val => {
                    if (val > maxAvailable && val !== 1) return null;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setQuantity(Math.min(val, maxAvailable));
                          setErrorMsg('');
                        }}
                        className={`h-11 rounded-xl text-xs font-bold border transition-colors ${
                          quantity === val
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        +{val} {item.unidadeContagem.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live calculated units preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-xs text-slate-400">Total de peças computadas:</div>
                <div className="text-lg font-bold text-amber-300 font-mono">
                  {totalUnits.toLocaleString('pt-BR')} unidades
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Sobrarão no estoque: <strong className="text-slate-200">{maxAvailable - quantity} {item.unidadeContagem}(s)</strong>
                </div>
              </div>

              {/* Informação simplificada: sempre reposição de bancada */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-slate-400">Finalidade do registro:</span>
                <span className="font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  Reposição de Bancada
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Confirmation Action */}
        {maxAvailable > 0 && !successMsg && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50"
            >
              <CheckCircle className="w-6 h-6" />
              <span>CONFIRMAR RETIRADA ({quantity} {item.unidadeContagem})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
