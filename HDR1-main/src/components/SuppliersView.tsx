import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Star,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Tag,
  PackageCheck,
  FileText,
} from 'lucide-react';
import { Supplier, InventoryPart } from '../types';
import { validateNIF, formatDatePT } from '../lib/ptFormatters';

interface SuppliersViewProps {
  suppliers: Supplier[];
  inventory: InventoryPart[];
  onSaveSupplier: (supplier: Supplier) => void;
}

const CATEGORY_OPTIONS = [
  'Filtros & Lubrificantes',
  'Travões & Suspensão',
  'Distribuição',
  'Componentes Elétricos',
  'Climatização & AC',
  'Pneus & Válvulas',
  'Acessórios & Ferramenta',
  'Baterias & Ignição',
  'Carroçaria & Iluminação',
];

const PAYMENT_TERMS_OPTIONS = [
  'Pronto Pagamento',
  '15 Dias',
  '30 Dias',
  '60 Dias',
  '90 Dias',
];

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  inventory,
  onSaveSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    paymentTerms: '30 Dias',
    categories: [] as string[],
    notes: '',
    rating: 5,
  });

  const [nifError, setNifError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      nif: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      postalCode: '',
      city: '',
      contactPerson: '',
      paymentTerms: '30 Dias',
      categories: ['Filtros & Lubrificantes'],
      notes: '',
      rating: 5,
    });
    setNifError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      nif: supplier.nif,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website || '',
      address: supplier.address,
      postalCode: supplier.postalCode,
      city: supplier.city,
      contactPerson: supplier.contactPerson || '',
      paymentTerms: supplier.paymentTerms,
      categories: supplier.categories || [],
      notes: supplier.notes || '',
      rating: supplier.rating || 5,
    });
    setNifError(null);
    setIsModalOpen(true);
  };

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
      setNifError('O NIF deve conter 9 dígitos numéricos.');
    } else {
      setNifError(null);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
      }
      return { ...prev, categories: [...prev.categories, cat] };
    });
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

    const supplierToSave: Supplier = {
      id: editingSupplier ? editingSupplier.id : `supp-${Date.now()}`,
      name: formData.name,
      nif: formData.nif,
      email: formData.email,
      phone: formData.phone,
      website: formData.website || undefined,
      address: formData.address,
      postalCode: formData.postalCode,
      city: formData.city,
      contactPerson: formData.contactPerson || undefined,
      paymentTerms: formData.paymentTerms,
      categories: formData.categories.length > 0 ? formData.categories : ['Geral'],
      notes: formData.notes || undefined,
      rating: formData.rating,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveSupplier(supplierToSave);
    setIsModalOpen(false);
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nif.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todos' || (s.categories && s.categories.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  // Calculate unique categories across all suppliers
  const allCategories = Array.from(
    new Set(suppliers.flatMap((s) => s.categories || []))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Gestão de Parceiros & Distribuição</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Cadastro de Fornecedores
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Gerencie contatos de distribuidores de peças, prazos de pagamento, NIF de fornecedores e categorias de componentes auto em Portugal.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{suppliers.length}</div>
            <div className="text-xs text-slate-500 font-medium">Fornecedores Registados</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {suppliers.filter((s) => s.paymentTerms === '30 Dias' || s.paymentTerms === '60 Dias').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Com Crédito (30/60 Dias)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{allCategories.length}</div>
            <div className="text-xs text-slate-500 font-medium">Categorias Cobertas</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{inventory.length}</div>
            <div className="text-xs text-slate-500 font-medium">Peças em Inventário</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Pesquisar por nome, NIF, cidade, email ou pessoa de contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <button
            onClick={() => setSelectedCategory('Todos')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'Todos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({suppliers.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = suppliers.filter((s) => s.categories?.includes(cat)).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => {
          const nifCheck = validateNIF(supplier.nif);
          return (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-blue-400 font-bold text-lg flex items-center justify-center shadow-sm">
                      {supplier.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {supplier.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                          NIF: {supplier.nif}
                          {nifCheck.isValid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                          )}
                        </span>
                        <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded">
                          {supplier.paymentTerms}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(supplier)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar fornecedor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rating */}
                {supplier.rating && (
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (supplier.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] text-slate-500 font-medium ml-1">
                      Parceiro Avaliado
                    </span>
                  </div>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {supplier.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Contact info grid */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{supplier.contactPerson}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={`tel:${supplier.phone}`}
                      className="hover:text-blue-600 font-mono transition-colors"
                    >
                      {supplier.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={`mailto:${supplier.email}`}
                      className="hover:text-blue-600 transition-colors truncate"
                    >
                      {supplier.email}
                    </a>
                  </div>

                  {supplier.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">
                      {supplier.address}, {supplier.postalCode} {supplier.city}
                    </span>
                  </div>
                </div>

                {supplier.notes && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                    "{supplier.notes}"
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Registo: {formatDatePT(supplier.createdAt)}
                </span>
                <a
                  href={`mailto:${supplier.email}?subject=Encomenda%20Pe%C3%A7as%20-%20Oficina`}
                  className="flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-800"
                >
                  <Mail className="w-3.5 h-3.5" /> Enviar Cotação
                </a>
              </div>
            </div>
          );
        })}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Nenhum fornecedor encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente alterar os termos da pesquisa ou adicionar um novo fornecedor.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Adicionar Fornecedor
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-lg">
                  {editingSupplier ? 'Editar Fornecedor' : 'Registar Novo Fornecedor'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome / Razão Social do Fornecedor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Fornecedor ou Empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* NIF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIF / NIPC Português (9 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    placeholder="500000000"
                    value={formData.nif}
                    onChange={(e) => handleNifChange(e.target.value)}
                    className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:outline-none font-mono ${
                      nifError
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {nifError && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">{nifError}</p>
                  )}
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pessoa de Contacto / Gestor
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do Contacto Comercial"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Principal *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="encomendas@fornecedor.pt"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+351 210 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Website */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plataforma B2B / Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://b2b.fornecedor.pt"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Morada / Armazém *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rua / Zona Industrial..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    placeholder="4000-000"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Localidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Porto / Lisboa / Maia"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Payment terms */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condições de Pagamento
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classificação do Parceiro
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (Excelente / Prioritário)</option>
                    <option value={4}>⭐⭐⭐⭐ (Muito Bom)</option>
                    <option value={3}>⭐⭐⭐ (Normal)</option>
                    <option value={2}>⭐⭐ (Razoável)</option>
                    <option value={1}>⭐ (Ocasional)</option>
                  </select>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Categorias de Componentes Fornecidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas Internas (Descontos comerciais, rotas de entrega, observações)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Desconto de 35% em embraiagens e discos. Entregas às 10h e 15h..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
                >
                  {editingSupplier ? 'Guardar Alterações' : 'Criar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
