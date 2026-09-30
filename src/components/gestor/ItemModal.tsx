import React, { useState, useEffect } from 'react';
import { StockItem, CategoryType, CountUnit } from '../../types';
import { useStock } from '../../context/StockContext';
import { X, Package, Save } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: StockItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  const { adicionarItem, editarItem } = useStock();

  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('Smurfit Kappa');
  const [tipo, setTipo] = useState<CategoryType>('Caixa');
  const [nomeItem, setNomeItem] = useState('');
  const [multiplo, setMultiplo] = useState('1000');
  const [unidadeContagem, setUnidadeContagem] = useState<CountUnit>('Pallet');
  const [contagem, setContagem] = useState('0');

  useEffect(() => {
    if (itemToEdit) {
      setCodigo(itemToEdit.codigo);
      setDescricao(itemToEdit.descricao);
      setFornecedor(itemToEdit.fornecedor);
      setTipo(itemToEdit.tipo);
      setNomeItem(itemToEdit.nomeItem);
      setMultiplo(String(itemToEdit.multiplo));
      setUnidadeContagem(itemToEdit.unidadeContagem);
      setContagem(String(itemToEdit.contagem));
    } else {
      setCodigo('');
      setDescricao('');
      setFornecedor('Smurfit Kappa');
      setTipo('Caixa');
      setNomeItem('');
      setMultiplo('1000');
      setUnidadeContagem('Pallet');
      setContagem('0');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const multNum = Math.max(1, parseInt(multiplo, 10) || 1);
    const countNum = Math.max(0, parseInt(contagem, 10) || 0);

    if (itemToEdit) {
      editarItem(itemToEdit.id, {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        fornecedor: fornecedor.trim(),
        tipo,
        nomeItem: nomeItem.trim(),
        multiplo: multNum,
        unidadeContagem,
        contagem: countNum
      });
    } else {
      adicionarItem({
        codigo: codigo.trim() || `ITEM-${Date.now()}`,
        descricao: descricao.trim(),
        fornecedor: fornecedor.trim() || 'Geral',
        tipo,
        nomeItem: nomeItem.trim() || 'Novo Item',
        multiplo: multNum,
        unidadeContagem,
        contagem: countNum
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {itemToEdit ? 'Editar Item do Estoque' : 'Adicionar Novo Item ao Estoque'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Código do Produto
              </label>
              <input
                type="text"
                placeholder="Ex: BR-COR95099"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Item (Identificador Curto)
              </label>
              <input
                type="text"
                placeholder="Ex: PM7 ou Box 99"
                value={nomeItem}
                onChange={e => setNomeItem(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição Completa
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Caixa Kraft 24x18x12 B-Flute para expedição..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Embalagem
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as CategoryType)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Caixa">Caixa</option>
                <option value="Polibag">Polibag</option>
                <option value="Polijiffy">Polijiffy</option>
                <option value="Etiqueta">Etiqueta</option>
                <option value="Gift Wrap">Gift Wrap (Presente)</option>
                <option value="Prep">Prep</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                placeholder="Ex: Smurfit Kappa, World Post..."
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unidade de Contar
              </label>
              <select
                value={unidadeContagem}
                onChange={e => setUnidadeContagem(e.target.value as CountUnit)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Pallet">Pallet</option>
                <option value="Fardo">Fardo</option>
                <option value="Rolo">Rolo</option>
                <option value="Pacote">Pacote</option>
                <option value="de">de</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Múltiplo (Peças por Un)
              </label>
              <input
                type="number"
                min="1"
                value={multiplo}
                onChange={e => setMultiplo(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contagem Física
              </label>
              <input
                type="number"
                min="0"
                value={contagem}
                onChange={e => setContagem(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Estoque total calculado:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {((parseInt(contagem, 10) || 0) * (parseInt(multiplo, 10) || 1)).toLocaleString('pt-BR')} unidades
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
