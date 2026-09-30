export type CategoryType = 
  | 'Caixa' 
  | 'Polijiffy' 
  | 'Polibag' 
  | 'Etiqueta' 
  | 'Gift Wrap' 
  | 'Prep' 
  | 'Outros';

export type CountUnit = 'Pallet' | 'Fardo' | 'Rolo' | 'Pacote' | 'de';

export interface StockItem {
  id: string;
  codigo: string;
  descricao: string;
  fornecedor: string;
  tipo: CategoryType;
  nomeItem: string;
  multiplo: number;
  unidadeContagem: CountUnit;
  contagem: number; // quantidade física contada de paletes/fardos/rolos
  localizacao?: string;
  minimoAlerta?: number;
  observacao?: string;
  updatedAt: string;
  updatedBy?: string;
}

export type MovementType = 'retirada' | 'entrada' | 'ajuste_contagem';

export interface StockMovement {
  id: string;
  dataHora: string;
  tipo: MovementType;
  itemId: string;
  itemCodigo: string;
  itemNome: string;
  tipoItem: CategoryType;
  quantidadeContagem: number; // quantos paletes/fardos/rolos
  unidade: CountUnit;
  multiplo: number;
  totalUnidades: number; // quantidadeContagem * multiplo
  contagemAnterior: number;
  contagemNova: number;
  usuarioId: string;
  usuarioNome: string;
  motivo?: string;
}

export type UserRole = 'gestor' | 'auxiliar';

export interface AppUser {
  id: string;
  nome: string;
  username: string;
  pin: string; // senha ou pin
  role: UserRole;
  avatarColor?: string;
  createdAt: string;
  isMainManager?: boolean;
  canEditAndDelete?: boolean; // Permissão liberada pelo gestor principal
}

export type MessageStatus = 'pendente' | 'em_analise' | 'resolvido';

export type MessageCategory = 
  | 'avaria'          // Palete ou fardo danificado
  | 'estoque_zerado'  // Item zerado na bancada
  | 'divergencia'     // Contagem física diferente do sistema
  | 'duvida'          // Dúvida operacional
  | 'urgencia'        // Solicitação urgente
  | 'geral';          // Mensagem geral

export interface ChatReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  timestamp: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  timestamp: string;
  text: string;
  photoUrl?: string; // Base64 data URL for attached warehouse photo
  category: MessageCategory;
  relatedItemCode?: string; // Optional stock item code referenced
  relatedItemName?: string;
  status: MessageStatus;
  readByGestor: boolean;
  replies?: ChatReply[];
}

export type CoverageBucketId = 
  | '0_a_3'        // 0 a 3 dias
  | '3_1_a_5'      // 3,1 a 5 dias
  | '5_1_a_14'     // 5,1 a 14 dias
  | '14_1_a_21'    // 14,1 a 21 dias
  | 'acima_21_1';  // Acima de 21,1 dias

export interface DailyUsageItem {
  itemKey: string; // ex: "12", "PM1", "105", "V3", "SIOC"
  boxNameGroup?: string;
  warehouseId?: string;
  mediaUso: number; // Consumo médio diário
  usoPercentual?: number; // Participação % do mix diário
  consumoDiario?: Record<string, number>; // { 'Set 24, 2026': 842, ... }
  updatedAt: string;
}

export interface ItemCoverageAnalysis {
  itemKey: string;
  itemId?: string;
  codigo?: string;
  descricao?: string;
  nomeItem: string;
  tipo?: CategoryType;
  fornecedor?: string;
  multiplo: number;
  unidadeContagem: CountUnit;
  contagemEstoque: number; // quantidade física contada
  estoqueTotalPecas: number; // estoque total em peças
  mediaUsoDiario: number; // peças consumidas por dia
  usoPercentual: number; // % do total
  diasCobertura: number; // estoqueTotalPecas / mediaUsoDiario
  bucket: CoverageBucketId;
  bucketLabel: string;
}

