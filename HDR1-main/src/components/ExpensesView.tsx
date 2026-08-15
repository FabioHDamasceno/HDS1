import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Zap,
  Droplets,
  Users,
  FileText,
  Truck,
  Edit2,
  Trash2,
  X,
  Printer,
  Calendar,
  Check,
  Tag,
  Receipt,
  Download,
  Flame,
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseStatus, Supplier, Invoice, Client, WorkshopConfig } from '../types';
import { formatCurrency, formatDatePT } from '../lib/ptFormatters';
import { MonthlyReportModal } from './MonthlyReportModal';

interface ExpensesViewProps {
  expenses: Expense[];
  suppliers: Supplier[];
  invoices?: Invoice[];
  clients?: Client[];
  workshopConfig?: WorkshopConfig;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  'Aluguer & Renda': Building2,
  'Fornecedores & Peças': Truck,
  'Eletricidade & Energia': Zap,
  'Água & Saneamento': Droplets,
  'Salários & Funcionários': Users,
  'Impostos & Seg. Social': FileText,
  'Comunicações & Internet': Tag,
  'Ferramentas & Equipamento': Receipt,
  'Combustível & Transporte': Flame,
  'Outras Despesas': CreditCard,
};

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; border: string; bar: string }> = {
  'Aluguer & Renda': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', bar: 'bg-purple-600' },
  'Fornecedores & Peças': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', bar: 'bg-blue-600' },
  'Eletricidade & Energia': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
  'Água & Saneamento': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', bar: 'bg-cyan-500' },
  'Salários & Funcionários': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-600' },
  'Impostos & Seg. Social': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', bar: 'bg-rose-600' },
  'Comunicações & Internet': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', bar: 'bg-indigo-600' },
  'Ferramentas & Equipamento': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', bar: 'bg-orange-500' },
  'Combustível & Transporte': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', bar: 'bg-yellow-600' },
  'Outras Despesas': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', bar: 'bg-slate-600' },
};

const ALL_CATEGORIES: ExpenseCategory[] = [
  'Aluguer & Renda',
  'Fornecedores & Peças',
  'Eletricidade & Energia',
  'Água & Saneamento',
  'Salários & Funcionários',
  'Impostos & Seg. Social',
  'Comunicações & Internet',
  'Ferramentas & Equipamento',
  'Combustível & Transporte',
  'Outras Despesas',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  suppliers,
  invoices = [],
  clients = [],
  workshopConfig = {
    name: 'Oficina Auto',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    capitalSocial: '',
    conservatoria: '',
    iban: '',
    defaultHourlyRate: 40.0,
    defaultVatRate: 23,
  },
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'vencimento' | 'valor' | 'recentes'>('vencimento');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Pay Modal State
  const [payModalExpense, setPayModalExpense] = useState<Expense | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<Expense['paymentMethod']>('Transferência Bancária');

  // Form State
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'Fornecedores & Peças',
    description: '',
    amount: 0,
    vatRate: 23,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    paymentMethod: 'Transferência Bancária',
    notes: '',
  });

  // Calculate totals
  const totalExpensesAmount = useMemo(
    () => expenses.filter((e) => e.status !== 'Cancelado').reduce((acc, e) => acc + e.amount, 0),
    [expenses]
  );

  const pendingAmount = useMemo(
    () =>
      expenses
        .filter((e) => e.status === 'Pendente' || e.status === 'Atrasado')
        .reduce((acc, e) => acc + e.amount, 0),
    [expenses]
  );

  const pendingCount = useMemo(
    () => expenses.filter((e) => e.status === 'Pendente' || e.status === 'Atrasado').length,
    [expenses]
  );

  const paidAmount = useMemo(
    () => expenses.filter((e) => e.status === 'Pago').reduce((acc, e) => acc + e.amount, 0),
    [expenses]
  );

  const totalVatDeductible = useMemo(
    () => expenses.filter((e) => e.status !== 'Cancelado').reduce((acc, e) => acc + (e.vatAmount || 0), 0),
    [expenses]
  );

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch =
          exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.supplierName && exp.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (exp.documentRef && exp.documentRef.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'Todas' || exp.category === selectedCategory;
        const matchesStatus = selectedStatus === 'Todos' || exp.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'vencimento') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'valor') {
          return b.amount - a.amount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [expenses, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Category Breakdown Totals
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter((e) => e.status !== 'Cancelado')
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return map;
  }, [expenses]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'Fornecedores & Peças',
      description: '',
      amount: 0,
      vatRate: 23,
      vatAmount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      paymentMethod: 'Transferência Bancária',
      notes: '',
      supplierName: '',
      documentRef: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({ ...exp });
    setIsModalOpen(true);
  };

  const handleFormAmountChange = (val: number, vatRateVal: number) => {
    const vatCalculated = val > 0 && vatRateVal > 0 ? (val * vatRateVal) / (100 + vatRateVal) : 0;
    setFormData((prev) => ({
      ...prev,
      amount: val,
      vatRate: vatRateVal,
      vatAmount: Math.round(vatCalculated * 100) / 100,
    }));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || formData.amount <= 0) {
      alert('Por favor, preencha a descrição e um valor válido superior a 0 €.');
      return;
    }

    const vatCalc =
      (formData.amount || 0) > 0 && (formData.vatRate || 0) > 0
        ? ((formData.amount || 0) * (formData.vatRate || 0)) / (100 + (formData.vatRate || 0))
        : 0;

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      category: (formData.category as ExpenseCategory) || 'Outras Despesas',
      description: formData.description || 'Despesa sem descrição',
      amount: Number(formData.amount),
      vatRate: Number(formData.vatRate || 0),
      vatAmount: Math.round(vatCalc * 100) / 100,
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      paymentDate: formData.status === 'Pago' ? formData.paymentDate || new Date().toISOString().split('T')[0] : undefined,
      status: (formData.status as ExpenseStatus) || 'Pendente',
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      documentRef: formData.documentRef,
      paymentMethod: formData.paymentMethod || 'Transferência Bancária',
      notes: formData.notes,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveExpense(newExpense);
    setIsModalOpen(false);
  };

  const handleConfirmPayment = () => {
    if (!payModalExpense) return;
    const updated: Expense = {
      ...payModalExpense,
      status: 'Pago',
      paymentDate: payDate,
      paymentMethod: payMethod,
    };
    onSaveExpense(updated);
    setPayModalExpense(null);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Módulo de Despesas & Pagamentos</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Registo e controlo de custos operacionais da oficina (aluguer, fornecedores, energia, água, salários e impostos).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex-1 md:flex-none px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all transform active:scale-95 shadow-sm"
            title="Gerar e imprimir relatório mensal de faturação e despesas por mês"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Relatório PDF</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Despesa</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Despesas</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalExpensesAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {expenses.length} registos totais
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs bg-gradient-to-br from-amber-50/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">A Pagar / Pendente</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {formatCurrency(pendingAmount)}
          </div>
          <span className="text-[11px] font-medium text-amber-800 mt-1 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {pendingCount} pagamento(s) pendente(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/30 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Já Liquidado</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(paidAmount)}
          </div>
          <span className="text-[11px] text-emerald-800 mt-1 block">
            Pagamentos efetuados com sucesso
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">IVA Dedutível Est.</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 mt-2">
            {formatCurrency(totalVatDeductible)}
          </div>
          <span className="text-[11px] text-blue-600 mt-1 block">
            Estimativa de IVA a suportar (CIVA PT)
          </span>
        </div>
      </div>

      {/* Categories Distribution Bar Widget */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Distribuição de Custos por Categoria
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ALL_CATEGORIES.map((cat) => {
            const catTotal = categoryTotals[cat] || 0;
            const percentage = totalExpensesAmount > 0 ? (catTotal / totalExpensesAmount) * 100 : 0;
            const IconComponent = CATEGORY_ICONS[cat];
            const colors = CATEGORY_COLORS[cat];

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'Todas' : cat)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedCategory === cat
                    ? 'ring-2 ring-blue-600 border-blue-600 shadow-xs'
                    : 'hover:border-slate-300 border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{percentage.toFixed(0)}%</span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate" title={cat}>
                  {cat}
                </div>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {formatCurrency(catTotal)}
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar despesa, fornecedor, nº fatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Todas">Todas as Categorias</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Todos">Todos os Estados</option>
            <option value="Pendente">Pendente</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Pago">Pago</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="vencimento">Ordenar: Vencimento</option>
            <option value="valor">Ordenar: Maior Valor</option>
            <option value="recentes">Ordenar: Recentes</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Listagem de Despesas ({filteredExpenses.length})
          </span>
          {selectedCategory !== 'Todas' && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              Filtro: {selectedCategory}
              <button onClick={() => setSelectedCategory('Todas')} className="hover:text-amber-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">Nenhuma despesa encontrada.</p>
            <p className="text-xs text-slate-400 mt-1">
              Tente alterar os filtros de pesquisa ou clique em "Registar Despesa".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Categoria / Ref</th>
                  <th className="py-3 px-4">Descrição & Entidade / Fornecedor</th>
                  <th className="py-3 px-4">Vencimento / Liquidação</th>
                  <th className="py-3 px-4">Método Pag.</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Valor Iliquido</th>
                  <th className="py-3 px-4 text-right">IVA</th>
                  <th className="py-3 px-4 text-right">Total a Pagar</th>
                  <th className="py-3 px-4 text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.map((exp) => {
                  const colors = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['Outras Despesas'];
                  const IconComp = CATEGORY_ICONS[exp.category] || CreditCard;
                  const isOverdue = exp.status === 'Atrasado' || (exp.status === 'Pendente' && new Date(exp.dueDate) < new Date());

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{exp.category}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {exp.documentRef || exp.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1" title={exp.description}>
                          {exp.description}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {exp.supplierName ? (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Truck className="w-3 h-3 text-slate-400" /> {exp.supplierName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Despesa Geral / Serviços</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-mono font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                          {formatDatePT(exp.dueDate)}
                        </div>
                        {exp.paymentDate ? (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Pago em: {formatDatePT(exp.paymentDate)}
                          </div>
                        ) : isOverdue ? (
                          <div className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Atrasado
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">Prazo Regular</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {exp.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {exp.status === 'Pago' && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Pago
                          </span>
                        )}
                        {(exp.status === 'Pendente' && !isOverdue) && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                        {(exp.status === 'Atrasado' || (exp.status === 'Pendente' && isOverdue)) && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-200 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Atrasado
                          </span>
                        )}
                        {exp.status === 'Cancelado' && (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 font-medium px-2.5 py-1 rounded-full text-[10px]">
                            Cancelado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(exp.amount - (exp.vatAmount || 0))}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        <div>{formatCurrency(exp.vatAmount || 0)}</div>
                        <div className="text-[9px] text-slate-400">({exp.vatRate}%)</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center print:hidden whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {exp.status !== 'Pago' && (
                            <button
                              onClick={() => {
                                setPayModalExpense(exp);
                                setPayDate(new Date().toISOString().split('T')[0]);
                                setPayMethod(exp.paymentMethod);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all"
                              title="Marcar como Liquidado/Pago"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Pagar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Despesa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem a certeza que deseja eliminar a despesa "${exp.description}"?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar Despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Confirmation Modal */}
      {payModalExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar Liquidação de Despesa</span>
              </div>
              <button
                onClick={() => setPayModalExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Despesa:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{payModalExpense.description}</div>
                <div className="text-amber-600 font-black text-lg mt-1">
                  {formatCurrency(payModalExpense.amount)}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Data de Pagamento Efetivo:</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Método de Pagamento Utilizado:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="Débito Direto">Débito Direto</option>
                  <option value="MB WAY">MB WAY</option>
                  <option value="Multibanco">Multibanco</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPayModalExpense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingExpense ? 'Editar Despesa' : 'Registar Nova Despesa de Oficina'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Preencha os dados da fatura, recibo ou custo operacional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria de Custo *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Linking */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fornecedor / Entidade</label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={(e) => {
                      const supId = e.target.value;
                      const foundSup = suppliers.find((s) => s.id === supId);
                      setFormData({
                        ...formData,
                        supplierId: supId || undefined,
                        supplierName: foundSup ? foundSup.name : formData.supplierName,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 mb-1"
                  >
                    <option value="">-- Selecionar da Lista de Fornecedores --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NIF: {s.nif})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Ou digite o nome da entidade (ex: EDP, MEO, Senhorio)"
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Descrição do Custo / Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Renda do Pavilhão de Fevereiro / Conta de Luz Trifásica"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Total Amount */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor Total (c/ IVA €) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => handleFormAmountChange(parseFloat(e.target.value) || 0, formData.vatRate || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* VAT Rate */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Taxa IVA % (CIVA PT)</label>
                  <select
                    value={formData.vatRate || 0}
                    onChange={(e) => handleFormAmountChange(formData.amount || 0, parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={0}>0% (Isento / Renda / Salários)</option>
                    <option value={6}>6% (Taxa Reduzida - Água)</option>
                    <option value={13}>13% (Taxa Intermédia)</option>
                    <option value={23}>23% (Taxa Normal - Peças / Energia / Tels)</option>
                  </select>
                </div>

                {/* VAT Calculated Portion */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Valor do IVA Dedutível</label>
                  <div className="px-3 py-2 bg-slate-200/60 rounded-lg font-mono font-bold text-slate-700">
                    {formatCurrency(formData.vatAmount || 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Document Reference */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nº Documento / Fatura</label>
                  <input
                    type="text"
                    placeholder="Ex: FT 2026/9012"
                    value={formData.documentRef || ''}
                    onChange={(e) => setFormData({ ...formData, documentRef: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estado do Pagamento *</label>
                  <select
                    value={formData.status || 'Pendente'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ExpenseStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Método de Pagamento</label>
                  <select
                    value={formData.paymentMethod || 'Transferência Bancária'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Débito Direto">Débito Direto</option>
                    <option value="MB WAY">MB WAY</option>
                    <option value="Multibanco">Multibanco</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                {/* Payment Date if Paid */}
                {formData.status === 'Pago' && (
                  <div>
                    <label className="block text-emerald-800 font-bold mb-1">Data Efetiva de Pagamento</label>
                    <input
                      type="date"
                      value={formData.paymentDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações / Notas Adicionais</label>
                <textarea
                  rows={2}
                  placeholder="Informação adicional sobre este pagamento ou transferência..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  {editingExpense ? 'Guardar Alterações' : 'Registar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Monthly Report Modal */}
      {isReportModalOpen && (
        <MonthlyReportModal
          invoices={invoices}
          expenses={expenses}
          clients={clients}
          workshopConfig={workshopConfig}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
