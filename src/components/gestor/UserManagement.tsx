import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';
import { AppUser, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  User,
  Crown,
  Eye,
  EyeOff,
  Edit2,
  Copy,
  Check,
  Share2,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    users,
    currentUser,
    adicionarUsuario,
    excluirUsuario,
    atualizarCredenciaisGestor,
    playAudioFeedback
  } = useStock();

  // Find the logged in manager or the primary manager
  const activeGestor = currentUser?.role === 'gestor'
    ? currentUser
    : users.find(u => u.role === 'gestor') || users[0];

  // Form 1: Edit Manager Profile & Password
  const [gestorName, setGestorName] = useState(activeGestor?.nome || 'Gestor Geral');
  const [gestorUsername, setGestorUsername] = useState(activeGestor?.username || 'gestor');
  const [gestorPin, setGestorPin] = useState(activeGestor?.pin || '9923');
  const [showGestorPin, setShowGestorPin] = useState(false);
  const [gestorSuccess, setGestorSuccess] = useState('');
  const [gestorError, setGestorError] = useState('');

  // Form 2: Add New User (Gestor or Auxiliar)
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('gestor'); // defaults to gestor as requested!
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');

  // Newly created credentials card to provide access to user
  const [justCreatedCredentials, setJustCreatedCredentials] = useState<{
    nome: string;
    username: string;
    pin: string;
    role: UserRole;
  } | null>(null);

  // Search & Filter in user list
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'gestor' | 'auxiliar'>('all');
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Confirm Delete
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Quick edit any user modal
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPin, setEditPin] = useState('');
  const [showEditPin, setShowEditPin] = useState(false);

  const gestoresList = users.filter(u => u.role === 'gestor');
  const auxiliaresList = users.filter(u => u.role === 'auxiliar');

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.nome.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.pin.includes(q)
      );
    }
    return true;
  });

  const togglePinVisibility = (userId: string) => {
    setVisiblePins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyUserCredentials = (user: { nome: string; username: string; pin: string; role: UserRole }, idToMark?: string) => {
    const roleText = user.role === 'gestor'
      ? 'Gestor (Acesso Total: Planilhas, Relatórios, Cobertura, Atas e Equipe)'
      : 'Auxiliar de Almoxarifado (Retirada Rápida e Envio de Fotos/Chat)';

    const text = `📦 ACESSO AO SISTEMA DE ALMOXARIFADO VIX1\nOlá, ${user.nome}!\nSeu acesso foi liberado pelo Gestor Principal:\n\n👤 Usuário de Login: ${user.username}\n🔒 Senha / PIN: ${user.pin}\n🛡️ Perfil: ${roleText}\n🌐 Link de Acesso: ${window.location.origin}\n\nGuarde sua senha para acessar as informações do almoxarifado.`;

    navigator.clipboard.writeText(text);
    if (idToMark) {
      setCopiedId(idToMark);
      setTimeout(() => setCopiedId(null), 2500);
    }
    playAudioFeedback('Dados de acesso copiados para a área de transferência.');
  };

  const handleUpdateGestor = (e: React.FormEvent) => {
    e.preventDefault();
    setGestorSuccess('');
    setGestorError('');

    const res = atualizarCredenciaisGestor(gestorUsername, gestorPin, gestorName, activeGestor?.id);
    if (res.success) {
      setGestorSuccess(res.message);
      playAudioFeedback(`Nome e senha do gestor alterados com sucesso! Nome agora é ${gestorName}.`);
      setTimeout(() => setGestorSuccess(''), 5000);
    } else {
      setGestorError(res.message);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccess('');
    setUserError('');

    const res = adicionarUsuario(newName, newUsername, newPin, newRole);
    if (res.success) {
      setUserSuccess(res.message);
      setJustCreatedCredentials({
        nome: newName.trim(),
        username: newUsername.trim().toLowerCase(),
        pin: newPin.trim(),
        role: newRole
      });
      playAudioFeedback(`Novo ${newRole === 'gestor' ? 'gestor' : 'auxiliar'} cadastrado com sucesso!`);
      setNewName('');
      setNewUsername('');
      setNewPin('');
    } else {
      setUserError(res.message);
    }
  };

  const handleOpenEditUser = (user: AppUser) => {
    setUserToEdit(user);
    setEditName(user.nome);
    setEditUsername(user.username);
    setEditPin(user.pin);
    setShowEditPin(false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const res = atualizarCredenciaisGestor(editUsername, editPin, editName, userToEdit.id);
    if (res.success) {
      playAudioFeedback(`Dados de ${editName} atualizados com sucesso.`);
      setUserToEdit(null);
    } else {
      alert(res.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = excluirUsuario(userToDelete.id);
    if (res.success) {
      playAudioFeedback(`Usuário ${userToDelete.nome} excluído.`);
      setUserToDelete(null);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Controle de Acessos & Múltiplos Usuários
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Gestão de Usuários, Senhas & Equipe
            </h2>
            <p className="text-xs text-slate-400">
              Altere seu nome e senha de gestor geral, crie novos gestores com acesso às informações e forneça a senha aos colaboradores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Gestores (Acesso Total)</span>
            <span className="font-bold text-amber-400 text-base">{gestoresList.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Auxiliares</span>
            <span className="font-bold text-blue-400 text-base">{auxiliaresList.length}</span>
          </div>
        </div>
      </div>

      {/* Pop-up / Alert: Credenciais Recém Criadas para Fornecer ao Usuário */}
      {justCreatedCredentials && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>Acesso Criado com Sucesso! Forneça os Dados ao Colaborador:</span>
            </div>
            <button
              onClick={() => setJustCreatedCredentials(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Colaborador:</span>
              <strong className="text-white font-sans">{justCreatedCredentials.nome}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Perfil:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                justCreatedCredentials.role === 'gestor'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {justCreatedCredentials.role === 'gestor' ? 'Gestor (Acesso Total)' : 'Auxiliar de Almoxarifado'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Usuário de Login:</span>
              <strong className="text-amber-400">{justCreatedCredentials.username}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Senha de Acesso:</span>
              <strong className="text-emerald-300 text-sm tracking-widest">{justCreatedCredentials.pin}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => copyUserCredentials(justCreatedCredentials, 'just-created')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              {copiedId === 'just-created' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedId === 'just-created' ? 'Copiado para Enviar!' : 'Copiar Acesso Formatado (WhatsApp / Mensagem)'}</span>
            </button>
            <span className="text-[11px] text-slate-400">
              O colaborador pode entrar imediatamente no sistema com este usuário e senha.
            </span>
          </div>
        </div>
      )}

      {/* Grid: Edit My Profile + Add New User Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Alterar Nome e Senha do Gestor Logado */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Alterar Meu Nome & Senha (Gestor Geral)
              </h3>
              <p className="text-[11px] text-slate-400">
                Altere o nome "Gestor Geral" para o seu nome real e personalize a sua senha de acesso.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateGestor} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Gestor Geral:
              </label>
              <input
                type="text"
                value={gestorName}
                onChange={e => setGestorName(e.target.value)}
                placeholder="Ex: Carlos Gestor / Maria Líder Almoxarifado"
                required
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Este nome será exibido nas atas de cobertura em PDF e relatórios.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Usuário para Login:
              </label>
              <input
                type="text"
                value={gestorUsername}
                onChange={e => setGestorUsername(e.target.value)}
                placeholder="Ex: gestor"
                required
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nova Senha Desejada:
              </label>
              <div className="relative">
                <input
                  type={showGestorPin ? 'text' : 'password'}
                  value={gestorPin}
                  onChange={e => setGestorPin(e.target.value)}
                  required
                  placeholder="Digite sua nova senha"
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowGestorPin(!showGestorPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showGestorPin ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showGestorPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Senha inicial anterior: <strong className="text-amber-400 font-mono">9923</strong>. Você pode definir qualquer número ou palavra.
              </span>
            </div>

            {gestorSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{gestorSuccess}</span>
              </div>
            )}

            {gestorError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{gestorError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
            >
              <KeyRound className="w-4 h-4" />
              <span>Salvar Meu Nome & Minha Senha</span>
            </button>
          </form>
        </div>

        {/* Card 2: Cadastrar Novo Acesso (Múltiplos Gestores ou Auxiliares) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Criar Acesso para Outro Usuário
              </h3>
              <p className="text-[11px] text-slate-400">
                O gestor principal pode adicionar novos gestores ou auxiliares e fornecer a senha.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3.5">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Acesso (Perfil):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    newRole === 'gestor'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="role"
                      checked={newRole === 'gestor'}
                      onChange={() => setNewRole('gestor')}
                      className="accent-amber-500"
                    />
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-xs">Novo Gestor</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Acesso completo: planilhas, relatórios, atas, zerados e equipe.
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    newRole === 'auxiliar'
                      ? 'bg-blue-500/10 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="role"
                      checked={newRole === 'auxiliar'}
                      onChange={() => setNewRole('auxiliar')}
                      className="accent-blue-500"
                    />
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-xs">Auxiliar</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Operador no galpão: retirada rápida e envio de fotos/chat.
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Colaborador:
              </label>
              <input
                type="text"
                placeholder={newRole === 'gestor' ? "Ex: Roberta Supervisora" : "Ex: Pedro Henrique"}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Usuário de Login:
                </label>
                <input
                  type="text"
                  placeholder="Ex: roberta"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha que você fornecerá:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 8844 ou senha"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {userSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{userSuccess}</span>
              </div>
            )}

            {userError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar {newRole === 'gestor' ? 'Novo Gestor' : 'Auxiliar'} & Gerar Acesso</span>
            </button>
          </form>
        </div>
      </div>

      {/* Users List with Search & Role Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Todos os Usuários Cadastrados ({users.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Consulte e forneça a senha de acesso aos colaboradores sempre que necessário.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('gestor')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'gestor' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gestores ({gestoresList.length})
            </button>
            <button
              onClick={() => setRoleFilter('auxiliar')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'auxiliar' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auxiliares ({auxiliaresList.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, usuário de login ou senha..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Users Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsers.map((u, idx) => {
            const isManager = u.role === 'gestor';
            const isMainManager = isManager && (idx === 0 || u.username === 'gestor' || u.id === 'user-gestor');
            const isSelf = u.id === currentUser?.id;
            const isPinVisible = visiblePins[u.id] || false;

            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                  isManager
                    ? 'bg-slate-950/90 border-amber-500/30 shadow-md'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Header: Avatar, Name & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        u.avatarColor || (isManager ? 'bg-amber-600' : 'bg-blue-600')
                      } text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md`}
                    >
                      {u.nome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                        <span className="truncate">{u.nome}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-normal shrink-0">
                            (Você)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block truncate">
                        login: <strong className="text-slate-200">@{u.username}</strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isMainManager
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isManager
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isMainManager ? 'Gestor Principal' : isManager ? 'Gestor' : 'Auxiliar'}
                  </span>
                </div>

                {/* Password / PIN Section */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block leading-none mb-1">
                      Senha de Acesso:
                    </span>
                    <span className="font-mono font-bold text-white text-sm tracking-wider">
                      {isPinVisible ? u.pin : '••••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePinVisibility(u.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isPinVisible ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(u.pin);
                        setCopiedId(`pin-${u.id}`);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
                      title="Copiar apenas a senha"
                    >
                      {copiedId === `pin-${u.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `pin-${u.id}` ? 'Copiada!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Actions: Copiar Ficha de Acesso, Editar, Excluir */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => copyUserCredentials(u, u.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Copiar mensagem com login e senha para enviar no WhatsApp"
                  >
                    {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copiedId === u.id ? 'Acesso Copiado!' : 'Fornecer Acesso'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Editar nome, login ou senha"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    {/* Cannot delete the last manager or logged in manager */}
                    {!(isManager && gestoresList.length <= 1) && !isSelf && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit User Modal */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Editar Acesso de {userToEdit.nome}</span>
            </h3>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Usuário de Login:</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nova Senha / PIN:</label>
                <div className="relative">
                  <input
                    type={showEditPin ? 'text' : 'password'}
                    value={editPin}
                    onChange={e => setEditPin(e.target.value)}
                    required
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showEditPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Excluir Acesso de {userToDelete.nome}?</h3>
            <p className="text-xs text-slate-400">
              Esta ação removerá permanentemente o acesso deste usuário ao sistema do almoxarifado.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
