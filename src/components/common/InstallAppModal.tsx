import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Sparkles,
  WifiOff,
  Maximize2,
  Camera,
  Share2,
  MoreVertical
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&color=f59e0b&bgcolor=0f172a&data=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Instalação Mobile
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                Baixar App no Celular Android
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick status if already installed */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>O aplicativo já está instalado neste dispositivo e rodando em modo nativo!</span>
            </div>
          )}

          {/* 1-Click Install Button if supported by current browser (Android / Chrome) */}
          {isInstallable && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Instalação Direta Disponível</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seu navegador suporta instalação com 1 toque.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Download className="w-5 h-5" />
                <span>{isInstalling ? 'Instalando...' : 'Instalar Aplicativo Agora no Celular'}</span>
              </button>
            </div>
          )}

          {/* Step by Step Guide for Android */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Passo a Passo para Instalar no Android (Chrome):</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs">
                  <strong className="text-white block">Abra este site no Google Chrome</strong>
                  <span className="text-slate-400">
                    No seu smartphone Android, acesse o link pelo navegador Chrome.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-white">Toque no menu de 3 pontinhos</strong>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[10px] inline-flex items-center">
                      <MoreVertical className="w-3 h-3" />
                    </span>
                  </div>
                  <span className="text-slate-400">
                    Localizado no canto superior direito da tela do Chrome.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs">
                  <strong className="text-white block">Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"</strong>
                  <span className="text-slate-400">
                    O Android irá baixar o aplicativo e criar o ícone nativo <strong>"Estoque VIX1"</strong> no seu aparelho.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section for Opening on Phone */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-700/80 shrink-0 shadow-inner">
              <img
                src={qrCodeUrl}
                alt="QR Code para abrir no celular Android"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg"
                loading="lazy"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-amber-400">
                <QrCode className="w-4 h-4" />
                <span>Abra a câmera do celular para ler o QR Code</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aponte a câmera do seu smartphone Android para este código e toque na notificação para abrir o app diretamente no seu celular.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link do App'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Vantagens do Aplicativo no Celular:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <Maximize2 className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-[11px] font-bold text-white">Tela Cheia</div>
                <div className="text-[10px] text-slate-500">Sem barra de URL</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <WifiOff className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-[11px] font-bold text-white">Modo Offline</div>
                <div className="text-[10px] text-slate-500">Cache local ativo</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <Camera className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-[11px] font-bold text-white">Câmera Rápida</div>
                <div className="text-[10px] text-slate-500">Fotos de avarias</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <Smartphone className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-[11px] font-bold text-white">1 Toque</div>
                <div className="text-[10px] text-slate-500">Ícone no Android</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
