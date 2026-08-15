import {
  Client,
  Vehicle,
  MaintenanceRecord,
  WorkOrder,
  Invoice,
  InventoryPart,
  Supplier,
  WorkshopConfig,
  Expense,
  Appointment,
  UserAccount,
} from '../types';

export const INITIAL_WORKSHOP_CONFIG: WorkshopConfig = {
  name: 'Oficina Auto',
  nif: '',
  address: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  iban: '',
  defaultHourlyRate: 40.0,
  capitalSocial: '',
  conservatoria: '',
  defaultVatRate: 23,
  invoiceNotes: 'Processado por programa certificado SAF-T PT. Bens sujeitos a reserva de propriedade até liquidação integral.',
  website: '',
  logoText: 'OFICINA',
};

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_INVENTORY: InventoryPart[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [];
