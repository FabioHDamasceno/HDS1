import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  FileText,
  CreditCard,
  Percent,
  Euro,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Eye,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  UserPlus,
  KeyRound,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  X,
  ShieldAlert,
  Database,
  RefreshCw,
  Copy,
  UploadCloud,
  DownloadCloud,
  Check,
  AlertTriangle,
  Server,
  Code,
  Sparkles,
} from 'lucide-react';
import {
  WorkshopConfig,
  UserAccount,
  UserRole,
  Client,
  Vehicle,
  MaintenanceRecord,
  WorkOrder,
  Invoice,
  InventoryPart,
  Supplier,
  Expense,
  Appointment,
} from '../types';
import { validateNIF, formatCurrency } from '../lib/ptFormatters';
import { INITIAL_WORKSHOP_CONFIG } from '../data/initialData';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
} from '../lib/supabase';
import {
  testSupabaseConnection,
  uploadAllLocalDataToSupabase,
  fetchAllDataFromSupabase,
  clearAllSupabaseData,
  TestConnectionResult,
} from '../lib/supabaseService';
import { SUPABASE_FULL_SCHEMA_SQL } from '../lib/supabaseSchemaSql';

interface SettingsViewProps {
  workshopConfig: WorkshopConfig;
  onSaveConfig: (config: WorkshopConfig) => void;
  userAccounts: UserAccount[];
  onSaveUserAccounts: (users: UserAccount[]) => void;
  currentUser: UserAccount;

  // Zerar & Supabase integration props
  onResetSystemToZero?: (clearSupabaseRemote?: boolean) => Promise<void> | void;
  onRestoreDemoData?: () => void;
  entityCounts?: {
    clients: number;
    vehicles: number;
    workOrders: number;
    invoices: number;
    inventory: number;
    expenses: number;
    appointments: number;
    suppliers: number;
    maintenance: number;
  };
  currentDataPayload?: {
    workshopConfig: WorkshopConfig;
    clients: Client[];
    vehicles: Vehicle[];
    maintenanceRecords: MaintenanceRecord[];
    workOrders: WorkOrder[];
    invoices: Invoice[];
    inventory: InventoryPart[];
    suppliers: Supplier[];
    expenses: Expense[];
    appointments: Appointment[];
    userAccounts: UserAccount[];
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  workshopConfig,
  onSaveConfig,
  userAccounts = [],
  onSaveUserAccounts,
  currentUser,
  onResetSystemToZero,
  onRestoreDemoData,
  entityCounts = {
    clients: 0,
    vehicles: 0,
    workOrders: 0,
    invoices: 0,
    inventory: 0,
    expenses: 0,
    appointments: 0,
    suppliers: 0,
    maintenance: 0,
  },
  currentDataPayload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'users' | 'database'>('general');

  // General Workshop Config Form
  const [formData, setFormData] = useState<WorkshopConfig>({
    name: workshopConfig.name || '',
    nif: workshopConfig.nif || '',
    address: workshopConfig.address || '',
    postalCode: workshopConfig.postalCode || '',
    city: workshopConfig.city || '',
    phone: workshopConfig.phone || '',
    email: workshopConfig.email || '',
    iban: workshopConfig.iban || '',
    defaultHourlyRate: workshopConfig.defaultHourlyRate || 42.5,
    capitalSocial: workshopConfig.capitalSocial || '50.000,00 €',
    conservatoria: workshopConfig.conservatoria || 'Conservatória do Registo Comercial',
    defaultVatRate: workshopConfig.defaultVatRate || 23,
    invoiceNotes:
      workshopConfig.invoiceNotes ||
      'Processado por programa certificado SAF-T PT. Bens sujeitos a reserva de propriedade até liquidação integral.',
    website: workshopConfig.website || '',
    logoText: workshopConfig.logoText || 'AML',
  });

  const [nifError, setNifError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // User Accounts Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userFormData, setUserFormData] = useState<{
    name: string;
    username: string;
    passwordPin: string;
    role: UserRole;
    specialty: string;
    phone: string;
    active: boolean;
  }>({
    name: '',
    username: '',
    passwordPin: '0000',
    role: 'Mecânico',
    specialty: 'Mecânica Geral',
    phone: '',
    active: true,
  });

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Zerar Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [clearSupabaseCheck, setClearSupabaseCheck] = useState(true);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseKey(creds.key);
  }, []);

  const handleNifChange = (raw: string) => {
    const val = raw.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({ ...prev, nif: val }));

    if (val.length === 9) {
      const res = validateNIF(val);
      if (!res.isValid) {
        setNifError(res.message);
      } else {
        setNifError(null);
      }
    } else if (val.length > 0) {
      setNifError('O NIF deve ter 9 dígitos.');
    } else {
      setNifError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nif) {
      const check = validateNIF(formData.nif);
      if (!check.isValid) {
        setNifError(check.message);
        return;
      }
    }

    onSaveConfig(formData);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
    }, 4000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Tem a certeza que deseja repor os dados originais da oficina?'
      )
    ) {
      setFormData(INITIAL_WORKSHOP_CONFIG);
      onSaveConfig(INITIAL_WORKSHOP_CONFIG);
      setNifError(null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    }
  };

  // User Accounts Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      username: '',
      passwordPin: '1234',
      role: 'Mecânico',
      specialty: 'Mecânica Geral',
      phone: '',
      active: true,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      username: user.username,
      passwordPin: user.passwordPin,
      role: user.role,
      specialty: user.specialty || '',
      phone: user.phone || '',
      active: user.active,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.username.trim()) {
      alert('Por favor preencha o nome e o login de utilizador.');
      return;
    }

    let updatedList: UserAccount[];

    if (editingUser) {
      updatedList = userAccounts.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: userFormData.name.trim(),
              username: userFormData.username.trim().toLowerCase(),
              passwordPin: userFormData.passwordPin.trim(),
              role: userFormData.role,
              specialty: userFormData.specialty.trim(),
              phone: userFormData.phone.trim(),
              active: userFormData.active,
            }
          : u
      );
    } else {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: userFormData.name.trim(),
        username: userFormData.username.trim().toLowerCase(),
        passwordPin: userFormData.passwordPin.trim() || '0000',
        role: userFormData.role,
        specialty: userFormData.specialty.trim(),
        phone: userFormData.phone.trim(),
        active: userFormData.active,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updatedList = [...userAccounts, newUser];
    }

    onSaveUserAccounts(updatedList);
    setIsUserModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const handleToggleUserActive = (user: UserAccount) => {
    const updated = userAccounts.map((u) =>
      u.id === user.id ? { ...u, active: !u.active } : u
    );
    onSaveUserAccounts(updated);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (userAccounts.length <= 1) {
      alert('Não é possível eliminar a única conta de utilizador do sistema.');
      return;
    }
    if (
      window.confirm(
        `Tem a certeza que pretende eliminar a conta do utilizador "${user.name}"?`
      )
    ) {
      const updated = userAccounts.filter((u) => u.id !== user.id);
      onSaveUserAccounts(updated);
    }
  };

  // Supabase Handlers
  const handleSaveSupabaseCredentials = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setTestResult(null);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const handleTestSupabaseConnection = async () => {
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setTestingSupabase(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestingSupabase(false);
    setTestResult(res);
  };

  const handleSyncToSupabase = async () => {
    if (!currentDataPayload) {
      alert('Erro: Dados do sistema indisponíveis para sincronização.');
      return;
    }
    setSyncingSupabase(true);
    setSyncMessage(null);
    const res = await uploadAllLocalDataToSupabase(currentDataPayload);
    setSyncingSupabase(false);
    setSyncMessage(res.message);
  };

  const handleFetchFromSupabase = async () => {
    setSyncingSupabase(true);
    setSyncMessage(null);
    try {
      const data = await fetchAllDataFromSupabase();
      if (!data) {
        setSyncMessage('Sem dados encontrados no Supabase ou erro na ligação.');
      } else {
        if (data.workshopConfig) localStorage.setItem('oficina_config', JSON.stringify(data.workshopConfig));
        if (data.clients) localStorage.setItem('oficina_clients', JSON.stringify(data.clients));
        if (data.vehicles) localStorage.setItem('oficina_vehicles', JSON.stringify(data.vehicles));
        if (data.maintenanceRecords) localStorage.setItem('oficina_maintenance', JSON.stringify(data.maintenanceRecords));
        if (data.workOrders) localStorage.setItem('oficina_workorders', JSON.stringify(data.workOrders));
        if (data.invoices) localStorage.setItem('oficina_invoices', JSON.stringify(data.invoices));
        if (data.inventory) localStorage.setItem('oficina_inventory', JSON.stringify(data.inventory));
        if (data.suppliers) localStorage.setItem('oficina_suppliers', JSON.stringify(data.suppliers));
        if (data.expenses) localStorage.setItem('oficina_expenses', JSON.stringify(data.expenses));
        if (data.appointments) localStorage.setItem('oficina_appointments', JSON.stringify(data.appointments));
        if (data.userAccounts) localStorage.setItem('oficina_users', JSON.stringify(data.userAccounts));

        setSyncMessage('Sucesso! Dados descarregados do Supabase com sucesso. A atualizar...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setSyncMessage(`Erro ao descarregar dados: ${err?.message || 'Erro de comunicação'}`);
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_FULL_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Zerar Handlers
  const handleConfirmResetSystem = async () => {
    if (!onResetSystemToZero) return;
    setIsResetting(true);

    try {
      await onResetSystemToZero(clearSupabaseCheck && isSupabaseConfigured());
      setIsResetting(false);
      setIsResetModalOpen(false);
      setResetConfirmationText('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    } catch (err: any) {
      setIsResetting(false);
      alert(`Erro ao zerar sistema: ${err?.message || 'Falha no processo'}`);
    }
  };

  const nifCheckResult = validateNIF(formData.nif);
  const totalItemsCount =
    entityCounts.clients +
    entityCounts.vehicles +
    entityCounts.workOrders +
    entityCounts.invoices +
    entityCounts.inventory +
    entityCounts.expenses +
    entityCounts.appointments +
    entityCounts.suppliers +
    entityCounts.maintenance;

  const isSystemZeroed = totalItemsCount === 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Parâmetros do Sistema, Acessos & Base de Dados</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Configuração & Gestão do Sistema
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Gerira os dados fiscais da oficina, utilizadores, ligação ao Supabase e zeramento de base de dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'general' && (
            <button
              onClick={handleReset}
              type="button"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          )}
          {activeSubTab === 'users' && (
            <button
              onClick={handleOpenAddUser}
              type="button"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Login Mecânico</span>
            </button>
          )}
          {activeSubTab === 'database' && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              type="button"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all animate-pulse"
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar Sistema (0 Registos)</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Oficina & Faturação</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contas de Mecânicos & Acessos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'users' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {userAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap ${
            activeSubTab === 'database'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase & Zerar Sistema</span>
          {isSystemZeroed ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
              ZERADO (0)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {totalItemsCount} Registos
            </span>
          )}
        </button>
      </div>

      {/* Success Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Operação Concluída com Sucesso!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                As alterações foram guardadas e aplicadas imediatamente ao sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: General Workshop Settings */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Settings Form */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Identification section */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2>Identificação da Empresa & Dados Fiscais</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Workshop Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome da Oficina / Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* NIF */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIF / NIPC da Empresa (9 dígitos) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={formData.nif}
                        onChange={(e) => handleNifChange(e.target.value)}
                        className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:outline-none font-mono font-bold ${
                          nifError
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                      />
                      <div className="absolute right-3 top-2.5">
                        {nifCheckResult.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    {nifError && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">
                        {nifError}
                      </p>
                    )}
                  </div>

                  {/* Capital Social */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Capital Social (€)
                    </label>
                    <input
                      type="text"
                      value={formData.capitalSocial}
                      onChange={(e) =>
                        setFormData({ ...formData, capitalSocial: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ex: 50.000,00 €"
                    />
                  </div>

                  {/* Conservatoria */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Conservatória do Registo Comercial
                    </label>
                    <input
                      type="text"
                      value={formData.conservatoria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conservatoria: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ex: Conservatória do Registo Comercial do Porto"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Contacts & Address */}
              <div className="pt-2">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h2>Localização & Contactos Comerciais</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Morada Completa da Oficina *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Localidade / Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone Geral / Oficina *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Geral / Faturação *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Pricing & VAT Defaults */}
              <div className="pt-2">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2>Valores Padrão de Mão de Obra e Pagamento</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Hourly rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço Mão-de-Obra p/ Hora (€ S/ IVA) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formData.defaultHourlyRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultHourlyRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                        €/h
                      </span>
                    </div>
                  </div>

                  {/* Default VAT */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Taxa de IVA Padrão (Portugal Continental)
                    </label>
                    <div className="relative">
                      <select
                        value={formData.defaultVatRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultVatRate: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      >
                        <option value={23}>23% (Taxa Normal PT)</option>
                        <option value={13}>13% (Taxa Intermédia)</option>
                        <option value={6}>6% (Taxa Reduzida)</option>
                        <option value={0}>0% (Isento - Art. 16.º IVA)</option>
                      </select>
                    </div>
                  </div>

                  {/* IBAN */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IBAN para Pagamentos (Impresso nas Faturas)
                    </label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) =>
                        setFormData({ ...formData, iban: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="PT50 0000 0000 0000 0000 0000 0"
                    />
                  </div>

                  {/* Invoice footer notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Notas de Rodapé em Documentos e Faturas
                    </label>
                    <textarea
                      rows={2}
                      value={formData.invoiceNotes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoiceNotes: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Alterações da Oficina</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Preview Box */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Pré-visualização do Cabeçalho</span>
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-sans">
                <div className="font-extrabold text-slate-900 text-sm">
                  {formData.name || 'Nome da Oficina'}
                </div>
                <div className="text-slate-600 text-[11px] font-semibold">
                  NIF / NIPC: {formData.nif || '999999990'}
                </div>
                <div className="text-slate-500 text-[11px] leading-tight">
                  {formData.address || 'Morada da Oficina'}
                  <br />
                  {formData.postalCode} {formData.city}
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{formData.phone || '220 000 000'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.email || 'geral@oficina.pt'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: User Accounts & Mechanics Logins Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Information & Permission Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-5 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  Gestão de Acessos & Regras de Acesso para Mecânicos
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O Administrador pode criar e gerir os logins dos mecânicos da oficina. Por motivos de segurança operacional e controlo de qualidade:
                </p>
                <div className="mt-2 bg-white/80 p-3 rounded-xl border border-amber-200/80 text-xs text-slate-700 space-y-1 font-medium">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Permissões do Mecânico Autenticado:</span>
                  </div>
                  <p className="text-slate-600 pl-6">
                    • Na <strong>Ordem de Serviço</strong>, o mecânico apenas tem permissão para alterar o estado do trabalho entre:
                    <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mx-1">Aguardar Peças</span>
                    <span className="font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded mx-1">Em Reparação</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded mx-1">Pronto para Entrega</span>
                  </p>
                  <p className="text-slate-500 text-[11px] pl-6">
                    • Alterações de preços, dados de faturação e anulação de ordens continuam exclusivas do Administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Accounts List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Utilizadores Registados ({userAccounts.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lista de contas ativas e pendentes para acesso ao sistema da oficina.
                </p>
              </div>

              <button
                onClick={handleOpenAddUser}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Adicionar Novo Mecânico</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAccounts.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    user.active
                      ? 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          user.role === 'Administrador'
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {user.role === 'Administrador' ? (
                          <ShieldCheck className="w-3 h-3 text-purple-700" />
                        ) : (
                          <Wrench className="w-3 h-3 text-amber-700" />
                        )}
                        <span>{user.role}</span>
                      </span>

                      <button
                        onClick={() => handleToggleUserActive(user)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                          user.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                        }`}
                        title={user.active ? 'Inativar conta' : 'Ativar conta'}
                      >
                        {user.active ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Ativo
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 text-slate-500" /> Inativo
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {user.name}
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200/60 w-fit">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>Login: <strong>{user.username}</strong></span>
                        <span className="text-slate-400">• PIN: {user.passwordPin}</span>
                      </div>

                      {user.specialty && (
                        <div className="text-xs text-slate-500">
                          Especialidade: <span className="font-semibold text-slate-700">{user.specialty}</span>
                        </div>
                      )}

                      {user.phone && (
                        <div className="text-xs text-slate-500">
                          Contacto: <span className="font-semibold text-slate-700">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Criado em: {user.createdAt}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                        title="Editar Utilizador"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Database, Supabase Integration & System Reset */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          {/* Status Box: Zeroed vs Populated */}
          <div
            className={`rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              isSystemZeroed
                ? 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-red-200 text-slate-900'
                : 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl text-white shrink-0 shadow-sm ${
                  isSystemZeroed ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              >
                {isSystemZeroed ? <AlertTriangle className="w-6 h-6" /> : <Database className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">
                    {isSystemZeroed ? 'Sistema Zerado e Limpo (0 Registos)' : 'Sistema com Dados Ativos'}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isSystemZeroed ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isSystemZeroed ? 'Pronto para Supabase' : 'Em Operação'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  {isSystemZeroed
                    ? 'A base de dados local está limpa e vazia (0 registos). O sistema está pronto para utilização em produção ou sincronização direta com o Supabase.'
                    : `Atualmente existem ${totalItemsCount} registos no sistema (${entityCounts.clients} clientes, ${entityCounts.vehicles} veículos, ${entityCounts.workOrders} ordens de trabalho, ${entityCounts.invoices} faturas, ${entityCounts.inventory} peças).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSystemZeroed ? 'Sistema Limpo' : 'Limpar Todos os Dados'}</span>
              </button>
            </div>
          </div>

          {/* Counts Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes</span>
              <span className="text-lg font-black text-slate-900">{entityCounts.clients}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Veículos</span>
              <span className="text-lg font-black text-slate-900">{entityCounts.vehicles}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordens de Serviço</span>
              <span className="text-lg font-black text-slate-900">{entityCounts.workOrders}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faturas</span>
              <span className="text-lg font-black text-slate-900">{entityCounts.invoices}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peças Inventário</span>
              <span className="text-lg font-black text-slate-900">{entityCounts.inventory}</span>
            </div>
          </div>

          {/* Supabase Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white p-2.5 rounded-xl shrink-0 shadow-xs">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Configuração da Base de Dados Supabase</span>
                    {isSupabaseConfigured() ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Configurado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        Pendente Credenciais
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ligue a sua aplicação a uma instância PostgreSQL hosted em Supabase.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={testingSupabase}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${testingSupabase ? 'animate-spin' : ''}`} />
                  <span>{testingSupabase ? 'A testar...' : 'Testar Conexão'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabaseCredentials}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Chaves</span>
                </button>
              </div>
            </div>

            {/* Test Result Message Alert */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in text-xs font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.success ? 'Ligação com Sucesso!' : 'Atenção / Erro de Ligação'}</p>
                  <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL do Projeto Supabase (VITE_SUPABASE_URL) *
                </label>
                <input
                  type="text"
                  placeholder="https://xxxxxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Encontra este URL nas definições do projeto no dashboard do Supabase (Project Settings &gt; API).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chave Pública / Anon Key (VITE_SUPABASE_ANON_KEY) *
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Chave pública <code className="text-slate-600">anon</code> / <code className="text-slate-600">public</code>.
                </p>
              </div>
            </div>

            {/* Sync Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Sincronização de dados entre a aplicação local e o Supabase cloud:
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchFromSupabase}
                  disabled={syncingSupabase || !isSupabaseConfigured()}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                  title="Descarregar todos os dados do Supabase e atualizar a aplicação"
                >
                  <DownloadCloud className={`w-4 h-4 ${syncingSupabase ? 'animate-bounce' : ''}`} />
                  <span>Importar do Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={syncingSupabase || !isSupabaseConfigured()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                  title="Guardar todos os dados locais no Supabase"
                >
                  <UploadCloud className={`w-4 h-4 ${syncingSupabase ? 'animate-bounce' : ''}`} />
                  <span>{syncingSupabase ? 'A Sincronizar...' : 'Exportar para Supabase'}</span>
                </button>
              </div>
            </div>

            {syncMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold">
                {syncMessage}
              </div>
            )}
          </div>

          {/* SQL Schema Script Box */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>Script SQL do Supabase (Schema com 11 Tabelas & RLS)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copie este código e execute-o diretamente no <strong>SQL Editor</strong> do seu dashboard do Supabase.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copiado para Área de Transferência!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-72 overflow-y-auto font-mono text-xs text-blue-300 leading-relaxed scrollbar-thin">
              <pre>{SUPABASE_FULL_SCHEMA_SQL}</pre>
            </div>
          </div>
        </div>
      )}

      {/* User Add / Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in relative">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingUser ? 'Editar Conta de Utilizador' : 'Cadastrar Login de Mecânico'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser ? 'Atualize as credenciais do utilizador.' : 'Defina os dados de acesso para o novo mecânico.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Mecânico / Utilizador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Mecânico / Utilizador"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome de Utilizador / Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="joao.mecanico"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Palavra-passe / PIN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234"
                    value={userFormData.passwordPin}
                    onChange={(e) => setUserFormData({ ...userFormData, passwordPin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Função no Sistema *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Mecânico">Mecânico (Acesso Restrito OS)</option>
                    <option value="Administrador">Administrador (Acesso Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contacto Telefónico
                  </label>
                  <input
                    type="text"
                    placeholder="912 000 000"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Especialidade Técnica / Área
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mecânica Geral & Travões, Eletrónica & Diagnóstico..."
                  value={userFormData.specialty}
                  onChange={(e) => setUserFormData({ ...userFormData, specialty: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={userFormData.active}
                  onChange={(e) => setUserFormData({ ...userFormData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Conta Ativa (Permite iniciar sessão no sistema)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs"
                >
                  {editingUser ? 'Atualizar Conta' : 'Criar Conta de Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: ZERAR TODO O SISTEMA */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 animate-fade-in relative">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-red-100">
              <div className="bg-red-600 text-white p-2.5 rounded-xl shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Zerar Todo o Sistema (Apagar Todos os Registos)
                </h3>
                <p className="text-xs text-red-600 font-semibold">
                  Atenção: Esta ação irá limpar completamente a base de dados!
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ao zerar o sistema, os seguintes registos locais serão permanentemente removidos:
              </p>

              <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs font-mono font-bold text-red-900 grid grid-cols-2 gap-2">
                <div>• {entityCounts.clients} Clientes</div>
                <div>• {entityCounts.vehicles} Veículos</div>
                <div>• {entityCounts.workOrders} Folhas de Obra</div>
                <div>• {entityCounts.invoices} Faturas</div>
                <div>• {entityCounts.inventory} Peças de Inventário</div>
                <div>• {entityCounts.expenses} Despesas</div>
                <div>• {entityCounts.appointments} Marcações</div>
                <div>• {entityCounts.suppliers} Fornecedores</div>
              </div>

              {isSupabaseConfigured() && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="clearSupabaseRemote"
                      checked={clearSupabaseCheck}
                      onChange={(e) => setClearSupabaseCheck(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <label
                      htmlFor="clearSupabaseRemote"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Limpar também as tabelas remotas no Supabase
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    Se ativado, irá também eliminar todas as linhas das tabelas no seu projeto Supabase configurado.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Para confirmar, escreva <code className="text-red-600 font-extrabold">ZERAR</code> abaixo:
                </label>
                <input
                  type="text"
                  placeholder="ZERAR"
                  value={resetConfirmationText}
                  onChange={(e) => setResetConfirmationText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetSystem}
                  disabled={resetConfirmationText.trim() !== 'ZERAR' || isResetting}
                  className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isResetting ? 'A Limpar Base de Dados...' : 'ZERAR SISTEMA AGORA'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
