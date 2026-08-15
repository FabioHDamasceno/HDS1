-- Schema SQL para a base de dados Supabase da OficinaAuto PT
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com)

-- 1. Tabela: Configuração da Oficina
CREATE TABLE IF NOT EXISTS workshop_config (
  id TEXT PRIMARY KEY DEFAULT 'config_main',
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  iban TEXT,
  default_hourly_rate NUMERIC DEFAULT 42.50,
  capital_social TEXT,
  conservatoria TEXT,
  default_vat_rate NUMERIC DEFAULT 23,
  invoice_notes TEXT,
  website TEXT,
  logo_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela: Clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'Particular',
  email TEXT,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela: Veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  fuel_type TEXT DEFAULT 'Gasóleo',
  vin TEXT,
  odometer INTEGER DEFAULT 0,
  ipo_date TEXT,
  iuc_month TEXT,
  color TEXT,
  engine_displacement TEXT,
  power_hp INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela: Histórico de Manutenção
CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  odometer INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  mechanic_name TEXT,
  cost_total NUMERIC DEFAULT 0,
  work_order_id TEXT,
  parts_used JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela: Ordens de Serviço (Folhas de Obra)
CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Receção',
  entry_date TEXT NOT NULL,
  estimated_delivery_date TEXT,
  technician_name TEXT,
  bay TEXT,
  client_complaint TEXT,
  diagnosis_notes TEXT,
  checklist JSONB DEFAULT '{}'::jsonb,
  labor_items JSONB DEFAULT '[]'::jsonb,
  parts_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela: Faturas e Documentos
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  work_order_id TEXT,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  vat_summary JSONB DEFAULT '[]'::jsonb,
  total_vat NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  payment_method TEXT,
  iban TEXT,
  hash_preview TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela: Inventário e Peças
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 23,
  stock_qty INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 2,
  location_in_workshop TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela: Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  contact_person TEXT,
  payment_terms TEXT DEFAULT 'Pronto Pagamento',
  categories JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela: Despesas
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 23,
  vat_amount NUMERIC DEFAULT 0,
  due_date TEXT NOT NULL,
  payment_date TEXT,
  status TEXT DEFAULT 'Pendente',
  supplier_id TEXT,
  supplier_name TEXT,
  document_ref TEXT,
  payment_method TEXT DEFAULT 'Transferência Bancária',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela: Marcações e Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_id TEXT,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_id TEXT,
  assigned_technician TEXT,
  bay TEXT,
  status TEXT DEFAULT 'Agendado',
  estimated_cost NUMERIC DEFAULT 0,
  notes TEXT,
  work_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabela: Contas de Utilizador
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Mecânico',
  active BOOLEAN DEFAULT TRUE,
  specialty TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE workshop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para permitir re-execução do script
DROP POLICY IF EXISTS "Public Read/Write workshop_config" ON workshop_config;
DROP POLICY IF EXISTS "Public Read/Write clients" ON clients;
DROP POLICY IF EXISTS "Public Read/Write vehicles" ON vehicles;
DROP POLICY IF EXISTS "Public Read/Write maintenance_records" ON maintenance_records;
DROP POLICY IF EXISTS "Public Read/Write work_orders" ON work_orders;
DROP POLICY IF EXISTS "Public Read/Write invoices" ON invoices;
DROP POLICY IF EXISTS "Public Read/Write inventory" ON inventory;
DROP POLICY IF EXISTS "Public Read/Write suppliers" ON suppliers;
DROP POLICY IF EXISTS "Public Read/Write expenses" ON expenses;
DROP POLICY IF EXISTS "Public Read/Write appointments" ON appointments;
DROP POLICY IF EXISTS "Public Read/Write user_accounts" ON user_accounts;

-- Políticas de Permissão Pública (Acesso Total para Applet)
CREATE POLICY "Public Read/Write workshop_config" ON workshop_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write maintenance_records" ON maintenance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write user_accounts" ON user_accounts FOR ALL USING (true) WITH CHECK (true);
