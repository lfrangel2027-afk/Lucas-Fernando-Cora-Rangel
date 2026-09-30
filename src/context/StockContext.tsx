import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  StockItem,
  StockMovement,
  AppUser,
  MovementType,
  CategoryType,
  CountUnit,
  DailyUsageItem,
  ItemCoverageAnalysis,
  CoverageBucketId,
  ChatMessage,
  MessageStatus,
  MessageCategory,
  ChatReply
} from '../types';
import { INITIAL_ITEMS, INITIAL_USERS } from '../data/initialInventory';
import { INITIAL_USAGE_DATA } from '../data/initialUsageData';
import { INITIAL_MESSAGES } from '../data/initialMessages';
import { exportarAtaCoberturaPDF, exportarInventarioPDF as exportPDFUtil, exportarDelphiPDF } from '../utils/pdfExport';

interface StockContextType {
  items: StockItem[];
  users: AppUser[];
  movements: StockMovement[];
  usageData: DailyUsageItem[];
  coverageAnalyses: ItemCoverageAnalysis[];
  messages: ChatMessage[];
  currentUser: AppUser | null;
  audioFeedbackEnabled: boolean;
  setAudioFeedbackEnabled: (enabled: boolean) => void;
  playAudioFeedback: (text: string) => void;
  login: (usernameOrId: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (user: AppUser) => void;
  retirarItem: (itemId: string, quantidade: number, motivo?: string) => { success: boolean; message: string };
  excluirLancamento: (movementId: string, motivoCancelamento?: string) => { success: boolean; message: string };
  adicionarItem: (item: Omit<StockItem, 'id' | 'updatedAt'>) => { success: boolean; message: string } | void;
  editarItem: (id: string, updates: Partial<StockItem>) => { success: boolean; message: string } | void;
  ajustarContagem: (itemId: string, novaContagem: number, motivo?: string) => { success: boolean; message: string } | void;
  excluirItem: (id: string) => { success: boolean; message: string } | void;
  adicionarUsuario: (nome: string, username: string, pin: string, role: 'auxiliar' | 'gestor') => { success: boolean; message: string };
  excluirUsuario: (id: string) => { success: boolean; message: string };
  atualizarCredenciaisGestor: (username: string, novoPin: string, nome?: string, userId?: string) => { success: boolean; message: string };
  enviarMensagem: (msgData: {
    text: string;
    photoUrl?: string;
    category: MessageCategory;
    relatedItemCode?: string;
    relatedItemName?: string;
  }) => { success: boolean; message: ChatMessage };
  responderMensagem: (messageId: string, resposta: string) => void;
  marcarMensagemStatus: (messageId: string, status: MessageStatus) => void;
  marcarTodasMensagensLidas: () => void;
  unreadMessagesCount: number;
  exportarCSV: () => void;
  exportarPlanilha: (formato?: 'xlsx' | 'csv') => void;
  exportarInventarioPDF: () => void;
  exportarAtaPDF: () => void;
  importarPlanilha: (novosItens: StockItem[], modo?: 'substituir' | 'atualizar' | 'somar') => { success: boolean; count: number; message: string };
  baixarModeloPlanilha: (formato?: 'xlsx' | 'csv') => void;
  importarPlanilhaUso: (novosDados: DailyUsageItem[], modo: 'substituir' | 'atualizar') => { success: boolean; count: number; message: string };
  atualizarMediaUso: (itemKey: string, novaMedia: number) => void;
  baixarModeloPlanilhaUso: (formato?: 'xlsx' | 'csv') => void;
  resetarDadosOriginais: () => void;
  kpis: {
    totalItens: number;
    totalContagem: number;
    totalEstoquePecas: number;
    itensZerados: number;
    itensBaixos: number;
    totalRetiradasHoje: number;
  };
  coverageBucketsCount: Record<CoverageBucketId, number>;
  isMainManager: boolean;
  canModifyData: boolean;
  sessionOverrideUnlocked: boolean;
  mainGestorName: string;
  liberarComSenhaGestorPrincipal: (senha: string) => { success: boolean; message: string };
  solicitarLiberacaoGestorPrincipal: (motivo?: string) => { success: boolean; message: string };
  alternarPermissaoGestorSecundario: (userId: string, allow: boolean) => void;
  accessRequests: Array<{ id: string; userId: string; userName: string; timestamp: string; motivo?: string }>;
  aprovarAcessoSecundario: (requestId: string) => void;
  recusarAcessoSecundario: (requestId: string) => void;
  delphiData: Array<{ codigo: string; quantidade: number; nomeItem: string; tipo: string; contagem: number; multiplo: number; descricao?: string }>;
  exportarDelphi: (formato?: 'xlsx' | 'csv') => void;
  exportarDelphiPDF: () => void;
  restrictedNotice: { title: string; message: string; actionTitle?: string; timestamp: number } | null;
  clearRestrictedNotice: () => void;
  isRestrictedModalOpen: boolean;
  setIsRestrictedModalOpen: (open: boolean) => void;
  restrictedModalActionTitle: string;
  setRestrictedModalActionTitle: (title: string) => void;
  verifyModifyPermission: (actionName: string) => boolean;
}

const STORAGE_KEY_ITEMS = 'app_stock_items_v2';
const STORAGE_KEY_USERS = 'app_stock_users_v2';
const STORAGE_KEY_MOVEMENTS = 'app_stock_movements_v2';
const STORAGE_KEY_CURRENT_USER = 'app_stock_current_user_v2';
const STORAGE_KEY_AUDIO = 'app_stock_audio_enabled';
const STORAGE_KEY_USAGE = 'app_stock_usage_v2';
const STORAGE_KEY_MESSAGES = 'app_stock_messages_v2';

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Items state
  const [items, setItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse items from storage', e);
    }
    return INITIAL_ITEMS;
  });

  // Users state
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse users from storage', e);
    }
    return INITIAL_USERS;
  });

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse messages', e);
    }
    return INITIAL_MESSAGES;
  });

  // Movements state
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse movements from storage', e);
    }
    return [
      {
        id: 'mov-init-1',
        dataHora: new Date(Date.now() - 3600000 * 2).toISOString(),
        tipo: 'retirada',
        itemId: 'BR-PAC20787',
        itemCodigo: 'BR-PAC20787',
        itemNome: 'PM1',
        tipoItem: 'Polibag',
        quantidadeContagem: 2,
        unidade: 'Fardo',
        multiplo: 1000,
        totalUnidades: 2000,
        contagemAnterior: 120,
        contagemNova: 118,
        usuarioId: 'user-aux-1',
        usuarioNome: 'João Silva',
        motivo: 'Abastecimento Bancada de Embalagem 1'
      },
      {
        id: 'mov-init-2',
        dataHora: new Date(Date.now() - 3600000 * 5).toISOString(),
        tipo: 'retirada',
        itemId: 'BR-COR95057',
        itemCodigo: 'BR-COR95057',
        itemNome: '12',
        tipoItem: 'Caixa',
        quantidadeContagem: 1,
        unidade: 'Pallet',
        multiplo: 2000,
        totalUnidades: 2000,
        contagemAnterior: 7,
        contagemNova: 6,
        usuarioId: 'user-aux-2',
        usuarioNome: 'Maria Santos',
        motivo: 'Linha de Expedição'
      }
    ];
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse current user', e);
    }
    // Default to the first auxiliary user to make it instantly usable on load, or null
    return INITIAL_USERS[1]; // João Silva
  });

  // Daily Usage & Consumption data state
  const [usageData, setUsageData] = useState<DailyUsageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse usage data', e);
    }
    return INITIAL_USAGE_DATA;
  });

  // Audio feedback state
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIO);
      return saved !== 'false'; // Enabled by default
    } catch {
      return true;
    }
  });

  // Secondary manager override unlock for session
  const [sessionOverrideUnlocked, setSessionOverrideUnlocked] = useState(false);
  // Pending access requests from secondary managers
  const [accessRequests, setAccessRequests] = useState<Array<{ id: string; userId: string; userName: string; timestamp: string; motivo?: string }>>([]);

  // Restricted access notice and modal state
  const [restrictedNotice, setRestrictedNotice] = useState<{
    title: string;
    message: string;
    actionTitle?: string;
    timestamp: number;
  } | null>(null);

  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
  const [restrictedModalActionTitle, setRestrictedModalActionTitle] = useState('Esta alteração ou exclusão');

  const clearRestrictedNotice = () => {
    setRestrictedNotice(null);
  };

  // Find the primary manager in system
  const mainManager = useMemo(() => {
    return (
      users.find(u => u.role === 'gestor' && u.isMainManager) ||
      users.find(u => u.role === 'gestor' && (u.id === 'user-gestor' || u.username === 'gestor')) ||
      users.find(u => u.role === 'gestor') ||
      null
    );
  }, [users]);

  const mainGestorName = mainManager?.nome || 'Gestor Principal';

  const isMainManager = useMemo(() => {
    if (!currentUser || currentUser.role !== 'gestor') return false;
    if (currentUser.isMainManager) return true;
    if (currentUser.id === mainManager?.id) return true;
    if (currentUser.username === 'gestor') return true;
    return false;
  }, [currentUser, mainManager]);

  const canModifyData = useMemo(() => {
    if (!currentUser) return false;
    if (isMainManager) return true;
    if (currentUser.canEditAndDelete) return true;
    if (sessionOverrideUnlocked) return true;
    return false;
  }, [currentUser, isMainManager, sessionOverrideUnlocked]);

  // Permission verification helper: blocks secondary managers from modifying or deleting
  const verifyModifyPermission = (actionName: string): boolean => {
    if (!canModifyData) {
      const errorMsg = `Acesso Restrito: Apenas o gestor principal (${mainGestorName}) tem permissão para ${actionName}. Gestores secundários possuem acesso apenas para visualização e exportação de planilhas e relatórios. Solicite a liberação ao gestor principal.`;
      playAudioFeedback('Acesso Restrito! Apenas o gestor principal pode alterar ou excluir informações.');
      setRestrictedNotice({
        title: 'Acesso Restrito',
        message: errorMsg,
        actionTitle: actionName,
        timestamp: Date.now()
      });
      setRestrictedModalActionTitle(actionName);
      setIsRestrictedModalOpen(true);
      return false;
    }
    return true;
  };

  // Save changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIO, String(audioFeedbackEnabled));
  }, [audioFeedbackEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(usageData));
  }, [usageData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Text to speech helper for users with writing or reading challenges
  const playAudioFeedback = useCallback((text: string) => {
    if (!audioFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis not available', err);
    }
  }, [audioFeedbackEnabled]);

  // Login handler
  const login = (usernameOrId: string, pin: string) => {
    const trimmedInput = usernameOrId.trim().toLowerCase();
    const trimmedPin = pin.trim();

    const user = users.find(
      u => (u.username.toLowerCase() === trimmedInput || u.id === trimmedInput) && u.pin === trimmedPin
    );

    if (user) {
      setCurrentUser(user);
      playAudioFeedback(`Bem-vindo, ${user.nome}!`);
      return { success: true };
    }

    // Also check if someone typed "gestor" and matches any gestor's pin
    if (trimmedInput === 'gestor') {
      const gestorWithPin = users.find(u => u.role === 'gestor' && u.pin === trimmedPin);
      if (gestorWithPin) {
        setCurrentUser(gestorWithPin);
        playAudioFeedback(`Acesso de gestor concedido. Bem-vindo, ${gestorWithPin.nome}!`);
        return { success: true };
      }
    }

    return { success: false, message: 'Usuário ou senha inválidos. Tente novamente.' };
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionOverrideUnlocked(false);
  };

  const switchUser = (user: AppUser) => {
    setCurrentUser(user);
    setSessionOverrideUnlocked(false);
    playAudioFeedback(`Acesso alterado para ${user.nome}`);
  };

  // Retirar item (Withdraw item)
  const retirarItem = (itemId: string, quantidade: number, motivo?: string) => {
    if (quantidade <= 0) {
      return { success: false, message: 'Informe uma quantidade maior que zero.' };
    }

    const item = items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado no estoque.' };
    }

    if (item.contagem < quantidade) {
      const msg = `Estoque insuficiente! Temos apenas ${item.contagem} ${item.unidadeContagem}s no momento.`;
      playAudioFeedback(msg);
      return { success: false, message: msg };
    }

    const contagemNova = Math.max(0, item.contagem - quantidade);
    const totalPecasRetiradas = quantidade * item.multiplo;

    // Update item
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, contagem: contagemNova, updatedAt: new Date().toISOString() } : i))
    );

    // Record movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataHora: new Date().toISOString(),
      tipo: 'retirada',
      itemId: item.id,
      itemCodigo: item.codigo,
      itemNome: item.nomeItem,
      tipoItem: item.tipo,
      quantidadeContagem: quantidade,
      unidade: item.unidadeContagem,
      multiplo: item.multiplo,
      totalUnidades: totalPecasRetiradas,
      contagemAnterior: item.contagem,
      contagemNova: contagemNova,
      usuarioId: currentUser?.id || 'anonimo',
      usuarioNome: currentUser?.nome || 'Auxiliar',
      motivo: motivo || 'Retirada para operação'
    };

    setMovements(prev => [movement, ...prev]);

    const audioMsg = `Confirmado! Retirada de ${quantidade} ${item.unidadeContagem} de ${item.nomeItem}. Restam ${contagemNova}.`;
    playAudioFeedback(audioMsg);

    return {
      success: true,
      message: `Retirada realizada: ${quantidade} ${item.unidadeContagem}(s) de ${item.nomeItem} (${totalPecasRetiradas.toLocaleString('pt-BR')} unidades). Restam ${contagemNova}.`
    };
  };

  // Excluir lançamento errado de item (Estorno automático e correção do estoque)
  const excluirLancamento = (movementId: string, motivoCancelamento?: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) {
      return { success: false, message: 'Lançamento não encontrado ou já foi excluído anteriormente.' };
    }

    // 1. Devolver itens ao estoque para que o saldo não fique incorreto
    if (movement.tipo === 'retirada') {
      const item = items.find(i => i.id === movement.itemId);
      if (item) {
        const novaContagem = item.contagem + movement.quantidadeContagem;
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, contagem: novaContagem, updatedAt: new Date().toISOString() }
              : i
          )
        );
      }
    } else if (movement.tipo === 'entrada') {
      const item = items.find(i => i.id === movement.itemId);
      if (item) {
        const novaContagem = Math.max(0, item.contagem - movement.quantidadeContagem);
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, contagem: novaContagem, updatedAt: new Date().toISOString() }
              : i
          )
        );
      }
    } else if (movement.tipo === 'ajuste_contagem') {
      const item = items.find(i => i.id === movement.itemId);
      if (item) {
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, contagem: movement.contagemAnterior, updatedAt: new Date().toISOString() }
              : i
          )
        );
      }
    }

    // 2. Remover o registro incorreto da lista de movimentações
    setMovements(prev => prev.filter(m => m.id !== movementId));

    const audioMsg = `Lançamento cancelado com sucesso. O estoque de ${movement.itemNome} foi corrigido.`;
    playAudioFeedback(audioMsg);

    return {
      success: true,
      message: `Lançamento excluído com sucesso! O estoque de "${movement.itemNome}" foi corrigido (+${movement.quantidadeContagem} ${movement.unidade}(s)). As informações do sistema foram normalizadas.`
    };
  };

  // Adjust count (Inventory recount)
  const ajustarContagem = (itemId: string, novaContagem: number, motivo?: string) => {
    if (!verifyModifyPermission('ajustar ou alterar contagem física manualmente')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode ajustar contagens físicas.' };
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item não encontrado no estoque.' };

    const count = Math.max(0, novaContagem);
    const contagemAnterior = item.contagem;
    const diff = count - contagemAnterior;

    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, contagem: count, updatedAt: new Date().toISOString() } : i))
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      dataHora: new Date().toISOString(),
      tipo: diff >= 0 ? 'entrada' : 'ajuste_contagem',
      itemId: item.id,
      itemCodigo: item.codigo,
      itemNome: item.nomeItem,
      tipoItem: item.tipo,
      quantidadeContagem: Math.abs(diff),
      unidade: item.unidadeContagem,
      multiplo: item.multiplo,
      totalUnidades: Math.abs(diff) * item.multiplo,
      contagemAnterior: contagemAnterior,
      contagemNova: count,
      usuarioId: currentUser?.id || 'gestor',
      usuarioNome: currentUser?.nome || 'Gestor',
      motivo: motivo || 'Conferência de inventário físico'
    };

    setMovements(prev => [movement, ...prev]);
    playAudioFeedback(`Estoque de ${item.nomeItem} atualizado para ${count} ${item.unidadeContagem}s.`);
    return { success: true, message: `Estoque de ${item.nomeItem} atualizado para ${count}.` };
  };

  const adicionarItem = (newItemData: Omit<StockItem, 'id' | 'updatedAt'>) => {
    if (!verifyModifyPermission('cadastrar novos materiais no estoque')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode cadastrar materiais.' };
    }

    // Check if an item with the same code or name already exists to prevent duplicate creation
    const cleanNewCode = newItemData.codigo.trim().toLowerCase();
    const cleanNewName = newItemData.nomeItem.trim().toLowerCase();

    const existingItem = items.find(
      i => i.codigo.trim().toLowerCase() === cleanNewCode || (cleanNewName && i.nomeItem.trim().toLowerCase() === cleanNewName)
    );

    if (existingItem) {
      // Apply updates to the existing item without duplicating
      setItems(prev =>
        prev.map(i =>
          i.id === existingItem.id
            ? {
                ...i,
                ...newItemData,
                id: existingItem.id,
                contagem: existingItem.contagem + (newItemData.contagem || 0),
                updatedAt: new Date().toISOString()
              }
            : i
        )
      );
      playAudioFeedback(`Material ${existingItem.nomeItem} já existia e foi atualizado sem duplicar.`);
      return {
        success: true,
        message: `Material já existia no estoque. As informações foram aplicadas ao mesmo item sem duplicação.`
      };
    }

    const newItem: StockItem = {
      ...newItemData,
      id: newItemData.codigo.trim() || `ITEM-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    setItems(prev => [newItem, ...prev]);
    playAudioFeedback(`Material ${newItem.nomeItem} cadastrado com sucesso.`);
    return { success: true, message: `Material ${newItem.nomeItem} adicionado com sucesso!` };
  };

  const editarItem = (id: string, updates: Partial<StockItem>) => {
    if (!verifyModifyPermission('editar informações de materiais no estoque')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode alterar materiais.' };
    }

    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i))
    );
    playAudioFeedback('Material atualizado com sucesso.');
    return { success: true, message: 'Material atualizado com sucesso.' };
  };

  const excluirItem = (id: string) => {
    if (!verifyModifyPermission('excluir materiais do estoque')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode excluir materiais.' };
    }

    const targetItem = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (targetItem) {
      playAudioFeedback(`Item ${targetItem.nomeItem} excluído com sucesso.`);
    }
    return { success: true, message: 'Material excluído do estoque com sucesso.' };
  };

  // Authorization and permission methods for Secondary Managers
  const liberarComSenhaGestorPrincipal = (senha: string) => {
    if (!mainManager) {
      return { success: false, message: 'Gestor Principal não configurado no sistema.' };
    }
    if (senha.trim() === mainManager.pin.trim()) {
      setSessionOverrideUnlocked(true);
      playAudioFeedback('Permissão de alteração liberada pelo Gestor Principal!');
      return { success: true, message: 'Acesso liberado! Agora você pode alterar ou excluir informações nesta sessão.' };
    }
    return { success: false, message: 'Senha do Gestor Principal incorreta. Tente novamente.' };
  };

  const solicitarLiberacaoGestorPrincipal = (motivo?: string) => {
    if (!currentUser) return { success: false, message: 'Nenhum usuário logado.' };
    const newReq = {
      id: `req-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.nome,
      timestamp: new Date().toISOString(),
      motivo: motivo || 'Solicitação para alterar/excluir dados no estoque'
    };
    setAccessRequests(prev => [newReq, ...prev]);

    // Send high-priority chat notification for Gestor Principal
    enviarMensagem({
      text: `⚠️ SOLICITAÇÃO DE ACESSO: O gestor secundário ${currentUser.nome} está solicitando liberação para alterar/excluir dados no almoxarifado. Motivo: ${motivo || 'Operação no estoque'}.`,
      category: 'urgencia'
    });

    playAudioFeedback('Solicitação de liberação enviada ao Gestor Principal.');
    return { success: true, message: 'Solicitação de liberação enviada com sucesso para o Gestor Principal!' };
  };

  const alternarPermissaoGestorSecundario = (userId: string, allow: boolean) => {
    if (!verifyModifyPermission('gerenciar permissões de acesso de gestores')) {
      return;
    }
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, canEditAndDelete: allow } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, canEditAndDelete: allow } : null));
    }
    playAudioFeedback(`Permissões do gestor secundário ${allow ? 'liberadas para alteração' : 'restringidas apenas para exportação'}.`);
  };

  const aprovarAcessoSecundario = (requestId: string) => {
    const req = accessRequests.find(r => r.id === requestId);
    if (req) {
      alternarPermissaoGestorSecundario(req.userId, true);
      setAccessRequests(prev => prev.filter(r => r.id !== requestId));
      setRestrictedNotice(null);
      setIsRestrictedModalOpen(false);
      playAudioFeedback(`Acesso liberado para o gestor ${req.userName}.`);
    }
  };

  const recusarAcessoSecundario = (requestId: string) => {
    setAccessRequests(prev => prev.filter(r => r.id !== requestId));
    playAudioFeedback('Solicitação de acesso recusada.');
  };

  // User management (Gestor capabilities)
  const adicionarUsuario = (nome: string, username: string, pin: string, role: 'auxiliar' | 'gestor') => {
    if (!verifyModifyPermission('cadastrar novos usuários no sistema')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode cadastrar novos usuários.' };
    }

    if (!nome.trim() || !username.trim() || !pin.trim()) {
      return { success: false, message: 'Preencha nome, usuário e senha.' };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Este nome de usuário já está em uso.' };
    }

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600', 'bg-amber-600'];
    const randomColor = role === 'gestor' ? 'bg-amber-600' : colors[Math.floor(Math.random() * colors.length)];

    const isFirstGestor = role === 'gestor' && !users.some(u => u.role === 'gestor');
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      nome: nome.trim(),
      username: cleanUsername,
      pin: pin.trim(),
      role,
      avatarColor: randomColor,
      createdAt: new Date().toISOString(),
      isMainManager: isFirstGestor,
      canEditAndDelete: isFirstGestor // Gestores secundários começam sem permissão de alteração/exclusão (apenas exportação)
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, message: `${role === 'gestor' ? 'Novo Gestor' : 'Auxiliar'} ${nome} cadastrado com sucesso!` };
  };

  const excluirUsuario = (id: string) => {
    if (!verifyModifyPermission('excluir usuários do sistema')) {
      return { success: false, message: 'Acesso Restrito: Apenas o gestor principal pode excluir usuários.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (target.id === currentUser?.id) {
      return { success: false, message: 'Você não pode excluir o seu próprio usuário logado.' };
    }

    // Do not allow deleting the last manager
    if (target.role === 'gestor') {
      const managersCount = users.filter(u => u.role === 'gestor').length;
      if (managersCount <= 1) {
        return { success: false, message: 'Não é possível excluir o único gestor do sistema.' };
      }
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true, message: `Usuário ${target.nome} excluído com sucesso.` };
  };

  // Update manager credentials (username, pin, and display name)
  const atualizarCredenciaisGestor = (username: string, novoPin: string, nome?: string, userId?: string) => {
    if (!username.trim() || !novoPin.trim()) {
      return { success: false, message: 'Usuário e senha não podem ficar vazios.' };
    }

    const targetUser = userId
      ? users.find(u => u.id === userId)
      : (currentUser?.role === 'gestor' ? currentUser : users.find(u => u.role === 'gestor'));

    if (!targetUser) {
      return { success: false, message: 'Gestor não encontrado no cadastro.' };
    }

    // Check if new username is taken by another user
    const usernameTaken = users.some(
      u => u.id !== targetUser.id && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (usernameTaken) {
      return { success: false, message: 'Esse nome de usuário já está sendo usado por outra pessoa.' };
    }

    const updatedUser: AppUser = {
      ...targetUser,
      username: username.trim(),
      pin: novoPin.trim(),
      nome: nome?.trim() || targetUser.nome
    };

    setUsers(prev => prev.map(u => (u.id === targetUser.id ? updatedUser : u)));

    if (currentUser?.id === targetUser.id) {
      setCurrentUser(updatedUser);
    }

    return { success: true, message: `Dados de ${updatedUser.nome} atualizados com sucesso!` };
  };

  // Chat methods for Auxiliares & Gestor communication
  const enviarMensagem = (msgData: {
    text: string;
    photoUrl?: string;
    category: MessageCategory;
    relatedItemCode?: string;
    relatedItemName?: string;
  }) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser?.id || 'anonimo',
      senderName: currentUser?.nome || 'Auxiliar',
      senderRole: currentUser?.role || 'auxiliar',
      senderAvatar: currentUser?.avatarColor || 'bg-amber-600',
      timestamp: new Date().toISOString(),
      text: msgData.text.trim(),
      photoUrl: msgData.photoUrl,
      category: msgData.category,
      relatedItemCode: msgData.relatedItemCode,
      relatedItemName: msgData.relatedItemName,
      status: 'pendente',
      readByGestor: currentUser?.role === 'gestor',
      replies: []
    };

    setMessages(prev => [newMessage, ...prev]);
    playAudioFeedback('Mensagem enviada com sucesso para o gestor.');
    return { success: true, message: newMessage };
  };

  const responderMensagem = (messageId: string, resposta: string) => {
    if (!resposta.trim()) return;
    const reply: ChatReply = {
      id: `rep-${Date.now()}`,
      senderId: currentUser?.id || 'gestor',
      senderName: currentUser?.nome || 'Gestor',
      senderRole: currentUser?.role || 'gestor',
      timestamp: new Date().toISOString(),
      text: resposta.trim()
    };

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              readByGestor: true,
              status: m.status === 'pendente' ? 'em_analise' : m.status,
              replies: [...(m.replies || []), reply]
            }
          : m
      )
    );
    playAudioFeedback('Resposta enviada ao auxiliar.');
  };

  const marcarMensagemStatus = (messageId: string, status: MessageStatus) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, status, readByGestor: true } : m))
    );
  };

  const marcarTodasMensagensLidas = () => {
    setMessages(prev => prev.map(m => ({ ...m, readByGestor: true })));
  };

  const unreadMessagesCount = useMemo(() => {
    return messages.filter(m => !m.readByGestor).length;
  }, [messages]);

  const resetarDadosOriginais = () => {
    if (!verifyModifyPermission('restaurar dados originais do estoque')) {
      return;
    }
    setItems(INITIAL_ITEMS);
    setUsers(INITIAL_USERS);
    setMovements([]);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    playAudioFeedback('Dados originais do sistema restaurados.');
  };

  const exportarPlanilha = (formato: 'xlsx' | 'csv' = 'xlsx') => {
    const data = items.map((item, index) => {
      const total = item.contagem * item.multiplo;
      const status = item.contagem === 0 ? 'ZERADO' : item.contagem <= 2 ? 'ESTOQUE BAIXO' : 'OK';
      return {
        '#': index + 1,
        'Código': item.codigo,
        'Descrição': item.descricao,
        'Fornecedor': item.fornecedor,
        'Tipo': item.tipo,
        'Nome do item': item.nomeItem,
        'Múltiplo': item.multiplo,
        'Contar': item.unidadeContagem,
        'Contagem': item.contagem,
        'Estoque total': total,
        'Status': status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle de Estoque');

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `estoque_almoxarifado_${dateStr}.${formato}`;

    XLSX.writeFile(workbook, filename, { bookType: formato });
  };

  const exportarCSV = () => {
    exportarPlanilha('csv');
  };

  const exportarInventarioPDF = () => {
    exportPDFUtil(items, kpis, {
      gestorName: currentUser?.nome || 'Gestor Almoxarifado',
      cdName: 'Centro de Distribuição VIX1'
    });
  };

  const exportarAtaPDF = () => {
    exportarAtaCoberturaPDF(coverageAnalyses, coverageBucketsCount, {
      gestorName: currentUser?.nome || 'Gestor Almoxarifado',
      cdName: 'Centro de Distribuição VIX1'
    });
  };

  // Delphi Data (2 columns: Código and Quantidade total em peças, pulled automatically from physical stock)
  const delphiData = useMemo(() => {
    return items.map(item => ({
      codigo: item.codigo,
      quantidade: item.contagem * item.multiplo,
      nomeItem: item.nomeItem,
      tipo: item.tipo,
      contagem: item.contagem,
      multiplo: item.multiplo,
      descricao: item.descricao
    }));
  }, [items]);

  const exportarDelphi = (formato: 'xlsx' | 'csv' = 'xlsx') => {
    const data = items.map(item => ({
      'Código': item.codigo,
      'Quantidade': item.contagem * item.multiplo
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delphi');

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `delphi_estoque_${dateStr}.${formato}`;

    XLSX.writeFile(workbook, filename, { bookType: formato });
    playAudioFeedback('Exportação do Delphi gerada com sucesso.');
  };

  const exportarDelphiPDFContext = () => {
    exportarDelphiPDF(items, {
      gestorName: currentUser?.nome || 'Gestor Almoxarifado',
      cdName: 'Centro de Distribuição VIX1'
    });
    playAudioFeedback('Relatório do Delphi em PDF gerado com sucesso.');
  };

  const baixarModeloPlanilha = (formato: 'xlsx' | 'csv' = 'xlsx') => {
    const modelo = [
      {
        '#': 1,
        'Código': 'BR-COR95057',
        'Descrição': 'COR95057-Box, 12 (B12) 10x7x2, 26-ECT B-Flute Kraft BR',
        'Fornecedor': 'Smurfit Kappa',
        'Tipo': 'Caixa',
        'Nome do item': '12',
        'Múltiplo': 2000,
        'Contar': 'Pallet',
        'Contagem': 6,
        'Estoque total': 12000,
        'Status': 'OK'
      },
      {
        '#': 2,
        'Código': 'BR-PAC20787',
        'Descrição': 'PAC20787-BR-Polibag PM1',
        'Fornecedor': 'World Post',
        'Tipo': 'Polibag',
        'Nome do item': 'PM1',
        'Múltiplo': 1000,
        'Contar': 'Fardo',
        'Contagem': 118,
        'Estoque total': 118000,
        'Status': 'OK'
      },
      {
        '#': 3,
        'Código': 'BR-PAC10023',
        'Descrição': 'PAC10023-BR-Etiqueta Térmica SLAM S2045 1.000 unidades Tubete 3"',
        'Fornecedor': 'JS',
        'Tipo': 'Etiqueta',
        'Nome do item': 'SLAM',
        'Múltiplo': 1000,
        'Contar': 'Rolo',
        'Contagem': 888,
        'Estoque total': 888000,
        'Status': 'OK'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(modelo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação');
    XLSX.writeFile(workbook, `modelo_importacao_estoque.${formato}`, { bookType: formato });
  };

  const importarPlanilha = (
    novosItens: StockItem[],
    modo: 'substituir' | 'atualizar' | 'somar' = 'atualizar'
  ) => {
    if (!verifyModifyPermission('importar ou alterar a planilha do estoque')) {
      return {
        success: false,
        count: 0,
        message: 'Acesso Restrito: Apenas o gestor principal pode importar ou alterar a planilha do estoque. Solicite liberação.'
      };
    }

    if (!novosItens || novosItens.length === 0) {
      return { success: false, count: 0, message: 'Nenhum item válido encontrado na planilha.' };
    }

    // Helper to normalize strings for robust comparison
    const normKey = (str?: string) => {
      if (!str) return '';
      return String(str)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s\-_.]/g, '');
    };

    const normName = (str?: string) => {
      if (!str) return '';
      return String(str)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    // Step 1: Consolidate incoming items if the spreadsheet itself has duplicate rows for the same SKU
    const consolidatedIncoming: StockItem[] = [];
    const incomingIndexMap = new Map<string, number>();

    novosItens.forEach(rawItem => {
      const kCode = normKey(rawItem.codigo);
      const kName = normName(rawItem.nomeItem);
      const primaryKey = kCode || kName;

      if (!primaryKey) return;

      if (incomingIndexMap.has(primaryKey)) {
        // Merge with existing row in the incoming spreadsheet
        const existingIdx = incomingIndexMap.get(primaryKey)!;
        const current = consolidatedIncoming[existingIdx];
        consolidatedIncoming[existingIdx] = {
          ...current,
          contagem: current.contagem + rawItem.contagem,
          descricao: current.descricao || rawItem.descricao,
          fornecedor: current.fornecedor !== 'Geral' ? current.fornecedor : rawItem.fornecedor
        };
      } else {
        incomingIndexMap.set(primaryKey, consolidatedIncoming.length);
        if (kName && !incomingIndexMap.has(kName)) {
          incomingIndexMap.set(kName, consolidatedIncoming.length);
        }
        consolidatedIncoming.push({ ...rawItem });
      }
    });

    if (modo === 'substituir') {
      // In replace mode, use the deduplicated incoming list
      setItems(consolidatedIncoming);
      playAudioFeedback(`Estoque substituído com sucesso! ${consolidatedIncoming.length} itens únicos carregados.`);
      return {
        success: true,
        count: consolidatedIncoming.length,
        message: `Estoque substituído com sucesso! ${consolidatedIncoming.length} itens cadastrados sem duplicidade.`
      };
    }

    // modo === 'atualizar' OR modo === 'somar'
    // "O item não pode duplicar apenas as informações se aplica ao mesmo item adicionando mais ou menos itens do que for retirado ou reposto."
    let updatedCount = 0;
    let addedCount = 0;
    const newMovements: StockMovement[] = [];

    setItems(prevItems => {
      const resultList = [...prevItems];

      consolidatedIncoming.forEach(incoming => {
        const inCode = normKey(incoming.codigo);
        const inName = normName(incoming.nomeItem);

        // Find existing match
        const matchIndex = resultList.findIndex(existing => {
          if (incoming.id && existing.id === incoming.id) return true;
          const exCode = normKey(existing.codigo);
          if (inCode && exCode && inCode === exCode) return true;
          if (inCode.length >= 6 && exCode.length >= 6) {
            if (inCode.includes(exCode) || exCode.includes(inCode)) return true;
          }
          const exName = normName(existing.nomeItem);
          if (inName && exName && inName === exName) return true;
          return false;
        });

        if (matchIndex >= 0) {
          // ITEM ALREADY EXISTS: NEVER DUPLICATE!
          // Apply information to the exact same item
          const existing = resultList[matchIndex];

          let novaContagem = existing.contagem;
          if (modo === 'somar') {
            // Reposição direta: soma a quantidade da planilha
            novaContagem = existing.contagem + incoming.contagem;
          } else {
            // Atualizar com a quantidade importada
            novaContagem = incoming.contagem;
          }

          const diff = novaContagem - existing.contagem;

          resultList[matchIndex] = {
            ...existing,
            descricao: incoming.descricao || existing.descricao,
            fornecedor: (incoming.fornecedor && incoming.fornecedor !== 'Geral') ? incoming.fornecedor : existing.fornecedor,
            tipo: incoming.tipo || existing.tipo,
            nomeItem: incoming.nomeItem || existing.nomeItem,
            multiplo: incoming.multiplo > 0 ? incoming.multiplo : existing.multiplo,
            unidadeContagem: incoming.unidadeContagem || existing.unidadeContagem,
            contagem: novaContagem,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.nome || 'Importação de Planilha'
          };

          // Record movement tracking what was added or removed
          if (diff !== 0) {
            const isReposition = diff > 0;
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              dataHora: new Date().toISOString(),
              tipo: isReposition ? 'entrada' : 'retirada',
              itemId: existing.id,
              itemCodigo: existing.codigo,
              itemNome: existing.nomeItem,
              tipoItem: existing.tipo,
              quantidadeContagem: Math.abs(diff),
              unidade: existing.unidadeContagem,
              multiplo: existing.multiplo,
              totalUnidades: Math.abs(diff) * existing.multiplo,
              contagemAnterior: existing.contagem,
              contagemNova: novaContagem,
              usuarioId: currentUser?.id || 'gestor',
              usuarioNome: currentUser?.nome || 'Importação Planilha',
              motivo: isReposition
                ? `Importação de Planilha: Reposição de estoque (+${diff} ${existing.unidadeContagem}s)`
                : `Importação de Planilha: Baixa / Retirada (-${Math.abs(diff)} ${existing.unidadeContagem}s)`
            });
          }

          updatedCount++;
        } else {
          // New item (does not exist in stock)
          const newItem: StockItem = {
            ...incoming,
            id: incoming.id || incoming.codigo.trim() || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.nome || 'Importação de Planilha'
          };
          resultList.push(newItem);

          if (incoming.contagem > 0) {
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              dataHora: new Date().toISOString(),
              tipo: 'entrada',
              itemId: newItem.id,
              itemCodigo: newItem.codigo,
              itemNome: newItem.nomeItem,
              tipoItem: newItem.tipo,
              quantidadeContagem: incoming.contagem,
              unidade: newItem.unidadeContagem,
              multiplo: newItem.multiplo,
              totalUnidades: incoming.contagem * newItem.multiplo,
              contagemAnterior: 0,
              contagemNova: incoming.contagem,
              usuarioId: currentUser?.id || 'gestor',
              usuarioNome: currentUser?.nome || 'Importação Planilha',
              motivo: `Importação de Planilha: Cadastro de novo item com contagem inicial (+${incoming.contagem} ${newItem.unidadeContagem}s)`
            });
          }

          addedCount++;
        }
      });

      return resultList;
    });

    if (newMovements.length > 0) {
      setMovements(prev => [...newMovements, ...prev]);
    }

    const feedbackMsg = `Planilha processada com sucesso! ${updatedCount} itens existentes atualizados sem duplicação${addedCount > 0 ? `, e ${addedCount} novos itens adicionados.` : '.'}`;
    playAudioFeedback(feedbackMsg);

    return {
      success: true,
      count: updatedCount + addedCount,
      message: feedbackMsg
    };
  };

  const importarPlanilhaUso = (novosDados: DailyUsageItem[], modo: 'substituir' | 'atualizar') => {
    if (!verifyModifyPermission('importar dados de consumo e cobertura')) {
      return { success: false, count: 0, message: 'Acesso Restrito: Apenas o gestor principal pode alterar dados de consumo.' };
    }

    if (!novosDados || novosDados.length === 0) {
      return { success: false, count: 0, message: 'Nenhum dado de uso válido encontrado na planilha.' };
    }

    if (modo === 'substituir') {
      setUsageData(novosDados);
      playAudioFeedback(`Dados de consumo e cobertura atualizados! ${novosDados.length} itens processados.`);
      return {
        success: true,
        count: novosDados.length,
        message: `Histórico de uso substituído com sucesso! ${novosDados.length} itens carregados.`
      };
    } else {
      setUsageData(prev => {
        const map = new Map<string, DailyUsageItem>();
        prev.forEach(u => map.set(u.itemKey.toLowerCase().trim(), u));
        novosDados.forEach(u => map.set(u.itemKey.toLowerCase().trim(), u));
        return Array.from(map.values());
      });
      playAudioFeedback(`Dados de consumo atualizados com sucesso!`);
      return {
        success: true,
        count: novosDados.length,
        message: `Planilha de uso mesclada com sucesso! ${novosDados.length} itens computados.`
      };
    }
  };

  const atualizarMediaUso = (itemKey: string, novaMedia: number) => {
    if (!verifyModifyPermission('alterar média diária de consumo')) {
      return;
    }

    const cleanKey = itemKey.toLowerCase().trim();
    const media = Math.max(0, novaMedia);
    setUsageData(prev => {
      const exists = prev.some(u => u.itemKey.toLowerCase().trim() === cleanKey);
      if (exists) {
        return prev.map(u => (u.itemKey.toLowerCase().trim() === cleanKey ? { ...u, mediaUso: media, updatedAt: new Date().toISOString() } : u));
      } else {
        return [
          ...prev,
          {
            itemKey,
            mediaUso: media,
            usoPercentual: 0,
            updatedAt: new Date().toISOString()
          }
        ];
      }
    });
  };

  const baixarModeloPlanilhaUso = (formato: 'xlsx' | 'csv' = 'xlsx') => {
    const modelo = [
      {
        'Item': '12',
        'Média': 34,
        'box name group': 'B1212',
        'wareho use_id': 'VIX1',
        'Set 24, 2026': 40,
        'Set 23, 2026': 39,
        'Set 22, 2026': 46,
        'Set 21, 2026': 17,
        'Set 20, 2026': 44,
        'Set 19, 2026': 20,
        'Set 18, 2026': 29
      },
      {
        'Item': 'PM1',
        'Média': 685,
        'box name group': 'BBHPM1',
        'wareho use_id': 'VIX1',
        'Set 24, 2026': 842,
        'Set 23, 2026': 848,
        'Set 22, 2026': 732,
        'Set 21, 2026': 483,
        'Set 20, 2026': 807,
        'Set 19, 2026': 382,
        'Set 18, 2026': 704
      },
      {
        'Item': 'SIOC',
        'Média': 221,
        'box name group': 'SIOC',
        'wareho use_id': 'VIX1',
        'Set 24, 2026': 226,
        'Set 23, 2026': 294,
        'Set 22, 2026': 269,
        'Set 21, 2026': 174,
        'Set 20, 2026': 245,
        'Set 19, 2026': 107,
        'Set 18, 2026': 232
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(modelo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Uso Diario');
    XLSX.writeFile(workbook, `modelo_planilha_uso_${formato}.${formato}`, { bookType: formato });
  };

  // Coverage Analysis Calculation
  const coverageAnalyses = useMemo<ItemCoverageAnalysis[]>(() => {
    // Map usage by normalized key
    const usageMap = new Map<string, DailyUsageItem>();
    usageData.forEach(u => {
      usageMap.set(u.itemKey.toLowerCase().trim(), u);
    });

    const analyses: ItemCoverageAnalysis[] = items.map(item => {
      const cleanName = item.nomeItem.toLowerCase().trim();
      const cleanCode = item.codigo.toLowerCase().trim();

      // Find matching usage
      let usage = usageMap.get(cleanName);
      if (!usage) {
        // Try partial match or code
        for (const [key, val] of usageMap.entries()) {
          if (cleanName === key || cleanCode.includes(key) || key.includes(cleanName)) {
            usage = val;
            break;
          }
        }
      }

      const mediaUso = usage?.mediaUso ?? 0;
      const usoPercentual = usage?.usoPercentual ?? 0;
      const totalPecas = item.contagem * item.multiplo;

      let diasCobertura = 0;
      let bucket: CoverageBucketId = '0_a_3';
      let bucketLabel = '0 a 3 dias';

      if (totalPecas === 0) {
        diasCobertura = 0;
        bucket = '0_a_3';
        bucketLabel = '0 a 3 dias';
      } else if (mediaUso === 0) {
        diasCobertura = 999; // Sem consumo diário registrado
        bucket = 'acima_21_1';
        bucketLabel = 'Acima de 21,1 dias';
      } else {
        diasCobertura = Number((totalPecas / mediaUso).toFixed(1));
        if (diasCobertura <= 3.0) {
          bucket = '0_a_3';
          bucketLabel = '0 a 3 dias';
        } else if (diasCobertura <= 5.0) {
          bucket = '3_1_a_5';
          bucketLabel = '3,1 a 5 dias';
        } else if (diasCobertura <= 14.0) {
          bucket = '5_1_a_14';
          bucketLabel = '5,1 a 14 dias';
        } else if (diasCobertura <= 21.0) {
          bucket = '14_1_a_21';
          bucketLabel = '14,1 a 21 dias';
        } else {
          bucket = 'acima_21_1';
          bucketLabel = 'Acima de 21,1 dias';
        }
      }

      return {
        itemKey: usage?.itemKey || item.nomeItem,
        itemId: item.id,
        codigo: item.codigo,
        descricao: item.descricao,
        nomeItem: item.nomeItem,
        tipo: item.tipo,
        fornecedor: item.fornecedor,
        multiplo: item.multiplo,
        unidadeContagem: item.unidadeContagem,
        contagemEstoque: item.contagem,
        estoqueTotalPecas: totalPecas,
        mediaUsoDiario: mediaUso,
        usoPercentual,
        diasCobertura,
        bucket,
        bucketLabel
      };
    });

    // Sort by diasCobertura ascending (critical items first!)
    return analyses.sort((a, b) => a.diasCobertura - b.diasCobertura);
  }, [items, usageData]);

  // Coverage Buckets Count
  const coverageBucketsCount = useMemo<Record<CoverageBucketId, number>>(() => {
    const counts: Record<CoverageBucketId, number> = {
      '0_a_3': 0,
      '3_1_a_5': 0,
      '5_1_a_14': 0,
      '14_1_a_21': 0,
      'acima_21_1': 0
    };
    coverageAnalyses.forEach(ca => {
      counts[ca.bucket] = (counts[ca.bucket] || 0) + 1;
    });
    return counts;
  }, [coverageAnalyses]);

  // KPIs
  const kpis = {
    totalItens: items.length,
    totalContagem: items.reduce((acc, i) => acc + i.contagem, 0),
    totalEstoquePecas: items.reduce((acc, i) => acc + (i.contagem * i.multiplo), 0),
    itensZerados: items.filter(i => i.contagem === 0).length,
    itensBaixos: items.filter(i => i.contagem > 0 && i.contagem <= 2).length,
    totalRetiradasHoje: movements.filter(m => {
      const today = new Date().toISOString().slice(0, 10);
      return m.tipo === 'retirada' && m.dataHora.slice(0, 10) === today;
    }).length
  };

  return (
    <StockContext.Provider
      value={{
        items,
        users,
        movements,
        usageData,
        coverageAnalyses,
        messages,
        currentUser,
        audioFeedbackEnabled,
        setAudioFeedbackEnabled,
        playAudioFeedback,
        login,
        logout,
        switchUser,
        retirarItem,
        excluirLancamento,
        adicionarItem,
        editarItem,
        ajustarContagem,
        excluirItem,
        adicionarUsuario,
        excluirUsuario,
        atualizarCredenciaisGestor,
        enviarMensagem,
        responderMensagem,
        marcarMensagemStatus,
        marcarTodasMensagensLidas,
        unreadMessagesCount,
        exportarCSV,
        exportarPlanilha,
        exportarInventarioPDF,
        exportarAtaPDF,
        importarPlanilha,
        baixarModeloPlanilha,
        importarPlanilhaUso,
        atualizarMediaUso,
        baixarModeloPlanilhaUso,
        resetarDadosOriginais,
        kpis,
        coverageBucketsCount,
        isMainManager,
        canModifyData,
        sessionOverrideUnlocked,
        mainGestorName,
        liberarComSenhaGestorPrincipal,
        solicitarLiberacaoGestorPrincipal,
        alternarPermissaoGestorSecundario,
        accessRequests,
        aprovarAcessoSecundario,
        recusarAcessoSecundario,
        delphiData,
        exportarDelphi,
        exportarDelphiPDF: exportarDelphiPDFContext,
        restrictedNotice,
        clearRestrictedNotice,
        isRestrictedModalOpen,
        setIsRestrictedModalOpen,
        restrictedModalActionTitle,
        setRestrictedModalActionTitle,
        verifyModifyPermission
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStock must be used within StockProvider');
  return context;
};
