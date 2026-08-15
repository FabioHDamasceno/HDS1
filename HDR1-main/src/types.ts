export type UserRole = 'Administrador' | 'Mecânico';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  passwordPin: string;
  role: UserRole;
  active: boolean;
  specialty?: string;
  phone?: string;
  createdAt: string;
}

export type FuelType = 'Gasóleo' | 'Gasolina' | 'Híbrido' | 'Elétrico' | 'GPL';

export type ClientType = 'Particular' | 'Empresa';

export interface Client {
  id: string;
  name: string;
  nif: string; // 9 digits PT NIF
  clientType: ClientType;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  licensePlate: string; // e.g. "AA-01-AB" or "12-34-AB"
  make: string; // e.g. Volkswagen
  model: string; // e.g. Golf VII 1.6 TDI
  year: number;
  fuelType: FuelType;
  vin: string; // Nº Chassis
  odometer: number; // Km atuais
  ipoDate: string; // Data limite da Inspeção Periódica Obrigatória
  iucMonth: string; // Mês do Imposto Único de Circulação
  color: string;
  engineDisplacement?: string; // e.g. 1598 cc
  powerHp?: number; // e.g. 115 cv
}

export type MaintenanceCategory =
  | 'Revisão'
  | 'Travões'
  | 'Óleo/Filtros'
  | 'Distribuição'
  | 'Pneus'
  | 'Diagnóstico'
  | 'Elétrico'
  | 'Climatização'
  | 'Geral';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  title: string;
  category: MaintenanceCategory;
  description: string;
  mechanicName: string;
  costTotal: number;
  workOrderId?: string;
  partsUsed: { name: string; qty: number; price: number }[];
}

export type WorkOrderStatus =
  | 'Receção'
  | 'Em Diagnóstico'
  | 'Aguardar Peças'
  | 'Em Reparação'
  | 'Pronto para Entrega'
  | 'Faturado'
  | 'Cancelado';

export type LaborPricingType = 'Horas' | 'Valor Fechado';

export interface WorkOrderLaborItem {
  id: string;
  description: string;
  pricingType?: LaborPricingType;
  hours: number;
  hourlyRate: number;
  vatRate: number; // e.g. 23
}

export interface WorkOrderPartItem {
  id: string;
  partId?: string;
  isManual?: boolean;
  name: string;
  ref: string;
  qty: number;
  unitPrice: number;
  vatRate: number; // e.g. 23
}

export interface VehicleChecklist {
  oilOk: boolean;
  coolantOk: boolean;
  brakesOk: boolean;
  tiresOk: boolean;
  lightsOk: boolean;
  scratchesNotes: string;
  fuelLevel: 'E' | '1/4' | '1/2' | '3/4' | 'F';
}

export interface WorkOrder {
  id: string;
  number: string; // e.g. "OS 2026/001"
  clientId: string;
  vehicleId: string;
  status: WorkOrderStatus;
  entryDate: string;
  estimatedDeliveryDate: string;
  technicianName: string;
  bay: 'Elevador 1' | 'Elevador 2' | 'Banca Elétrica' | 'Zona Rápida';
  clientComplaint: string;
  diagnosisNotes: string;
  checklist: VehicleChecklist;
  laborItems: WorkOrderLaborItem[];
  partsItems: WorkOrderPartItem[];
  notes?: string;
  createdAt: string;
}

export type DocType = 'Fatura' | 'Fatura-Recibo' | 'Orçamento' | 'Guia de Transporte';

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
  type: 'Peça' | 'Mão-de-Obra';
  pricingType?: LaborPricingType;
  partId?: string;
  ref?: string;
  isManual?: boolean;
}

export interface Invoice {
  id: string;
  docType: DocType;
  docNumber: string; // e.g. "FT 2026/012"
  workOrderId?: string;
  clientId: string;
  vehicleId: string;
  issueDate: string;
  dueDate: string;
  status: 'Paga' | 'Pendente' | 'Anulada' | 'Rascunho';
  items: InvoiceItem[];
  subtotal: number;
  vatSummary: { rate: number; base: number; vatAmount: number }[];
  totalVat: number;
  grandTotal: number;
  paymentMethod?: 'Multibanco' | 'MB WAY' | 'Transferência Bancária' | 'Dinheiro';
  iban?: string;
  hashPreview?: string;
  qrCodeUrl?: string;
}

export interface InventoryPart {
  id: string;
  code: string; // Ref OEM ou EAN
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  vatRate: number;
  stockQty: number;
  minStockAlert: number;
  locationInWorkshop: string;
}

export interface Supplier {
  id: string;
  name: string;
  nif: string; // 9-digit PT NIF/NIPC
  email: string;
  phone: string;
  website?: string;
  address: string;
  postalCode: string;
  city: string;
  contactPerson?: string;
  paymentTerms: string; // e.g., "Pronto Pagamento", "15 Dias", "30 Dias", "60 Dias"
  categories: string[];
  notes?: string;
  rating?: number; // 1 to 5
  createdAt: string;
}

export type ExpenseCategory =
  | 'Aluguer & Renda'
  | 'Fornecedores & Peças'
  | 'Eletricidade & Energia'
  | 'Água & Saneamento'
  | 'Salários & Funcionários'
  | 'Impostos & Seg. Social'
  | 'Comunicações & Internet'
  | 'Ferramentas & Equipamento'
  | 'Combustível & Transporte'
  | 'Outras Despesas';

export type ExpenseStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number; // Gross total in EUR (incl. VAT)
  vatRate: number; // 0, 6, 13, 23
  vatAmount: number; // Calculated VAT portion
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: ExpenseStatus;
  supplierId?: string;
  supplierName?: string;
  documentRef?: string; // e.g. FT 2026/8901
  paymentMethod: 'Transferência Bancária' | 'Débito Direto' | 'MB WAY' | 'Cartão de Crédito' | 'Dinheiro' | 'Multibanco';
  notes?: string;
  createdAt: string;
}

export type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Em Oficina' | 'Concluído' | 'Cancelado';

export type ServiceType =
  | 'Revisão Periódica / Óleo'
  | 'Diagnóstico Eletrónico'
  | 'Sistema de Travões'
  | 'Kit Distribuição / Correia'
  | 'Preparação / Levado a IPO'
  | 'Substituição de Pneus'
  | 'Embraiagem & Caixa'
  | 'Ar Condicionado & Carregamento'
  | 'Alinhamento & Suspensão'
  | 'Serviço Rápido Geral';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string; // HH:mm e.g. "10:30"
  serviceType: ServiceType;
  description: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleId?: string;
  assignedTechnician?: string;
  bay?: string; // e.g. "Elevador 1", "Elevador 2", "Posto Eletrónica"
  status: AppointmentStatus;
  estimatedCost?: number;
  notes?: string;
  workOrderId?: string; // linked Work Order if converted
  createdAt: string;
}

export interface WorkshopConfig {
  name: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  iban: string;
  defaultHourlyRate: number; // e.g., 42.50 € / hr
  capitalSocial: string;
  conservatoria: string;
  defaultVatRate?: number; // e.g. 23
  invoiceNotes?: string;
  website?: string;
  logoText?: string;
}

export interface AIDiagnosisResult {
  diagnosticoResumo: string;
  nivelGravidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  causasProvaveis: string[];
  passosDiagnostico: string[];
  pecasRecomendadas: {
    nome: string;
    referenciaProvavel?: string;
    estimativaPrecoEur: number;
  }[];
  tempoMaoDeObraHoras: number;
  recomendacoesCliente: string;
}

export interface AIPreventivePlanResult {
  planoResumo: string;
  itensObrigatorios: {
    item: string;
    motivo: string;
    custoEstimadoPecas: number;
  }[];
  itensRecomendadosVerificacao: {
    item: string;
    urgencia: string;
  }[];
  alertaCorreiaDistribuição: string;
  proximaInspecaoKm: number;
}

export interface AIPartCompatibilityResult {
  nomePeca: string;
  codigoRef: string;
  marca?: string;
  categoria?: string;
  resumoCompatibilidade: string;
  veiculosCompativeis: {
    marca: string;
    modelos: string;
    anos: string;
    motorizacao: string;
    codigosMotor?: string;
    observacoes?: string;
  }[];
  referenciasCruzadas: {
    fabricante: string;
    codigo: string;
  }[];
  instrucoesMontagem: string[];
  alertaTecnico?: string;
}

