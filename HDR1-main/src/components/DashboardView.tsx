import React from 'react';
import {
  Wrench,
  Euro,
  AlertTriangle,
  CalendarCheck,
  Plus,
  Car,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  UserCheck,
  CheckCircle2,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { WorkOrder, Vehicle, Invoice, InventoryPart, Client, Expense, Appointment } from '../types';
import { formatCurrency, formatDatePT } from '../lib/ptFormatters';

interface DashboardViewProps {
  workOrders: WorkOrder[];
  vehicles: Vehicle[];
  invoices: Invoice[];
  inventory: InventoryPart[];
  clients: Client[];
  expenses?: Expense[];
  appointments?: Appointment[];
  setActiveTab: (tab: string) => void;
  onNewWorkOrder: () => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onSelectVehicle: (v: Vehicle) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workOrders,
  vehicles,
  invoices,
  inventory,
  clients,
  expenses = [],
  appointments = [],
  setActiveTab,
  onNewWorkOrder,
  onSelectWorkOrder,
  onSelectVehicle,
}) => {
  // Compute KPI metrics
  const activeWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'Faturado' && wo.status !== 'Cancelado'
  );

  const monthlyInvoicesTotal = invoices
    .filter((inv) => inv.status === 'Paga' || inv.status === 'Pendente')
    .reduce((acc, inv) => acc + inv.grandTotal, 0);

  const totalExpenses = expenses
    .filter((exp) => exp.status !== 'Cancelado')
    .reduce((acc, exp) => acc + exp.amount, 0);

  // Vehicles with upcoming IPO inspection in the next 60 days
  const now = new Date();
  const upcomingIpoVehicles = vehicles.filter((v) => {
    if (!v.ipoDate) return false;
    const ipo = new Date(v.ipoDate);
    const diffDays = (ipo.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= -10 && diffDays <= 60;
  });

  const lowStockParts = inventory.filter((p) => p.stockQty <= p.minStockAlert);

  // Bays status mapping
  const baysList = [
    { name: 'Elevador 1', desc: 'Mecânica Geral' },
    { name: 'Elevador 2', desc: 'Travões & Suspensão' },
    { name: 'Banca Elétrica', desc: 'Diagnóstico Eletrónico' },
    { name: 'Zona Rápida', desc: 'Pneus & Alinhamento' },
  ];

  const getClientName = (clientId: string) => {
    const c = clients.find((cli) => cli.id === clientId);
    return c ? c.name : 'Cliente Desconhecido';
  };

  const getVehicleByPlate = (vehId: string) => {
    return vehicles.find((v) => v.id === vehId);
  };

  const getStatusColor = (status: string) => {
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div>
          <span className="text-blue-400 font-semibold text-xs tracking-wider uppercase block">
            Mercado Automóvel Português
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Gestão de Oficina & Folhas de Obra
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Acompanhe a ocupação dos elevadores, histórico de reparações por matrícula, validações de NIF e emissão de orçamentos e faturas IVA em conformidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onNewWorkOrder}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Folha de Obra</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Assistente IA</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Work Orders */}
        <div
          onClick={() => setActiveTab('workorders')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Em Reparação
            </span>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeWorkOrders.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              de {workOrders.length} totais
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-orange-600 font-medium flex items-center gap-1">
            <span>Ver pipeline</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div
          onClick={() => setActiveTab('invoices')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Faturação
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(monthlyInvoicesTotal)}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">
              c/ IVA
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span>Faturas & Orçamentos</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Despesas & Custos
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-amber-700 tracking-tight">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-[10px] font-semibold text-amber-800">
              {expenses.length} custos
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <span>Aluguer, luz, água...</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Upcoming IPO Inspections */}
        <div
          onClick={() => setActiveTab('vehicles')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Inspeções IPO
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {upcomingIpoVehicles.length}
            </span>
            <span className="text-[10px] font-semibold text-blue-600">
              Próx. 60 dias
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <span>Ver datas IPO</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 5: Inventory Alerts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Stock Crítico
            </span>
            <div
              className={`p-2 rounded-lg ${
                lowStockParts.length > 0
                  ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600'
              } transition-colors`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {lowStockParts.length}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              itens alerta
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <span>Gerir peças</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Workshop Bays Occupancy Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" /> Ocupação dos Postos de Trabalho & Elevadores
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado em tempo real dos elevadores da oficina e mecânicos atribuídos
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            5 Postos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {baysList.map((bay) => {
            const woInBay = activeWorkOrders.find((w) => w.bay === bay.name);
            const vehicle = woInBay ? getVehicleByPlate(woInBay.vehicleId) : null;

            return (
              <div
                key={bay.name}
                className={`p-3.5 rounded-xl border transition-all ${
                  woInBay
                    ? 'bg-orange-50/60 border-orange-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {bay.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      woInBay
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {woInBay ? 'OCUPADO' : 'LIVRE'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2">{bay.desc}</p>

                {woInBay && vehicle ? (
                  <div
                    onClick={() => onSelectWorkOrder(woInBay)}
                    className="bg-white p-2.5 rounded-lg border border-orange-200 shadow-2xs hover:border-orange-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                        {vehicle.licensePlate}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {woInBay.number}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 mt-1 truncate">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{woInBay.technicianName}</span>
                    </p>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center text-xs text-slate-400">
                    Disponível para entrada
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Split: Active Work Orders Table + Upcoming Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Work Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Folhas de Obra em Processamento
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe os serviços em curso na oficina
                </p>
              </div>
              <button
                onClick={() => setActiveTab('workorders')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Ver Todas ({workOrders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeWorkOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Todas as folhas de obra concluídas!</p>
                <p className="text-xs text-slate-400 mt-1">Crie uma nova folha de obra para dar entrada a um veículo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Nº Folha</th>
                      <th className="py-2.5 px-3">Matrícula / Veículo</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWorkOrders.slice(0, 5).map((wo) => {
                      const veh = getVehicleByPlate(wo.vehicleId);
                      const clientName = getClientName(wo.clientId);

                      return (
                        <tr
                          key={wo.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => onSelectWorkOrder(wo)}
                        >
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {wo.number}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-900 text-amber-400 font-bold px-1.5 py-0.5 rounded text-[11px]">
                                {veh ? veh.licensePlate : '-'}
                              </span>
                              <span className="font-medium text-slate-800 truncate max-w-[140px]">
                                {veh ? `${veh.make} ${veh.model}` : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 truncate max-w-[120px]">
                            {clientName}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusColor(
                                wo.status
                              )}`}
                            >
                              {wo.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectWorkOrder(wo);
                              }}
                              className="text-amber-600 hover:text-amber-800 font-bold text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200 transition-colors"
                            >
                              Abrir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Valores tabelados a {formatCurrency(42.5)}/hora (Preço médio mão-de-obra PT)</span>
            <button
              onClick={onNewWorkOrder}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Ordem de Serviço
            </button>
          </div>
        </div>

        {/* Sidebar Widget: Upcoming IPO Inspections PT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" /> Próximas Inspeções IPO
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Portugal
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Alertas de Inspeção Periódica Obrigatória dos veículos da sua frota
            </p>

            {upcomingIpoVehicles.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                Nenhum veículo com IPO a vencer nos próximos 60 dias.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {upcomingIpoVehicles.map((v) => {
                  const client = clients.find((c) => c.id === v.clientId);
                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicle(v)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                          {v.licensePlate}
                        </span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          IPO: {formatDatePT(v.ipoDate)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5">
                        {v.make} {v.model} ({v.year})
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Proprietário: {client ? client.name : 'Particular'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upcoming Agenda Appointments Widget */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" /> Próximas Marcações na Agenda
                </h2>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  Ver Agenda
                </button>
              </div>

              {appointments.filter((a) => a.status !== 'Cancelado').length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  Sem agendamentos futuros registados.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {appointments
                    .filter((a) => a.status !== 'Cancelado')
                    .slice(0, 4)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setActiveTab('calendar')}
                        className="p-2 bg-purple-50/40 hover:bg-purple-100/50 border border-purple-100 rounded-lg transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                              {apt.vehiclePlate}
                            </span>
                            <span className="font-bold text-slate-900 truncate max-w-[130px]">
                              {apt.serviceType}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {apt.clientName} • {formatDatePT(apt.date)} às {apt.startTime}h
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {apt.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Controlo IUC & IPO em conformidade IMT</span>
            <button
              onClick={() => setActiveTab('vehicles')}
              className="text-blue-600 font-bold hover:underline"
            >
              Ver Frota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
