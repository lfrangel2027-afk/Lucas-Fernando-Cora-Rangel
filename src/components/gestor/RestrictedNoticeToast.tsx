import React, { useEffect } from 'react';
import { ShieldAlert, Lock, KeyRound, X, ChevronRight } from 'lucide-react';

interface RestrictedNoticeToastProps {
  notice: {
    title: string;
    message: string;
    actionTitle?: string;
    timestamp: number;
  };
  onClose: () => void;
  onOpenUnlockModal: () => void;
}

export const RestrictedNoticeToast: React.FC<RestrictedNoticeToastProps> = ({
  notice,
  onClose,
  onOpenUnlockModal
}) => {
  // Auto-dismiss after 10 seconds if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 left-3 md:left-auto md:right-6 z-50 max-w-lg animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 border-2 border-rose-500/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-slate-100 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                  Acesso Restrito
                </span>
                <span className="text-[11px] text-slate-400">
                  Gestor Secundário
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                {notice.title}: Ação Não Permitida
              </h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          {notice.message}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Apenas consulta e exportação permitidas</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Entendido
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenUnlockModal();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pedir Acesso</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
