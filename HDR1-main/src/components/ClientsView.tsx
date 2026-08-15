import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Car,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  X,
  FileText,
} from 'lucide-react';
import { Client, ClientType, Vehicle, Invoice } from '../types';
import { validateNIF, formatCurrency } from '../lib/ptFormatters';

interface ClientsViewProps {
  clients: Client[];
  vehicles: Vehicle[];
  invoices: Invoice[];
  onSaveClient: (c: Client) => void;
  onSelectVehicle: (v: Vehicle) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  vehicles,
  invoices,
  onSaveClient,
  onSelectVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.nif.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  const handleOpenNew = () => {
    setEditingClient({
      id: `cli-${Date.now()}`,
      name: '',
      nif: '',
      clientType: 'Particular',
      email: '',
      phone: '+351 ',
      address: '',
      postalCode: '',
      city: '',
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient({ ...c });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Gestão de Clientes & NIFs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registo de clientes particulares e empresas com verificação algorítmica de NIF/NIPC de Portugal
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Novo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Nome, NIF, Email, Cidade, Telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientVehicles = vehicles.filter((v) => v.clientId === client.id);
          const clientInvoices = invoices.filter((i) => i.clientId === client.id);
          const totalSpent = clientInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

          const nifStatus = validateNIF(client.nif);

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Top Type & NIF validation badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      client.clientType === 'Empresa'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {client.clientType === 'Empresa' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {client.clientType}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                      nifStatus.isValid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {nifStatus.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    NIF: {client.nif}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{client.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {client.address}, {client.postalCode} {client.city}
                    </span>
                  </p>
                </div>

                {/* Client's Vehicles */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                    Veículos Associados ({clientVehicles.length}):
                  </span>
                  {clientVehicles.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhum veículo registado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {clientVehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => onSelectVehicle(v)}
                          className="bg-slate-900 text-amber-400 hover:bg-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Car className="w-3 h-3" />
                          <span>{v.licensePlate}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Faturado:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(totalSpent)}</span>
                </div>

                <button
                  onClick={() => handleOpenEdit(client)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1 rounded-md text-xs border border-slate-200 transition-colors"
                >
                  Editar Ficha
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Client Edit / New */}
      {isModalOpen && editingClient && (
        <ClientModal
          client={editingClient}
          onClose={() => setIsModalOpen(false)}
          onSave={(c) => {
            onSaveClient(c);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Modal Subcomponent
interface ClientModalProps {
  client: Client;
  onClose: () => void;
  onSave: (c: Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
  const [form, setForm] = useState<Client>({ ...client });

  const nifValidation = validateNIF(form.nif);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nif) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Ficha do Cliente & Dados Fiscais
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tipo de Cliente:</label>
              <select
                value={form.clientType}
                onChange={(e) => setForm({ ...form, clientType: e.target.value as ClientType })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-bold"
              >
                <option value="Particular">Particular</option>
                <option value="Empresa">Empresa / NIPC</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                NIF / NIPC (9 dígitos PT):
              </label>
              <input
                type="text"
                placeholder="123456789 ou 501234567"
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Live NIF Validation Alert */}
          {form.nif.length > 0 && (
            <div
              className={`p-2.5 rounded-md flex items-center gap-2 text-xs font-semibold ${
                nifValidation.isValid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {nifValidation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{nifValidation.message}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Nome Completo / Razão Social:</label>
            <input
              type="text"
              placeholder="Nome do cliente particular ou empresa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Telefone (+351):</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email de Faturação:</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Morada de Faturação:</label>
            <input
              type="text"
              placeholder="Rua, Número, Andar..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Código Postal:</label>
              <input
                type="text"
                placeholder="4000-123"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Localidade / Cidade:</label>
              <input
                type="text"
                placeholder="Porto, Lisboa, Matosinhos..."
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
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
              Guardar Ficha do Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
