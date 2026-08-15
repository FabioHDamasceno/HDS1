import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Euro,
  Building2,
  QrCode,
  ShieldCheck,
  X,
  ChevronRight,
  Download,
  AlertCircle,
  Edit3,
  Trash2,
  Wrench,
  Package,
} from 'lucide-react';
import {
  Invoice,
  DocType,
  Client,
  Vehicle,
  WorkshopConfig,
  InventoryPart,
  InvoiceItem,
  LaborPricingType,
  Expense,
} from '../types';
import { formatCurrency, formatDatePT, generateATDocumentHash } from '../lib/ptFormatters';
import { openDocumentPrintWindow, triggerDirectPrint } from '../lib/printHelper';
import { MonthlyReportModal } from './MonthlyReportModal';

interface InvoicingViewProps {
  invoices: Invoice[];
  clients: Client[];
  vehicles: Vehicle[];
  inventory?: InventoryPart[];
  expenses?: Expense[];
  workshopConfig: WorkshopConfig;
  onSaveInvoice: (inv: Invoice) => void;
}

export const InvoicingView: React.FC<InvoicingViewProps> = ({
  invoices,
  clients,
  vehicles,
  inventory = [],
  expenses = [],
  workshopConfig,
  onSaveInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('TODOS');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const filteredInvoices = invoices.filter((inv) => {
    const client = clients.find((c) => c.id === inv.clientId);
    const vehicle = vehicles.find((v) => v.id === inv.vehicleId);
    const matchesSearch =
      inv.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client && client.nif.includes(searchTerm)) ||
      (vehicle && vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = docTypeFilter === 'TODOS' || inv.docType === docTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const grandTotalAll = invoices
    .filter((i) => i.status === 'Paga' || i.status === 'Pendente')
    .reduce((acc, i) => acc + i.grandTotal, 0);

  const totalVatAll = invoices
    .filter((i) => i.status === 'Paga' || i.status === 'Pendente')
    .reduce((acc, i) => acc + i.totalVat, 0);

  const handlePrintDocument = (targetInvoice?: Invoice) => {
    const inv = targetInvoice || viewingInvoice;
    if (!inv) return;
    const client = clients.find((c) => c.id === inv.clientId);
    const vehicle = vehicles.find((v) => v.id === inv.vehicleId);
    openDocumentPrintWindow(inv, workshopConfig, client, vehicle);
  };

  const handleCreateNewInvoice = (type: DocType = 'Orçamento') => {
    const prefix = type === 'Orçamento' ? 'ORC' : type === 'Fatura-Recibo' ? 'FR' : 'FT';
    const num = `${prefix} 2026/${String(invoices.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      docType: type,
      docNumber: num,
      clientId: clients[0]?.id || '',
      vehicleId: vehicles[0]?.id || '',
      issueDate: today,
      dueDate: dueDate,
      status: type === 'Orçamento' ? 'Pendente' : 'Paga',
      items: [
        {
          id: `item-${Date.now()}-1`,
          description: 'Mão-de-Obra de Diagnóstico e Reparação',
          qty: 1,
          unitPrice: 42.5,
          vatRate: 23,
          type: 'Mão-de-Obra',
          pricingType: 'Horas',
        },
      ],
      subtotal: 42.5,
      vatSummary: [{ rate: 23, base: 42.5, vatAmount: 9.78 }],
      totalVat: 9.78,
      grandTotal: 52.28,
      paymentMethod: 'MB WAY',
      iban: workshopConfig.iban,
      hashPreview: generateATDocumentHash(num, today, 52.28),
    };

    setEditingInvoice(newInv);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Faturação Integrada & Documentos de Venda
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emissão e edição de Faturas, Faturas-Recibo e Orçamentos com discriminação de IVA (23%) e validações AT/SAF-T
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 border border-slate-700"
            title="Gerar e imprimir relatório mensal de faturação e despesas por mês"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Relatório PDF</span>
          </button>

          <button
            onClick={() => handleCreateNewInvoice('Orçamento')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Orçamento / Fatura</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-xl">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Total IVA Liquidado:</span>
              <span className="text-sm font-extrabold">{formatCurrency(totalVatAll)}</span>
            </div>
            <div className="pl-3 border-l border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Faturado:</span>
              <span className="text-base font-extrabold text-amber-400">{formatCurrency(grandTotalAll)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar N° Fatura, Cliente, NIF, Matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {['TODOS', 'Fatura', 'Fatura-Recibo', 'Orçamento'].map((dt) => (
            <button
              key={dt}
              onClick={() => setDocTypeFilter(dt)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap border ${
                docTypeFilter === dt
                  ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {dt}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Tipo & Nº Documento</th>
                <th className="py-3 px-4">Data Emissão</th>
                <th className="py-3 px-4">Cliente / NIF</th>
                <th className="py-3 px-4">Veículo (Matrícula)</th>
                <th className="py-3 px-4 text-right">Base Iliquida</th>
                <th className="py-3 px-4 text-right">IVA (23%)</th>
                <th className="py-3 px-4 text-right">Total c/ IVA</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const vehicle = vehicles.find((v) => v.id === inv.vehicleId);

                return (
                  <tr
                    key={inv.id}
                    onClick={() => setViewingInvoice(inv)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-900 text-amber-400 font-mono text-[11px] px-2 py-0.5 rounded mr-2">
                        {inv.docType}
                      </span>
                      {inv.docNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatDatePT(inv.issueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{client ? client.name : 'Cliente Geral'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIF: {client ? client.nif : '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {vehicle ? (
                        <span className="font-mono bg-slate-100 font-bold text-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {vehicle.licensePlate}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(inv.totalVat)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          inv.status === 'Paga'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : inv.status === 'Pendente'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvoice(inv);
                          }}
                          className="text-slate-800 hover:text-amber-700 font-bold bg-slate-100 hover:bg-amber-50 px-2 py-1 rounded border border-slate-300 transition-colors flex items-center gap-1"
                          title="Editar Peças, Mão-de-Obra ou Valores do Documento"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintDocument(inv);
                          }}
                          className="text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded border border-slate-300 transition-colors flex items-center gap-1"
                          title="Imprimir / Guardar em PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingInvoice(inv);
                          }}
                          className="text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200 transition-colors"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Nenhum documento de faturação encontrado.
          </div>
        )}
      </div>

      {/* Modal: Edit / Create Invoice or Budget */}
      {editingInvoice && (
        <InvoiceEditModal
          invoice={editingInvoice}
          clients={clients}
          vehicles={vehicles}
          inventory={inventory}
          workshopConfig={workshopConfig}
          onClose={() => setEditingInvoice(null)}
          onSave={(updated) => {
            onSaveInvoice(updated);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* Modal: Official Printable Document Viewer */}
      {viewingInvoice && (
        <DocumentPrintModal
          invoice={viewingInvoice}
          workshopConfig={workshopConfig}
          client={clients.find((c) => c.id === viewingInvoice.clientId)}
          vehicle={vehicles.find((v) => v.id === viewingInvoice.vehicleId)}
          onClose={() => setViewingInvoice(null)}
          onPrint={handlePrintDocument}
        />
      )}

      {/* Modal: Monthly Financial Report */}
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

// Invoice & Quote Full Editor Modal
interface InvoiceEditModalProps {
  invoice: Invoice;
  clients: Client[];
  vehicles: Vehicle[];
  inventory: InventoryPart[];
  workshopConfig: WorkshopConfig;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
}

const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  invoice,
  clients,
  vehicles,
  inventory,
  workshopConfig,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Invoice>({ ...invoice });
  const [selectedStockPartId, setSelectedStockPartId] = useState('');

  // Calculations
  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((acc, item) => acc + (item.qty || 0) * (item.unitPrice || 0), 0);
    const totalVat = subtotal * 0.23;
    const grandTotal = subtotal + totalVat;
    return {
      subtotal,
      vatSummary: [{ rate: 23, base: subtotal, vatAmount: totalVat }],
      totalVat,
      grandTotal,
    };
  };

  const updateItems = (newItems: InvoiceItem[]) => {
    const totals = calculateTotals(newItems);
    setFormData({
      ...formData,
      items: newItems,
      ...totals,
      hashPreview: generateATDocumentHash(formData.docNumber, formData.issueDate, totals.grandTotal),
    });
  };

  const addLaborLine = () => {
    const newLine: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Mão-de-Obra Mecânica / Serviços',
      qty: 1,
      unitPrice: 42.5,
      vatRate: 23,
      type: 'Mão-de-Obra',
      pricingType: 'Horas',
    };
    updateItems([...formData.items, newLine]);
  };

  const addStockPartLine = () => {
    if (!selectedStockPartId) return;
    const p = inventory.find((i) => i.id === selectedStockPartId);
    if (!p) return;

    const newLine: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: p.name,
      ref: p.code,
      partId: p.id,
      qty: 1,
      unitPrice: p.sellingPrice,
      vatRate: p.vatRate || 23,
      type: 'Peça',
      isManual: false,
    };
    updateItems([...formData.items, newLine]);
    setSelectedStockPartId('');
  };

  const addManualPartLine = () => {
    const newLine: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Peça/Material (Fora de Stock)',
      ref: 'FORA-STK',
      qty: 1,
      unitPrice: 0.0,
      vatRate: 23,
      type: 'Peça',
      isManual: true,
    };
    updateItems([...formData.items, newLine]);
  };

  const removeLine = (id: string) => {
    updateItems(formData.items.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-slate-300">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base">
              Editar {formData.docType}: {formData.docNumber}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Main Info Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Documento</label>
              <select
                value={formData.docType}
                onChange={(e) => {
                  const newType = e.target.value as DocType;
                  const prefix = newType === 'Orçamento' ? 'ORC' : newType === 'Fatura-Recibo' ? 'FR' : 'FT';
                  const newNum = `${prefix} 2026/${formData.docNumber.split('/')[1] || '001'}`;
                  setFormData({
                    ...formData,
                    docType: newType,
                    docNumber: newNum,
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold text-slate-900"
              >
                <option value="Orçamento">Orçamento</option>
                <option value="Fatura">Fatura</option>
                <option value="Fatura-Recibo">Fatura-Recibo</option>
                <option value="Guia de Transporte">Guia de Transporte</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">N° Documento</label>
              <input
                type="text"
                value={formData.docNumber}
                onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cliente</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NIF: {c.nif})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Viatura Reparada</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
              >
                <option value="">-- Sem Viatura --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Emissão</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Vencimento</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
              >
                <option value="Pendente">Pendente</option>
                <option value="Paga">Paga</option>
                <option value="Anulada">Anulada</option>
                <option value="Rascunho">Rascunho</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meio de Pagamento</label>
              <select
                value={formData.paymentMethod || 'MB WAY'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'MB WAY' | 'Multibanco' | 'Transferência Bancária' | 'Dinheiro' })}
                className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
              >
                <option value="MB WAY">MB WAY</option>
                <option value="Multibanco">Multibanco</option>
                <option value="Transferência Bancária">Transferência Bancária</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Line Items Editor Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" /> Linhas do Documento (Mão-de-Obra & Peças)
              </h3>

              {/* Add item buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addLaborLine}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Mão-de-Obra</span>
                </button>

                <select
                  value={selectedStockPartId}
                  onChange={(e) => setSelectedStockPartId(e.target.value)}
                  className="bg-white border border-slate-300 rounded p-1 text-xs max-w-[170px]"
                >
                  <option value="">-- Peça do Stock --</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.sellingPrice)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addStockPartLine}
                  className="bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold px-2 py-1 rounded text-xs transition-colors"
                >
                  + Stock
                </button>

                <button
                  type="button"
                  onClick={addManualPartLine}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded text-xs border border-slate-300 transition-colors flex items-center gap-1"
                  title="Adicionar peça/material fora de stock manualmente"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Peça Manual</span>
                </button>
              </div>
            </div>

            {formData.items.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Nenhum item no documento. Utilize os botões acima para adicionar Mão-de-Obra ou Peças.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, idx) => {
                  const isLabor = item.type === 'Mão-de-Obra';
                  const isFixed = item.pricingType === 'Valor Fechado';

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${
                          isLabor ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.type}
                      </span>

                      {/* Description */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...formData.items];
                          updated[idx].description = e.target.value;
                          updateItems(updated);
                        }}
                        className="flex-grow bg-white border border-slate-300 rounded p-1.5 text-xs min-w-[180px]"
                        placeholder="Descrição do item"
                      />

                      {/* Reference for Parts */}
                      {!isLabor && (
                        <div className="w-24">
                          <input
                            type="text"
                            value={item.ref || ''}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].ref = e.target.value;
                              updateItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] font-mono font-bold"
                            placeholder="Ref OEM"
                          />
                        </div>
                      )}

                      {/* Mode Selector for Labor */}
                      {isLabor && (
                        <div className="w-32">
                          <select
                            value={item.pricingType || 'Horas'}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              const pType = e.target.value as LaborPricingType;
                              updated[idx].pricingType = pType;
                              if (pType === 'Valor Fechado') {
                                updated[idx].qty = 1;
                              }
                              updateItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] font-bold"
                          >
                            <option value="Horas">Por Horas</option>
                            <option value="Valor Fechado">Valor Fechado</option>
                          </select>
                        </div>
                      )}

                      {/* Quantity or Hours */}
                      <div className="w-16">
                        <input
                          type="number"
                          step={isLabor && !isFixed ? '0.25' : '1'}
                          min="0.1"
                          disabled={isLabor && isFixed}
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...formData.items];
                            updated[idx].qty = parseFloat(e.target.value) || 1;
                            updateItems(updated);
                          }}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold disabled:bg-slate-100"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                          {isLabor ? (isFixed ? 'Fechado' : 'Horas') : 'Qtd'}
                        </span>
                      </div>

                      {/* Unit Price or Fixed Price */}
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.5"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...formData.items];
                            updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                            updateItems(updated);
                          }}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-right font-bold"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                          {isLabor && isFixed ? 'Preço Total (€)' : '€ Unid.'}
                        </span>
                      </div>

                      {/* VAT % */}
                      <div className="w-16">
                        <select
                          value={item.vatRate || 23}
                          onChange={(e) => {
                            const updated = [...formData.items];
                            updated[idx].vatRate = parseInt(e.target.value, 10) || 23;
                            updateItems(updated);
                          }}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] font-bold text-center"
                        >
                          <option value={23}>23%</option>
                          <option value={13}>13%</option>
                          <option value={6}>6%</option>
                          <option value={0}>0%</option>
                        </select>
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">IVA</span>
                      </div>

                      {/* Line Total */}
                      <div className="w-24 text-right font-bold text-slate-900 pr-1">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </div>

                      {/* Remove line button */}
                      <button
                        type="button"
                        onClick={() => removeLine(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Retirar esta linha"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Subtotal Iliquido:</span>
                <span className="font-bold text-slate-200">{formatCurrency(formData.subtotal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total IVA (23%):</span>
                <span className="font-bold text-slate-200">{formatCurrency(formData.totalVat)}</span>
              </div>
              <div className="pl-4 border-l border-slate-700">
                <span className="text-amber-400 font-bold block text-[10px]">TOTAL C/ IVA:</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(formData.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 p-4 rounded-b-xl border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs shadow transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Alterações do Documento</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Official Printable Layout Modal
interface DocumentPrintModalProps {
  invoice: Invoice;
  workshopConfig: WorkshopConfig;
  client?: Client;
  vehicle?: Vehicle;
  onClose: () => void;
  onPrint: () => void;
}

const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  invoice,
  workshopConfig,
  client,
  vehicle,
  onClose,
  onPrint,
}) => {
  const hashVal =
    invoice.hashPreview ||
    generateATDocumentHash(invoice.docNumber, invoice.issueDate, invoice.grandTotal);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col border border-slate-300">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white p-3.5 rounded-t-xl flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              Visualização de Documento Comercial Oficial (SAF-T PT)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openDocumentPrintWindow(invoice, workshopConfig, client, vehicle)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
              title="Abrir em nova janela otimizada para impressão ou exportação PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={() => triggerDirectPrint()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
              title="Imprimir diretamente nesta página"
            >
              <span>Imprimir Direto</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-document" className="printable-document p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 text-xs font-sans space-y-6 print:p-0">
          {/* Header Row: Company Details & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b-2 border-slate-800">
            {/* Workshop / Issuer details */}
            <div className="space-y-1">
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {workshopConfig.name}
              </h1>
              <p className="text-slate-600 font-medium">{workshopConfig.address}</p>
              <p className="text-slate-600 font-medium">
                {workshopConfig.postalCode} {workshopConfig.city} • Portugal
              </p>
              <p className="text-slate-700 font-bold">NIF / NIPC: {workshopConfig.nif}</p>
              <p className="text-[10px] text-slate-500">
                Cap. Social: {workshopConfig.capitalSocial} • {workshopConfig.conservatoria}
              </p>
            </div>

            {/* Document Title & Number Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-right space-y-1 sm:w-64">
              <span className="text-xs font-black uppercase text-amber-600 block tracking-wider">
                {invoice.docType}
              </span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                {invoice.docNumber}
              </span>
              <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>Data Emissão: <strong className="text-slate-900">{formatDatePT(invoice.issueDate)}</strong></p>
                <p>Vencimento: <strong className="text-slate-900">{formatDatePT(invoice.dueDate)}</strong></p>
                <p>Estado: <strong className="text-slate-900">{invoice.status}</strong></p>
              </div>
            </div>
          </div>

          {/* Client & Vehicle Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Adquirente / Cliente:</span>
              <p className="font-bold text-sm text-slate-900">{client ? client.name : 'Cliente Geral'}</p>
              <p className="font-bold text-slate-800 font-mono">NIF: {client ? client.nif : '999999990'}</p>
              <p className="text-slate-600">
                {client ? `${client.address}, ${client.postalCode} ${client.city}` : 'Portugal'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Viatura Reparada:</span>
              {vehicle ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                      {vehicle.licensePlate}
                    </span>
                    <span className="font-bold text-slate-800">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-mono">
                    VIN: {vehicle.vin} • Km: {vehicle.odometer.toLocaleString('pt-PT')} Km
                  </p>
                </>
              ) : (
                <p className="text-slate-500 italic">Viatura não especificada.</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">Descrição dos Serviços / Peças</th>
                  <th className="py-2 px-2 text-center">Qtd</th>
                  <th className="py-2 px-2 text-right">Preço Unid.</th>
                  <th className="py-2 px-2 text-center">IVA %</th>
                  <th className="py-2 px-2 text-right">Total Iliquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-2">
                      <span className="bg-slate-200 text-slate-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-medium text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-2 text-center font-bold">
                      {item.pricingType === 'Valor Fechado' ? 'Valor Fechado' : item.qty}
                    </td>
                    <td className="py-2.5 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-2 text-center font-bold">{item.vatRate}%</td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t-2 border-slate-800">
            {/* VAT Summary Table */}
            <div className="w-full sm:w-72 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] space-y-1">
              <span className="font-bold text-slate-800 uppercase block mb-1">
                Quadro de Resumo de IVA (CIVA PT):
              </span>
              <div className="flex items-center justify-between text-slate-600 border-b border-slate-200 pb-1">
                <span>Taxa Normal (23%):</span>
                <span className="font-bold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Imposto IVA (23%):</span>
                <span className="font-bold text-slate-900">{formatCurrency(invoice.totalVat)}</span>
              </div>
            </div>

            {/* Final Amount */}
            <div className="w-full sm:w-64 bg-slate-900 text-white p-4 rounded-xl space-y-1 text-right">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">
                Valor Total a Pagar:
              </span>
              <span className="text-2xl font-black">{formatCurrency(invoice.grandTotal)}</span>
              <p className="text-[10px] text-slate-400 pt-1">
                Meio de Pagamento: <strong>{invoice.paymentMethod || 'MB WAY'}</strong>
              </p>
            </div>
          </div>

          {/* Payment IBAN & Legal AT Footnote */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Dados para Pagamento por Transferência Bancária:</p>
              <p className="font-mono text-slate-900 font-bold mt-0.5">{workshopConfig.iban}</p>
            </div>

            {/* Simulated QR Code / AT Certification Hash */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-slate-900 text-amber-400 flex items-center justify-center rounded font-mono font-bold text-xs">
                QR
              </div>
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Processado por Programa Certificado
                </p>
                <p className="font-mono text-[9px] text-slate-500">
                  Assinatura SAF-T PT Hash: <strong className="text-slate-900">{hashVal}-S1</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
