import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { StockItem, StockMovement, CategoryType } from '../../types';
import { QuickWithdrawModal } from './QuickWithdrawModal';
import { DeleteMovementModal } from '../common/DeleteMovementModal';
import {
  Package,
  Layers,
  Tag,
  Gift,
  Shield,
  Search,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
  Camera,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Undo2
} from 'lucide-react';

interface AuxiliarViewProps {
  onOpenLogin: () => void;
  onOpenChatModal?: (item?: StockItem | null) => void;
}

export const AuxiliarView: React.FC<AuxiliarViewProps> = ({ onOpenLogin, onOpenChatModal }) => {
  const { items, currentUser, movements, kpis, messages } = useStock();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemForWithdraw, setActiveItemForWithdraw] = useState<StockItem | null>(null);
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Categories config
  const categories: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'Tudo', icon: <Layers className="w-4 h-4" />, color: 'from-amber-500 to-amber-600' },
    { id: 'Caixa', label: 'Caixas', icon: <Package className="w-4 h-4" />, color: 'from-orange-500 to-orange-600' },
    { id: 'Polibag', label: 'Polibags (PM)', icon: <Package className="w-4 h-4" />, color: 'from-blue-500 to-blue-600' },
    { id: 'Polijiffy', label: 'Polijiffy (PJ)', icon: <Package className="w-4 h-4" />, color: 'from-indigo-500 to-indigo-600' },
    { id: 'Etiqueta', label: 'Etiquetas', icon: <Tag className="w-4 h-4" />, color: 'from-emerald-500 to-emerald-600' },
    { id: 'Gift Wrap', label: 'Presente', icon: <Gift className="w-4 h-4" />, color: 'from-pink-500 to-pink-600' },
    { id: 'Prep', label: 'Prep / Bolsas', icon: <Shield className="w-4 h-4" />, color: 'from-teal-500 to-teal-600' },
    { id: 'Outros', label: 'Fitas & Outros', icon: <Layers className="w-4 h-4" />, color: 'from-purple-500 to-purple-600' },
  ];

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'all' && item.tipo !== selectedCategory) {
        return false;
      }
      if (hideZeroStock && item.contagem === 0) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.nomeItem.toLowerCase().includes(query);
        const matchesCode = item.codigo.toLowerCase().includes(query);
        const matchesDesc = item.descricao.toLowerCase().includes(query);
        const matchesSupplier = item.fornecedor.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesDesc || matchesSupplier;
      }
      return true;
    });
  }, [items, selectedCategory, hideZeroStock, searchTerm]);

  // Recent movements by this user or overall
  const recentWithdrawals = useMemo(() => {
    return movements
      .filter(m => m.tipo === 'retirada')
      .slice(0, 6);
  }, [movements]);

  // My messages sent to gestor
  const myMessagesCount = useMemo(() => {
    return messages.filter(m => m.senderId === currentUser?.id).length;
  }, [messages, currentUser]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {/* Operator Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${
              currentUser?.avatarColor || 'bg-amber-600'
            } text-white flex items-center justify-center text-xl font-black shadow-lg shadow-amber-950/40 shrink-0`}
          >
            {currentUser ? currentUser.nome.charAt(0) : '?'}
          </div>
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Área de Retirada do Almoxarifado
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Olá, {currentUser ? currentUser.nome : 'Visitante'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Selecione o item abaixo e aperte no botão grande para registrar a saída.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onOpenChatModal && (
            <button
              onClick={() => onOpenChatModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Enviar Foto ao Gestor</span>
            </button>
          )}

          <button
            onClick={onOpenLogin}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Trocar Operador</span>
          </button>
        </div>
      </div>

      {/* Prominent Chat & Camera Alert Banner for Auxiliares */}
      {onOpenChatModal && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  Canal Direto com o Gestor Geral (Fotos & Recados)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Chat Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Viu algum palete danificado, material que zerou na bancada ou tem alguma dúvida? Tire uma foto e envie direto para o gestor.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChatModal()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 whitespace-nowrap self-start sm:self-auto"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Abrir Chat & Câmera</span>
            {myMessagesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                {myMessagesCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Category Pills / Large touch selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            1. Escolha a Categoria:
          </span>
          <span className="text-slate-500">
            {filteredItems.length} {filteredItems.length === 1 ? 'item disponível' : 'itens disponíveis'}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102 ring-2 ring-amber-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome (ex: 12, PM1, SLAM, Plástico Bolha...)"
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setHideZeroStock(!hideZeroStock)}
            className={`h-12 px-4 rounded-2xl text-xs font-semibold border flex items-center gap-2 transition-colors ${
              hideZeroStock
                ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Ocultar Zerados</span>
          </button>
        </div>
      </div>

      {/* Items Grid - Large, tactile cards */}
      <div className="space-y-2">
        <div className="text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider text-slate-300">
          2. Toque no item para Retirar ou Enviar Foto de Problema:
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-base font-bold text-slate-300">Nenhum item encontrado</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente trocar a categoria selecionada ou limpar o texto de busca acima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map(item => {
              const isZero = item.contagem === 0;
              const isLow = item.contagem > 0 && item.contagem <= 2;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between p-4 relative overflow-hidden ${
                    isZero
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                      : isLow
                      ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Top line info */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        {item.codigo}
                      </span>
                      
                      {/* Quick Report photo button for this specific item */}
                      {onOpenChatModal && (
                        <button
                          type="button"
                          onClick={() => onOpenChatModal(item)}
                          title="Enviar foto ou aviso sobre este item para o gestor"
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700/80 transition-colors flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>Reportar</span>
                        </button>
                      )}
                    </div>

                    {/* Big Item Title */}
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight my-1">
                      {item.nomeItem}
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
                      {item.descricao}
                    </p>
                  </div>

                  {/* Stock count and withdraw button */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        1 {item.unidadeContagem} = {item.multiplo.toLocaleString('pt-BR')} un
                      </span>

                      {isZero ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px]">
                          ZERADO
                        </span>
                      ) : (
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.contagem} {item.unidadeContagem}(s)
                        </span>
                      )}
                    </div>

                    {/* Big Touch Withdrawal Button */}
                    <button
                      type="button"
                      onClick={() => setActiveItemForWithdraw(item)}
                      disabled={isZero}
                      className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        isZero
                          ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                          : 'bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 shadow-lg shadow-amber-950/40'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>{isZero ? 'Sem Estoque' : `Retirar ${item.unidadeContagem}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Success Notification Toast / Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="p-1 rounded text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Recent Withdrawals (Confirmação e opção de exclusão para o auxiliar) */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Últimas Retiradas Registradas</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Errou na contagem ou no item? Toque em <strong className="text-rose-400">"Excluir Lançamento Errado"</strong> para devolver ao estoque e corrigir o sistema.
            </p>
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            Total hoje: <strong className="text-slate-300">{kpis.totalRetiradasHoje}</strong>
          </span>
        </div>

        {recentWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            Nenhuma retirada registrada ainda neste turno.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentWithdrawals.map(mov => (
              <div
                key={mov.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 text-xs transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{mov.itemNome}</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {mov.itemCodigo} · {mov.tipoItem}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Por <strong className="text-slate-300">{mov.usuarioNome}</strong> às {new Date(mov.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-400 text-sm block">
                      -{mov.quantidadeContagem} {mov.unidade.slice(0, 3)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ({mov.totalUnidades.toLocaleString('pt-BR')} un)
                    </span>
                  </div>
                </div>

                {/* Excluir Lançamento Errado Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    Lançado por engano?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementToDelete(mov);
                      setIsDeleteModalOpen(true);
                    }}
                    title="Excluir este lançamento e devolver a quantidade ao estoque"
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Excluir Lançamento Errado</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Withdraw Modal */}
      {activeItemForWithdraw && (
        <QuickWithdrawModal
          item={activeItemForWithdraw}
          onClose={() => setActiveItemForWithdraw(null)}
        />
      )}

      {/* Delete Movement Confirmation Modal (Correção de Lançamento Errado) */}
      <DeleteMovementModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMovementToDelete(null);
        }}
        movement={movementToDelete}
        onSuccess={(msg) => {
          setActionSuccessMsg(msg);
          setTimeout(() => {
            setActionSuccessMsg('');
          }, 6000);
        }}
      />
    </div>
  );
};
