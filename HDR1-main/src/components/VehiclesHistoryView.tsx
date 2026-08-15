import React, { useState } from 'react';
import {
  Car,
  Search,
  Plus,
  CalendarCheck,
  Gauge,
  Wrench,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, MaintenanceCategory, Client } from '../types';
import { formatCurrency, formatDatePT, formatLicensePlate } from '../lib/ptFormatters';

interface VehiclesHistoryViewProps {
  vehicles: Vehicle[];
  clients: Client[];
  maintenanceRecords: MaintenanceRecord[];
  onSaveVehicle: (v: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
  onSaveRecord: (rec: MaintenanceRecord) => void;
  onOpenAIPlan: (vehicle: Vehicle) => void;
  initialSelectedPlate?: string;
}

export const VehiclesHistoryView: React.FC<VehiclesHistoryViewProps> = ({
  vehicles,
  clients,
  maintenanceRecords,
  onSaveVehicle,
  onDeleteVehicle,
  onSaveRecord,
  onOpenAIPlan,
  initialSelectedPlate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSelectedPlate || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialSelectedPlate
      ? vehicles.find((v) => v.licensePlate === initialSelectedPlate)?.id || vehicles[0]?.id || ''
      : vehicles[0]?.id || ''
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [isAddMaintOpen, setIsAddMaintOpen] = useState(false);
  const [isUpdateOdometerOpen, setIsUpdateOdometerOpen] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedClient = selectedVehicle
    ? clients.find((c) => c.id === selectedVehicle.clientId)
    : null;

  // Filtered vehicles list
  const filteredVehicles = vehicles.filter((v) => {
    const c = clients.find((cli) => cli.id === v.clientId);
    const term = searchTerm.toLowerCase();
    return (
      v.licensePlate.toLowerCase().includes(term) ||
      v.make.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.vin.toLowerCase().includes(term) ||
      (c && c.name.toLowerCase().includes(term))
    );
  });

  // Maintenance history for selected vehicle
  const vehicleRecords = maintenanceRecords
    .filter((r) => r.vehicleId === selectedVehicle?.id)
    .filter((r) => categoryFilter === 'TODAS' || r.category === categoryFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Total spent on this vehicle
  const totalSpent = vehicleRecords.reduce((acc, r) => acc + r.costTotal, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" /> Ficha de Veículos & Histórico de Manutenção
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte a cronologia completa de intervenções, quilometragens, datas IPO e alertas preventivos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setVehicleToEdit(null);
              setIsAddVehicleOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3.5 py-2 rounded-lg text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Veículo</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicles Fleet List & Search (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar Matrícula, Modelo, VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredVehicles.map((v) => {
                const c = clients.find((cli) => cli.id === v.clientId);
                const isSelected = selectedVehicle && selectedVehicle.id === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'
                          }`}
                        >
                          {v.licensePlate}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicleId(v.id);
                            setVehicleToEdit(v);
                            setIsAddVehicleOpen(true);
                          }}
                          className={`p-1 rounded hover:bg-slate-200/50 transition-colors ${
                            isSelected ? 'text-amber-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Editar este veículo"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {v.fuelType}
                      </span>
                    </div>

                    <p className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {v.make} {v.model} ({v.year})
                    </p>

                    <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-slate-200/40">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {c ? c.name : 'Particular'}
                      </span>
                      <span className={`font-mono font-bold ${isSelected ? 'text-amber-400' : 'text-slate-700'}`}>
                        {v.odometer.toLocaleString('pt-PT')} Km
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Total de {vehicles.length} veículos registados no sistema
          </div>
        </div>

        {/* Right Column: Selected Vehicle Specs & Detailed History Timeline (2 Cols) */}
        {selectedVehicle ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Spec Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 text-amber-400 font-mono font-black text-xl px-3 py-1.5 rounded-lg tracking-wider border-2 border-slate-800 shadow-inner">
                    {selectedVehicle.licensePlate}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ano {selectedVehicle.year} • {selectedVehicle.fuelType} • {selectedVehicle.color}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setVehicleToEdit(selectedVehicle);
                      setIsAddVehicleOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-200 transition-colors"
                    title="Editar Ficha do Veículo"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar Veículo</span>
                  </button>

                  <button
                    onClick={() => setIsUpdateOdometerOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-200 transition-colors"
                  >
                    <Gauge className="w-3.5 h-3.5 text-slate-600" />
                    <span>Atualizar Km</span>
                  </button>

                  <button
                    onClick={() => onOpenAIPlan(selectedVehicle)}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Plano IA Preventivo</span>
                  </button>

                  <button
                    onClick={() => setIsAddMaintOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Registar Manutenção</span>
                  </button>
                </div>
              </div>

              {/* Spec Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Nº Chassis / VIN:</span>
                  <span className="font-mono font-bold text-slate-800 break-all">{selectedVehicle.vin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Quilometragem Atual:</span>
                  <span className="font-mono font-extrabold text-amber-600 text-sm">
                    {selectedVehicle.odometer.toLocaleString('pt-PT')} Km
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Validade IPO (Inspeção):</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded inline-block mt-0.5">
                    {formatDatePT(selectedVehicle.ipoDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mês do IUC (Imposto):</span>
                  <span className="font-bold text-slate-800">{selectedVehicle.iucMonth || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cilindrada / Potência:</span>
                  <span className="font-bold text-slate-800">
                    {selectedVehicle.engineDisplacement || 'N/A'} {selectedVehicle.powerHp ? `(${selectedVehicle.powerHp} cv)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cor & Combustível:</span>
                  <span className="font-bold text-slate-800">
                    {selectedVehicle.color || 'N/A'} • {selectedVehicle.fuelType}
                  </span>
                </div>
              </div>

              {/* Owner Info Bar */}
              {selectedClient && (
                <div className="flex items-center justify-between text-xs bg-amber-50/60 border border-amber-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900">{selectedClient.name}</span>
                    <span className="text-slate-500 font-mono">(NIF: {selectedClient.nif})</span>
                  </div>
                  <span className="text-slate-600">Contacto: <strong className="text-slate-900">{selectedClient.phone}</strong></span>
                </div>
              )}
            </div>

            {/* Maintenance History Timeline Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" /> Cronologia de Manutenções & Intervenções
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico detalhado de reparações, revisões e substituição de componentes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Total Investido:</span>
                  <span className="text-base font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
              </div>

              {/* Category Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['TODAS', 'Revisão', 'Travões', 'Óleo/Filtros', 'Distribuição', 'Pneus', 'Diagnóstico', 'Elétrico', 'Climatização'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap border ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Timeline List */}
              {vehicleRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Sem registos de manutenção para a categoria selecionada.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique em "+ Registar Manutenção" para adicionar a primeira intervenção ao histórico.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicleRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-amber-400 font-bold px-2 py-0.5 rounded text-[11px]">
                            {rec.category}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{rec.title}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                          {formatCurrency(rec.costTotal)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{rec.description}</p>

                      {/* Parts Used Tags */}
                      {rec.partsUsed && rec.partsUsed.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Peças Substituídas:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.partsUsed.map((p, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                              >
                                {p.name} ({p.qty}x • {formatCurrency(p.price)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer meta info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Data: <strong>{formatDatePT(rec.date)}</strong> • Quilometragem: <strong>{rec.odometer.toLocaleString('pt-PT')} Km</strong>
                        </span>
                        <span>Mecânico: <strong>{rec.mechanicName}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            Selecione um veículo da lista ao lado.
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Vehicle */}
      {isAddVehicleOpen && (
        <VehicleFormModal
          clients={clients}
          vehicleToEdit={vehicleToEdit}
          onClose={() => {
            setIsAddVehicleOpen(false);
            setVehicleToEdit(null);
          }}
          onSave={(veh) => {
            onSaveVehicle(veh);
            setIsAddVehicleOpen(false);
            setVehicleToEdit(null);
          }}
          onDelete={(vehId) => {
            if (onDeleteVehicle) {
              onDeleteVehicle(vehId);
            }
            setIsAddVehicleOpen(false);
            setVehicleToEdit(null);
          }}
        />
      )}

      {/* Modal: Add Maintenance Record */}
      {isAddMaintOpen && selectedVehicle && (
        <AddMaintenanceRecordModal
          vehicle={selectedVehicle}
          onClose={() => setIsAddMaintOpen(false)}
          onSave={(rec) => {
            onSaveRecord(rec);
            setIsAddMaintOpen(false);
          }}
        />
      )}

      {/* Modal: Update Odometer */}
      {isUpdateOdometerOpen && selectedVehicle && (
        <UpdateOdometerModal
          vehicle={selectedVehicle}
          onClose={() => setIsUpdateOdometerOpen(false)}
          onSave={(updatedKm) => {
            onSaveVehicle({ ...selectedVehicle, odometer: updatedKm });
            setIsUpdateOdometerOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Submodal: Add or Edit Vehicle
interface VehicleFormModalProps {
  clients: Client[];
  vehicleToEdit?: Vehicle | null;
  onClose: () => void;
  onSave: (v: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  clients,
  vehicleToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<Partial<Vehicle>>(() => {
    if (vehicleToEdit) {
      return { ...vehicleToEdit };
    }
    return {
      clientId: clients[0]?.id || '',
      licensePlate: '',
      make: '',
      model: '',
      year: 2020,
      fuelType: 'Gasóleo',
      vin: '',
      odometer: 100000,
      ipoDate: '2026-12-31',
      iucMonth: 'Janeiro',
      color: 'Preto',
      engineDisplacement: '',
      powerHp: undefined,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.licensePlate || !form.make || !form.model) return;

    const savedVeh: Vehicle = {
      id: vehicleToEdit ? vehicleToEdit.id : `veh-${Date.now()}`,
      clientId: form.clientId || clients[0]?.id || '',
      licensePlate: formatLicensePlate(form.licensePlate),
      make: form.make || '',
      model: form.model || '',
      year: Number(form.year) || 2020,
      fuelType: (form.fuelType as any) || 'Gasóleo',
      vin: form.vin || 'WVWZZZ...000000',
      odometer: Number(form.odometer) || 0,
      ipoDate: form.ipoDate || '',
      iucMonth: form.iucMonth || 'Janeiro',
      color: form.color || 'Cinzento',
      engineDisplacement: form.engineDisplacement || undefined,
      powerHp: form.powerHp ? Number(form.powerHp) : undefined,
    };

    onSave(savedVeh);
  };

  const handleDelete = () => {
    if (vehicleToEdit && onDelete) {
      if (confirm(`Tem a certeza que deseja eliminar o veículo com a matrícula ${vehicleToEdit.licensePlate}?`)) {
        onDelete(vehicleToEdit.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            <span>{vehicleToEdit ? `Editar Veículo (${vehicleToEdit.licensePlate})` : 'Adicionar Novo Veículo'}</span>
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Proprietário / Cliente:</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (NIF: {c.nif})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Matrícula (PT):</label>
              <input
                type="text"
                placeholder="ex: AA-01-AB"
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: formatLicensePlate(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 uppercase font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Combustível:</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              >
                {['Gasóleo', 'Gasolina', 'Híbrido', 'Elétrico', 'GPL'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Marca:</label>
              <input
                type="text"
                placeholder="ex: Volkswagen"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Modelo:</label>
              <input
                type="text"
                placeholder="ex: Focus 1.5 TDCi / Megane 1.5 dCi"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ano:</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2020 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
            <div className="col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Quilometragem (Km):</label>
              <input
                type="number"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cor do Veículo:</label>
              <input
                type="text"
                placeholder="ex: Cinzento Metalizado"
                value={form.color || ''}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mês do IUC:</label>
              <select
                value={form.iucMonth || 'Janeiro'}
                onChange={(e) => setForm({ ...form, iucMonth: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              >
                {[
                  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nº Chassis / VIN:</label>
              <input
                type="text"
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 uppercase font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Data de IPO:</label>
              <input
                type="date"
                value={form.ipoDate}
                onChange={(e) => setForm({ ...form, ipoDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cilindrada (ex: 1598 cc):</label>
              <input
                type="text"
                placeholder="ex: 1598 cc"
                value={form.engineDisplacement || ''}
                onChange={(e) => setForm({ ...form, engineDisplacement: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Potência (cv):</label>
              <input
                type="number"
                placeholder="ex: 115"
                value={form.powerHp || ''}
                onChange={(e) => setForm({ ...form, powerHp: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-200">
            {vehicleToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold px-3 py-2 rounded-lg text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Veículo</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow"
              >
                {vehicleToEdit ? 'Atualizar Veículo' : 'Guardar Veículo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddVehicleModal = VehicleFormModal;

// Submodal: Add Maintenance Record
interface AddMaintenanceRecordModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (rec: MaintenanceRecord) => void;
}

const AddMaintenanceRecordModal: React.FC<AddMaintenanceRecordModalProps> = ({
  vehicle,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('Revisão');
  const [description, setDescription] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [costTotal, setCostTotal] = useState<number>(120);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const rec: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      vehicleId: vehicle.id,
      date,
      odometer: vehicle.odometer,
      title,
      category,
      description,
      mechanicName,
      costTotal: Number(costTotal) || 0,
      partsUsed: [],
    };

    onSave(rec);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" /> Registar Manutenção - [{vehicle.licensePlate}]
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Título do Serviço:</label>
            <input
              type="text"
              placeholder="ex: Substituição de Discos e Pastilhas de Travão"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              >
                {['Revisão', 'Travões', 'Óleo/Filtros', 'Distribuição', 'Pneus', 'Diagnóstico', 'Elétrico', 'Climatização', 'Geral'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Descrição Detalhada:</label>
            <textarea
              rows={3}
              placeholder="Detalle o serviço executado e peças aplicadas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mecânico:</label>
              <input
                type="text"
                value={mechanicName}
                onChange={(e) => setMechanicName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Custo Total (€):</label>
              <input
                type="number"
                step="0.5"
                value={costTotal}
                onChange={(e) => setCostTotal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow"
            >
              Guardar Registo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Submodal: Update Odometer
interface UpdateOdometerModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (km: number) => void;
}

const UpdateOdometerModal: React.FC<UpdateOdometerModalProps> = ({ vehicle, onClose, onSave }) => {
  const [km, setKm] = useState<number>(vehicle.odometer);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-500" /> Atualizar Quilometragem - [{vehicle.licensePlate}]
        </h3>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Nova Quilometragem (Km):</label>
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 font-mono font-extrabold text-base text-slate-900"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold">
            Cancelar
          </button>
          <button
            onClick={() => onSave(km)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs shadow"
          >
            Confirmar Km
          </button>
        </div>
      </div>
    </div>
  );
};
