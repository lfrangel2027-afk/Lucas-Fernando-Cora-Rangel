import React, { useState } from 'react';
import { StockProvider, useStock } from './context/StockContext';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { AuxiliarView } from './components/auxiliar/AuxiliarView';
import { AuxiliarChatModal } from './components/auxiliar/AuxiliarChatModal';
import { GestorDashboard } from './components/gestor/GestorDashboard';
import { EditGestorModal } from './components/gestor/EditGestorModal';
import { SecondaryManagerLockModal } from './components/gestor/SecondaryManagerLockModal';
import { RestrictedNoticeToast } from './components/gestor/RestrictedNoticeToast';
import { StockItem } from './types';
import { Lock, KeyRound, Monitor, Smartphone } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    users,
    login,
    switchUser,
    isRestrictedModalOpen,
    setIsRestrictedModalOpen,
    restrictedModalActionTitle,
    restrictedNotice,
    clearRestrictedNotice
  } = useStock();
  const [activeTab, setActiveTab] = useState<'auxiliar' | 'tabela' | 'delphi' | 'cobertura' | 'chat' | 'historico' | 'usuarios'>('auxiliar');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [chatPreselectedItem, setChatPreselectedItem] = useState<StockItem | null>(null);
  const [gestorPassInput, setGestorPassInput] = useState('');
  const [gestorError, setGestorError] = useState('');
  const [isWideScreen, setIsWideScreen] = useState(true);

  const isGestor = currentUser?.role === 'gestor';

  // Ensure an auxiliar user is never on any gestor tab (like 'tabela' / Planilha Geral)
  React.useEffect(() => {
    if (!isGestor && activeTab !== 'auxiliar') {
      setActiveTab('auxiliar');
    }
  }, [isGestor, activeTab]);

  const handleOpenChat = (item?: StockItem | null) => {
    setChatPreselectedItem(item || null);
    setIsChatModalOpen(true);
  };

  const handleTabChange = (tab: 'auxiliar' | 'tabela' | 'delphi' | 'cobertura' | 'chat' | 'historico' | 'usuarios') => {
    if (tab === 'chat' && !isGestor) {
      handleOpenChat();
      return;
    }
    if (!isGestor && tab !== 'auxiliar') {
      setIsLoginModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleQuickGestorUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = gestorPassInput.trim();

    // Check if the pin matches ANY registered manager
    const matchedGestor = users.find(u => u.role === 'gestor' && u.pin === pin);
    if (matchedGestor) {
      switchUser(matchedGestor);
      setGestorPassInput('');
      setGestorError('');
      if (activeTab === 'auxiliar') {
        setActiveTab('tabela');
      }
      return;
    }

    // Try standard login
    const res = login('gestor', pin);
    if (res.success) {
      setGestorPassInput('');
      setGestorError('');
      if (activeTab === 'auxiliar') {
        setActiveTab('tabela');
      }
    } else {
      setGestorError('Senha incorreta! Digite a senha cadastrada para o gestor (padrão inicial: 9923).');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenChatModal={() => handleOpenChat()}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        isWideScreen={isWideScreen}
        setIsWideScreen={setIsWideScreen}
      />

      {/* Main Container - Expands to 1720px on desktop site when isWideScreen is true */}
      <main
        className={`flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-8 transition-all ${
          isWideScreen ? 'max-w-[1720px]' : 'max-w-7xl'
        }`}
      >
        {activeTab === 'auxiliar' ? (
          <AuxiliarView
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenChatModal={handleOpenChat}
          />
        ) : isGestor ? (
          <GestorDashboard
            initialSubTab={activeTab}
            isWideScreen={isWideScreen}
          />
        ) : (
          /* Password gate when non-gestor tries to access Gestor tabs */
          <div className="max-w-md mx-auto my-8 sm:my-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Acesso Exclusivo ao Gestor
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Esta área contém o acompanhamento do estoque, relatório de itens zerados, cobertura de insumos, ocorrências com fotos e gestão da equipe.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 text-left">
              <strong className="block font-semibold">Senha inicial padrão:</strong>
              Digite <span className="font-mono font-bold text-amber-200">9923</span> para entrar pela primeira vez. Caso já tenha alterado sua senha, digite a sua senha atual.
            </div>

            <form onSubmit={handleQuickGestorUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Digite a senha do gestor"
                  value={gestorPassInput}
                  onChange={e => setGestorPassInput(e.target.value)}
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center font-mono tracking-widest text-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              {gestorError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  {gestorError}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <KeyRound className="w-4 h-4" />
                <span>Entrar no Painel do Gestor</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('auxiliar')}
                className="text-slate-400 hover:text-slate-200 underline"
              >
                ← Voltar para a área de retirada dos auxiliares
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer - Hidden on small mobile to avoid interference with bottom nav */}
      <footer className="hidden md:block border-t border-slate-800/80 bg-slate-900/60 py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>Controle de Estoque & Expedição · Almoxarifado Inteligente</span>
            <span className="hidden lg:inline text-slate-700">|</span>
            <span className="hidden lg:inline text-slate-400">Otimizado para Navegador Web & Mobile</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Caixas · Polibags · Etiquetas · Prep</span>
            <span>·</span>
            <span>Unidades: Pallet, Fardo, Rolo</span>
          </div>
        </div>
      </footer>

      {/* Login / Switch user modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Auxiliar Chat & Camera Modal */}
      <AuxiliarChatModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          setChatPreselectedItem(null);
        }}
        preselectedItem={chatPreselectedItem}
      />

      {/* Manager Profile & Password Edit Modal */}
      <EditGestorModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Global Secondary Manager Lock / Restricted Access Modal */}
      <SecondaryManagerLockModal
        isOpen={isRestrictedModalOpen}
        onClose={() => setIsRestrictedModalOpen(false)}
        actionTitle={restrictedModalActionTitle}
      />

      {/* Global Floating Restricted Notice Toast Bar */}
      {restrictedNotice && (
        <RestrictedNoticeToast
          notice={restrictedNotice}
          onClose={clearRestrictedNotice}
          onOpenUnlockModal={() => setIsRestrictedModalOpen(true)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <StockProvider>
      <MainContent />
    </StockProvider>
  );
}
