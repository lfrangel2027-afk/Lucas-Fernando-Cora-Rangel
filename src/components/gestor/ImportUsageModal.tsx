import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { DailyUsageItem } from '../../types';
import { useStock } from '../../context/StockContext';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';

interface ImportUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportUsageModal: React.FC<ImportUsageModalProps> = ({ isOpen, onClose }) => {
  const { importarPlanilhaUso, baixarModeloPlanilhaUso } = useStock();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsedUsage, setParsedUsage] = useState<DailyUsageItem[]>([]);
  const [importMode, setImportMode] = useState<'atualizar' | 'substituir'>('atualizar');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number; message: string } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName('');
    setParsedUsage([]);
    setErrorMsg('');
    setSuccessInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessInfo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setErrorMsg('A planilha selecionada está vazia ou não possui linhas de dados.');
          setIsProcessing(false);
          return;
        }

        // Clean number helper
        const parseNum = (val: any): number => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const s = String(val).trim();
          // Handle percentage string e.g. "28,6%" or "28.6%"
          if (s.includes('%')) {
            const clean = s.replace('%', '').replace(',', '.').trim();
            return parseFloat(clean) || 0;
          }
          const dotRemoved = s.replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(dotRemoved);
          return isNaN(parsed) ? 0 : parsed;
        };

        const validatedUsage: DailyUsageItem[] = [];

        rawRows.forEach((row, idx) => {
          // Identify Item column
          let itemKey = '';
          let mediaUso = 0;
          let usoPercentual = 0;
          let boxNameGroup = '';
          let warehouseId = 'VIX1';
          const consumoDiario: Record<string, number> = {};

          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const val = row[key];

            if (cleanKey === 'item' || cleanKey === 'codigo' || cleanKey === 'nome do item' || cleanKey === 'item_name') {
              itemKey = String(val).trim();
            } else if (cleanKey === 'media' || cleanKey === 'media de uso' || cleanKey === 'consumo medio') {
              mediaUso = Math.round(parseNum(val));
            } else if (cleanKey.includes('uso%') || cleanKey.includes('uso %') || cleanKey === 'percentual' || cleanKey === '%') {
              usoPercentual = Number(parseNum(val).toFixed(2));
            } else if (cleanKey.includes('box name') || cleanKey.includes('box_name')) {
              boxNameGroup = String(val).trim();
            } else if (cleanKey.includes('warehouse') || cleanKey.includes('wareho')) {
              warehouseId = String(val).trim();
            } else {
              // Potential date column like "Set 24, 2026", "24/09", etc.
              const numericVal = parseNum(val);
              if (numericVal >= 0 && val !== '') {
                consumoDiario[key.trim()] = Math.round(numericVal);
              }
            }
          }

          // If row is a "Total" summary row, skip it
          if (!itemKey || itemKey.toLowerCase() === 'total') return;

          // If mediaUso is 0 but we have daily values, compute average automatically!
          if (mediaUso === 0 && Object.keys(consumoDiario).length > 0) {
            const values = Object.values(consumoDiario);
            const sum = values.reduce((a, b) => a + b, 0);
            mediaUso = Math.round(sum / values.length);
          }

          validatedUsage.push({
            itemKey,
            boxNameGroup: boxNameGroup || `B${itemKey}`,
            warehouseId: warehouseId || 'VIX1',
            mediaUso,
            usoPercentual,
            consumoDiario,
            updatedAt: new Date().toISOString()
          });
        });

        if (validatedUsage.length === 0) {
          setErrorMsg('Nenhum dado de uso válido foi identificado. Certifique-se de que a planilha possui colunas como "Item" e "Média".');
        } else {
          setParsedUsage(validatedUsage);
        }
      } catch (err) {
        console.error('Error parsing usage sheet', err);
        setErrorMsg('Falha ao processar a planilha de uso. Verifique se o arquivo está no formato .xlsx, .xls ou .csv.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Erro ao ler arquivo no navegador.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirm = () => {
    if (parsedUsage.length === 0) return;
    const res = importarPlanilhaUso(parsedUsage, importMode);
    if (res.success) {
      setSuccessInfo({ count: res.count, message: res.message });
      setTimeout(() => {
        onClose();
        handleReset();
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Importar Planilha de Uso / Consumo Diário
              </h2>
              <p className="text-xs text-slate-400">
                Envie o relatório diário de uso para atualizar as médias e o cálculo de cobertura.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Download Template Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">
                  Modelo de Planilha de Consumo (Uso / Média)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Compatível com o layout de consumo do VIX1 (Item, Média, Datas Set 24, Set 23...).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => baixarModeloPlanilhaUso('xlsx')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo (.xlsx)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto transition-colors">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <span className="text-sm font-bold text-white block">
                {fileName ? fileName : 'Clique para selecionar a planilha de Uso / Consumo'}
              </span>
              <span className="text-xs text-slate-400">
                Suporta planilhas Excel (.xlsx, .xls) ou CSV (.csv) com colunas de datas ou Média
              </span>
            </div>

            {fileName && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <FileCheck className="w-3.5 h-3.5" />
                Arquivo lido com sucesso
              </span>
            )}
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success display */}
          {successInfo && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successInfo.message}</span>
            </div>
          )}

          {/* Preview of Parsed Usage */}
          {parsedUsage.length > 0 && !successInfo && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  {parsedUsage.length} itens de consumo identificados:
                </span>
                <span>Prévia das primeiras linhas:</span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2.5">Item</th>
                      <th className="py-2 px-2.5">Grupo / Box</th>
                      <th className="py-2 px-2.5 text-right">Média Diária</th>
                      <th className="py-2 px-2.5 text-right">Uso %</th>
                      <th className="py-2 px-2.5">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedUsage.slice(0, 6).map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-1.5 px-2.5 font-bold text-white font-sans">{u.itemKey}</td>
                        <td className="py-1.5 px-2.5 text-slate-400">{u.boxNameGroup || '-'}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-amber-400">
                          {u.mediaUso.toLocaleString('pt-BR')} un/dia
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-slate-300">
                          {u.usoPercentual ? `${u.usoPercentual}%` : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-400 font-sans">{u.warehouseId || 'VIX1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Modo de Aplicação do Histórico:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportMode('atualizar')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      importMode === 'atualizar'
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">🔄 Mesclar / Atualizar</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Atualiza as médias existentes e adiciona novos itens.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('substituir')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      importMode === 'substituir'
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-rose-300">⚠️ Substituir Tudo</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Usa estritamente os itens desta nova planilha.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedUsage.length > 0 && !successInfo && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
            >
              Escolher Outro Arquivo
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Atualizar Médias e Cobertura ({parsedUsage.length} itens)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
