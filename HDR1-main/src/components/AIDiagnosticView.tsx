import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  FileText,
  Upload,
  Gauge,
  Loader2,
  ChevronRight,
  Plus,
  ShieldAlert,
  Boxes,
  PackageCheck,
  Car,
  Info,
  Tag,
  MapPin,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  Vehicle,
  AIDiagnosisResult,
  AIPreventivePlanResult,
  AIPartCompatibilityResult,
  InventoryPart,
  WorkOrder,
} from '../types';
import { formatCurrency } from '../lib/ptFormatters';
import { safeFetchJson } from '../utils/api';

interface AIDiagnosticViewProps {
  vehicles: Vehicle[];
  inventory?: InventoryPart[];
  initialSymptoms?: string;
  initialVehicleInfo?: string;
  onCreateWorkOrderFromAI?: (diagnosis: AIDiagnosisResult) => void;
}

function safeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.message === 'string') return val.message;
    if (typeof val.error === 'string') return val.error;
    if (typeof val.details === 'string') return val.details;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export const AIDiagnosticView: React.FC<AIDiagnosticViewProps> = ({
  vehicles,
  inventory = [],
  initialSymptoms = '',
  initialVehicleInfo = '',
  onCreateWorkOrderFromAI,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dtc' | 'preventive' | 'ocr' | 'compatibility'>('dtc');

  // AI Connection Status
  const [aiStatus, setAiStatus] = useState<{
    checking: boolean;
    configured: boolean | null;
    model?: string;
    message?: string;
  }>({
    checking: false,
    configured: null,
  });

  const checkAiHealth = async () => {
    setAiStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await safeFetchJson<{
        configured: boolean;
        model?: string;
        message?: any;
      }>('/api/ai/status');

      if (res.ok && res.data) {
        setAiStatus({
          checking: false,
          configured: !!res.data.configured,
          model: typeof res.data.model === 'string' ? res.data.model : 'gemini-3.7-flash',
          message: safeString(res.data.message, 'Assistente Gemini ativo e operacional!'),
        });
      } else {
        setAiStatus({
          checking: false,
          configured: false,
          message: safeString(res.error, 'Não foi possível validar o estado do serviço Gemini.'),
        });
      }
    } catch (e: any) {
      setAiStatus({
        checking: false,
        configured: false,
        message: safeString(e?.message, 'Não foi possível contactar o servidor.'),
      });
    }
  };

  useEffect(() => {
    checkAiHealth();
  }, []);

  // DTC Diagnostic State
  const [dtcCode, setDtcCode] = useState('');
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState(initialVehicleInfo);
  const [isLoadingDiagnose, setIsLoadingDiagnose] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<AIDiagnosisResult | null>(null);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);

  // Preventive Plan State
  const [selectedVehForPlan, setSelectedVehForPlan] = useState<string>(vehicles[0]?.id || '');
  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualYear, setManualYear] = useState(new Date().getFullYear());
  const [manualFuel, setManualFuel] = useState('Gasóleo');
  const [manualKm, setManualKm] = useState(100000);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planResult, setPlanResult] = useState<AIPreventivePlanResult | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // OCR Document Scanner State
  const [docText, setDocText] = useState('');
  const [docImageBase64, setDocImageBase64] = useState<string | null>(null);
  const [isLoadingOCR, setIsLoadingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Part Stock Compatibility State
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [customPartCode, setCustomPartCode] = useState<string>('');
  const [customPartName, setCustomPartName] = useState<string>('');
  const [customPartBrand, setCustomPartBrand] = useState<string>('');
  const [customPartCategory, setCustomPartCategory] = useState<string>('');
  const [isLoadingPartComp, setIsLoadingPartComp] = useState<boolean>(false);
  const [partCompResult, setPartCompResult] = useState<AIPartCompatibilityResult | null>(null);
  const [partCompError, setPartCompError] = useState<string | null>(null);

  // Handle inventory selection for part compatibility
  const handleSelectInventoryPart = (partId: string) => {
    setSelectedPartId(partId);
    const found = inventory.find((p) => p.id === partId);
    if (found) {
      setCustomPartCode(found.code);
      setCustomPartName(found.name);
      setCustomPartBrand(found.brand);
      setCustomPartCategory(found.category);
    } else {
      setCustomPartCode('');
      setCustomPartName('');
      setCustomPartBrand('');
      setCustomPartCategory('');
    }
  };

  const handleRunPartCompatibility = async () => {
    if (!customPartCode && !customPartName) {
      setPartCompError('Insira o código/referência da peça (ex: 03L115561) ou selecione uma peça do stock.');
      return;
    }

    setIsLoadingPartComp(true);
    setPartCompError(null);
    setPartCompResult(null);

    const invPart = inventory.find((p) => p.id === selectedPartId || p.code.toLowerCase() === customPartCode.toLowerCase());

    try {
      const res = await safeFetchJson<AIPartCompatibilityResult>('/api/ai/part-compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partCode: customPartCode,
          partName: customPartName,
          brand: customPartBrand,
          category: customPartCategory,
          stockQty: invPart ? invPart.stockQty : undefined,
          locationInWorkshop: invPart ? invPart.locationInWorkshop : undefined,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Falha ao consultar compatibilidade da peça com Gemini');
      }

      setPartCompResult(res.data);
    } catch (err: any) {
      console.error('Erro na consulta de compatibilidade:', err);
      setPartCompError(
        safeString(
          err?.message,
          'Não foi possível consultar os modelos compatíveis. Verifique a sua chave GEMINI_API_KEY.'
        )
      );
    } finally {
      setIsLoadingPartComp(false);
    }
  };

  // Find matching vehicles in workshop fleet for the current part
  const matchingWorkshopVehicles = React.useMemo(() => {
    if (
      !partCompResult ||
      !Array.isArray(partCompResult.veiculosCompativeis) ||
      !Array.isArray(vehicles) ||
      vehicles.length === 0
    ) {
      return [];
    }

    return vehicles.filter((v) => {
      if (!v || !v.make || !v.model) return false;
      const vMakeLower = String(v.make).toLowerCase();
      const vModelLower = String(v.model).toLowerCase();

      return (partCompResult.veiculosCompativeis || []).some((vc) => {
        if (!vc) return false;
        const compMakeLower = String(vc.marca || '').toLowerCase();
        const compModelsLower = String(vc.modelos || '').toLowerCase();

        const matchMake = compMakeLower.includes(vMakeLower) || vMakeLower.includes(compMakeLower);
        const matchModel =
          compModelsLower.includes(vModelLower) ||
          vModelLower
            .split(' ')
            .some((m) => m && m.length > 2 && compModelsLower.includes(m.toLowerCase()));

        return matchMake && matchModel;
      });
    });
  }, [partCompResult, vehicles]);

  // If initialSymptoms updated, run diagnose automatically if empty result
  useEffect(() => {
    if (initialSymptoms && !diagnoseResult) {
      setSymptoms(initialSymptoms);
      if (initialVehicleInfo) setSelectedVehicleInfo(initialVehicleInfo);
    }
  }, [initialSymptoms, initialVehicleInfo]);

  // Handler for AI Diagnosis
  const handleRunDiagnosis = async () => {
    if (!dtcCode && !symptoms) {
      setDiagnoseError('Insira pelo menos um código DTC (ex: P0300) ou a descrição dos sintomas.');
      return;
    }

    setIsLoadingDiagnose(true);
    setDiagnoseError(null);
    setDiagnoseResult(null);

    try {
      const res = await safeFetchJson<AIDiagnosisResult>('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dtcCode,
          symptoms,
          vehicleInfo: selectedVehicleInfo,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Falha na resposta do servidor Gemini');
      }

      setDiagnoseResult(res.data);
    } catch (err: any) {
      console.error('Erro na chamada AI:', err);
      setDiagnoseError(
        safeString(
          err?.message,
          'Não foi possível gerar o diagnóstico neste momento. Verifique a sua chave GEMINI_API_KEY.'
        )
      );
    } finally {
      setIsLoadingDiagnose(false);
    }
  };

  // Handler for Preventive Plan
  const handleRunPreventivePlan = async () => {
    setIsLoadingPlan(true);
    setPlanError(null);
    setPlanResult(null);

    const veh = vehicles.find((v) => v.id === selectedVehForPlan);
    const make = veh ? veh.make : manualMake;
    const model = veh ? veh.model : manualModel;
    const year = veh ? veh.year : manualYear;
    const fuelType = veh ? veh.fuelType : manualFuel;
    const currentKm = veh ? veh.odometer : manualKm;

    try {
      const res = await safeFetchJson<AIPreventivePlanResult>('/api/ai/preventive-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make,
          model,
          year,
          fuelType,
          currentKm,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Falha ao obter plano preventivo');
      }
      setPlanResult(res.data);
    } catch (err: any) {
      console.error(err);
      setPlanError(
        safeString(
          err?.message,
          'Erro ao gerar o plano de manutenção preventiva. Verifique a sua chave GEMINI_API_KEY.'
        )
      );
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Image Upload Handler for Document OCR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunOCR = async () => {
    setIsLoadingOCR(true);
    setOcrError(null);
    setOcrResult(null);

    try {
      const res = await safeFetchJson<any>('/api/ai/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: docText,
          imageBase64: docImageBase64,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Falha no leitor OCR');
      }
      setOcrResult(res.data);
    } catch (err: any) {
      console.error(err);
      setOcrError(
        safeString(
          err?.message,
          'Erro ao processar o documento com IA. Verifique a sua chave GEMINI_API_KEY.'
        )
      );
    } finally {
      setIsLoadingOCR(false);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Média':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-amber-400 font-semibold text-xs uppercase tracking-wider block">
                Gemini AI Engine • Especialista Automóvel
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Assistente Técnico de Oficina & Diagnósticos
              </h1>
              <p className="text-slate-300 text-xs mt-1">
                Apoio de Inteligência Artificial para avarias OBD-II, verificação de compatibilidade de peças em stock, planos preventivos e leitor de faturas.
              </p>
            </div>
          </div>

          {/* AI Connection Status Badge */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs backdrop-blur-sm self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  aiStatus.checking
                    ? 'bg-amber-400 animate-pulse'
                    : aiStatus.configured
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-200">
                {aiStatus.checking
                  ? 'A verificar IA...'
                  : aiStatus.configured
                  ? 'Gemini 3.7 Flash Ativo'
                  : 'Chave GEMINI_API_KEY necessária'}
              </span>
            </div>
            <button
              onClick={checkAiHealth}
              disabled={aiStatus.checking}
              title="Testar Conexão com Gemini API"
              className="p-1 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiStatus.checking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {aiStatus.configured === false && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {safeString(
                  aiStatus.message,
                  'Para ativar as funcionalidades de IA, configure a variável GEMINI_API_KEY.'
                )}
              </span>
            </div>
            <button
              onClick={checkAiHealth}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs ml-3 whitespace-nowrap"
            >
              Reverificar
            </button>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('dtc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'dtc'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Diagnóstico DTC / Avarias</span>
          </button>

          <button
            onClick={() => setActiveSubTab('compatibility')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'compatibility'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Compatibilidade de Peças em Stock</span>
          </button>

          <button
            onClick={() => setActiveSubTab('preventive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'preventive'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Plano Preventivo por Km</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ocr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'ocr'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Leitor de Documentos / Faturas</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 2: Stock Part Compatibility & Vehicle Models */}
      {activeSubTab === 'compatibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form / Selector (1 Col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-500" /> Consulta de Peça & Aplicação
            </h2>

            {/* Option 1: Pick from Inventory */}
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Selecionar Peça do Stock da Oficina:
              </label>
              <select
                value={selectedPartId}
                onChange={(e) => handleSelectInventoryPart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
              >
                <option value="">-- Escolher do Inventário de Peças --</option>
                {(inventory || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.code || 'S/ REF'}] {item.name || 'Peça'} ({item.brand || 'Geral'}) • Stock: {item.stockQty ?? 0} un.
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">Ou Digitar Código / Ref</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Option 2: Manual code input */}
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Código da Peça / Ref OEM / Ref Aftermarket: *
              </label>
              <input
                type="text"
                placeholder="ex: 03L115561, F026407008, HU7008Z, GDB1550"
                value={customPartCode}
                onChange={(e) => {
                  setCustomPartCode(e.target.value.toUpperCase());
                  setSelectedPartId('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-extrabold text-sm uppercase text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Nome ou Descrição da Peça:
              </label>
              <input
                type="text"
                placeholder="ex: Filtro de Óleo, Pastilhas de Travão Dianteiras, Kit Distribuição"
                value={customPartName}
                onChange={(e) => setCustomPartName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Marca / Fabricante:
                </label>
                <input
                  type="text"
                  placeholder="ex: Bosch, VAG, Mann"
                  value={customPartBrand}
                  onChange={(e) => setCustomPartBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Categoria:
                </label>
                <input
                  type="text"
                  placeholder="ex: Óleo/Filtros"
                  value={customPartCategory}
                  onChange={(e) => setCustomPartCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
            </div>

            {partCompError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{partCompError}</span>
              </div>
            )}

            <button
              onClick={handleRunPartCompatibility}
              disabled={isLoadingPartComp}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingPartComp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>A pesquisar veículos compatíveis com Gemini IA...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4 text-amber-400" />
                  <span>Obter Modelos de Veículos Compatíveis</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display (2 Cols) */}
          <div className="lg:col-span-2">
            {partCompResult ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header Card */}
                <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                          {partCompResult.categoria || 'Peça Automóvel'}
                        </span>
                        {partCompResult.marca && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {partCompResult.marca}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black mt-2 text-white">
                        {partCompResult.nomePeca}
                      </h2>
                      <p className="text-amber-400 font-mono text-sm font-bold mt-0.5">
                        Ref / Código: {partCompResult.codigoRef}
                      </p>
                    </div>

                    {/* Stock badge if selected from stock */}
                    {selectedPartId && (() => {
                      const item = inventory.find((p) => p.id === selectedPartId);
                      if (!item) return null;
                      return (
                        <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Em Stock na Oficina</span>
                          <span className={`text-base font-black ${item.stockQty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.stockQty} unidades
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5 flex items-center justify-end gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" /> {item.locationInWorkshop || 'Sem localização'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <p className="text-slate-300 text-xs mt-3 pt-3 border-t border-slate-800 font-medium">
                    <strong>Resumo de Aplicação:</strong> {partCompResult.resumoCompatibilidade}
                  </p>
                </div>

                {/* Matching Workshop Vehicles (if any client vehicle matches this part) */}
                {matchingWorkshopVehicles.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-600" /> Veículos na Frota de Clientes da Oficina Compatíveis ({matchingWorkshopVehicles.length}):
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {matchingWorkshopVehicles.map((v) => (
                        <div key={v.id} className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">[{v.licensePlate}]</span>
                            <span className="font-medium text-slate-700">{v.make} {v.model} ({v.year})</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Compatível
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table of Compatible Vehicle Models */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-500" /> Modelos & Motorizações Atendidas por Esta Peça:
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Marca</th>
                          <th className="py-2.5 px-3">Modelos Atendidos</th>
                          <th className="py-2.5 px-3">Anos</th>
                          <th className="py-2.5 px-3">Motorizações & Códigos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(partCompResult.veiculosCompativeis || []).map((vc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                              {vc?.marca || 'Geral'}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {vc?.modelos || 'Todos os modelos'}
                              {vc?.observacoes && (
                                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                                  Obs: {vc.observacoes}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                              {vc?.anos || 'Vários'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">
                              <div className="font-medium">{vc?.motorizacao || 'Todas'}</div>
                              {vc?.codigosMotor && (
                                <div className="text-[10px] font-mono font-bold text-amber-700 mt-0.5">
                                  Cód. Motor: {vc.codigosMotor}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cross-References Grid */}
                {partCompResult.referenciasCruzadas && partCompResult.referenciasCruzadas.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-500" /> Referências Cruzadas Equivalentes (OEM & Aftermarket):
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {partCompResult.referenciasCruzadas.map((ref, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{ref.fabricante}</span>
                          <span className="font-mono font-extrabold text-slate-900 text-xs block mt-0.5">{ref.codigo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Instructions & Warnings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {partCompResult.instrucoesMontagem && partCompResult.instrucoesMontagem.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dicas & Recomendações de Montagem:
                      </h3>
                      <ul className="space-y-1.5 text-slate-700">
                        {partCompResult.instrucoesMontagem.map((inst, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {partCompResult.alertaTecnico && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1 text-slate-800">
                      <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Nota & Alerta Técnico:
                      </h3>
                      <p className="font-medium text-slate-700">{partCompResult.alertaTecnico}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                <Boxes className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="font-bold text-slate-700 text-base">Aguardando seleção ou código da peça.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Escolha uma peça do stock da oficina ou digite um código/referência OEM para ver a lista completa de veículos e motores onde esta peça pode ser aplicada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: DTC Fault Diagnosis */}
      {activeSubTab === 'dtc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Form (1 Col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-500" /> Parâmetros do Diagnóstico
            </h2>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Selecione o Veículo da Frota (Opcional):
              </label>
              <select
                value={selectedVehicleInfo}
                onChange={(e) => setSelectedVehicleInfo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">-- Escolher ou digitar manualmente --</option>
                {(vehicles || []).map((v) => (
                  <option key={v.id} value={`[${v.licensePlate || 'S/ MATRÍCULA'}] ${v.make || ''} ${v.model || ''} (${v.year || ''})`}>
                    [{v.licensePlate || 'S/ MATRÍCULA'}] - {v.make || ''} {v.model || ''} ({v.year || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Código DTC / OBD-II (se disponível):
              </label>
              <input
                type="text"
                placeholder="ex: P0300, P0420, P0299, P0171"
                value={dtcCode}
                onChange={(e) => setDtcCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-extrabold text-sm uppercase text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Descrição dos Sintomas & Comportamento:
              </label>
              <textarea
                rows={4}
                placeholder="ex: Barulho metálico nas curvas, fumo azulado no arranque a frio, luz de avaria a piscar acima das 2500 RPM..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>

            {diagnoseError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{diagnoseError}</span>
              </div>
            )}

            <button
              onClick={handleRunDiagnosis}
              disabled={isLoadingDiagnose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingDiagnose ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>A analisar dados técnicos com Gemini IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Gerar Diagnóstico Técnico</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display (2 Cols) */}
          <div className="lg:col-span-2">
            {diagnoseResult ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Diagnóstico Gerado por Gemini 3.7 Flash:
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {diagnoseResult.diagnosticoResumo}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 self-start sm:self-auto ${getSeverityBadge(
                      diagnoseResult.nivelGravidade
                    )}`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Gravidade: {diagnoseResult.nivelGravidade}
                  </span>
                </div>

                {/* Causes & Testing steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Causas Prováveis:
                    </h3>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      {(diagnoseResult.causasProvaveis || []).map((causa, idx) => (
                        <li key={idx} className="font-medium">{causa}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Passos de Diagnóstico / Testes:
                    </h3>
                    <ol className="space-y-1.5 list-decimal list-inside text-slate-700">
                      {(diagnoseResult.passosDiagnostico || []).map((passo, idx) => (
                        <li key={idx} className="font-medium">{passo}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Recommended Parts Table */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Peças Recomendadas para Substituição:
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Nome da Peça</th>
                          <th className="py-2.5 px-3">Ref. OEM Provável</th>
                          <th className="py-2.5 px-3 text-right">Preço Est. (€)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(diagnoseResult.pecasRecomendadas || []).map((peca, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{peca?.nome || 'Peça'}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">
                              {peca?.referenciaProvavel || 'OEM Vários'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(Number(peca?.estimativaPrecoEur || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Labor & Customer Note Box */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Estimativa de Mão-de-Obra Técnica:</span>
                    <span className="text-amber-700 font-mono text-sm">
                      {diagnoseResult.tempoMaoDeObraHoras || 1} Horas ({formatCurrency(Number(diagnoseResult.tempoMaoDeObraHoras || 1) * 42.5)})
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium pt-2 border-t border-amber-200/80">
                    <strong>Mensagem para Transmitir ao Cliente:</strong> "{diagnoseResult.recomendacoesCliente || 'Diagnóstico concluído.'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="font-bold text-slate-700 text-base">Aguardando solicitação de diagnóstico.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Preencha o código DTC de avaria ou descreva os sintomas do veículo ao lado para receber um diagnóstico completo em Português.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Preventive Maintenance Plan */}
      {activeSubTab === 'preventive' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="max-w-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-500" /> Seleção de Veículo para Plano Preventivo
            </h2>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Escolher Veículo da Frota:</label>
              <select
                value={selectedVehForPlan}
                onChange={(e) => setSelectedVehForPlan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
              >
                {(vehicles || []).map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.licensePlate || 'S/ MATRÍCULA'}] - {v.make || ''} {v.model || ''} ({v.year || ''}) - {Number(v.odometer || 0).toLocaleString('pt-PT')} Km
                  </option>
                ))}
              </select>
            </div>

            {planError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <button
              onClick={handleRunPreventivePlan}
              disabled={isLoadingPlan}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-2"
            >
              {isLoadingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A calcular plano preventivo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Plano de Manutenção Preventiva</span>
                </>
              )}
            </button>
          </div>

          {planResult && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Resumo do Plano:</span>
                <p className="font-bold text-sm mt-0.5">{planResult.planoResumo}</p>
                <p className="text-xs text-amber-300 font-mono mt-1">
                  Próxima Inspeção Recomendada aos: <strong>{Number(planResult.proximaInspecaoKm || 0).toLocaleString('pt-PT')} Km</strong>
                </p>
              </div>

              {/* Mandatory items */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Intervenções Obrigatórias Recomendadas:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(planResult.itensObrigatorios || []).map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                      <p className="font-bold text-slate-900">{item?.item || 'Item'}</p>
                      <p className="text-slate-600">{item?.motivo || ''}</p>
                      <p className="font-bold text-amber-800 pt-1 border-t border-amber-200">
                        Custo Estimado Peças: {formatCurrency(Number(item?.custoEstimadoPecas || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing Belt Alert Box */}
              {planResult.alertaCorreiaDistribuição && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-medium flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-sm text-red-950 mb-0.5">
                      Alerta de Correia de Distribuição / Corrente:
                    </strong>
                    <p>{planResult.alertaCorreiaDistribuição}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Document OCR Scanner */}
      {activeSubTab === 'ocr' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Leitor OCR de Faturas e Notas de Peças
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Carregue uma imagem de fatura ou cole o texto para extrair automaticamente linhas de peças e preços.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Carregar Imagem do Documento (PNG/JPG):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-amber-400 hover:file:bg-slate-800"
              />
            </div>

            {docImageBase64 && (
              <div className="p-2 border border-slate-200 rounded-lg max-w-xs">
                <img src={docImageBase64} alt="Document preview" className="rounded max-h-40 object-contain mx-auto" />
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Ou cole o texto do orçamento/nota de peças:
              </label>
              <textarea
                rows={3}
                placeholder="Cole o texto com peças e preços..."
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>

            {ocrError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{ocrError}</span>
              </div>
            )}

            <button
              onClick={handleRunOCR}
              disabled={isLoadingOCR}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-2"
            >
              {isLoadingOCR ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A ler e extrair dados com Gemini IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extrair Peças e Preços</span>
                </>
              )}
            </button>
          </div>

          {ocrResult && (
            <div className="pt-6 border-t border-slate-200 space-y-4 bg-slate-50 p-4 rounded-xl">
              <h3 className="font-bold text-slate-900 text-sm">Dados Extraídos pelo Gemini OCR:</h3>
              <pre className="text-xs font-mono bg-white p-3 border border-slate-200 rounded-lg overflow-x-auto text-slate-800">
                {JSON.stringify(ocrResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
