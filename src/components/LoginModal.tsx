import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { AppUser } from '../types';
import { X, Lock, KeyRound, Shield, CheckCircle, UserCheck, Crown, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'auxiliar' | 'gestor';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole = 'auxiliar' }) => {
  const { users, currentUser, login, switchUser } = useStock();
  const [activeTab, setActiveTab] = useState<'auxiliares' | 'gestor'>(
    defaultRole === 'gestor' ? 'gestor' : 'auxiliares'
  );

  // Auxiliar login state
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<AppUser | null>(null);
  const [auxPin, setAuxPin] = useState('');
  const [auxError, setAuxError] = useState('');

  // Gestor login state
  const [selectedGestor, setSelectedGestor] = useState<AppUser | null>(null);
  const [gestorUsername, setGestorUsername] = useState('gestor');
  const [gestorPin, setGestorPin] = useState('');
  const [showGestorPin, setShowGestorPin] = useState(false);
  const [gestorError, setGestorError] = useState('');

  if (!isOpen) return null;

  const auxiliares = users.filter(u => u.role === 'auxiliar');
  const gestores = users.filter(u => u.role === 'gestor');

  const handleAuxiliarSelect = (user: AppUser) => {
    setSelectedAuxiliar(user);
    setAuxPin('');
    setAuxError('');
  };

  const handleGestorSelect = (user: AppUser) => {
    setSelectedGestor(user);
    setGestorUsername(user.username);
    setGestorPin('');
    setGestorError('');
  };

  const handleAuxiliarConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuxiliar) return;

    if (auxPin.trim() === selectedAuxiliar.pin) {
      switchUser(selectedAuxiliar);
      onClose();
    } else {
      setAuxError('Senha / PIN incorreto para este auxiliar.');
    }
  };

  const handleGestorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setGestorError('');

    // If a gestor was chosen, or typed username
    const res = login(gestorUsername, gestorPin);
    if (res.success) {
      onClose();
    } else {
      setGestorError(res.message || 'Senha incorreta para o Gestor. Lembre-se: a senha padrão inicial é 9923.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Identificação no Sistema</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/60 border-b border-slate-800 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('auxiliares')}
            className={`py-2.5 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'auxiliares'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Auxiliares ({auxiliares.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gestor')}
            className={`py-2.5 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'gestor'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Acesso Gestor ({gestores.length})</span>
          </button>
        </div>

        {/* Auxiliares Tab Content */}
        {activeTab === 'auxiliares' && (
          <div className="p-6">
            <p className="text-xs text-slate-400 mb-3">
              Toque no seu nome para registrar retiradas ou contagens no estoque:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 max-h-56 overflow-y-auto pr-1">
              {auxiliares.map(aux => {
                const isSelected = selectedAuxiliar?.id === aux.id;
                const isCurrent = currentUser?.id === aux.id;
                return (
                  <button
                    key={aux.id}
                    type="button"
                    onClick={() => handleAuxiliarSelect(aux)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        aux.avatarColor || 'bg-blue-600'
                      } flex items-center justify-center text-xs font-bold text-white shrink-0`}
                    >
                      {aux.nome.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{aux.nome}</span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Usuário Atual" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">@{aux.username}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAuxiliar ? (
              <form onSubmit={handleAuxiliarConfirmLogin} className="space-y-3.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Entrando como <strong className="text-white">{selectedAuxiliar.nome}</strong>:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Senha padrão: <strong>{selectedAuxiliar.pin}</strong>)
                  </span>
                </div>

                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Digite seu PIN / Senha"
                    value={auxPin}
                    onChange={e => setAuxPin(e.target.value)}
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-center tracking-widest text-base font-mono"
                  />
                </div>

                {auxError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                    {auxError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      switchUser(selectedAuxiliar);
                      onClose();
                    }}
                    className="flex-1 h-11 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Entrar Rápido (1 Toque)
                  </button>

                  <button
                    type="submit"
                    className="flex-1 h-11 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Senha</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400">
                Toque em um dos auxiliares acima para começar
              </div>
            )}
          </div>
        )}

        {/* Gestor Tab Content */}
        {activeTab === 'gestor' && (
          <form onSubmit={handleGestorLogin} className="p-6 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              <strong className="block font-semibold mb-0.5">Acesso Restrito ao Gestor</strong>
              O gestor principal pode alterar seu nome e senha, e criar acessos adicionais para outros gestores.
            </div>

            {/* Quick selector if multiple managers exist */}
            {gestores.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Selecione o Gestor:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {gestores.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGestorSelect(g)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        gestorUsername.toLowerCase() === g.username.toLowerCase()
                          ? 'border-amber-500 bg-amber-500/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">{g.nome}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{g.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Usuário do Gestor:
              </label>
              <input
                type="text"
                value={gestorUsername}
                onChange={e => setGestorUsername(e.target.value)}
                placeholder="Ex: gestor"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Senha de Acesso:
              </label>
              <div className="relative">
                <input
                  type={showGestorPin ? 'text' : 'password'}
                  value={gestorPin}
                  onChange={e => setGestorPin(e.target.value)}
                  placeholder="Digite a senha cadastrada"
                  autoFocus
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowGestorPin(!showGestorPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showGestorPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Senha padrão inicial para novas instalações: <strong className="text-amber-400 font-mono">9923</strong>.
              </span>
            </div>

            {gestorError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                {gestorError}
              </p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                className="w-full h-12 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <Lock className="w-4 h-4" />
                <span>Entrar no Painel do Gestor</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
