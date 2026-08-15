import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Invoice, Expense, Client, WorkshopConfig } from '../types';
import { formatCurrency, formatDatePT } from '../lib/ptFormatters';
import { openMonthlyReportPrintWindow } from '../lib/printHelper';

interface MonthlyReportModalProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  workshopConfig: WorkshopConfig;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  invoices,
  expenses,
  clients,
  workshopConfig,
  onClose,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  const monthStr = String(selectedMonth).padStart(2, '0');
  const targetPrefix = `${selectedYear}-${monthStr}`;
  const monthNameLabel = `${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`;

  // Filter invoices for selected month
  const monthInvoices = invoices.filter((inv) => {
    if (!inv.issueDate) return false;
    return inv.issueDate.startsWith(targetPrefix);
  });

  // Filter expenses for selected month
  const monthExpenses = expenses.filter((exp) => {
    const d = exp.dueDate || exp.paymentDate || exp.createdAt;
    return d ? d.startsWith(targetPrefix) : false;
  });

  // Calculations
  const totalInvoicedGross = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.grandTotal, 0);

  const totalInvoicedNet = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.subtotal, 0);

  const totalInvoicedVat = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.totalVat, 0);

  const totalExpensesGross = monthExpenses
    .filter((e) => e.status !== 'Cancelado')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpensesVat = monthExpenses
    .filter((e) => e.status !== 'Cancelado')
    .reduce((acc, e) => acc + (e.vatAmount || 0), 0);

  const totalExpensesNet = totalExpensesGross - totalExpensesVat;

  const netMargin = totalInvoicedGross - totalExpensesGross;
  const vatBalance = totalInvoicedVat - totalExpensesVat;

  const handlePrint = () => {
    openMonthlyReportPrintWindow(
      selectedYear,
      selectedMonth,
      monthNameLabel,
      invoices,
      expenses,
      clients,
      workshopConfig
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base tracking-tight">
                Relatório Financeiro Mensal (Faturação & Despesas)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecione o mês desejado para pré-visualizar e gerar a impressão oficial do relatório
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Month & Year Selection Bar */}
          <div className="bg-amber-500/10 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-900 text-xs">Selecione o Mês do Relatório:</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-300 font-bold text-slate-900 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-300 font-bold text-slate-900 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={handlePrint}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 whitespace-nowrap ml-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF do Mês</span>
              </button>
            </div>
          </div>

          {/* Quick Month Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MONTH_NAMES.map((m, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(mNum)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {m.substring(0, 3)}
                </button>
              );
            })}
          </div>

          {/* KPI Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Income Card */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="font-bold text-[10px] uppercase">Faturação ({monthInvoices.length} docs)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-900 mt-1">
                {formatCurrency(totalInvoicedGross)}
              </div>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                Base: {formatCurrency(totalInvoicedNet)} | IVA: {formatCurrency(totalInvoicedVat)}
              </p>
            </div>

            {/* Expenses Card */}
            <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-rose-800">
                <span className="font-bold text-[10px] uppercase">Despesas ({monthExpenses.length} cust)</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg font-black text-rose-900 mt-1">
                {formatCurrency(totalExpensesGross)}
              </div>
              <p className="text-[10px] text-rose-700 mt-0.5">
                Base: {formatCurrency(totalExpensesNet)} | IVA: {formatCurrency(totalExpensesVat)}
              </p>
            </div>

            {/* Net Profit Card */}
            <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-blue-800">
                <span className="font-bold text-[10px] uppercase">Resultado Líquido</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div
                className={`text-lg font-black mt-1 ${
                  netMargin >= 0 ? 'text-blue-900' : 'text-rose-600'
                }`}
              >
                {netMargin >= 0 ? '+' : ''}
                {formatCurrency(netMargin)}
              </div>
              <p className="text-[10px] text-blue-700 mt-0.5">Faturação - Despesas</p>
            </div>

            {/* VAT Settlement Card */}
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-amber-800">
                <span className="font-bold text-[10px] uppercase">Apuramento IVA</span>
                <PieChart className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-black text-amber-900 mt-1">
                {formatCurrency(vatBalance)}
              </div>
              <p className="text-[10px] text-amber-700 mt-0.5">
                {vatBalance >= 0 ? 'A pagar ao Estado' : 'Crédito de IVA'}
              </p>
            </div>
          </div>

          {/* Detailed Lists Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Invoices List Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Faturação de {monthNameLabel}
                </h3>
                <span className="font-bold text-emerald-700">{formatCurrency(totalInvoicedGross)}</span>
              </div>

              {monthInvoices.length === 0 ? (
                <p className="text-slate-400 italic text-center py-6">
                  Nenhuma fatura emitida em {monthNameLabel}.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {monthInvoices.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId);
                    return (
                      <div
                        key={inv.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {inv.docType} {inv.docNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {client ? client.name : 'Cliente Geral'} • {formatDatePT(inv.issueDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900">
                            {formatCurrency(inv.grandTotal)}
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              inv.status === 'Paga'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expenses List Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  Despesas de {monthNameLabel}
                </h3>
                <span className="font-bold text-rose-700">{formatCurrency(totalExpensesGross)}</span>
              </div>

              {monthExpenses.length === 0 ? (
                <p className="text-slate-400 italic text-center py-6">
                  Nenhuma despesa registada em {monthNameLabel}.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {monthExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{exp.description}</div>
                        <div className="text-[10px] text-slate-500">
                          {exp.category} • Vencimento: {formatDatePT(exp.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900">
                          {formatCurrency(exp.amount)}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            exp.status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 rounded-b-2xl border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar Impressão / Exportar PDF ({monthNameLabel})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
