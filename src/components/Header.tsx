import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { InstallAppModal } from './common/InstallAppModal';
import {
  Warehouse,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Lock,
  FileSpreadsheet,
  Calendar,
  History,
  Users,
  Zap,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  MessageSquare,
  Camera,
  Crown,
  KeyRound,
  Database,
  Download
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'auxiliar' | 'tabela' | 'delphi' | 'cobertura' | 'historico' | 'usuarios' | 'chat';
  setActiveTab: (tab: 'auxiliar' | 'tabela' | 'delphi' | 'cobertura' | 'historico' | 'usuarios' | 'chat') => void;
  onOpenLogin: () => void;
  onOpenChatModal?: () => void;
  onOpenProfileModal?: () => void;
  isWideScreen?: boolean;
  setIsWideScreen?: (wide: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenChatModal,
  onOpenProfileModal,
  isWideScreen = true,
  setIsWideScreen
}) => {
  const {
    currentUser,
    logout,
    audioFeedbackEnabled,
    setAudioFeedbackEnabled,
    kpis,
    coverageBucketsCount,
    unreadMessagesCount
  } = useStock();

  const isGestor = currentUser?.role === 'gestor';
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Zone 1: Logo & Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                    Controle de Estoque
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VIX1
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Almoxarifado, Embalagens & Insumos
                </span>
              </div>
            </div>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
              <button
                onClick={() => setActiveTab('auxiliar')}
                className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'auxiliar'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Retirada Rápida</span>
                <span className="text-[10px] opacity-75 font-normal">(Auxiliares)</span>
              </button>

              {isGestor ? (
                <>
                  <button
                    onClick={() => setActiveTab('tabela')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'tabela'
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Planilha Geral</span>
                    {kpis.itensZerados > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500/25 text-rose-300 text-[10px] font-black flex items-center justify-center border border-rose-500/40">
                        {kpis.itensZerados}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('delphi')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'delphi'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Delphi</span>
                    <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Auto
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('cobertura')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'cobertura'
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cobertura (Insumos)</span>
                    {coverageBucketsCount['0_a_3'] > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500/25 text-rose-300 text-[10px] font-black flex items-center justify-center border border-rose-500/40">
                        {coverageBucketsCount['0_a_3']}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 relative ${
                      activeTab === 'chat'
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ocorrências & Fotos</span>
                    {unreadMessagesCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('historico')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'historico'
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Histórico</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`px-3 py-2 text-xs lg:text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'usuarios'
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Usuários</span>
                  </button>
                </>
              ) : (
                /* Auxiliary Quick Chat Trigger in header */
                <button
                  onClick={() => {
                    if (onOpenChatModal) onOpenChatModal();
                    else setActiveTab('chat');
                  }}
                  className="px-3 py-2 text-xs lg:text-sm font-semibold rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Enviar Foto ao Gestor</span>
                </button>
              )}
            </nav>

            {/* Zone 3: Actions & User Info */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Wide Screen Toggle for Desktop */}
              {setIsWideScreen && (
                <button
                  onClick={() => setIsWideScreen(!isWideScreen)}
                  title={isWideScreen ? 'Visualização Larga (Tamanho Máximo do Monitor)' : 'Visualização Padrão'}
                  className="hidden xl:flex items-center gap-1 p-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-700/60 transition-colors"
                >
                  {isWideScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isWideScreen ? 'Tela Cheia' : 'Padrão'}</span>
                </button>
              )}

              {/* Chat trigger button (Visible on mobile header) */}
              <button
                onClick={() => {
                  if (onOpenChatModal) onOpenChatModal();
                  else setActiveTab('chat');
                }}
                title="Mensagens & Fotos"
                className="md:hidden relative p-2 rounded-xl text-slate-300 bg-slate-800/60 border border-slate-700"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Baixar App Android Button */}
              <button
                onClick={() => setIsInstallModalOpen(true)}
                title="Baixar App no Celular Android"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 shadow-sm transition-all shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Baixar App Android</span>
                <span className="lg:hidden text-[11px]">Baixar App</span>
              </button>

              {/* Audio Voice Feedback Toggle */}
              <button
                onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                title={audioFeedbackEnabled ? 'Voz ativada (Clique para silenciar)' : 'Voz desativada (Clique para ativar)'}
                className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 ${
                  audioFeedbackEnabled
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                {audioFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden lg:inline text-[11px]">Voz</span>
              </button>

              {/* User Profile or Login Trigger */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 py-1.5 shadow-sm">
                  <div
                    onClick={() => {
                      if (currentUser.role === 'gestor' && onOpenProfileModal) {
                        onOpenProfileModal();
                      } else {
                        onOpenLogin();
                      }
                    }}
                    className={`w-7 h-7 rounded-lg ${
                      currentUser.avatarColor || 'bg-amber-600'
                    } flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer hover:opacity-90 transition-opacity`}
                    title={currentUser.role === 'gestor' ? "Clique para alterar seu nome e senha" : "Perfil"}
                  >
                    {currentUser.nome.charAt(0)}
                  </div>
                  <div
                    onClick={() => {
                      if (currentUser.role === 'gestor' && onOpenProfileModal) {
                        onOpenProfileModal();
                      } else {
                        onOpenLogin();
                      }
                    }}
                    className="hidden sm:block text-left leading-tight pr-1 cursor-pointer hover:opacity-90 transition-opacity"
                    title={currentUser.role === 'gestor' ? "Clique para alterar seu nome e senha" : "Perfil"}
                  >
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[100px] lg:max-w-[130px] flex items-center gap-1">
                      <span>{currentUser.nome}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold capitalize flex items-center gap-1">
                      {currentUser.role === 'gestor' && <Crown className="w-2.5 h-2.5" />}
                      <span>{currentUser.role === 'gestor' ? 'Gestor' : 'Auxiliar'}</span>
                    </div>
                  </div>

                  {currentUser.role === 'gestor' && onOpenProfileModal && (
                    <button
                      onClick={onOpenProfileModal}
                      title="Alterar meu nome e senha de gestor"
                      className="p-1 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={onOpenLogin}
                    title="Trocar usuário / Entrar como Gestor"
                    className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700/60 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={logout}
                    title="Sair da conta"
                    className="p-1 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Sticky Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/98 border-t border-slate-800 backdrop-blur-xl px-1.5 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {/* Auxiliar Retirada */}
        <button
          onClick={() => setActiveTab('auxiliar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'auxiliar'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Retirar</span>
        </button>

        {isGestor ? (
          <>
            {/* Planilha Geral (Gestor Only) */}
            <button
              onClick={() => setActiveTab('tabela')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'tabela'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-none">Estoque</span>
              {kpis.itensZerados > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                  {kpis.itensZerados}
                </span>
              )}
            </button>

            {/* Delphi (Mobile) */}
            <button
              onClick={() => setActiveTab('delphi')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'delphi'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-none">Delphi</span>
            </button>

            {/* Cobertura Insumos */}
            <button
              onClick={() => setActiveTab('cobertura')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'cobertura'
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-none">Cobertura</span>
              {coverageBucketsCount['0_a_3'] > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                  {coverageBucketsCount['0_a_3']}
                </span>
              )}
            </button>

            {/* Chat / Enviar Fotos */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                activeTab === 'chat'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-none">Fotos</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Usuários ou Equipe */}
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'usuarios'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-none">Equipe</span>
            </button>
          </>
        ) : (
          <>
            {/* Auxiliar Mobile: Baixar App Android */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-amber-300 hover:text-amber-200"
            >
              <Download className="w-5 h-5 mb-0.5 text-amber-400" />
              <span className="text-[10px] leading-none">Baixar App</span>
            </button>

            {/* Auxiliar Mobile: Enviar Foto ao Gestor */}
            <button
              onClick={() => {
                if (onOpenChatModal) onOpenChatModal();
              }}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-amber-300 hover:text-amber-200 relative"
            >
              <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
              <span className="text-[10px] leading-none">Enviar Foto</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Auxiliar Mobile: Trocar Operador */}
            <button
              onClick={onOpenLogin}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-slate-400 hover:text-slate-200"
            >
              <User className="w-5 h-5 mb-0.5 text-slate-400" />
              <span className="text-[10px] leading-none">Trocar</span>
            </button>

            {/* Auxiliar Mobile: Acesso Gestor (abre o modal de login) */}
            <button
              onClick={onOpenLogin}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-slate-400 hover:text-amber-400"
            >
              <Lock className="w-5 h-5 mb-0.5 text-amber-400/70" />
              <span className="text-[10px] leading-none text-slate-300">Gestor</span>
            </button>
          </>
        )}
      </nav>

      {/* Modal Baixar App Android Mobile */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
};
