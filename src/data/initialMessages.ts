import { ChatMessage } from '../types';

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'user-aux-1',
    senderName: 'João Silva',
    senderRole: 'auxiliar',
    senderAvatar: 'bg-blue-600',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    text: 'Atenção gestor: Identificamos um palete de Caixa 12 com avaria no transporte na doca 2. Precisa de conferência.',
    category: 'avaria',
    relatedItemCode: 'BR-COR95057',
    relatedItemName: '12',
    status: 'em_analise',
    readByGestor: true,
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    replies: [
      {
        id: 'rep-1',
        senderId: 'user-gestor',
        senderName: 'Gestor Geral',
        senderRole: 'gestor',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        text: 'Ciente João! Já comuniquei a equipe de qualidade para inspecionar o lote.'
      }
    ]
  },
  {
    id: 'msg-2',
    senderId: 'user-aux-2',
    senderName: 'Maria Santos',
    senderRole: 'auxiliar',
    senderAvatar: 'bg-emerald-600',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    text: 'Acabou o estoque de Polibag PM1 na bancada de embalagem principal. Precisamos de reposição urgente para continuar a expedição.',
    category: 'estoque_zerado',
    relatedItemCode: 'BR-PAC20787',
    relatedItemName: 'PM1',
    status: 'pendente',
    readByGestor: false,
    replies: []
  }
];
