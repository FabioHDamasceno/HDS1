import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { DashboardView } from './components/DashboardView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { VehiclesHistoryView } from './components/VehiclesHistoryView';
import { ClientsView } from './components/ClientsView';
import { InvoicingView } from './components/InvoicingView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { ExpensesView } from './components/ExpensesView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { AIDiagnosticView } from './components/AIDiagnosticView';
import { LoginScreen } from './components/LoginScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

import {
  INITIAL_WORKSHOP_CONFIG,
  INITIAL_CLIENTS,
  INITIAL_VEHICLES,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_WORK_ORDERS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_APPOINTMENTS,
  INITIAL_USER_ACCOUNTS,
} from './data/initialData';

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
  InvoiceItem,
  UserAccount,
} from './types';
import { generateATDocumentHash } from './lib/ptFormatters';
import {
  clearAllSupabaseData,
  uploadAllLocalDataToSupabase,
  fetchAllDataFromSupabase,
  syncWorkshopConfigToSupabase,
  syncClientToSupabase,
  deleteClientFromSupabase,
  syncVehicleToSupabase,
  deleteVehicleFromSupabase,
  syncMaintenanceRecordToSupabase,
  syncWorkOrderToSupabase,
  deleteWorkOrderFromSupabase,
  syncInvoiceToSupabase,
  deleteInvoiceFromSupabase,
  syncInventoryPartToSupabase,
  deleteInventoryPartFromSupabase,
  syncSupplierToSupabase,
  deleteSupplierFromSupabase,
  syncExpenseToSupabase,
  deleteExpenseFromSupabase,
  syncAppointmentToSupabase,
  deleteAppointmentFromSupabase,
  syncAllUserAccountsToSupabase,
} from './lib/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // Persistence state
  const [workshopConfig, setWorkshopConfig] = useState<WorkshopConfig>(() => {
    const saved = localStorage.getItem('oficina_config');
    return saved ? JSON.parse(saved) : INITIAL_WORKSHOP_CONFIG;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('oficina_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('oficina_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('oficina_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('oficina_maintenance');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('oficina_workorders');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('oficina_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [inventory, setInventory] = useState<InventoryPart[]>(() => {
    const saved = localStorage.getItem('oficina_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('oficina_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('oficina_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('oficina_users');
    return saved ? JSON.parse(saved) : INITIAL_USER_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUserId = localStorage.getItem('oficina_current_user_id');
    if (savedUserId === 'logout') return null;
    if (savedUserId) {
      const found = userAccounts.find((u) => u.id === savedUserId && u.active);
      if (found) return found;
    }
    return userAccounts.find((u) => u.active) || userAccounts[0] || INITIAL_USER_ACCOUNTS[0];
  });

  // Navigation and active selection state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [quickSearchPlate, setQuickSearchPlate] = useState<string>('');
  const [selectedWorkOrderInit, setSelectedWorkOrderInit] = useState<WorkOrder | null>(null);

  // AI Assistant triggers
  const [aiSymptomsInit, setAiSymptomsInit] = useState<string>('');
  const [aiVehicleInfoInit, setAiVehicleInfoInit] = useState<string>('');

  // LocalStorage Sync Effects
  useEffect(() => {
    localStorage.setItem('oficina_config', JSON.stringify(workshopConfig));
  }, [workshopConfig]);

  useEffect(() => {
    localStorage.setItem('oficina_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('oficina_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('oficina_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('oficina_maintenance', JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  useEffect(() => {
    localStorage.setItem('oficina_workorders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('oficina_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('oficina_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('oficina_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('oficina_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Load all remote data from Supabase on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchAllDataFromSupabase().then((data) => {
        if (!data) return;
        if (data.workshopConfig) {
          setWorkshopConfig(data.workshopConfig);
          localStorage.setItem('oficina_config', JSON.stringify(data.workshopConfig));
        }
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
          localStorage.setItem('oficina_clients', JSON.stringify(data.clients));
        }
        if (data.vehicles && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          localStorage.setItem('oficina_vehicles', JSON.stringify(data.vehicles));
        }
        if (data.maintenanceRecords && data.maintenanceRecords.length > 0) {
          setMaintenanceRecords(data.maintenanceRecords);
          localStorage.setItem('oficina_maintenance', JSON.stringify(data.maintenanceRecords));
        }
        if (data.workOrders && data.workOrders.length > 0) {
          setWorkOrders(data.workOrders);
          localStorage.setItem('oficina_workorders', JSON.stringify(data.workOrders));
        }
        if (data.invoices && data.invoices.length > 0) {
          setInvoices(data.invoices);
          localStorage.setItem('oficina_invoices', JSON.stringify(data.invoices));
        }
        if (data.inventory && data.inventory.length > 0) {
          setInventory(data.inventory);
          localStorage.setItem('oficina_inventory', JSON.stringify(data.inventory));
        }
        if (data.suppliers && data.suppliers.length > 0) {
          setSuppliers(data.suppliers);
          localStorage.setItem('oficina_suppliers', JSON.stringify(data.suppliers));
        }
        if (data.expenses && data.expenses.length > 0) {
          setExpenses(data.expenses);
          localStorage.setItem('oficina_expenses', JSON.stringify(data.expenses));
        }
        if (data.appointments && data.appointments.length > 0) {
          setAppointments(data.appointments);
          localStorage.setItem('oficina_appointments', JSON.stringify(data.appointments));
        }
        if (data.userAccounts && data.userAccounts.length > 0) {
          setUserAccounts(data.userAccounts);
          localStorage.setItem('oficina_users', JSON.stringify(data.userAccounts));
        }
      }).catch((err) => {
        console.error('Erro ao carregar dados do Supabase no arranque:', err);
      });
    }
  }, []);

  // Handlers
  const handleResetSystemToZero = async (clearSupabaseRemote?: boolean) => {
    setClients([]);
    setVehicles([]);
    setMaintenanceRecords([]);
    setWorkOrders([]);
    setInvoices([]);
    setInventory([]);
    setSuppliers([]);
    setExpenses([]);
    setAppointments([]);

    localStorage.removeItem('oficina_clients');
    localStorage.removeItem('oficina_vehicles');
    localStorage.removeItem('oficina_maintenance');
    localStorage.removeItem('oficina_workorders');
    localStorage.removeItem('oficina_invoices');
    localStorage.removeItem('oficina_inventory');
    localStorage.removeItem('oficina_suppliers');
    localStorage.removeItem('oficina_expenses');
    localStorage.removeItem('oficina_appointments');

    if (clearSupabaseRemote && isSupabaseConfigured()) {
      await clearAllSupabaseData();
    }
  };

  const handleRestoreDemoData = () => {
    setClients(INITIAL_CLIENTS);
    setVehicles(INITIAL_VEHICLES);
    setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setInvoices(INITIAL_INVOICES);
    setInventory(INITIAL_INVENTORY);
    setSuppliers(INITIAL_SUPPLIERS);
    setExpenses(INITIAL_EXPENSES);
    setAppointments(INITIAL_APPOINTMENTS);

    localStorage.setItem('oficina_clients', JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('oficina_vehicles', JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem('oficina_maintenance', JSON.stringify(INITIAL_MAINTENANCE_RECORDS));
    localStorage.setItem('oficina_workorders', JSON.stringify(INITIAL_WORK_ORDERS));
    localStorage.setItem('oficina_invoices', JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem('oficina_inventory', JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem('oficina_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem('oficina_expenses', JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem('oficina_appointments', JSON.stringify(INITIAL_APPOINTMENTS));

    if (isSupabaseConfigured()) {
      uploadAllLocalDataToSupabase({
        workshopConfig,
        clients: INITIAL_CLIENTS,
        vehicles: INITIAL_VEHICLES,
        maintenanceRecords: INITIAL_MAINTENANCE_RECORDS,
        workOrders: INITIAL_WORK_ORDERS,
        invoices: INITIAL_INVOICES,
        inventory: INITIAL_INVENTORY,
        suppliers: INITIAL_SUPPLIERS,
        expenses: INITIAL_EXPENSES,
        appointments: INITIAL_APPOINTMENTS,
        userAccounts,
      });
    }
  };

  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === appointment.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = appointment;
        return copy;
      }
      return [appointment, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncAppointmentToSupabase(appointment);
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    if (isSupabaseConfigured()) {
      deleteAppointmentFromSupabase(appointmentId);
    }
  };

  const handleCreateWorkOrderFromAppointment = (appointment: Appointment) => {
    // Find or fallback client and vehicle IDs
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === appointment.clientName.toLowerCase() || c.id === appointment.clientId
    );
    const matchedVehicle = vehicles.find(
      (v) => v.licensePlate.toLowerCase() === appointment.vehiclePlate.toLowerCase() || v.id === appointment.vehicleId
    );

    const newWorkOrder: WorkOrder = {
      id: `wo-${Date.now().toString().slice(-4)}`,
      number: `OS 2026/${(workOrders.length + 10).toString().padStart(3, '0')}`,
      clientId: matchedClient ? matchedClient.id : (clients[0]?.id || ''),
      vehicleId: matchedVehicle ? matchedVehicle.id : (vehicles[0]?.id || ''),
      status: 'Em Reparação',
      entryDate: appointment.date,
      estimatedDeliveryDate: appointment.date,
      technicianName: appointment.assignedTechnician || '',
      bay: 'Elevador 1',
      clientComplaint: `${appointment.serviceType}: ${appointment.description || 'Serviço preventivo agendado'}`,
      diagnosisNotes: `Viatura rececionada através da Agenda de Marcações em ${appointment.date}.`,
      checklist: {
        oilOk: true,
        coolantOk: true,
        brakesOk: true,
        tiresOk: true,
        lightsOk: true,
        scratchesNotes: 'Verificação inicial efetuada no ato de receção.',
        fuelLevel: '1/2',
      },
      laborItems: [
        {
          id: `lab-${Date.now()}`,
          description: `Serviço de ${appointment.serviceType}`,
          hours: 1.5,
          hourlyRate: workshopConfig.defaultHourlyRate || 42.5,
          vatRate: 23,
        },
      ],
      partsItems: [],
      notes: `Agendamento prévio #${appointment.id}. Contacto cliente: ${appointment.clientPhone}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Update appointment status to "Em Oficina" and save WO
    handleSaveAppointment({
      ...appointment,
      status: 'Em Oficina',
      workOrderId: newWorkOrder.id,
    });

    handleSaveWorkOrder(newWorkOrder);
    setSelectedWorkOrderInit(newWorkOrder);
    setActiveTab('workorders');
  };

  const handleSaveExpense = (expense: Expense) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = expense;
        return copy;
      }
      return [expense, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncExpenseToSupabase(expense);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    if (isSupabaseConfigured()) {
      deleteExpenseFromSupabase(expenseId);
    }
  };

  const handleSaveWorkshopConfig = (newConfig: WorkshopConfig) => {
    setWorkshopConfig(newConfig);
    if (isSupabaseConfigured()) {
      syncWorkshopConfigToSupabase(newConfig);
    }
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === supplier.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = supplier;
        return copy;
      }
      return [supplier, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncSupplierToSupabase(supplier);
    }
  };

  const handleQuickSearchPlate = (plate: string) => {
    setQuickSearchPlate(plate);
    setActiveTab('vehicles');
  };

  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncClientToSupabase(client);
    }
  };

  const handleSaveVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => {
      const idx = prev.findIndex((v) => v.id === vehicle.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = vehicle;
        return copy;
      }
      return [vehicle, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncVehicleToSupabase(vehicle);
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    if (isSupabaseConfigured()) {
      deleteVehicleFromSupabase(vehicleId);
    }
  };

  const handleSaveMaintenanceRecord = (rec: MaintenanceRecord) => {
    setMaintenanceRecords((prev) => [rec, ...prev]);

    // Also update vehicle odometer if recorded km is higher
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === rec.vehicleId && rec.odometer > v.odometer) {
          const updatedV = { ...v, odometer: rec.odometer };
          if (isSupabaseConfigured()) {
            syncVehicleToSupabase(updatedV);
          }
          return updatedV;
        }
        return v;
      })
    );

    if (isSupabaseConfigured()) {
      syncMaintenanceRecordToSupabase(rec);
    }
  };

  const handleSaveWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((prev) => {
      const idx = prev.findIndex((w) => w.id === wo.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = wo;
        return copy;
      }
      return [wo, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncWorkOrderToSupabase(wo);
    }
  };

  const handleSaveInvoice = (inv: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === inv.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = inv;
        return copy;
      }
      return [inv, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncInvoiceToSupabase(inv);
    }
  };

  const handleSaveInventoryPart = (part: InventoryPart) => {
    setInventory((prev) => {
      const idx = prev.findIndex((p) => p.id === part.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = part;
        return copy;
      }
      return [part, ...prev];
    });
    if (isSupabaseConfigured()) {
      syncInventoryPartToSupabase(part);
    }
  };

  // Convert Work Order into Invoice/Quote
  const handleConvertToInvoice = (wo: WorkOrder, docType: 'Fatura' | 'Fatura-Recibo' | 'Orçamento') => {
    const docPrefix = docType === 'Orçamento' ? 'ORC' : docType === 'Fatura-Recibo' ? 'FR' : 'FT';
    const docNum = `${docPrefix} 2026/${String(invoices.length + 1).padStart(3, '0')}`;

    const items: InvoiceItem[] = [
      ...wo.laborItems.map((l) => ({
        id: l.id,
        description: l.description,
        qty: l.pricingType === 'Valor Fechado' ? 1 : l.hours,
        unitPrice: l.hourlyRate,
        vatRate: l.vatRate || 23,
        type: 'Mão-de-Obra' as const,
        pricingType: l.pricingType || 'Horas',
      })),
      ...wo.partsItems.map((p) => ({
        id: p.id,
        description: p.name,
        qty: p.qty,
        unitPrice: p.unitPrice,
        vatRate: p.vatRate || 23,
        type: 'Peça' as const,
        partId: p.partId,
        ref: p.ref,
        isManual: p.isManual,
      })),
    ];

    const subtotal = items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const totalVat = subtotal * 0.23;
    const grandTotal = subtotal + totalVat;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      docType,
      docNumber: docNum,
      workOrderId: wo.id,
      clientId: wo.clientId,
      vehicleId: wo.vehicleId,
      issueDate,
      dueDate,
      status: docType === 'Orçamento' ? 'Pendente' : 'Paga',
      items,
      subtotal,
      vatSummary: [{ rate: 23, base: subtotal, vatAmount: totalVat }],
      totalVat,
      grandTotal,
      paymentMethod: 'MB WAY',
      iban: workshopConfig.iban,
      hashPreview: generateATDocumentHash(docNum, issueDate, grandTotal),
    };

    handleSaveInvoice(newInvoice);

    // Update WorkOrder status
    if (docType !== 'Orçamento') {
      handleSaveWorkOrder({ ...wo, status: 'Faturado' });
    }

    setActiveTab('invoices');
  };

  const handleOpenAIDiagnosticFromWO = (symptoms: string, vehicleInfo: string) => {
    setAiSymptomsInit(symptoms);
    setAiVehicleInfoInit(vehicleInfo);
    setActiveTab('ai-assistant');
  };

  const handleSaveUserAccounts = (users: UserAccount[]) => {
    setUserAccounts(users);
    localStorage.setItem('oficina_users', JSON.stringify(users));
    if (currentUser) {
      const stillExists = users.find((u) => u.id === currentUser.id);
      if (stillExists) {
        setCurrentUser(stillExists);
      } else if (users.length > 0) {
        setCurrentUser(users[0]);
      }
    }
    if (isSupabaseConfigured()) {
      syncAllUserAccountsToSupabase(users).catch((err) =>
        console.error('Erro ao guardar utilizadores no Supabase:', err)
      );
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('oficina_current_user_id', user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.setItem('oficina_current_user_id', 'logout');
  };

  const handleSwitchUser = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('oficina_current_user_id', user.id);
  };

  if (!currentUser) {
    return (
      <LoginScreen
        workshopConfig={workshopConfig}
        userAccounts={userAccounts}
        onLoginSuccess={handleLoginSuccess}
        onSaveUserAccounts={handleSaveUserAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedWorkOrderInit(null);
          setActiveTab(tab);
        }}
        onQuickSearchPlate={handleQuickSearchPlate}
        onNewWorkOrder={() => {
          setSelectedWorkOrderInit(null);
          setActiveTab('workorders');
        }}
        workshopName={workshopConfig.name}
        userAccounts={userAccounts}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            workOrders={workOrders}
            vehicles={vehicles}
            invoices={invoices}
            inventory={inventory}
            clients={clients}
            expenses={expenses}
            appointments={appointments}
            setActiveTab={setActiveTab}
            onNewWorkOrder={() => {
              setSelectedWorkOrderInit(null);
              setActiveTab('workorders');
            }}
            onSelectWorkOrder={(wo) => {
              setSelectedWorkOrderInit(wo);
              setActiveTab('workorders');
            }}
            onSelectVehicle={(v) => {
              setQuickSearchPlate(v.licensePlate);
              setActiveTab('vehicles');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            appointments={appointments}
            clients={clients}
            vehicles={vehicles}
            onSaveAppointment={handleSaveAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onCreateWorkOrderFromAppointment={handleCreateWorkOrderFromAppointment}
          />
        )}

        {activeTab === 'workorders' && (
          <WorkOrdersView
            workOrders={workOrders}
            vehicles={vehicles}
            clients={clients}
            inventory={inventory}
            workshopConfig={workshopConfig}
            onSaveWorkOrder={handleSaveWorkOrder}
            onConvertToInvoice={handleConvertToInvoice}
            onOpenAIDiagnostic={handleOpenAIDiagnosticFromWO}
            selectedWorkOrderInit={selectedWorkOrderInit}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesHistoryView
            vehicles={vehicles}
            clients={clients}
            maintenanceRecords={maintenanceRecords}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onSaveRecord={handleSaveMaintenanceRecord}
            onOpenAIPlan={(v) => {
              setActiveTab('ai-assistant');
            }}
            initialSelectedPlate={quickSearchPlate}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            vehicles={vehicles}
            invoices={invoices}
            onSaveClient={handleSaveClient}
            onSelectVehicle={(v) => {
              setQuickSearchPlate(v.licensePlate);
              setActiveTab('vehicles');
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicingView
            invoices={invoices}
            clients={clients}
            vehicles={vehicles}
            inventory={inventory}
            expenses={expenses}
            workshopConfig={workshopConfig}
            onSaveInvoice={handleSaveInvoice}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            suppliers={suppliers}
            invoices={invoices}
            clients={clients}
            workshopConfig={workshopConfig}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onSavePart={handleSaveInventoryPart}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            inventory={inventory}
            onSaveSupplier={handleSaveSupplier}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            workshopConfig={workshopConfig}
            onSaveConfig={handleSaveWorkshopConfig}
            userAccounts={userAccounts}
            onSaveUserAccounts={handleSaveUserAccounts}
            currentUser={currentUser}
            onResetSystemToZero={handleResetSystemToZero}
            onRestoreDemoData={handleRestoreDemoData}
            entityCounts={{
              clients: clients.length,
              vehicles: vehicles.length,
              workOrders: workOrders.length,
              invoices: invoices.length,
              inventory: inventory.length,
              expenses: expenses.length,
              appointments: appointments.length,
              suppliers: suppliers.length,
              maintenance: maintenanceRecords.length,
            }}
            currentDataPayload={{
              workshopConfig,
              clients,
              vehicles,
              maintenanceRecords,
              workOrders,
              invoices,
              inventory,
              suppliers,
              expenses,
              appointments,
              userAccounts,
            }}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <ErrorBoundary fallbackTitle="Assistente Técnico IA Automóvel">
            <AIDiagnosticView
              vehicles={vehicles || []}
              inventory={inventory || []}
              initialSymptoms={aiSymptomsInit}
              initialVehicleInfo={aiVehicleInfoInit}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-200">{workshopConfig.name}</strong> • Sistema de Gestão de Oficina Automóvel (Mercado Português)
          </div>
          <div className="text-[11px] text-slate-500">
            NIF: {workshopConfig.nif} • Emissão em conformidade IVA 23% & SAF-T PT
          </div>
        </div>
      </footer>
    </div>
  );
}
