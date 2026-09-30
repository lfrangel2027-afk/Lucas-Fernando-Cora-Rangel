import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { StockItem, CategoryType, CountUnit } from '../../types';
import { useStock } from '../../context/StockContext';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  ArrowRight,
  FileCheck
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { importarPlanilha, baixarModeloPlanilha, canModifyData, mainGestorName } = useStock();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<StockItem[]>([]);
  const [importMode, setImportMode] = useState<'atualizar' | 'substituir' | 'somar'>('atualizar');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number; message: string } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName('');
    setParsedItems([]);
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

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse to JSON array of objects
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setErrorMsg('A planilha selecionada está vazia ou não possui linhas de dados.');
          setIsProcessing(false);
          return;
        }

        // Helper to find column value by potential header names
        const findVal = (row: Record<string, any>, candidates: string[]): any => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            for (const cand of candidates) {
              const cleanCand = cand.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              if (cleanKey === cleanCand || cleanKey.includes(cleanCand)) {
                return row[key];
              }
            }
          }
          return undefined;
        };

        const validatedItems: StockItem[] = [];

        rawRows.forEach((row, idx) => {
          const rawCodigo = findVal(row, ['codigo', 'código', 'cod', 'code', 'ref']);
          const rawDesc = findVal(row, ['descricao', 'descrição', 'desc', 'produto', 'especificacao']);
          const rawFornecedor = findVal(row, ['fornecedor', 'supplier', 'fabricante', 'marca']) || 'Geral';
          const rawTipo = findVal(row, ['tipo', 'type', 'categoria', 'categoria_material']) || 'Outros';
          const rawNome = findVal(row, ['nome do item', 'nome item', 'nome', 'item', 'item_name', 'identificador']);
          const rawMultiplo = findVal(row, ['multiplo', 'múltiplo', 'multiple', 'embalagem', 'pecas']) || 1;
          const rawUnidade = findVal(row, ['contar', 'unidade', 'und', 'unidade contagem', 'unidade_contagem']) || 'Pallet';
          const rawContagem = findVal(row, ['contagem', 'qtd', 'quantidade', 'saldo', 'estoque fisico']) ?? 0;

          const codigo = String(rawCodigo || '').trim();
          const descricao = String(rawDesc || rawCodigo || `Item #${idx + 1}`).trim();
          const nomeItem = String(rawNome || rawCodigo || `Item ${idx + 1}`).trim();

          // Only skip if there's no code and no name
          if (!codigo && !nomeItem) return;

          // Parse numeric values
          const cleanNum = (val: any, fallback: number) => {
            if (typeof val === 'number') return val;
            if (!val) return fallback;
            // Handle Brazilian dot thousands separator e.g. "2.000" or comma
            const s = String(val).trim();
            // If format is like "2.000" (thousands dot)
            const dotRemoved = s.replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(dotRemoved);
            return isNaN(parsed) ? fallback : parsed;
          };

          const multiplo = Math.max(1, Math.round(cleanNum(rawMultiplo, 1000)));
          const contagem = Math.max(0, Math.round(cleanNum(rawContagem, 0)));

          // Normalize Tipo
          let tipo: CategoryType = 'Outros';
          const cleanTipoStr = String(rawTipo).toLowerCase();
          if (cleanTipoStr.includes('caixa') || cleanTipoStr.includes('box')) tipo = 'Caixa';
          else if (cleanTipoStr.includes('polibag') || cleanTipoStr.includes('pm')) tipo = 'Polibag';
          else if (cleanTipoStr.includes('polijiffy') || cleanTipoStr.includes('pj') || cleanTipoStr.includes('jiffy')) tipo = 'Polijiffy';
          else if (cleanTipoStr.includes('etiqueta') || cleanTipoStr.includes('label')) tipo = 'Etiqueta';
          else if (cleanTipoStr.includes('presente') || cleanTipoStr.includes('gift')) tipo = 'Gift Wrap';
          else if (cleanTipoStr.includes('prep')) tipo = 'Prep';

          // Normalize UnidadeContagem
          let unidadeContagem: CountUnit = 'Pallet';
          const cleanUndStr = String(rawUnidade).toLowerCase();
          if (cleanUndStr.includes('fardo')) unidadeContagem = 'Fardo';
          else if (cleanUndStr.includes('rolo')) unidadeContagem = 'Rolo';
          else if (cleanUndStr.includes('pacote')) unidadeContagem = 'Pacote';
          else if (cleanUndStr.includes('pallet') || cleanUndStr.includes('palete')) unidadeContagem = 'Pallet';
          else if (cleanUndStr.includes('de')) unidadeContagem = 'de';

          validatedItems.push({
            id: codigo || `ITEM-${Date.now()}-${idx}`,
            codigo: codigo || `COD-${idx + 1}`,
            descricao,
            fornecedor: String(rawFornecedor).trim() || 'Geral',
            tipo,
            nomeItem,
            multiplo,
            unidadeContagem,
            contagem,
            updatedAt: new Date().toISOString()
          });
        });

        if (validatedItems.length === 0) {
          setErrorMsg('Nenhuma linha de produto válida foi identificada na planilha. Verifique se o arquivo possui colunas como "Código", "Descrição" e "Contagem".');
        } else {
          setParsedItems(validatedItems);
        }
      } catch (err) {
        console.error('Error parsing spreadsheet', err);
        setErrorMsg('Falha ao processar o arquivo. Certifique-se de que é um arquivo válido nos formatos .xlsx, .xls ou .csv.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo no navegador.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;

    const res = importarPlanilha(parsedItems, importMode);
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

  const zeradosCount = parsedItems.filter(i => i.contagem === 0).length;
  const emEstoqueCount = parsedItems.filter(i => i.contagem > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Importar Planilha de Estoque
              </h2>
              <p className="text-xs text-slate-400">
                Carregue arquivos Excel (.xlsx, .xls) ou CSV (.csv) para atualizar o inventário.
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
          {/* Secondary manager notice */}
          {!canModifyData && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Aviso: Acesso de Gestor Secundário</span>
                <span className="text-[11px] text-slate-300">
                  Gestores secundários podem visualizar dados e exportar. Ao confirmar a importação, será solicitada a autorização ou senha do Gestor Principal ({mainGestorName}).
                </span>
              </div>
            </div>
          )}

          {/* Download Template Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">
                  Precisa do modelo padrão da planilha?
                </span>
                <span className="text-slate-400 text-[11px]">
                  Contém as colunas exatas da foto: Código, Descrição, Fornecedor, Múltiplo, Contagem...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => baixarModeloPlanilha('xlsx')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Modelo Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto transition-colors">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <span className="text-sm font-bold text-white block">
                {fileName ? fileName : 'Clique aqui para selecionar a planilha'}
              </span>
              <span className="text-xs text-slate-400">
                Suporta planilhas Excel (.xlsx, .xls) e arquivos (.csv)
              </span>
            </div>

            {fileName && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <FileCheck className="w-3.5 h-3.5" />
                Arquivo selecionado com sucesso
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successInfo.message}</span>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedItems.length > 0 && !successInfo && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Summary stats of the parsed file */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Itens Encontrados</div>
                  <div className="text-lg font-black font-mono text-white">
                    {parsedItems.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-emerald-400">Com Estoque</div>
                  <div className="text-lg font-black font-mono text-emerald-400">
                    {emEstoqueCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-rose-400">Itens Zerados</div>
                  <div className="text-lg font-black font-mono text-rose-400">
                    {zeradosCount}
                  </div>
                </div>
              </div>

              {/* Import Mode Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Como deseja aplicar esta planilha?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportMode('atualizar')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      importMode === 'atualizar'
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                    }`}
                  >
                    <div className="font-bold text-xs text-white flex items-center justify-between">
                      <span>🔄 Atualizar (Sem Duplicar)</span>
                      {importMode === 'atualizar' && (
                        <span className="text-[10px] text-amber-400 font-semibold">Padrão</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Aplica as informações aos mesmos itens já cadastrados sem duplicar. Ajusta a contagem registrando reposições e baixas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('somar')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      importMode === 'somar'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-300 flex items-center justify-between">
                      <span>➕ Somar Quantidades</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Soma a quantidade da planilha à contagem atual dos mesmos itens no estoque (reposição direta de bancadas/paletes).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('substituir')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      importMode === 'substituir'
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                    }`}
                  >
                    <div className="font-bold text-xs text-rose-300 flex items-center justify-between">
                      <span>⚠️ Substituir Tudo</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Recarrega a lista conforme a planilha, deduplicando códigos repetidos.
                    </p>
                  </button>
                </div>
              </div>

              {/* Sample Preview Rows */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Prévia das primeiras linhas detectadas:</span>
                  <span className="text-[11px]">Mostrando 5 de {parsedItems.length}</span>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-2.5">Código</th>
                        <th className="py-2 px-2.5">Nome</th>
                        <th className="py-2 px-2.5">Tipo</th>
                        <th className="py-2 px-2.5 text-right">Contagem</th>
                        <th className="py-2 px-2.5 text-center">Unidade</th>
                        <th className="py-2 px-2.5 text-right">Total Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {parsedItems.slice(0, 5).map((it, i) => (
                        <tr key={i} className="hover:bg-slate-900/60">
                          <td className="py-1.5 px-2.5 text-slate-300">{it.codigo}</td>
                          <td className="py-1.5 px-2.5 font-bold text-white font-sans">{it.nomeItem}</td>
                          <td className="py-1.5 px-2.5 text-slate-400 font-sans">{it.tipo}</td>
                          <td className={`py-1.5 px-2.5 text-right font-bold ${it.contagem === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {it.contagem}
                          </td>
                          <td className="py-1.5 px-2.5 text-center text-slate-400 font-sans">{it.unidadeContagem}</td>
                          <td className="py-1.5 px-2.5 text-right text-slate-300">
                            {(it.contagem * it.multiplo).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {parsedItems.length > 0 && !successInfo && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Escolher Outro Arquivo
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <Upload className="w-4 h-4" />
              <span>Importar {parsedItems.length} Itens para o Estoque</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
