import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  KeyRound,
  User,
  Lock,
  LogIn,
  AlertCircle,
  Car,
  Sparkles,
  CheckCircle2,
  Users,
  UserPlus,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount, WorkshopConfig, UserRole } from '../types';
import { syncUserAccountToSupabase } from '../lib/supabaseService';

const luxuryWorkshopLogo = new URL('../assets/images/luxury_workshop_logo_1786628005049.jpg', import.meta.url).href;

interface LoginScreenProps {
  workshopConfig: WorkshopConfig;
  userAccounts: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onSaveUserAccounts?: (users: UserAccount[]) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  workshopConfig,
  userAccounts = [],
  onLoginSuccess,
  onSaveUserAccounts,
}) => {
  const activeAccounts = userAccounts.filter((u) => u.active);
  const isSystemEmpty = activeAccounts.length === 0;

  // Active tab state: default to 'create-initial' if empty, else 'quick'
  const [activeTab, setActiveTab] = useState<'quick' | 'manual' | 'register'>(
    isSystemEmpty ? 'register' : 'quick'
  );

  // Manual Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinManual, setShowPinManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Select State
  const [selectedUserForPin, setSelectedUserForPin] = useState<UserAccount | null>(null);
  const [quickPinInput, setQuickPinInput] = useState('');
  const [showPinQuick, setShowPinQuick] = useState(false);

  // Register New User Form State
  const [registerData, setRegisterData] = useState<{
    name: string;
    username: string;
    passwordPin: string;
    confirmPin: string;
    role: UserRole;
    specialty: string;
    phone: string;
  }>({
    name: '',
    username: '',
    passwordPin: '1234',
    confirmPin: '1234',
    role: isSystemEmpty ? 'Administrador' : 'Mecânico',
    specialty: 'Gestão & Manutenção',
    phone: '',
  });
  const [showRegisterPin, setShowRegisterPin] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = userAccounts.find(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!user) {
      setErrorMessage('Utilizador não encontrado. Verifique o nome de utilizador.');
      return;
    }

    if (!user.active) {
      setErrorMessage('Esta conta de utilizador está inativa. Contacte o Administrador.');
      return;
    }

    if (user.passwordPin !== pinInput.trim()) {
      setErrorMessage('Palavra-passe / PIN incorreto. Tente novamente.');
      return;
    }

    onLoginSuccess(user);
  };

  const handleQuickPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedUserForPin) return;

    if (selectedUserForPin.passwordPin !== quickPinInput.trim()) {
      setErrorMessage(`PIN incorreto para ${selectedUserForPin.name}.`);
      return;
    }

    onLoginSuccess(selectedUserForPin);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!registerData.name.trim()) {
      setErrorMessage('Por favor introduza o nome completo.');
      return;
    }
    if (!registerData.username.trim()) {
      setErrorMessage('Por favor introduza o nome de utilizador (login).');
      return;
    }
    if (!registerData.passwordPin.trim()) {
      setErrorMessage('Por favor introduza um código PIN.');
      return;
    }
    if (registerData.passwordPin !== registerData.confirmPin) {
      setErrorMessage('Os códigos PIN não coincidem.');
      return;
    }

    // Check if username already exists
    const existing = userAccounts.find(
      (u) => u.username.toLowerCase() === registerData.username.trim().toLowerCase()
    );
    if (existing) {
      setErrorMessage(`O nome de utilizador "${registerData.username}" já está em uso.`);
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: registerData.name.trim(),
      username: registerData.username.trim().toLowerCase(),
      passwordPin: registerData.passwordPin.trim(),
      role: registerData.role,
      specialty: registerData.specialty.trim() || 'Mecânica Geral',
      phone: registerData.phone.trim(),
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedAccounts = [...userAccounts, newUser];

    // Sync directly to Supabase if configured
    syncUserAccountToSupabase(newUser).catch((err) =>
      console.error('Falha ao sincronizar utilizador para o Supabase:', err)
    );

    if (onSaveUserAccounts) {
      onSaveUserAccounts(updatedAccounts);
    }

    // Immediately log in as the newly created user
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(30,58,138,0.25),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_rgba(15,23,42,0.8),_transparent_70%)]" />
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

      <div className="relative w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 my-8">
        {/* Left Side: Brand Identity Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
            <Car className="w-80 h-80 text-blue-400" />
          </div>

          <div className="space-y-6 relative z-10">
            {/* Logo Badge */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-500/40 shadow-lg shadow-blue-600/25 shrink-0 group hover:border-blue-400 transition-all">
                <img
                  src={luxuryWorkshopLogo}
                  alt="Oficina Automóvel de Alto Padrão"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white leading-tight">
                  {workshopConfig.name || 'Oficina Automóvel'}
                </h1>
                <p className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase">
                  Gestão & Manutenção PT
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-xl font-bold text-slate-100 leading-snug">
                Portal de Acesso de Colaboradores
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inicie sessão com o seu perfil de Administrador ou Mecânico para gerir folhas de obra, diagnósticos e faturação.
              </p>
            </div>

            {/* Status Card */}
            {isSystemEmpty ? (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Sem Utilizadores Registados</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Não existem contas ativas no sistema. Crie a conta do <strong>Administrador Principal</strong> para iniciar as operações.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                    Utilizadores Ativos
                  </span>
                  <span className="bg-blue-600/30 text-blue-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    {activeAccounts.length} Conta(s)
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {activeAccounts.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {u.role === 'Administrador' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-200 truncate">{u.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">@{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Login & Registration Interactive Area */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Header Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
              <div className="flex items-center gap-2">
                {!isSystemEmpty && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('quick');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'quick'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Escolha Rápida</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('manual');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'manual'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Credenciais</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'register'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSystemEmpty ? 'Registo Inicial' : 'Registar Conta'}</span>
                </button>
              </div>
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="mb-5 bg-red-950/80 border border-red-800 text-red-200 p-3.5 rounded-xl flex items-center gap-3 text-xs animate-shake">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: Quick Profile Switcher with PIN */}
            {activeTab === 'quick' && !isSystemEmpty && (
              <div className="space-y-5">
                {!selectedUserForPin ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Selecione o seu utilizador para iniciar sessão:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeAccounts.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserForPin(user);
                            setQuickPinInput('');
                            setErrorMessage(null);
                          }}
                          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/80 rounded-2xl p-4 text-left transition-all duration-200 group flex items-start gap-3 hover:shadow-lg hover:shadow-blue-900/20"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                              user.role === 'Administrador'
                                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                                : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                            }`}
                          >
                            {user.role === 'Administrador' ? (
                              <ShieldCheck className="w-5 h-5" />
                            ) : (
                              <Wrench className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="font-extrabold text-sm text-white group-hover:text-blue-300 transition-colors">
                              {user.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              @{user.username}
                            </div>
                            <div className="inline-block pt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  user.role === 'Administrador'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* PIN Entry Form */
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            selectedUserForPin.role === 'Administrador'
                              ? 'bg-purple-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {selectedUserForPin.role === 'Administrador' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <Wrench className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">
                            {selectedUserForPin.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Inserir PIN para perfil {selectedUserForPin.role}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForPin(null);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Trocar Perfil
                      </button>
                    </div>

                    <form onSubmit={handleQuickPinLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Código PIN de Acesso
                        </label>
                        <div className="relative">
                          <input
                            type={showPinQuick ? 'text' : 'password'}
                            maxLength={8}
                            autoFocus
                            required
                            placeholder="••••"
                            value={quickPinInput}
                            onChange={(e) => setQuickPinInput(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 bg-slate-900 border border-slate-600 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                          <button
                            type="button"
                            onClick={() => setShowPinQuick(!showPinQuick)}
                            className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                          >
                            {showPinQuick ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForPin(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Confirmar PIN</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Manual Username / Password Form */}
            {activeTab === 'manual' && !isSystemEmpty && (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome de Utilizador / Login
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: admin"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Palavra-passe / PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPinManual ? 'text' : 'password'}
                      required
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPinManual(!showPinManual)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                    >
                      {showPinManual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sessão no Sistema</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Register Account (Initial or Additional) */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {isSystemEmpty && (
                  <div className="bg-blue-950/60 border border-blue-800 p-3.5 rounded-xl text-xs text-blue-200 mb-4 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="font-bold">Primeira Configuração da Oficina</p>
                      <p className="text-[11px] text-blue-300 mt-0.5">
                        Crie a conta de Administrador principal para ter acesso total ao sistema.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome do Utilizador"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Login / Utilizador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: admin"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Perfil de Acesso
                    </label>
                    <select
                      value={registerData.role}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, role: e.target.value as UserRole })
                      }
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                    >
                      <option value="Administrador">Administrador (Gestão Total)</option>
                      <option value="Mecânico">Mecânico (Acesso Técnico)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Código PIN *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPin ? 'text' : 'password'}
                        required
                        placeholder="Ex: 1234"
                        maxLength={8}
                        value={registerData.passwordPin}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, passwordPin: e.target.value })
                        }
                        className="w-full px-3.5 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPin(!showRegisterPin)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showRegisterPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Confirmar PIN *
                    </label>
                    <input
                      type={showRegisterPin ? 'text' : 'password'}
                      required
                      placeholder="Ex: 1234"
                      maxLength={8}
                      value={registerData.confirmPin}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, confirmPin: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Especialidade / Função
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Gestão ou Mecânica Geral"
                      value={registerData.specialty}
                      onChange={(e) => setRegisterData({ ...registerData, specialty: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Contacto Telefónico
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 912 345 678"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSystemEmpty ? 'Criar Administrador e Iniciar Sessão' : 'Registar Conta e Iniciar Sessão'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
