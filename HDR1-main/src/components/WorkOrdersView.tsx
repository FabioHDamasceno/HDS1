import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Car,
  FileText,
  Printer,
  ChevronRight,
  Gauge,
  Sparkles,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import {
  WorkOrder,
  WorkOrderStatus,
  Vehicle,
  Client,
  InventoryPart,
  WorkOrderLaborItem,
  WorkOrderPartItem,
  WorkshopConfig,
  UserAccount,
} from '../types';
import { formatCurrency, formatDatePT, formatLicensePlate } from '../lib/ptFormatters';
import { openWorkOrderPrintWindow } from '../lib/printHelper';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  vehicles: Vehicle[];
  clients: Client[];
  inventory: InventoryPart[];
  workshopConfig: WorkshopConfig;
  onSaveWorkOrder: (wo: WorkOrder) => void;
  onConvertToInvoice: (wo: WorkOrder, docType: 'Fatura' | 'Fatura-Recibo' | 'Orçamento') => void;
  onOpenAIDiagnostic: (symptoms: string, vehicleInfo: string) => void;
  selectedWorkOrderInit?: WorkOrder | null;
  currentUser?: UserAccount;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  vehicles,
  clients,
  inventory,
  workshopConfig,
  onSaveWorkOrder,
  onConvertToInvoice,
  onOpenAIDiagnostic,
  selectedWorkOrderInit,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(selectedWorkOrderInit || null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!selectedWorkOrderInit);

  // Filter list
  const filteredWorkOrders = workOrders.filter((wo) => {
    const veh = vehicles.find((v) => v.id === wo.vehicleId);
    const client = clients.find((c) => c.id === wo.clientId);

    const matchesSearch =
      wo.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veh && veh.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (veh && veh.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (veh && veh.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'TODOS' || wo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenNew = () => {
    const nextNum = `OS 2026/${String(workOrders.length + 1).padStart(3, '0')}`;
    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      number: nextNum,
      clientId: clients[0]?.id || '',
      vehicleId: vehicles[0]?.id || '',
      status: 'Receção',
      entryDate: new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      technicianName: '',
      bay: 'Elevador 1',
      clientComplaint: '',
      diagnosisNotes: '',
      checklist: {
        oilOk: true,
        coolantOk: true,
        brakesOk: true,
        tiresOk: true,
        lightsOk: true,
        scratchesNotes: 'Sem riscos evidentes.',
        fuelLevel: '1/2',
      },
      laborItems: [
        {
          id: `lab-${Date.now()}`,
          description: 'Mão-de-Obra Diagnóstico / Diagnóstico Eletrónico',
          hours: 1.0,
          hourlyRate: 42.5,
          vatRate: 23,
        },
      ],
      partsItems: [],
      notes: '',
      createdAt: new Date().toISOString(),
    };
    setEditingWO(newWO);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wo: WorkOrder) => {
    setEditingWO(wo);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Receção':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em Diagnóstico':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Aguardar Peças':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Em Reparação':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Pronto para Entrega':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Faturado':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrintWO = (woToPrint: WorkOrder) => {
    const veh = vehicles.find((v) => v.id === woToPrint.vehicleId);
    const client = clients.find((c) => c.id === woToPrint.clientId);
    openWorkOrderPrintWindow(woToPrint, workshopConfig, client, veh);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" /> Gestão de Folhas de Obra & Ordens de Serviço
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o ciclo de vida das reparações, checklist de receção e peças aplicadas
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow transition-all transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Folha de Obra</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Matrícula, Nº Folha, Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {['TODOS', 'Receção', 'Em Diagnóstico', 'Aguardar Peças', 'Em Reparação', 'Pronto para Entrega', 'Faturado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap border ${
                statusFilter === st
                  ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkOrders.map((wo) => {
          const veh = vehicles.find((v) => v.id === wo.vehicleId);
          const client = clients.find((c) => c.id === wo.clientId);

          const totalLabor = wo.laborItems.reduce((acc, l) => acc + l.hours * l.hourlyRate, 0);
          const totalParts = wo.partsItems.reduce((acc, p) => acc + p.qty * p.unitPrice, 0);
          const subtotal = totalLabor + totalParts;
          const grandTotal = subtotal * 1.23; // 23% IVA

          return (
            <div
              key={wo.id}
              onClick={() => handleOpenEdit(wo)}
              className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Header line */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-900 text-amber-400 font-extrabold px-2 py-0.5 rounded text-xs tracking-wider">
                      {veh ? veh.licensePlate : 'S/ MATRÍCULA'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{wo.number}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(wo.status)}`}>
                    {wo.status}
                  </span>
                </div>

                {/* Vehicle & Client Details */}
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    {veh ? `${veh.make} ${veh.model}` : 'Veículo não atribuído'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client ? client.name : 'Cliente Geral'}</span>
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Entrada: {formatDatePT(wo.entryDate)} • Posto: {wo.bay}</span>
                  </p>
                </div>

                {/* Complaint / Avaria */}
                {wo.clientComplaint && (
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Sintoma / Pedido:</span>
                    <p className="text-xs text-slate-700 italic line-clamp-2 mt-0.5">
                      "{wo.clientComplaint}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Total & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimativa c/ IVA:</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintWO(wo);
                    }}
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                    title="Imprimir Orçamento / Folha de Obra"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Orçamento</span>
                  </button>
                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Detalhes <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkOrders.length === 0 && (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-base text-slate-700">Nenhuma folha de obra encontrada.</p>
          <p className="text-xs text-slate-400 mt-1">
            Tente ajustar os termos de pesquisa ou crie uma nova ordem de serviço.
          </p>
        </div>
      )}

      {/* Modal: Create or Edit Work Order */}
      {isModalOpen && editingWO && (
        <WorkOrderEditModal
          wo={editingWO}
          vehicles={vehicles}
          clients={clients}
          inventory={inventory}
          workshopConfig={workshopConfig}
          currentUser={currentUser}
          onClose={() => setIsModalOpen(false)}
          onSave={(updated) => {
            onSaveWorkOrder(updated);
            setIsModalOpen(false);
          }}
          onConvertToInvoice={(docType) => {
            onConvertToInvoice(editingWO, docType);
            setIsModalOpen(false);
          }}
          onOpenAIDiagnostic={() => {
            const veh = vehicles.find((v) => v.id === editingWO.vehicleId);
            const info = veh ? `${veh.make} ${veh.model} (${veh.year})` : '';
            onOpenAIDiagnostic(editingWO.clientComplaint, info);
          }}
        />
      )}
    </div>
  );
};

// Internal Modal Sub-Component
interface WorkOrderEditModalProps {
  wo: WorkOrder;
  vehicles: Vehicle[];
  clients: Client[];
  inventory: InventoryPart[];
  workshopConfig: WorkshopConfig;
  currentUser?: UserAccount;
  onClose: () => void;
  onSave: (wo: WorkOrder) => void;
  onConvertToInvoice: (docType: 'Fatura' | 'Fatura-Recibo' | 'Orçamento') => void;
  onOpenAIDiagnostic: () => void;
}

const WorkOrderEditModal: React.FC<WorkOrderEditModalProps> = ({
  wo,
  vehicles,
  clients,
  inventory,
  workshopConfig,
  currentUser,
  onClose,
  onSave,
  onConvertToInvoice,
  onOpenAIDiagnostic,
}) => {
  const [formData, setFormData] = useState<WorkOrder>({ ...wo });
  const [selectedPartId, setSelectedPartId] = useState<string>('');

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
  const selectedClient = clients.find((c) => c.id === formData.clientId);

  const handleVehicleChange = (vehId: string) => {
    const veh = vehicles.find((v) => v.id === vehId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: vehId,
      clientId: veh ? veh.clientId : prev.clientId,
    }));
  };

  // Add Labor row
  const addLaborItem = () => {
    const newItem: WorkOrderLaborItem = {
      id: `lab-${Date.now()}`,
      description: 'Mão-de-Obra Mecânica Geral',
      pricingType: 'Horas',
      hours: 1.0,
      hourlyRate: 42.5,
      vatRate: 23,
    };
    setFormData((prev) => ({
      ...prev,
      laborItems: [...prev.laborItems, newItem],
    }));
  };

  const removeLaborItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      laborItems: prev.laborItems.filter((item) => item.id !== id),
    }));
  };

  // Add Part row from Inventory
  const addPartFromInventory = () => {
    if (!selectedPartId) return;
    const invItem = inventory.find((p) => p.id === selectedPartId);
    if (!invItem) return;

    const newPart: WorkOrderPartItem = {
      id: `part-${Date.now()}`,
      partId: invItem.id,
      isManual: false,
      name: invItem.name,
      ref: invItem.code,
      qty: 1,
      unitPrice: invItem.sellingPrice,
      vatRate: invItem.vatRate || 23,
    };

    setFormData((prev) => ({
      ...prev,
      partsItems: [...prev.partsItems, newPart],
    }));
    setSelectedPartId('');
  };

  // Add Manual Part (not in stock)
  const addManualPart = () => {
    const newPart: WorkOrderPartItem = {
      id: `part-${Date.now()}`,
      isManual: true,
      name: 'Peça/Material (Fora de Stock)',
      ref: 'FORA-STK',
      qty: 1,
      unitPrice: 0.0,
      vatRate: 23,
    };

    setFormData((prev) => ({
      ...prev,
      partsItems: [...prev.partsItems, newPart],
    }));
  };

  const removePartItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      partsItems: prev.partsItems.filter((p) => p.id !== id),
    }));
  };

  // Calculations
  const laborSubtotal = formData.laborItems.reduce((acc, l) => {
    if (l.pricingType === 'Valor Fechado') {
      return acc + (l.hourlyRate || 0);
    }
    return acc + (l.hours || 0) * (l.hourlyRate || 0);
  }, 0);
  const partsSubtotal = formData.partsItems.reduce((acc, p) => acc + (p.qty || 0) * (p.unitPrice || 0), 0);
  const subtotalNet = laborSubtotal + partsSubtotal;
  const vatTotal = subtotalNet * 0.23;
  const grandTotal = subtotalNet + vatTotal;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-lg font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Folha de Obra: <span className="text-amber-400">{formData.number}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Registo de entrada, peças aplicadas e verificação técnica de receção
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openWorkOrderPrintWindow(formData, workshopConfig, selectedClient, selectedVehicle)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
              title="Imprimir / Exportar PDF deste Orçamento"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Orçamento</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {/* Mechanic Role Restriction Banner */}
          {currentUser?.role === 'Mecânico' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-semibold shadow-xs">
              <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Mecânico ({currentUser.name}):</strong> Permissão limitada para atualizar o estado apenas para{' '}
                <span className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-bold">Aguardar Peças</span>,{' '}
                <span className="bg-orange-200 text-orange-900 px-1 py-0.5 rounded font-bold">Em Reparação</span> ou{' '}
                <span className="bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded font-bold">Pronto para Entrega</span>.
              </span>
            </div>
          )}

          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Selecione o Veículo (Matrícula):</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md p-2 font-mono font-bold text-xs"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.licensePlate}] - {v.make} {v.model} ({v.year})
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Km atuais: <span className="font-bold">{selectedVehicle.odometer.toLocaleString('pt-PT')} Km</span> • Combustível: {selectedVehicle.fuelType}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Cliente Associado:</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NIF: {c.nif})
                  </option>
                ))}
              </select>
              {selectedClient && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Contactos: {selectedClient.phone} • {selectedClient.email}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Estado do Serviço:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkOrderStatus })}
                className={`w-full border rounded-md p-2 font-bold text-xs ${
                  currentUser?.role === 'Mecânico'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-300'
                }`}
              >
                {(currentUser?.role === 'Mecânico'
                  ? (['Aguardar Peças', 'Em Reparação', 'Pronto para Entrega'].includes(formData.status)
                      ? ['Aguardar Peças', 'Em Reparação', 'Pronto para Entrega']
                      : [formData.status, 'Aguardar Peças', 'Em Reparação', 'Pronto para Entrega'])
                  : ['Receção', 'Em Diagnóstico', 'Aguardar Peças', 'Em Reparação', 'Pronto para Entrega', 'Faturado', 'Cancelado']
                ).map((st) => (
                  <option key={st} value={st}>
                    {st} {currentUser?.role === 'Mecânico' && ['Aguardar Peças', 'Em Reparação', 'Pronto para Entrega'].includes(st) ? ' (Permitido)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Posto: <span className="font-semibold">{formData.bay}</span>
              </p>
            </div>
          </div>

          {/* Dates & Technician Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mecânico Responsável:</label>
              <input
                type="text"
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs"
                placeholder="Nome do mecânico"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Posto / Elevador:</label>
              <select
                value={formData.bay}
                onChange={(e) => setFormData({ ...formData, bay: e.target.value as any })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs"
              >
                {['Elevador 1', 'Elevador 2', 'Banca Elétrica', 'Zona Rápida'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Previsão Conclusão:</label>
              <input
                type="date"
                value={formData.estimatedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs"
              />
            </div>
          </div>

          {/* Complaint & AI Diagnostic Trigger */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Sintomas Relatados pelo Cliente / Pedido de Oficina:
              </label>
              <button
                type="button"
                onClick={onOpenAIDiagnostic}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1 rounded-md text-[11px] shadow transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Análise IA Gemini</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={formData.clientComplaint}
              onChange={(e) => setFormData({ ...formData, clientComplaint: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-xs text-slate-900"
              placeholder="Descreva aqui o problema relatado (ex: ruído ao travar, luz de motor acesa, revisão dos 120.000km)..."
            />
          </div>

          {/* Vehicle Reception Checklist */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-600" /> Checklist de Receção da Viatura
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.oilOk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, oilOk: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Nível Óleo OK</span>
              </label>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.coolantOk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, coolantOk: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Anticongelante OK</span>
              </label>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.brakesOk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, brakesOk: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Travões OK</span>
              </label>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.tiresOk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, tiresOk: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Pneus OK</span>
              </label>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.checklist.lightsOk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, lightsOk: e.target.checked },
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Luzes OK</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nível de Combustível:</label>
                <div className="flex items-center gap-1.5">
                  {['E', '1/4', '1/2', '3/4', 'F'].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          checklist: { ...formData.checklist, fuelLevel: lvl as any },
                        })
                      }
                      className={`flex-1 py-1 text-center font-bold rounded border transition-colors ${
                        formData.checklist.fuelLevel === lvl
                          ? 'bg-slate-900 text-amber-400 border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Riscos ou Danos de Carroçaria:</label>
                <input
                  type="text"
                  value={formData.checklist.scratchesNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checklist: { ...formData.checklist, scratchesNotes: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs"
                  placeholder="Ex: Risco para-choques frontal direito..."
                />
              </div>
            </div>
          </div>

          {/* Labor Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-500" /> Mão-de-Obra Aplicada
              </h3>
              <button
                type="button"
                onClick={addLaborItem}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Mão-de-Obra
              </button>
            </div>

            <div className="space-y-2">
              {formData.laborItems.map((item, idx) => {
                const isFixed = item.pricingType === 'Valor Fechado';
                const lineTotal = isFixed ? item.hourlyRate : item.hours * item.hourlyRate;

                return (
                  <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...formData.laborItems];
                        updated[idx].description = e.target.value;
                        setFormData({ ...formData, laborItems: updated });
                      }}
                      className="flex-grow bg-white border border-slate-300 rounded p-1.5 text-xs min-w-[200px]"
                      placeholder="Descrição do serviço"
                    />

                    {/* Mode selector */}
                    <div className="w-32">
                      <select
                        value={item.pricingType || 'Horas'}
                        onChange={(e) => {
                          const updated = [...formData.laborItems];
                          const pType = e.target.value as 'Horas' | 'Valor Fechado';
                          updated[idx].pricingType = pType;
                          if (pType === 'Valor Fechado') {
                            updated[idx].hours = 1;
                          }
                          setFormData({ ...formData, laborItems: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] font-bold"
                      >
                        <option value="Horas">Por Horas</option>
                        <option value="Valor Fechado">Valor Fechado</option>
                      </select>
                      <span className="text-[9px] text-slate-400 block text-center mt-0.5">Tipo Cobrança</span>
                    </div>

                    {!isFixed ? (
                      <>
                        <div className="w-20">
                          <input
                            type="number"
                            step="0.25"
                            min="0.1"
                            value={item.hours}
                            onChange={(e) => {
                              const updated = [...formData.laborItems];
                              updated[idx].hours = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, laborItems: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">Horas</span>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            step="0.5"
                            value={item.hourlyRate}
                            onChange={(e) => {
                              const updated = [...formData.laborItems];
                              updated[idx].hourlyRate = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, laborItems: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-right font-bold"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">€ / Hora</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-36">
                        <input
                          type="number"
                          step="0.5"
                          value={item.hourlyRate}
                          onChange={(e) => {
                            const updated = [...formData.laborItems];
                            updated[idx].hours = 1;
                            updated[idx].hourlyRate = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, laborItems: updated });
                          }}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-right font-bold text-amber-700"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">Valor Fechado (€)</span>
                      </div>
                    )}

                    <div className="w-24 text-right font-bold text-slate-900 pr-1">
                      {formatCurrency(lineTotal)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLaborItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Retirar Mão-de-Obra"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parts Used Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" /> Peças e Componentes Aplicados
              </h3>

              {/* Add Part Dropdown & Manual Button */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="bg-white border border-slate-300 rounded p-1 text-xs max-w-[190px]"
                >
                  <option value="">-- Escolher do Stock --</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.sellingPrice)}) - Stk: {p.stockQty}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addPartFromInventory}
                  className="bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold px-2.5 py-1 rounded text-xs transition-colors"
                >
                  + Stock
                </button>
                <button
                  type="button"
                  onClick={addManualPart}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 shadow-xs"
                  title="Adicionar peça/material manualmente (não cadastrada no stock)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Peça Manual (Fora de Stock)</span>
                </button>
              </div>
            </div>

            {formData.partsItems.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Nenhuma peça adicionada. Escolha do stock ou clique em "+ Peça Manual (Fora de Stock)".
              </p>
            ) : (
              <div className="space-y-2">
                {formData.partsItems.map((part, idx) => (
                  <div key={part.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="w-28">
                      <input
                        type="text"
                        value={part.ref}
                        onChange={(e) => {
                          const updated = [...formData.partsItems];
                          updated[idx].ref = e.target.value;
                          setFormData({ ...formData, partsItems: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] font-mono font-bold"
                        placeholder="Ref OEM"
                      />
                      <span className="text-[9px] text-slate-400 block text-center mt-0.5">Referência</span>
                    </div>

                    <div className="flex-grow">
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => {
                          const updated = [...formData.partsItems];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, partsItems: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                        placeholder="Descrição / Nome da peça"
                      />
                      <span className="text-[9px] block mt-0.5">
                        {part.isManual ? (
                          <span className="text-amber-700 font-bold">Manual / Fora de Stock</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Do Stock</span>
                        )}
                      </span>
                    </div>

                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        value={part.qty}
                        onChange={(e) => {
                          const updated = [...formData.partsItems];
                          updated[idx].qty = parseInt(e.target.value, 10) || 1;
                          setFormData({ ...formData, partsItems: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold"
                      />
                      <span className="text-[9px] text-slate-400 block text-center mt-0.5">Qtd</span>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.5"
                        value={part.unitPrice}
                        onChange={(e) => {
                          const updated = [...formData.partsItems];
                          updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, partsItems: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-right font-bold"
                      />
                      <span className="text-[9px] text-slate-400 block text-center mt-0.5">€ Unid.</span>
                    </div>

                    <div className="w-24 text-right font-bold text-slate-900 pr-1">
                      {formatCurrency(part.qty * part.unitPrice)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removePartItem(part.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Retirar Peça"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary Footer */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Mão-de-Obra:</span>
                <span className="font-bold text-slate-200">{formatCurrency(laborSubtotal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Peças:</span>
                <span className="font-bold text-slate-200">{formatCurrency(partsSubtotal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">IVA (23% PT):</span>
                <span className="font-bold text-slate-200">{formatCurrency(vatTotal)}</span>
              </div>
              <div className="pl-4 border-l border-slate-700">
                <span className="text-amber-400 font-bold block text-[10px]">TOTAL FINAL:</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Quick Invoice Convert Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onConvertToInvoice('Orçamento')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition-colors"
              >
                Criar Orçamento
              </button>
              <button
                type="button"
                onClick={() => onConvertToInvoice('Fatura-Recibo')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Emitir Fatura IVA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
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
            <span>Guardar Folha de Obra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
