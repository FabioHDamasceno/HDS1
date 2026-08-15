import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Boxes,
  X,
  TrendingUp,
} from 'lucide-react';
import { InventoryPart } from '../types';
import { formatCurrency } from '../lib/ptFormatters';

interface InventoryViewProps {
  inventory: InventoryPart[];
  onSavePart: (part: InventoryPart) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onSavePart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'TODAS' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['TODAS', ...Array.from(new Set(inventory.map((i) => i.category)))];

  const handleOpenNew = () => {
    setEditingPart({
      id: `inv-${Date.now()}`,
      code: 'OEM-',
      name: '',
      category: 'Filtros',
      brand: 'Bosch',
      costPrice: 10.0,
      sellingPrice: 20.0,
      vatRate: 23,
      stockQty: 5,
      minStockAlert: 2,
      locationInWorkshop: 'Prateleira A1',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryPart) => {
    setEditingPart({ ...item });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" /> Stock de Peças & Consumíveis de Oficina
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de inventário, referências OEM, preços de custo, margens de lucro e alertas de reposição
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Peça em Stock</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Nome, Ref OEM, Marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap border ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Ref. OEM / Código</th>
                <th className="py-3 px-4">Descrição da Peça</th>
                <th className="py-3 px-4">Categoria / Marca</th>
                <th className="py-3 px-4">Localização em Oficina</th>
                <th className="py-3 px-4 text-right">P. Custo (€)</th>
                <th className="py-3 px-4 text-right">P. Venda (€)</th>
                <th className="py-3 px-4 text-center">Stock Atual</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isLowStock = item.stockQty <= item.minStockAlert;
                const profitMargin =
                  item.sellingPrice > 0
                    ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(0)
                    : '0';

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-slate-200 mr-2">
                        {item.category}
                      </span>
                      <span className="text-slate-500 font-medium">{item.brand}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.locationInWorkshop}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(item.sellingPrice)}
                      <span className="text-[10px] text-emerald-600 font-bold ml-1 block">
                        +{profitMargin}% margem
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${
                          isLowStock
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {item.stockQty} unid. {isLowStock && '⚠️'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="text-amber-600 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Nenhuma peça de stock encontrada.
          </div>
        )}
      </div>

      {/* Modal: Edit / Add Inventory Item */}
      {isModalOpen && editingPart && (
        <InventoryModal
          part={editingPart}
          onClose={() => setIsModalOpen(false)}
          onSave={(part) => {
            onSavePart(part);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Modal Subcomponent
interface InventoryModalProps {
  part: InventoryPart;
  onClose: () => void;
  onSave: (p: InventoryPart) => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ part, onClose, onSave }) => {
  const [form, setForm] = useState<InventoryPart>({ ...part });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" /> Ficha de Peça em Stock
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Referência OEM / EAN:</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Marca Fabricante:</label>
              <input
                type="text"
                placeholder="ex: Bosch, Mann, Brembo..."
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Nome / Descrição da Peça:</label>
            <input
              type="text"
              placeholder="ex: Filtro de Óleo Mann-Filter HU7008z"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
              <input
                type="text"
                placeholder="Filtros, Travões, Óleos, Distribuição..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Localização em Armazém:</label>
              <input
                type="text"
                placeholder="ex: Prateleira B3, Gaveta F2..."
                value={form.locationInWorkshop}
                onChange={(e) => setForm({ ...form, locationInWorkshop: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Preço de Custo (€):</label>
              <input
                type="number"
                step="0.1"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Preço de Venda ao Cliente (€):</label>
              <input
                type="number"
                step="0.1"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-md p-2 font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Quantidade em Stock:</label>
              <input
                type="number"
                value={form.stockQty}
                onChange={(e) => setForm({ ...form, stockQty: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Alerta de Stock Mínimo:</label>
              <input
                type="number"
                value={form.minStockAlert}
                onChange={(e) => setForm({ ...form, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 font-mono font-bold text-amber-700"
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
              Guardar Peça
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
