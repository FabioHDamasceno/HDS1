import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import {
  WorkshopConfig,
  Client,
  Vehicle,
  MaintenanceRecord,
  WorkOrder,
  Invoice,
  InventoryPart,
  Supplier,
  Expense,
  Appointment,
  UserAccount,
} from '../types';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  tableCount?: number;
}

export interface FetchAllDataResult {
  workshopConfig?: WorkshopConfig;
  clients?: Client[];
  vehicles?: Vehicle[];
  maintenanceRecords?: MaintenanceRecord[];
  workOrders?: WorkOrder[];
  invoices?: Invoice[];
  inventory?: InventoryPart[];
  suppliers?: Supplier[];
  expenses?: Expense[];
  appointments?: Appointment[];
  userAccounts?: UserAccount[];
}

/**
 * Tests if the Supabase connection works by querying the clients table.
 */
export async function testSupabaseConnection(): Promise<TestConnectionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase não está configurado. Por favor introduza o URL e a Anon Key.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Não foi possível inicializar o cliente Supabase com os dados fornecidos.',
    };
  }

  try {
    const { error } = await supabase.from('clients').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message:
            'Ligação estabelecida! No entanto, as tabelas ainda não foram criadas no Supabase. Por favor execute o script SQL fornecido no SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Erro ao comunicar com Supabase: ${error.message} (${error.code || 'sem código'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão ao Supabase estabelecida com sucesso e tabelas ativas!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro na ligação: ${err?.message || 'Falha desconhecida'}`,
    };
  }
}

/**
 * Syncs all current local app state to Supabase in full.
 */
export async function uploadAllLocalDataToSupabase(data: {
  workshopConfig: WorkshopConfig;
  clients: Client[];
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  inventory: InventoryPart[];
  suppliers: Supplier[];
  expenses: Expense[];
  appointments: Appointment[];
  userAccounts: UserAccount[];
}): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado.' };
  }

  try {
    // 1. Config
    if (data.workshopConfig) {
      const { error } = await supabase.from('workshop_config').upsert({
        id: 'config_main',
        name: data.workshopConfig.name,
        nif: data.workshopConfig.nif,
        address: data.workshopConfig.address,
        postal_code: data.workshopConfig.postalCode,
        city: data.workshopConfig.city,
        phone: data.workshopConfig.phone,
        email: data.workshopConfig.email,
        iban: data.workshopConfig.iban,
        default_hourly_rate: data.workshopConfig.defaultHourlyRate,
        capital_social: data.workshopConfig.capitalSocial,
        conservatoria: data.workshopConfig.conservatoria,
        default_vat_rate: data.workshopConfig.defaultVatRate,
        invoice_notes: data.workshopConfig.invoiceNotes,
        website: data.workshopConfig.website,
        logo_text: data.workshopConfig.logoText,
      });
      if (error) console.error('Erro no upsert workshop_config:', error);
    }

    // 2. Clients
    if (data.clients.length > 0) {
      const rows = data.clients.map((c) => ({
        id: c.id,
        name: c.name,
        nif: c.nif,
        client_type: c.clientType,
        email: c.email,
        phone: c.phone,
        address: c.address,
        postal_code: c.postalCode,
        city: c.city,
        notes: c.notes,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('clients').upsert(rows);
      if (error) console.error('Erro no upsert clients:', error);
    }

    // 3. Vehicles
    if (data.vehicles.length > 0) {
      const rows = data.vehicles.map((v) => ({
        id: v.id,
        client_id: v.clientId,
        license_plate: v.licensePlate,
        make: v.make,
        model: v.model,
        year: v.year,
        fuel_type: v.fuelType,
        vin: v.vin,
        odometer: v.odometer,
        ipo_date: v.ipoDate,
        iuc_month: v.iucMonth,
        color: v.color,
        engine_displacement: v.engineDisplacement,
        power_hp: v.powerHp,
      }));
      const { error } = await supabase.from('vehicles').upsert(rows);
      if (error) console.error('Erro no upsert vehicles:', error);
    }

    // 4. Maintenance
    if (data.maintenanceRecords.length > 0) {
      const rows = data.maintenanceRecords.map((m) => ({
        id: m.id,
        vehicle_id: m.vehicleId,
        date: m.date,
        odometer: m.odometer,
        title: m.title,
        category: m.category,
        description: m.description,
        mechanic_name: m.mechanicName,
        cost_total: m.costTotal,
        work_order_id: m.workOrderId,
        parts_used: m.partsUsed || [],
      }));
      const { error } = await supabase.from('maintenance_records').upsert(rows);
      if (error) console.error('Erro no upsert maintenance_records:', error);
    }

    // 5. Work Orders
    if (data.workOrders.length > 0) {
      const rows = data.workOrders.map((wo) => ({
        id: wo.id,
        number: wo.number,
        client_id: wo.clientId,
        vehicle_id: wo.vehicleId,
        status: wo.status,
        entry_date: wo.entryDate,
        estimated_delivery_date: wo.estimatedDeliveryDate,
        technician_name: wo.technicianName,
        bay: wo.bay,
        client_complaint: wo.clientComplaint,
        diagnosis_notes: wo.diagnosisNotes,
        checklist: wo.checklist || {},
        labor_items: wo.laborItems || [],
        parts_items: wo.partsItems || [],
        notes: wo.notes,
        created_at: wo.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('work_orders').upsert(rows);
      if (error) console.error('Erro no upsert work_orders:', error);
    }

    // 6. Invoices
    if (data.invoices.length > 0) {
      const rows = data.invoices.map((inv) => ({
        id: inv.id,
        doc_type: inv.docType,
        doc_number: inv.docNumber,
        work_order_id: inv.workOrderId,
        client_id: inv.clientId,
        vehicle_id: inv.vehicleId,
        issue_date: inv.issueDate,
        due_date: inv.dueDate,
        status: inv.status,
        items: inv.items || [],
        subtotal: inv.subtotal,
        vat_summary: inv.vatSummary || [],
        total_vat: inv.totalVat,
        grand_total: inv.grandTotal,
        payment_method: inv.paymentMethod,
        iban: inv.iban,
        hash_preview: inv.hashPreview,
        qr_code_url: inv.qrCodeUrl,
      }));
      const { error } = await supabase.from('invoices').upsert(rows);
      if (error) console.error('Erro no upsert invoices:', error);
    }

    // 7. Inventory
    if (data.inventory.length > 0) {
      const rows = data.inventory.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        category: i.category,
        brand: i.brand,
        cost_price: i.costPrice,
        selling_price: i.sellingPrice,
        vat_rate: i.vatRate,
        stock_qty: i.stockQty,
        min_stock_alert: i.minStockAlert,
        location_in_workshop: i.locationInWorkshop,
      }));
      const { error } = await supabase.from('inventory').upsert(rows);
      if (error) console.error('Erro no upsert inventory:', error);
    }

    // 8. Suppliers
    if (data.suppliers.length > 0) {
      const rows = data.suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        nif: s.nif,
        email: s.email,
        phone: s.phone,
        website: s.website,
        address: s.address,
        postal_code: s.postalCode,
        city: s.city,
        contact_person: s.contactPerson,
        payment_terms: s.paymentTerms,
        categories: s.categories || [],
        notes: s.notes,
        rating: s.rating,
        created_at: s.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('suppliers').upsert(rows);
      if (error) console.error('Erro no upsert suppliers:', error);
    }

    // 9. Expenses
    if (data.expenses.length > 0) {
      const rows = data.expenses.map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: e.amount,
        vat_rate: e.vatRate,
        vat_amount: e.vatAmount,
        due_date: e.dueDate,
        payment_date: e.paymentDate,
        status: e.status,
        supplier_id: e.supplierId,
        supplier_name: e.supplierName,
        document_ref: e.documentRef,
        payment_method: e.paymentMethod,
        notes: e.notes,
        created_at: e.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('expenses').upsert(rows);
      if (error) console.error('Erro no upsert expenses:', error);
    }

    // 10. Appointments
    if (data.appointments.length > 0) {
      const rows = data.appointments.map((a) => ({
        id: a.id,
        date: a.date,
        start_time: a.startTime,
        end_time: a.endTime,
        service_type: a.serviceType,
        description: a.description,
        client_name: a.clientName,
        client_phone: a.clientPhone,
        client_id: a.clientId,
        vehicle_plate: a.vehiclePlate,
        vehicle_model: a.vehicleModel,
        vehicle_id: a.vehicleId,
        assigned_technician: a.assignedTechnician,
        bay: a.bay,
        status: a.status,
        estimated_cost: a.estimatedCost,
        notes: a.notes,
        work_order_id: a.workOrderId,
        created_at: a.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('appointments').upsert(rows);
      if (error) console.error('Erro no upsert appointments:', error);
    }

    // 11. User Accounts
    if (data.userAccounts.length > 0) {
      const rows = data.userAccounts.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password_pin: u.passwordPin,
        role: u.role,
        active: u.active,
        specialty: u.specialty,
        phone: u.phone,
        created_at: u.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('user_accounts').upsert(rows);
      if (error) console.error('Erro no upsert user_accounts:', error);
    }

    return {
      success: true,
      message: 'Todos os dados foram guardados com sucesso no Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao sincronizar com Supabase: ${err?.message || 'Falha durante o upsert'}`,
    };
  }
}

/**
 * Fetches all remote data tables from Supabase into memory.
 */
export async function fetchAllDataFromSupabase(): Promise<FetchAllDataResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const result: FetchAllDataResult = {};

    // 1. Config
    const { data: configData } = await supabase.from('workshop_config').select('*').limit(1);
    if (configData && configData.length > 0) {
      const row = configData[0];
      result.workshopConfig = {
        name: row.name || '',
        nif: row.nif || '',
        address: row.address || '',
        postalCode: row.postal_code || '',
        city: row.city || '',
        phone: row.phone || '',
        email: row.email || '',
        iban: row.iban || '',
        defaultHourlyRate: Number(row.default_hourly_rate) || 42.5,
        capitalSocial: row.capital_social || '',
        conservatoria: row.conservatoria || '',
        defaultVatRate: Number(row.default_vat_rate) || 23,
        invoiceNotes: row.invoice_notes || '',
        website: row.website || '',
        logoText: row.logo_text || '',
      };
    }

    // 2. Clients
    const { data: clientRows } = await supabase.from('clients').select('*');
    if (clientRows) {
      result.clients = clientRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        nif: row.nif,
        clientType: row.client_type || 'Particular',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        postalCode: row.postal_code || '',
        city: row.city || '',
        notes: row.notes || '',
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    // 3. Vehicles
    const { data: vehicleRows } = await supabase.from('vehicles').select('*');
    if (vehicleRows) {
      result.vehicles = vehicleRows.map((row: any) => ({
        id: row.id,
        clientId: row.client_id,
        licensePlate: row.license_plate,
        make: row.make,
        model: row.model,
        year: row.year || 2020,
        fuelType: row.fuel_type || 'Gasóleo',
        vin: row.vin || '',
        odometer: Number(row.odometer) || 0,
        ipoDate: row.ipo_date || '',
        iucMonth: row.iuc_month || '',
        color: row.color || '',
        engineDisplacement: row.engine_displacement || '',
        powerHp: Number(row.power_hp) || 0,
      }));
    }

    // 4. Maintenance
    const { data: maintRows } = await supabase.from('maintenance_records').select('*');
    if (maintRows) {
      result.maintenanceRecords = maintRows.map((row: any) => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        date: row.date,
        odometer: Number(row.odometer) || 0,
        title: row.title,
        category: row.category,
        description: row.description || '',
        mechanicName: row.mechanic_name || '',
        costTotal: Number(row.cost_total) || 0,
        workOrderId: row.work_order_id,
        partsUsed: Array.isArray(row.parts_used)
          ? row.parts_used
          : typeof row.parts_used === 'string'
          ? JSON.parse(row.parts_used)
          : [],
      }));
    }

    // 5. Work Orders
    const { data: woRows } = await supabase.from('work_orders').select('*');
    if (woRows) {
      result.workOrders = woRows.map((row: any) => ({
        id: row.id,
        number: row.number,
        clientId: row.client_id,
        vehicleId: row.vehicle_id,
        status: row.status || 'Receção',
        entryDate: row.entry_date,
        estimatedDeliveryDate: row.estimated_delivery_date || '',
        technicianName: row.technician_name || '',
        bay: row.bay || '',
        clientComplaint: row.client_complaint || '',
        diagnosisNotes: row.diagnosis_notes || '',
        checklist: row.checklist || {},
        laborItems: Array.isArray(row.labor_items)
          ? row.labor_items
          : typeof row.labor_items === 'string'
          ? JSON.parse(row.labor_items)
          : [],
        partsItems: Array.isArray(row.parts_items)
          ? row.parts_items
          : typeof row.parts_items === 'string'
          ? JSON.parse(row.parts_items)
          : [],
        notes: row.notes || '',
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    // 6. Invoices
    const { data: invRows } = await supabase.from('invoices').select('*');
    if (invRows) {
      result.invoices = invRows.map((row: any) => ({
        id: row.id,
        docType: row.doc_type,
        docNumber: row.doc_number,
        workOrderId: row.work_order_id,
        clientId: row.client_id,
        vehicleId: row.vehicle_id,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        status: row.status || 'Pendente',
        items: Array.isArray(row.items)
          ? row.items
          : typeof row.items === 'string'
          ? JSON.parse(row.items)
          : [],
        subtotal: Number(row.subtotal) || 0,
        vatSummary: Array.isArray(row.vat_summary)
          ? row.vat_summary
          : typeof row.vat_summary === 'string'
          ? JSON.parse(row.vat_summary)
          : [],
        totalVat: Number(row.total_vat) || 0,
        grandTotal: Number(row.grand_total) || 0,
        paymentMethod: row.payment_method || '',
        iban: row.iban || '',
        hashPreview: row.hash_preview || '',
        qrCodeUrl: row.qr_code_url || '',
      }));
    }

    // 7. Inventory
    const { data: invenRows } = await supabase.from('inventory').select('*');
    if (invenRows) {
      result.inventory = invenRows.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category || '',
        brand: row.brand || '',
        costPrice: Number(row.cost_price) || 0,
        sellingPrice: Number(row.selling_price) || 0,
        vatRate: Number(row.vat_rate) || 23,
        stockQty: Number(row.stock_qty) || 0,
        minStockAlert: Number(row.min_stock_alert) || 2,
        locationInWorkshop: row.location_in_workshop || '',
      }));
    }

    // 8. Suppliers
    const { data: suppRows } = await supabase.from('suppliers').select('*');
    if (suppRows) {
      result.suppliers = suppRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        nif: row.nif,
        email: row.email || '',
        phone: row.phone || '',
        website: row.website || '',
        address: row.address || '',
        postalCode: row.postal_code || '',
        city: row.city || '',
        contactPerson: row.contact_person || '',
        paymentTerms: row.payment_terms || 'Pronto Pagamento',
        categories: Array.isArray(row.categories)
          ? row.categories
          : typeof row.categories === 'string'
          ? JSON.parse(row.categories)
          : [],
        notes: row.notes || '',
        rating: Number(row.rating) || 5,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    // 9. Expenses
    const { data: expRows } = await supabase.from('expenses').select('*');
    if (expRows) {
      result.expenses = expRows.map((row: any) => ({
        id: row.id,
        category: row.category,
        description: row.description,
        amount: Number(row.amount) || 0,
        vatRate: Number(row.vat_rate) || 23,
        vatAmount: Number(row.vat_amount) || 0,
        dueDate: row.due_date,
        paymentDate: row.payment_date || undefined,
        status: row.status || 'Pendente',
        supplierId: row.supplier_id || undefined,
        supplierName: row.supplier_name || undefined,
        documentRef: row.document_ref || undefined,
        paymentMethod: row.payment_method || 'Transferência Bancária',
        notes: row.notes || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    // 10. Appointments
    const { data: appRows } = await supabase.from('appointments').select('*');
    if (appRows) {
      result.appointments = appRows.map((row: any) => ({
        id: row.id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        serviceType: row.service_type,
        description: row.description || '',
        clientName: row.client_name,
        clientPhone: row.client_phone,
        clientId: row.client_id || undefined,
        vehiclePlate: row.vehicle_plate,
        vehicleModel: row.vehicle_model,
        vehicleId: row.vehicle_id || undefined,
        assignedTechnician: row.assigned_technician || '',
        bay: row.bay || '',
        status: row.status || 'Agendado',
        estimatedCost: Number(row.estimated_cost) || 0,
        notes: row.notes || '',
        workOrderId: row.work_order_id || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    // 11. Users
    const { data: usrRows } = await supabase.from('user_accounts').select('*');
    if (usrRows) {
      result.userAccounts = usrRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        passwordPin: row.password_pin,
        role: row.role as any,
        active: row.active ?? true,
        specialty: row.specialty || '',
        phone: row.phone || '',
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      }));
    }

    return result;
  } catch (err) {
    console.error('Erro ao procurar todos os dados no Supabase:', err);
    return null;
  }
}

/**
 * Granular sync helper functions for individual entities
 */

export async function syncWorkshopConfigToSupabase(config: WorkshopConfig) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workshop_config').upsert({
      id: 'config_main',
      name: config.name,
      nif: config.nif,
      address: config.address,
      postal_code: config.postalCode,
      city: config.city,
      phone: config.phone,
      email: config.email,
      iban: config.iban,
      default_hourly_rate: config.defaultHourlyRate,
      capital_social: config.capitalSocial,
      conservatoria: config.conservatoria,
      default_vat_rate: config.defaultVatRate,
      invoice_notes: config.invoiceNotes,
      website: config.website,
      logo_text: config.logoText,
    });
  } catch (e) {
    console.error('Erro ao guardar workshop_config:', e);
  }
}

export async function syncClientToSupabase(c: Client) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('clients').upsert({
      id: c.id,
      name: c.name,
      nif: c.nif,
      client_type: c.clientType,
      email: c.email,
      phone: c.phone,
      address: c.address,
      postal_code: c.postalCode,
      city: c.city,
      notes: c.notes,
      created_at: c.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erro ao guardar cliente:', e);
  }
}

export async function deleteClientFromSupabase(clientId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('clients').delete().eq('id', clientId);
  } catch (e) {
    console.error('Erro ao apagar cliente:', e);
  }
}

export async function syncVehicleToSupabase(v: Vehicle) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('vehicles').upsert({
      id: v.id,
      client_id: v.clientId,
      license_plate: v.licensePlate,
      make: v.make,
      model: v.model,
      year: v.year,
      fuel_type: v.fuelType,
      vin: v.vin,
      odometer: v.odometer,
      ipo_date: v.ipoDate,
      iuc_month: v.iucMonth,
      color: v.color,
      engine_displacement: v.engineDisplacement,
      power_hp: v.powerHp,
    });
  } catch (e) {
    console.error('Erro ao guardar veículo:', e);
  }
}

export async function deleteVehicleFromSupabase(vehicleId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('vehicles').delete().eq('id', vehicleId);
  } catch (e) {
    console.error('Erro ao apagar veículo:', e);
  }
}

export async function syncMaintenanceRecordToSupabase(m: MaintenanceRecord) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('maintenance_records').upsert({
      id: m.id,
      vehicle_id: m.vehicleId,
      date: m.date,
      odometer: m.odometer,
      title: m.title,
      category: m.category,
      description: m.description,
      mechanic_name: m.mechanicName,
      cost_total: m.costTotal,
      work_order_id: m.workOrderId,
      parts_used: m.partsUsed || [],
    });
  } catch (e) {
    console.error('Erro ao guardar registo de manutenção:', e);
  }
}

export async function syncWorkOrderToSupabase(wo: WorkOrder) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('work_orders').upsert({
      id: wo.id,
      number: wo.number,
      client_id: wo.clientId,
      vehicle_id: wo.vehicleId,
      status: wo.status,
      entry_date: wo.entryDate,
      estimated_delivery_date: wo.estimatedDeliveryDate,
      technician_name: wo.technicianName,
      bay: wo.bay,
      client_complaint: wo.clientComplaint,
      diagnosis_notes: wo.diagnosisNotes,
      checklist: wo.checklist || {},
      labor_items: wo.laborItems || [],
      parts_items: wo.partsItems || [],
      notes: wo.notes,
      created_at: wo.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erro ao guardar folha de obra:', e);
  }
}

export async function deleteWorkOrderFromSupabase(woId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('work_orders').delete().eq('id', woId);
  } catch (e) {
    console.error('Erro ao apagar folha de obra:', e);
  }
}

export async function syncInvoiceToSupabase(inv: Invoice) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('invoices').upsert({
      id: inv.id,
      doc_type: inv.docType,
      doc_number: inv.docNumber,
      work_order_id: inv.workOrderId,
      client_id: inv.clientId,
      vehicle_id: inv.vehicleId,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      status: inv.status,
      items: inv.items || [],
      subtotal: inv.subtotal,
      vat_summary: inv.vatSummary || [],
      total_vat: inv.totalVat,
      grand_total: inv.grandTotal,
      payment_method: inv.paymentMethod,
      iban: inv.iban,
      hash_preview: inv.hashPreview,
      qr_code_url: inv.qrCodeUrl,
    });
  } catch (e) {
    console.error('Erro ao guardar fatura:', e);
  }
}

export async function deleteInvoiceFromSupabase(invId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('invoices').delete().eq('id', invId);
  } catch (e) {
    console.error('Erro ao apagar fatura:', e);
  }
}

export async function syncInventoryPartToSupabase(i: InventoryPart) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('inventory').upsert({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category,
      brand: i.brand,
      cost_price: i.costPrice,
      selling_price: i.sellingPrice,
      vat_rate: i.vatRate,
      stock_qty: i.stockQty,
      min_stock_alert: i.minStockAlert,
      location_in_workshop: i.locationInWorkshop,
    });
  } catch (e) {
    console.error('Erro ao guardar peça no inventário:', e);
  }
}

export async function deleteInventoryPartFromSupabase(partId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('inventory').delete().eq('id', partId);
  } catch (e) {
    console.error('Erro ao apagar peça:', e);
  }
}

export async function syncSupplierToSupabase(s: Supplier) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('suppliers').upsert({
      id: s.id,
      name: s.name,
      nif: s.nif,
      email: s.email,
      phone: s.phone,
      website: s.website,
      address: s.address,
      postal_code: s.postalCode,
      city: s.city,
      contact_person: s.contactPerson,
      payment_terms: s.paymentTerms,
      categories: s.categories || [],
      notes: s.notes,
      rating: s.rating,
      created_at: s.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erro ao guardar fornecedor:', e);
  }
}

export async function deleteSupplierFromSupabase(supplierId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('suppliers').delete().eq('id', supplierId);
  } catch (e) {
    console.error('Erro ao apagar fornecedor:', e);
  }
}

export async function syncExpenseToSupabase(e: Expense) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('expenses').upsert({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      vat_rate: e.vatRate,
      vat_amount: e.vatAmount,
      due_date: e.dueDate,
      payment_date: e.paymentDate,
      status: e.status,
      supplier_id: e.supplierId,
      supplier_name: e.supplierName,
      document_ref: e.documentRef,
      payment_method: e.paymentMethod,
      notes: e.notes,
      created_at: e.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro ao guardar despesa:', err);
  }
}

export async function deleteExpenseFromSupabase(expenseId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('expenses').delete().eq('id', expenseId);
  } catch (e) {
    console.error('Erro ao apagar despesa:', e);
  }
}

export async function syncAppointmentToSupabase(a: Appointment) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('appointments').upsert({
      id: a.id,
      date: a.date,
      start_time: a.startTime,
      end_time: a.endTime,
      service_type: a.serviceType,
      description: a.description,
      client_name: a.clientName,
      client_phone: a.clientPhone,
      client_id: a.clientId,
      vehicle_plate: a.vehiclePlate,
      vehicle_model: a.vehicleModel,
      vehicle_id: a.vehicleId,
      assigned_technician: a.assignedTechnician,
      bay: a.bay,
      status: a.status,
      estimated_cost: a.estimatedCost,
      notes: a.notes,
      work_order_id: a.workOrderId,
      created_at: a.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erro ao guardar agendamento:', e);
  }
}

export async function deleteAppointmentFromSupabase(appointmentId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('appointments').delete().eq('id', appointmentId);
  } catch (e) {
    console.error('Erro ao apagar agendamento:', e);
  }
}

export async function clearAllSupabaseData(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado.' };
  }

  const tables = [
    'maintenance_records',
    'work_orders',
    'invoices',
    'appointments',
    'vehicles',
    'clients',
    'inventory',
    'suppliers',
    'expenses',
    'user_accounts',
  ];

  try {
    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '___non_existent_id___');
    }
    return {
      success: true,
      message: 'Todas as tabelas do Supabase foram completamente zeradas!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao zerar dados do Supabase: ${err?.message}`,
    };
  }
}

export async function syncUserAccountToSupabase(
  user: UserAccount
): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase não configurado.' };

  try {
    const { error } = await supabase.from('user_accounts').upsert({
      id: user.id,
      name: user.name,
      username: user.username,
      password_pin: user.passwordPin,
      role: user.role,
      active: user.active,
      specialty: user.specialty,
      phone: user.phone,
      created_at: user.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao guardar utilizador no Supabase:', error);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao guardar utilizador no Supabase:', err);
    return { success: false, message: err?.message };
  }
}

export async function syncAllUserAccountsToSupabase(
  users: UserAccount[]
): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase não configurado.' };

  if (users.length === 0) return { success: true };

  try {
    const rows = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      password_pin: u.passwordPin,
      role: u.role,
      active: u.active,
      specialty: u.specialty,
      phone: u.phone,
      created_at: u.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('user_accounts').upsert(rows);
    if (error) {
      console.error('Erro ao guardar utilizadores no Supabase:', error);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao guardar utilizadores no Supabase:', err);
    return { success: false, message: err?.message };
  }
}

export async function deleteUserAccountFromSupabase(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase não configurado.' };

  try {
    const { error } = await supabase.from('user_accounts').delete().eq('id', userId);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
}

export async function fetchUserAccountsFromSupabase(): Promise<UserAccount[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      passwordPin: row.password_pin,
      role: row.role as any,
      active: row.active ?? true,
      specialty: row.specialty || '',
      phone: row.phone || '',
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    }));
  } catch {
    return null;
  }
}
