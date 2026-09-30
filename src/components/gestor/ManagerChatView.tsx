import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { MessageStatus, MessageCategory } from '../../types';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Check,
  CheckCheck,
  Filter,
  Image as ImageIcon,
  User,
  Package,
  HelpCircle,
  Flame,
  ArrowRight
} from 'lucide-react';

export const ManagerChatView: React.FC = () => {
  const {
    messages,
    responderMensagem,
    marcarMensagemStatus,
    marcarTodasMensagensLidas,
    unreadMessagesCount
  } = useStock();

  const [filterStatus, setFilterStatus] = useState<'all' | MessageStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          m.text.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          (m.relatedItemCode && m.relatedItemCode.toLowerCase().includes(q)) ||
          (m.relatedItemName && m.relatedItemName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [messages, filterStatus, filterCategory, searchTerm]);

  const handleReply = (messageId: string) => {
    const text = replyTextMap[messageId];
    if (!text || !text.trim()) return;

    responderMensagem(messageId, text);
    setReplyTextMap(prev => ({ ...prev, [messageId]: '' }));
  };

  const getCategoryBadge = (cat: MessageCategory) => {
    switch (cat) {
      case 'avaria':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Package className="w-3 h-3 text-rose-400" />
            <span>Avaria / Dano</span>
          </span>
        );
      case 'estoque_zerado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3 text-orange-400 animate-pulse" />
            <span>Material Zerado</span>
          </span>
        );
      case 'divergencia':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Divergência Contagem</span>
          </span>
        );
      case 'duvida':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <HelpCircle className="w-3 h-3 text-blue-400" />
            <span>Dúvida Operacional</span>
          </span>
        );
      case 'urgencia':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-600/30">
            <Flame className="w-3 h-3 text-red-400 animate-bounce" />
            <span>Urgente</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            <span>Geral</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Comunicação Operacional com Auxiliares
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Ocorrências & Fotos do Almoxarifado
            </h2>
            <p className="text-xs text-slate-400">
              Fotos de avarias, pedidos de reposição e avisos enviados pelos funcionários no galpão.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadMessagesCount > 0 && (
            <button
              onClick={marcarTodasMensagensLidas}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Marcar Todas como Lidas</span>
            </button>
          )}

          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Não lidas:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{unreadMessagesCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por funcionário, mensagem ou código do item..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({messages.length})
            </button>

            <button
              onClick={() => setFilterStatus('pendente')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'pendente'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Pendentes ({messages.filter(m => m.status === 'pendente').length})
            </button>

            <button
              onClick={() => setFilterStatus('em_analise')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'em_analise'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              Em Análise ({messages.filter(m => m.status === 'em_analise').length})
            </button>

            <button
              onClick={() => setFilterStatus('resolvido')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'resolvido'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Resolvidos ({messages.filter(m => m.status === 'resolvido').length})
            </button>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">Nenhuma mensagem encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          filteredMessages.map(msg => {
            const hasPhoto = Boolean(msg.photoUrl);
            const isUnread = !msg.readByGestor;

            return (
              <div
                key={msg.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-4 shadow-xl ${
                  isUnread
                    ? 'bg-amber-950/15 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Header: Sender info, category badge, timestamp and status selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        msg.senderAvatar || 'bg-amber-600'
                      } flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md`}
                    >
                      {msg.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-400 capitalize px-1.5 py-0.5 rounded bg-slate-800">
                          {msg.senderRole}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(msg.category)}

                    {/* Status dropdown */}
                    <select
                      value={msg.status}
                      onChange={e => marcarMensagemStatus(msg.id, e.target.value as MessageStatus)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold border focus:outline-none transition-colors ${
                        msg.status === 'resolvido'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : msg.status === 'em_analise'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <option value="pendente" className="bg-slate-900 text-amber-300">Pendente</option>
                      <option value="em_analise" className="bg-slate-900 text-blue-300">Em Análise</option>
                      <option value="resolvido" className="bg-slate-900 text-emerald-300">Resolvido</option>
                    </select>
                  </div>
                </div>

                {/* Referenced Item Code / Name */}
                {msg.relatedItemCode && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400">Material Referenciado:</span>
                    <strong className="text-amber-400 font-mono">{msg.relatedItemCode}</strong>
                    {msg.relatedItemName && (
                      <span className="text-white font-bold">({msg.relatedItemName})</span>
                    )}
                  </div>
                )}

                {/* Message Text */}
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  {msg.text}
                </div>

                {/* Attached Photo (with 1-click zoom preview) */}
                {hasPhoto && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Foto da Ocorrência no Galpão (Clique para ampliar):</span>
                    </span>
                    <div className="inline-block relative rounded-2xl overflow-hidden border border-slate-700 group cursor-pointer">
                      <img
                        src={msg.photoUrl}
                        alt="Foto da ocorrência"
                        onClick={() => setZoomPhotoUrl(msg.photoUrl || null)}
                        className="max-h-60 rounded-2xl object-cover hover:scale-102 transition-transform duration-200"
                      />
                      <div
                        onClick={() => setZoomPhotoUrl(msg.photoUrl || null)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Foto em Tela Cheia</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Replies */}
                {msg.replies && msg.replies.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Respostas Enviadas:
                    </span>
                    {msg.replies.map(rep => (
                      <div key={rep.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>{rep.senderName} ({rep.senderRole})</span>
                          </span>
                          <span>{new Date(rep.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-200">{rep.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyTextMap[msg.id] || ''}
                    onChange={e => setReplyTextMap(prev => ({ ...prev, [msg.id]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleReply(msg.id);
                    }}
                    placeholder={`Responder para ${msg.senderName} (ex: 'Recebido', 'Já autorizei reposição no Box 3')...`}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />

                  <button
                    onClick={() => handleReply(msg.id)}
                    className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Responder</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Zoom Photo Modal */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomPhotoUrl}
              alt="Foto ampliada da ocorrência"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              Clique em qualquer lugar para fechar a visualização
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
