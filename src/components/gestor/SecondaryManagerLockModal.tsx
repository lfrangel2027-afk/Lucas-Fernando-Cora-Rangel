import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  X,
  CheckCircle,
  AlertCircle,
  Send,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface SecondaryManagerLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
  onUnlockedSuccess?: () => void;
}

export const SecondaryManagerLockModal: React.FC<SecondaryManagerLockModalProps> = ({
  isOpen,
  onClose,
  actionTitle = 'Esta ação de alteração ou exclusão',
  onUnlockedSuccess
}) => {
  const {
    mainGestorName,
    liberarComSenhaGestorPrincipal,
    solicitarLiberacaoGestorPrincipal,
    currentUser
  } = useStock();

  const [passwordInput, setPasswordInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'senha' | 'solicitar'>('senha');

  if (!isOpen) return null;

  const handleUnlockWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = liberarComSenhaGestorPrincipal(passwordInput);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
        if (onUnlockedSuccess) onUnlockedSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = solicitarLiberacaoGestorPrincipal(reasonInput || `Liberação para ${actionTitle}`);
    if (res.success) {
      setRequestSent(true);
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Acesso Restrito ao Gestor Principal
              </h3>
              <p className="text-[11px] text-slate-400">
                Apenas o gestor principal pode alterar ou excluir dados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-200">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Regra de Segurança do Sistema:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Os gestores secundários possuem permissão para <strong>visualizar todas as informações e exportar relatórios em Excel, CSV e PDF</strong>.
              Para alterar ou excluir informações, é necessário pedir acesso ao gestor principal (<strong>{mainGestorName}</strong>), que poderá fornecer a senha ou liberar o acesso.
            </p>
          </div>

          {/* Switcher Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('senha')}
              className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'senha'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Digitar Senha</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('solicitar')}
              className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'solicitar'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Pedir Liberação</span>
            </button>
          </div>

          {/* Tab 1: Enter Main Manager Password */}
          {activeTab === 'senha' && (
            <form onSubmit={handleUnlockWithPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha do Gestor Principal ({mainGestorName}):
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha de liberação"
                  autoFocus
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono tracking-widest text-center text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Solicite a senha ao gestor principal para liberar as alterações.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>Confirmar & Liberar Acesso</span>
              </button>
            </form>
          )}

          {/* Tab 2: Send Request to Main Manager */}
          {activeTab === 'solicitar' && (
            <form onSubmit={handleSendRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo da Solicitação:
                </label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="Ex: Necessidade de ajustar a contagem física de caixas ou cadastrar novo item..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={requestSent}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{requestSent ? 'Solicitação Enviada!' : 'Enviar Solicitação ao Gestor Principal'}</span>
              </button>
            </form>
          )}

          {/* Quick export reminder */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportações liberadas normalmente</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white underline"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
