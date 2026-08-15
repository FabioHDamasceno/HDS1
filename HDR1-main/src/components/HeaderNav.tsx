import React, { useState } from 'react';
import {
  Wrench,
  Car,
  FileText,
  Users,
  Package,
  Sparkles,
  Search,
  Plus,
  LayoutDashboard,
  ShieldCheck,
  Truck,
  Settings,
  CreditCard,
  Calendar,
  ChevronDown,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { formatLicensePlate } from '../lib/ptFormatters';
import { UserAccount } from '../types';

interface HeaderNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickSearchPlate: (plate: string) => void;
  onNewWorkOrder: () => void;
  workshopName: string;
  userAccounts: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onQuickSearchPlate,
  onNewWorkOrder,
  workshopName,
  userAccounts = [],
  currentUser,
  onSwitchUser,
  onLogout,
}) => {
  const [plateInput, setPlateInput] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handlePlateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plateInput.trim()) {
      onQuickSearchPlate(formatLicensePlate(plateInput));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda & Serviços', icon: Calendar },
    { id: 'workorders', label: 'Folhas de Obra', icon: Wrench },
    { id: 'vehicles', label: 'Veículos & Histórico', icon: Car },
    { id: 'clients', label: 'Clientes & NIF', icon: Users },
    { id: 'invoices', label: 'Faturação IVA', icon: FileText },
    { id: 'expenses', label: 'Despesas & Pagamentos', icon: CreditCard },
    { id: 'inventory', label: 'Stock & Peças', icon: Package },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'ai-assistant', label: 'Assistente IA', icon: Sparkles, highlight: true },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Workshop info */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                {workshopName}
              </span>
              <span className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Oficina PT • Faturação & Histórico
              </span>
            </div>
          </div>

          {/* License Plate Quick Search */}
          <form onSubmit={handlePlateSubmit} className="hidden md:flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar Matrícula (ex: AA-01-AB)"
                value={plateInput}
                onChange={(e) => setPlateInput(formatLicensePlate(e.target.value))}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 text-white placeholder-slate-400 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider font-mono w-60 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              Consultar
            </button>
          </form>

          {/* Active User Account Switcher Dropdown */}
          <div className="flex items-center gap-2.5">
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    currentUser.role === 'Administrador'
                      ? 'bg-purple-950/60 border-purple-800/80 text-purple-200 hover:bg-purple-900/80'
                      : 'bg-amber-950/60 border-amber-800/80 text-amber-200 hover:bg-amber-900/80'
                  }`}
                  title="Mudar Utilizador Autenticado"
                >
                  <div className={`p-1 rounded-lg shrink-0 ${currentUser.role === 'Administrador' ? 'bg-purple-600 text-white' : 'bg-amber-600 text-white'}`}>
                    {currentUser.role === 'Administrador' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-[11px] leading-tight font-extrabold truncate max-w-[120px]">{currentUser.name}</div>
                    <div className="text-[9px] opacity-80 uppercase font-mono font-semibold">{currentUser.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fade-in text-xs">
                    <div className="px-2 py-1.5 border-b border-slate-800 mb-1 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span>Alternar Acesso do Sistema</span>
                      <span className="text-blue-400 font-mono">@{currentUser.username}</span>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {userAccounts.filter((u) => u.active).map((usr) => (
                        <button
                          key={usr.id}
                          onClick={() => {
                            onSwitchUser(usr);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                            usr.id === currentUser.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {usr.role === 'Administrador' ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-xs">{usr.name}</div>
                              <div className="text-[10px] opacity-70 font-mono">Login: {usr.username}</div>
                            </div>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                            usr.role === 'Administrador' ? 'bg-purple-900/80 text-purple-200' : 'bg-amber-900/80 text-amber-200'
                          }`}>
                            {usr.role}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px] text-slate-400">
                      <span>Módulo <strong className="text-slate-200">Configurações</strong></span>
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 font-bold bg-red-950/40 hover:bg-red-900/60 px-2 py-1 rounded transition-colors"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Encerrar Sessão</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center justify-between w-full gap-1 overflow-x-auto pb-2 scrollbar-none pt-1.5 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] xl:text-xs font-semibold whitespace-nowrap transition-all min-w-max ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : item.highlight
                    ? 'text-blue-400 bg-blue-950/40 hover:bg-slate-800/80 hover:text-blue-300'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

