import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import {
  Crown,
  KeyRound,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';

interface EditGestorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditGestorModal: React.FC<EditGestorModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, atualizarCredenciaisGestor, playAudioFeedback } = useStock();

  const activeGestor = currentUser?.role === 'gestor'
    ? currentUser
    : users.find(u => u.role === 'gestor') || users[0];

  const [nome, setNome] = useState(activeGestor?.nome || 'Gestor Geral');
  const [username, setUsername] = useState(activeGestor?.username || 'gestor');
  const [pin, setPin] = useState(activeGestor?.pin || '9923');
  const [showPin, setShowPin] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeGestor) {
      setNome(activeGestor.nome);
      setUsername(activeGestor.username);
      setPin(activeGestor.pin);
    }
  }, [activeGestor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!nome.trim() || !username.trim() || !pin.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    const res = atualizarCredenciaisGestor(username, pin, nome, activeGestor?.id);
    if (res.success) {
      setSuccessMsg(`Nome e senha atualizados com sucesso! Você agora é "${nome.trim()}".`);
      playAudioFeedback(`Dados do gestor alterados com sucesso! Nome atualizado para ${nome.trim()}.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCopyCredentials = () => {
    const text = `📋 CREDENCIAIS DO GESTOR - ALMOXARIFADO VIX1\n👤 Nome: ${nome}\n🔑 Usuário: ${username}\n🔒 Senha: ${pin}\n🛡️ Perfil: Gestor Geral\n🌐 Acesso: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Alterar Nome e Senha do Gestor
              </h3>
              <p className="text-[11px] text-slate-400">
                Personalize o nome exibido e altere a senha padrão.
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Você pode alterar o seu nome de <strong>"Gestor Geral"</strong> para o seu nome real e definir a senha que desejar. A senha padrão inicial era <span className="font-mono font-bold text-amber-200">9923</span>.
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Gestor (Como aparecerá nas atas e relatórios):
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Carlos Gestor / Maria Líder Almoxarifado"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Usuário de Login */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Usuário para Login:
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ex: gestor ou seu nome de usuario"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Usado para fazer login no sistema.
            </span>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nova Senha de Acesso:
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Digite sua nova senha desejada"
                required
                className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title={showPin ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Pode ser qualquer número ou palavra.
            </span>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full sm:w-auto px-3.5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Dados'}</span>
            </button>

            <button
              type="submit"
              className="w-full sm:flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
            >
              <KeyRound className="w-4 h-4" />
              <span>Salvar Novo Nome & Senha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
