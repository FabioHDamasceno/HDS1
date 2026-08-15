import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Car,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
  FileText,
  MapPin,
  MessageSquare,
  ArrowRight,
  Trash2,
  Edit2,
  DollarSign,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  ServiceType,
  Client,
  Vehicle,
} from '../types';
import { formatCurrency, formatDatePT, formatLicensePlate } from '../lib/ptFormatters';

interface CalendarViewProps {
  appointments: Appointment[];
  clients: Client[];
  vehicles: Vehicle[];
  onSaveAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onCreateWorkOrderFromAppointment: (appointment: Appointment) => void;
}

const SERVICE_TYPES: ServiceType[] = [
  'Revisão Periódica / Óleo',
  'Diagnóstico Eletrónico',
  'Sistema de Travões',
  'Kit Distribuição / Correia',
  'Preparação / Levado a IPO',
  'Substituição de Pneus',
  'Embraiagem & Caixa',
  'Ar Condicionado & Carregamento',
  'Alinhamento & Suspensão',
  'Serviço Rápido Geral',
];

const TECHNICIANS = [
  'Técnico Principal',
  'Mecânico Geral',
  'Técnico de Eletrónica & Diagnóstico',
  'Técnico de Pneus & Travões',
];

const BAYS = [
  'Elevador 1 (Hidráulico 4T)',
  'Elevador 2 (Tesoura)',
  'Posto Diagnóstico OBD',
  'Fosso 1 + Alinhador Faróis',
  'Posto Pneus & Alinhamento',
  'Estação A/C',
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  clients,
  vehicles,
  onSaveAppointment,
  onDeleteAppointment,
  onCreateWorkOrderFromAppointment,
}) => {
  // Current view mode and date selection
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-08-11')); // Default aligned with initial data
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [copiedWhatsappId, setCopiedWhatsappId] = useState<string | null>(null);

  // Form State for Modal
  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: new Date('2026-08-11').toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    serviceType: 'Revisão Periódica / Óleo',
    description: '',
    clientName: '',
    clientPhone: '',
    vehiclePlate: '',
    vehicleModel: '',
    assignedTechnician: TECHNICIANS[0],
    bay: BAYS[0],
    status: 'Agendado',
    estimatedCost: 0,
    notes: '',
  });

  // Client & Vehicle auto-fill triggers
  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientPhone: found.phone,
      }));
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const found = vehicles.find((v) => v.id === vehicleId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: found.id,
        vehiclePlate: found.licensePlate,
        vehicleModel: `${found.make} ${found.model} (${found.year})`,
      }));
    }
  };

  // Open modal to create new appointment
  const handleOpenNewModal = (initialDate?: string, initialTime?: string) => {
    setEditingAppointment(null);
    setFormData({
      date: initialDate || currentDate.toISOString().split('T')[0],
      startTime: initialTime || '09:00',
      endTime: initialTime ? `${parseInt(initialTime.split(':')[0]) + 1}:00` : '10:30',
      serviceType: 'Revisão Periódica / Óleo',
      description: '',
      clientName: '',
      clientPhone: '',
      vehiclePlate: '',
      vehicleModel: '',
      assignedTechnician: TECHNICIANS[0],
      bay: BAYS[0],
      status: 'Agendado',
      estimatedCost: 120,
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open modal to edit existing appointment
  const handleOpenEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({ ...apt });
    setDetailAppointment(null);
    setIsModalOpen(true);
  };

  // Save form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.vehiclePlate || !formData.date) {
      alert('Por favor preencha o Nome do Cliente, Matrícula e Data do Agendamento.');
      return;
    }

    const newApt: Appointment = {
      id: editingAppointment ? editingAppointment.id : `apt-${Date.now()}`,
      date: formData.date!,
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '10:00',
      serviceType: formData.serviceType || 'Revisão Periódica / Óleo',
      description: formData.description || '',
      clientName: formData.clientName!,
      clientPhone: formData.clientPhone || '',
      clientId: formData.clientId,
      vehiclePlate: formatLicensePlate(formData.vehiclePlate!),
      vehicleModel: formData.vehicleModel || 'Viatura',
      vehicleId: formData.vehicleId,
      assignedTechnician: formData.assignedTechnician,
      bay: formData.bay,
      status: (formData.status as AppointmentStatus) || 'Agendado',
      estimatedCost: Number(formData.estimatedCost) || 0,
      notes: formData.notes || '',
      workOrderId: editingAppointment?.workOrderId,
      createdAt: editingAppointment ? editingAppointment.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveAppointment(newApt);
    setIsModalOpen(false);
  };

  // Date navigation helpers
  const handlePrevDate = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-08-11')); // Current operational date
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (selectedStatusFilter !== 'all' && apt.status !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = apt.clientName.toLowerCase().includes(q);
        const matchesPlate = apt.vehiclePlate.toLowerCase().includes(q);
        const matchesModel = apt.vehicleModel.toLowerCase().includes(q);
        const matchesService = apt.serviceType.toLowerCase().includes(q);
        const matchesTech = (apt.assignedTechnician || '').toLowerCase().includes(q);
        if (!matchesClient && !matchesPlate && !matchesModel && !matchesService && !matchesTech) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, selectedStatusFilter, searchQuery]);

  // Appointments today / metrics
  const todayStr = currentDate.toISOString().split('T')[0];
  const appointmentsToday = appointments.filter((a) => a.date === todayStr);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmado':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Confirmado</span>;
      case 'Em Oficina':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Em Oficina</span>;
      case 'Concluído':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Concluído</span>;
      case 'Cancelado':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 line-through">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Agendado</span>;
    }
  };

  // Helper to generate WhatsApp reminder link
  const handleCopyWhatsAppMsg = (apt: Appointment) => {
    const text = `Olá ${apt.clientName}, confirmamos o seu agendamento na oficina para a viatura ${apt.vehiclePlate} (${apt.vehicleModel}) no dia ${formatDatePT(apt.date)} às ${apt.startTime}h. Serviço: ${apt.serviceType}. Até breve!`;
    navigator.clipboard.writeText(text);
    setCopiedWhatsappId(apt.id);
    setTimeout(() => setCopiedWhatsappId(null), 2500);
  };

  // Format month name in PT
  const currentMonthName = currentDate.toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Agenda & marcações de Oficina</h1>
              <p className="text-xs text-slate-500">
                Gestão de serviços futuros, atribuição de elevadores e mecânicos em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenNewModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total na Agenda</span>
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{appointments.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Serviços registados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Agendados Hoje ({todayStr})</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{appointmentsToday.length}</p>
          <p className="text-[11px] text-amber-700 mt-1">Para data selecionada</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Em Oficina (Em Progresso)</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">
            {appointments.filter((a) => a.status === 'Em Oficina').length}
          </p>
          <p className="text-[11px] text-purple-700 mt-1">Viaturas nos elevadores</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Volume Estimado (€)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">
            {formatCurrency(
              appointments
                .filter((a) => a.status !== 'Cancelado')
                .reduce((acc, a) => acc + (a.estimatedCost || 0), 0)
            )}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">Valor orçamentado em agenda</p>
        </div>
      </div>

      {/* Control Bar: Date Nav, View Selectors, Search, Status Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDate}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={handleNextDate}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Seguinte"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-slate-800 capitalize ml-2">
            {currentMonthName}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'month' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'week' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'day' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Dia ({todayStr})
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Lista Completa
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar cliente, matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Estados</option>
            <option value="Agendado">Agendado</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Em Oficina">Em Oficina</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* MAIN VIEW CONTENT ACCORDING TO VIEW MODE */}

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <MonthCalendarGrid
          currentDate={currentDate}
          appointments={filteredAppointments}
          onSelectAppointment={(apt) => setDetailAppointment(apt)}
          onAddAppointmentForDate={(dateStr) => handleOpenNewModal(dateStr)}
        />
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <WeekCalendarGrid
          currentDate={currentDate}
          appointments={filteredAppointments}
          onSelectAppointment={(apt) => setDetailAppointment(apt)}
          onAddAppointmentForDate={(dateStr) => handleOpenNewModal(dateStr)}
        />
      )}

      {/* 3. DAY VIEW (Hourly / Bays) */}
      {viewMode === 'day' && (
        <DayScheduleGrid
          dateStr={todayStr}
          appointments={filteredAppointments.filter((a) => a.date === todayStr)}
          onSelectAppointment={(apt) => setDetailAppointment(apt)}
          onAddAppointmentForSlot={(time) => handleOpenNewModal(todayStr, time)}
        />
      )}

      {/* 4. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Lista de Agendamentos ({filteredAppointments.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="font-semibold text-slate-600">Nenhum agendamento encontrado</p>
                <p className="text-xs mt-1">Ajuste os filtros ou crie uma nova marcação de serviço.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700 font-bold text-center min-w-[70px]">
                      <span className="text-xs text-slate-500 block font-normal">
                        {formatDatePT(apt.date).split(' de ')[0]}
                      </span>
                      <span className="text-xs text-blue-600 font-mono">
                        {apt.startTime}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {apt.serviceType}
                        </span>
                        {getStatusBadge(apt.status)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {apt.clientName} ({apt.clientPhone})
                        </span>
                        <span className="flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <Car className="w-3.5 h-3.5" />
                          {apt.vehiclePlate}
                        </span>
                        <span className="text-slate-500">{apt.vehicleModel}</span>
                      </div>

                      {apt.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {apt.description}
                        </p>
                      )}

                      {(apt.assignedTechnician || apt.bay) && (
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          {apt.assignedTechnician && (
                            <span>👨‍🔧 {apt.assignedTechnician}</span>
                          )}
                          {apt.bay && <span>📍 {apt.bay}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-sm font-bold text-slate-900 mr-2">
                      {formatCurrency(apt.estimatedCost || 0)}
                    </span>

                    <button
                      onClick={() => handleCopyWhatsAppMsg(apt)}
                      className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                      title="Copiar mensagem para Lembrete WhatsApp"
                    >
                      {copiedWhatsappId === apt.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onCreateWorkOrderFromAppointment(apt)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs border border-blue-200 transition-colors flex items-center gap-1"
                      title="Gerar Folha de Obra para este agendamento"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Gerar F. Obra</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(apt)}
                      className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                      title="Editar Agendamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Tem a certeza que deseja eliminar este agendamento?')) {
                          onDeleteAppointment(apt.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-red-200"
                      title="Eliminar Agendamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAIL DRAWER / MODAL */}
      {detailAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Detalhes do Agendamento
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {detailAppointment.serviceType}
                </h3>
              </div>
              <button
                onClick={() => setDetailAppointment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Data & Horário:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDatePT(detailAppointment.date)}
                  </span>
                  <p className="text-blue-600 font-mono font-semibold">
                    {detailAppointment.startTime}h - {detailAppointment.endTime}h
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Estado:</span>
                  <div className="mt-1">{getStatusBadge(detailAppointment.status)}</div>
                  <span className="text-slate-900 font-bold block mt-2">
                    Orçamento: {formatCurrency(detailAppointment.estimatedCost || 0)}
                  </span>
                </div>
              </div>

              {/* Client & Vehicle */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{detailAppointment.clientName}</span>
                  <span className="text-slate-500">({detailAppointment.clientPhone})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {detailAppointment.vehiclePlate}
                  </span>
                  <span className="text-slate-700 font-medium">{detailAppointment.vehicleModel}</span>
                </div>
              </div>

              {/* Tech & Bay */}
              <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <div className="text-slate-700">
                  <span className="font-semibold text-amber-900">Mecânico Atribuído:</span>{' '}
                  {detailAppointment.assignedTechnician || 'Não definido'}
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold text-amber-900">Posto / Elevador:</span>{' '}
                  {detailAppointment.bay || 'Não definido'}
                </div>
              </div>

              {/* Description */}
              {detailAppointment.description && (
                <div>
                  <span className="font-semibold text-slate-800 block">Descrição dos Trabalhos:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-1 text-slate-600">
                    {detailAppointment.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {detailAppointment.notes && (
                <div>
                  <span className="font-semibold text-slate-800 block">Observações do Cliente / Internas:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-1 text-slate-600">
                    {detailAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-2">
              <button
                onClick={() => handleCopyWhatsAppMsg(detailAppointment)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Lembrete WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onCreateWorkOrderFromAppointment(detailAppointment);
                    setDetailAppointment(null);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Gerar Folha de Obra</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(detailAppointment)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT APPOINTMENT MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento de Oficina'}
                </h3>
                <p className="text-xs text-slate-500">
                  Agende a receção de viaturas e reserve horário de elevadores
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-4">
              {/* Quick autofill selects if clients/vehicles exist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1">
                    Selecionar Cliente Existente (Opcional)
                  </label>
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <option value="">-- Escolher da Lista de Clientes --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.nif})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1">
                    Selecionar Viatura Existente (Opcional)
                  </label>
                  <select
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <option value="">-- Escolher Viatura Registada --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.licensePlate} - {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Agendamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Início
                  </label>
                  <input
                    type="time"
                    value={formData.startTime || '09:00'}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora Fim Estimada
                  </label>
                  <input
                    type="time"
                    value={formData.endTime || '10:30'}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Client & Vehicle Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Cliente"
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="910 000 000"
                    value={formData.clientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matrícula da Viatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AA-00-AA"
                    value={formData.vehiclePlate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehiclePlate: formatLicensePlate(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca / Modelo / Ano
                  </label>
                  <input
                    type="text"
                    placeholder="Marca e Modelo da Viatura"
                    value={formData.vehicleModel || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Service Type & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Serviço *
                  </label>
                  <select
                    value={formData.serviceType || SERVICE_TYPES[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value as ServiceType })
                    }
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {SERVICE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Estimado (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimatedCost || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tech, Bay, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mecânico Atribuído
                  </label>
                  <select
                    value={formData.assignedTechnician || TECHNICIANS[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTechnician: e.target.value })
                    }
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {TECHNICIANS.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Elevador / Posto
                  </label>
                  <select
                    value={formData.bay || BAYS[0]}
                    onChange={(e) => setFormData({ ...formData, bay: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {BAYS.map((bay) => (
                      <option key={bay} value={bay}>
                        {bay}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={formData.status || 'Agendado'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AppointmentStatus })
                    }
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Em Oficina">Em Oficina</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Trabalho Solicitado
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes dos sintomas, peças a encomendar ou especificações do cliente..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Internas
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cliente prefere contacto por WhatsApp, necessita viatura de substituição..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  {editingAppointment ? 'Guardar Alterações' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS FOR MONTH, WEEK, AND DAY CALENDAR GRIDS                     */
/* -------------------------------------------------------------------------- */

// 1. MONTH GRID
const MonthCalendarGrid: React.FC<{
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onAddAppointmentForDate: (dateStr: string) => void;
}> = ({ currentDate, appointments, onSelectAppointment, onAddAppointmentForDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week offset (0 = Sunday, 1 = Monday in standard JS, let's map Monday = 0)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

  const daysInMonth = lastDayOfMonth.getDate();

  // Create grid cells
  const gridCells = [];
  // Previous month padding
  for (let i = 0; i < startDayOfWeek; i++) {
    gridCells.push(null);
  }
  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    gridCells.push(`${year}-${monthStr}-${dayStr}`);
  }

  const weekDayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Days */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-600">
        {weekDayNames.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/20">
        {gridCells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[110px]" />;
          }

          const dayNum = parseInt(dateStr.split('-')[2], 10);
          const dayApts = appointments.filter((a) => a.date === dateStr);
          const isToday = dateStr === '2026-08-11';

          return (
            <div
              key={dateStr}
              className={`min-h-[110px] p-1.5 flex flex-col justify-between group transition-colors ${
                isToday ? 'bg-blue-50/30 ring-1 ring-blue-400 inset-0' : 'hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 group-hover:text-blue-600'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <button
                    onClick={() => onAddAppointmentForDate(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                    title="Adicionar agendamento neste dia"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* List of day appointments */}
                <div className="mt-1 space-y-1">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className="p-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-[10px] cursor-pointer shadow-2xs transition-all flex items-center justify-between gap-1 overflow-hidden"
                    >
                      <span className="font-mono font-bold text-blue-700 shrink-0">
                        {apt.startTime}
                      </span>
                      <span className="truncate font-medium text-slate-800">
                        {apt.vehiclePlate} ({apt.serviceType.split(' ')[0]})
                      </span>
                    </div>
                  ))}

                  {dayApts.length > 3 && (
                    <div className="text-[10px] text-slate-500 font-semibold text-center py-0.5">
                      +{dayApts.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. WEEK GRID
const WeekCalendarGrid: React.FC<{
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onAddAppointmentForDate: (dateStr: string) => void;
}> = ({ currentDate, appointments, onSelectAppointment, onAddAppointmentForDate }) => {
  // Get start of week (Monday)
  const curr = new Date(currentDate);
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diff));

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    weekDays.push(nextDay);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-slate-200 bg-slate-50 border-b border-slate-200">
        {weekDays.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          const isToday = dateStr === '2026-08-11';
          return (
            <div key={dateStr} className="p-3 text-center">
              <span className="text-xs font-bold text-slate-500 block uppercase">
                {d.toLocaleDateString('pt-PT', { weekday: 'short' })}
              </span>
              <span
                className={`inline-block text-base font-extrabold mt-0.5 px-2.5 py-0.5 rounded-full ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[400px]">
        {weekDays.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          const dayApts = appointments.filter((a) => a.date === dateStr);

          return (
            <div key={dateStr} className="p-2 space-y-2 bg-slate-50/20">
              <button
                onClick={() => onAddAppointmentForDate(dateStr)}
                className="w-full py-1 text-[11px] font-semibold text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded border border-dashed border-slate-200 flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Agendar</span>
              </button>

              {dayApts.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-blue-600 font-mono font-bold">
                    <span>{apt.startTime} - {apt.endTime}</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">{apt.serviceType}</div>
                  <div className="font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px] inline-block">
                    {apt.vehiclePlate}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{apt.clientName}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. DAY SCHEDULE GRID (HOURLY / ELEVATORS)
const DayScheduleGrid: React.FC<{
  dateStr: string;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onAddAppointmentForSlot: (time: string) => void;
}> = ({ dateStr, appointments, onSelectAppointment, onAddAppointmentForSlot }) => {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Horário de Oficina para o dia {formatDatePT(dateStr)}
          </h3>
          <p className="text-xs text-slate-500">Distribuição temporal e disponibilidade de postos</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {hours.map((hour) => {
          // Appointments starting around this hour
          const slotApts = appointments.filter((a) => a.startTime.startsWith(hour.split(':')[0]));

          return (
            <div key={hour} className="flex items-start min-h-[70px] hover:bg-slate-50/60 transition-colors">
              <div className="w-20 p-3 text-xs font-mono font-bold text-slate-500 border-r border-slate-100 shrink-0">
                {hour}
              </div>

              <div className="flex-1 p-2 flex items-center gap-3 flex-wrap">
                {slotApts.length === 0 ? (
                  <button
                    onClick={() => onAddAppointmentForSlot(hour)}
                    className="text-xs text-slate-400 hover:text-blue-600 font-medium py-1 px-3 rounded-lg border border-dashed border-slate-200 hover:border-blue-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Livre - Agendar para as {hour}</span>
                  </button>
                ) : (
                  slotApts.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl hover:shadow-md transition-all cursor-pointer flex items-center gap-3 text-xs"
                    >
                      <div className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-200">
                        {apt.vehiclePlate}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{apt.serviceType}</span>
                        <span className="text-slate-600 text-[11px]">
                          {apt.clientName} • {apt.assignedTechnician}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
