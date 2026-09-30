import React, { useState, useRef } from 'react';
import { useStock } from '../../context/StockContext';
import { MessageCategory, StockItem } from '../../types';
import {
  MessageSquare,
  Camera,
  Image as ImageIcon,
  Send,
  X,
  AlertTriangle,
  Package,
  HelpCircle,
  Flame,
  CheckCircle2,
  Clock,
  ChevronDown,
  Trash2,
  Paperclip
} from 'lucide-react';

interface AuxiliarChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItem?: StockItem | null;
}

export const AuxiliarChatModal: React.FC<AuxiliarChatModalProps> = ({
  isOpen,
  onClose,
  preselectedItem
}) => {
  const { messages, currentUser, enviarMensagem, items } = useStock();

  const [text, setText] = useState('');
  const [category, setCategory] = useState<MessageCategory>('avaria');
  const [selectedItemCode, setSelectedItemCode] = useState(preselectedItem?.codigo || '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeTab, setActiveTab] = useState<'nova' | 'mensagens'>('nova');
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter messages sent by this user or general
  const myMessages = messages.filter(
    m => m.senderId === currentUser?.id || currentUser?.role === 'gestor'
  );

  // Quick preset templates for workers with writing difficulties
  const quickTemplates = [
    {
      category: 'avaria' as MessageCategory,
      label: 'Palete Danificado',
      text: 'Identifiquei palete com avaria física/caixas amassadas no galpão. Necessita inspeção.',
      icon: <Package className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      category: 'estoque_zerado' as MessageCategory,
      label: 'Material Zerou na Bancada',
      text: 'O estoque deste material acabou na bancada de expedição. Precisamos de reposição urgente.',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
    },
    {
      category: 'divergencia' as MessageCategory,
      label: 'Divergência de Contagem',
      text: 'A quantidade física no pallet não bate com o número do sistema. Favor conferir.',
      icon: <Clock className="w-3.5 h-3.5 text-orange-400" />
    },
    {
      category: 'duvida' as MessageCategory,
      label: 'Dúvida Operacional',
      text: 'Dúvida sobre onde alocar ou qual embalagem padrão utilizar para este produto.',
      icon: <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
    }
  ];

  // Client-side image compressor using Canvas
  const processImageFile = (file: File) => {
    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setPhotoDataUrl(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !photoDataUrl) return;

    const matchedItem = items.find(i => i.codigo === selectedItemCode);

    enviarMensagem({
      text: text.trim() || 'Foto enviada pelo auxiliar no galpão.',
      photoUrl: photoDataUrl || undefined,
      category,
      relatedItemCode: matchedItem?.codigo,
      relatedItemName: matchedItem?.nomeItem
    });

    setText('');
    setPhotoDataUrl(null);
    setActiveTab('mensagens');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Falar com o Gestor
              </h3>
              <p className="text-[11px] text-slate-400">
                Envie fotos de avarias, avisos de material zerado ou dúvidas.
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

        {/* Sub-tabs: Nova Mensagem vs Minhas Mensagens */}
        <div className="flex items-center bg-slate-950 px-4 pt-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('nova')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'nova'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Enviar Mensagem / Foto</span>
          </button>

          <button
            onClick={() => setActiveTab('mensagens')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'mensagens'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Conversas & Respostas ({myMessages.length})</span>
          </button>
        </div>

        {/* Tab 1: Nova Mensagem / Envio de Foto */}
        {activeTab === 'nova' ? (
          <form onSubmit={handleSend} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Quick 1-Tap Template Chips (Great for workers with difficulty writing) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Toque Rápido para Preencher (Sem precisar digitar):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickTemplates.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setCategory(t.category);
                      setText(t.text);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all flex items-center gap-2 group"
                  >
                    {t.icon}
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white line-clamp-1">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Item Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Material Relacionado (Opcional):
              </label>
              <select
                value={selectedItemCode}
                onChange={e => setSelectedItemCode(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Nenhum item específico / Aviso Geral</option>
                {items.map(item => (
                  <option key={item.id} value={item.codigo}>
                    {item.nomeItem} ({item.codigo}) - {item.tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Capture & Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Foto do Palete ou Material (Câmera ou Galeria):
              </label>

              {photoDataUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoDataUrl}
                      alt="Prévia anexada"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Foto anexada!</span>
                      <span className="text-[11px] text-emerald-400 font-medium">Pronta para envio</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Camera button (Environment / Back camera on phones) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-14 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold">Tirar Foto na Câmera</span>
                  </button>

                  {/* File Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-semibold">Escolher da Galeria</span>
                  </button>

                  {/* Hidden inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {isCompressing && (
                <div className="text-[11px] text-amber-300 mt-1 animate-pulse">
                  Otimizando imagem para envio...
                </div>
              )}
            </div>

            {/* Text Message Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Informação / Mensagem para o Gestor:
              </label>
              <textarea
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Descreva o que aconteceu (ex: 'Palete rasgado na doca', 'Caixa 12 zerou', etc.)..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!text.trim() && !photoDataUrl}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <Send className="w-4 h-4" />
              <span>Enviar para o Gestor</span>
            </button>
          </form>
        ) : (
          /* Tab 2: Minhas Mensagens & Respostas */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
            {myMessages.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Você ainda não enviou mensagens para o gestor.
              </div>
            ) : (
              myMessages.map(msg => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        msg.status === 'resolvido'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : msg.status === 'em_analise'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {msg.status === 'resolvido' ? 'Resolvido' : msg.status === 'em_analise' ? 'Em Análise' : 'Pendente'}
                    </span>
                  </div>

                  {msg.relatedItemName && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-amber-300">
                      <span>Item: {msg.relatedItemName} ({msg.relatedItemCode})</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-200 whitespace-pre-wrap">{msg.text}</p>

                  {/* Attached Photo */}
                  {msg.photoUrl && (
                    <div>
                      <img
                        src={msg.photoUrl}
                        alt="Foto da ocorrência"
                        onClick={() => setZoomPhoto(msg.photoUrl || null)}
                        className="max-h-48 rounded-xl border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity object-cover"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block italic">
                        Clique na foto para ampliar
                      </span>
                    </div>
                  )}

                  {/* Gestor Replies */}
                  {msg.replies && msg.replies.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Respostas do Gestor:
                      </span>
                      {msg.replies.map(rep => (
                        <div key={rep.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold text-slate-200">{rep.senderName}</span>
                            <span>{new Date(rep.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-300">{rep.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Zoom Modal */}
      {zoomPhoto && (
        <div
          onClick={() => setZoomPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={zoomPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
