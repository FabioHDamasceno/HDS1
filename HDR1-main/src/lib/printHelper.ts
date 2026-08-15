import { Invoice, WorkOrder, Client, Vehicle, WorkshopConfig, Expense } from '../types';
import { formatCurrency, formatDatePT, generateATDocumentHash } from './ptFormatters';

/**
 * Triggers browser print with window.focus()
 */
export function triggerDirectPrint() {
  try {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  } catch (err) {
    console.error('Error triggering window.print():', err);
  }
}

/**
 * Opens a dedicated popup print window containing clean HTML document for printing or saving as PDF
 */
export function openDocumentPrintWindow(
  invoice: Invoice,
  workshopConfig: WorkshopConfig,
  client?: Client,
  vehicle?: Vehicle
) {
  const hashVal =
    invoice.hashPreview ||
    generateATDocumentHash(invoice.docNumber, invoice.issueDate, invoice.grandTotal);

  const itemsHtml = invoice.items
    .map((item) => {
      const isFixed = item.pricingType === 'Valor Fechado';
      const qtyDisplay = isFixed ? 'Valor Fechado' : item.qty;
      const unitDisplay = formatCurrency(item.unitPrice);
      const total = item.qty * item.unitPrice;
      return `
    <tr>
      <td style="padding: 8px;"><span style="background: #e2e8f0; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${item.type}</span></td>
      <td style="padding: 8px; font-weight: 500;">${item.description} ${item.ref ? `<span style="font-size: 10px; color: #64748b;">[${item.ref}]</span>` : ''}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold;">${qtyDisplay}</td>
      <td style="padding: 8px; text-align: right;">${unitDisplay}</td>
      <td style="padding: 8px; text-align: center;">${item.vatRate}%</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(total)}</td>
    </tr>
  `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>${invoice.docType} ${invoice.docNumber} - ${workshopConfig.name}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 32px;
          color: #0f172a;
          background: #ffffff;
          font-size: 12px;
          line-height: 1.5;
        }
        @page { size: A4; margin: 12mm; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
        .workshop-name { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0 0 4px 0; color: #0f172a; }
        .doc-badge { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 18px; text-align: right; border-radius: 12px; width: 260px; }
        .doc-type { color: #d97706; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: block; }
        .doc-num { font-size: 16px; font-weight: 800; font-family: monospace; display: block; margin-top: 4px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
        .section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 10px 8px; border-bottom: 2px solid #0f172a; text-align: left; }
        td { border-bottom: 1px solid #e2e8f0; }
        .totals-flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-top: 2px solid #0f172a; pt: 16px; margin-top: 20px; }
        .vat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; width: 280px; }
        .grand-total-box { background: #0f172a; color: #ffffff; padding: 16px; border-radius: 12px; text-align: right; min-width: 220px; }
        .grand-total-val { font-size: 24px; font-weight: 900; color: #fbbf24; display: block; }
        .footer-note { font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; }
        .no-print-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          z-index: 9999;
        }
        .no-print-btn:hover { background: #1d4ed8; }
        @media print {
          .no-print-btn { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.print()">🖨️ Imprimir / Guardar em PDF</button>

      <div class="header">
        <div>
          <h1 class="workshop-name">${workshopConfig.name}</h1>
          <div>${workshopConfig.address}</div>
          <div>${workshopConfig.postalCode} ${workshopConfig.city} • Portugal</div>
          <div style="font-weight: bold; margin-top: 4px;">NIF / NIPC: ${workshopConfig.nif}</div>
          <div style="font-size: 10px; color: #64748b;">Cap. Social: ${workshopConfig.capitalSocial} • ${workshopConfig.conservatoria}</div>
        </div>

        <div class="doc-badge">
          <span class="doc-type">${invoice.docType}</span>
          <span class="doc-num">${invoice.docNumber}</span>
          <div style="font-size: 11px; margin-top: 8px;">
            <div>Data: <strong>${formatDatePT(invoice.issueDate)}</strong></div>
            <div>Vencimento: <strong>${formatDatePT(invoice.dueDate)}</strong></div>
            <div>Estado: <strong>${invoice.status}</strong></div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <span class="section-label">Adquirente / Cliente:</span>
          <div style="font-size: 14px; font-weight: bold;">${client ? client.name : 'Cliente Geral'}</div>
          <div style="font-family: monospace; font-weight: bold; margin-top: 2px;">NIF: ${client ? client.nif : '999999990'}</div>
          <div>${client ? `${client.address}, ${client.postalCode} ${client.city}` : 'Portugal'}</div>
        </div>

        <div>
          <span class="section-label">Viatura Reparada:</span>
          ${
            vehicle
              ? `
            <div style="font-weight: bold;">${vehicle.make} ${vehicle.model} (${vehicle.year})</div>
            <div style="font-family: monospace; font-weight: bold; color: #2563eb; margin-top: 2px;">Matrícula: ${vehicle.licensePlate}</div>
            <div style="font-size: 11px; color: #64748b;">VIN: ${vehicle.vin} • Km: ${vehicle.odometer.toLocaleString('pt-PT')} Km</div>
          `
              : '<div style="color: #64748b; italic;">Viatura não especificada</div>'
          }
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Tipo</th>
            <th>Descrição dos Serviços / Componentes</th>
            <th style="text-align: center; width: 60px;">Qtd</th>
            <th style="text-align: right; width: 100px;">Preço Unid.</th>
            <th style="text-align: center; width: 60px;">IVA %</th>
            <th style="text-align: right; width: 110px;">Total Iliquido</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals-flex">
        <div class="vat-box">
          <span class="section-label">Resumo de Impostos (CIVA PT):</span>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Incidência (23%):</span>
            <strong>${formatCurrency(invoice.subtotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Total IVA (23%):</span>
            <strong>${formatCurrency(invoice.totalVat)}</strong>
          </div>
        </div>

        <div class="grand-total-box">
          <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #fbbf24;">Valor Total a Pagar:</span>
          <span class="grand-total-val">${formatCurrency(invoice.grandTotal)}</span>
          <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Pagamento: ${invoice.paymentMethod || 'MB WAY / Transferência'}</div>
        </div>
      </div>

      <div class="footer-note">
        <div>
          <strong>Dados Bancários p/ Pagamento:</strong><br>
          IBAN: <span style="font-family: monospace; font-weight: bold;">${workshopConfig.iban}</span>
        </div>

        <div style="text-align: right;">
          <strong>Processado por Programa Certificado SAF-T PT</strong><br>
          <span style="font-family: monospace; font-size: 9px;">Assinatura Hash: ${hashVal}-S1</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // If popup was blocked, fallback to trigger direct print
    triggerDirectPrint();
  }
}

/**
 * Opens a dedicated popup print window for Work Orders / Budgets (Orçamentos)
 */
export function openWorkOrderPrintWindow(
  wo: WorkOrder,
  workshopConfig: WorkshopConfig,
  client?: Client,
  vehicle?: Vehicle
) {
  const laborTotal = wo.laborItems.reduce((acc, l) => {
    if (l.pricingType === 'Valor Fechado') return acc + (l.hourlyRate || 0);
    return acc + (l.hours || 0) * (l.hourlyRate || 0);
  }, 0);
  const partsTotal = wo.partsItems.reduce((acc, p) => acc + (p.qty || 0) * (p.unitPrice || 0), 0);
  const netTotal = laborTotal + partsTotal;
  const vatTotal = netTotal * 0.23;
  const grandTotal = netTotal + vatTotal;

  const laborRows = wo.laborItems
    .map((l) => {
      const isFixed = l.pricingType === 'Valor Fechado';
      const qtyStr = isFixed ? 'Valor Fechado' : `${l.hours}h`;
      const priceStr = isFixed ? formatCurrency(l.hourlyRate) : `${formatCurrency(l.hourlyRate)}/h`;
      const lineTotal = isFixed ? l.hourlyRate : l.hours * l.hourlyRate;
      return `
    <tr>
      <td style="padding: 8px;"><span style="background: #e2e8f0; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Mão-de-Obra</span></td>
      <td style="padding: 8px;">${l.description}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold;">${qtyStr}</td>
      <td style="padding: 8px; text-align: right;">${priceStr}</td>
      <td style="padding: 8px; text-align: center;">23%</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(lineTotal)}</td>
    </tr>
  `;
    })
    .join('');

  const partsRows = wo.partsItems
    .map((p) => {
      const badge = p.isManual ? 'Manual/Fora Stock' : 'Peça/Stock';
      const badgeBg = p.isManual ? '#fef3c7' : '#e0f2fe';
      const badgeColor = p.isManual ? '#92400e' : '#0369a1';
      return `
    <tr>
      <td style="padding: 8px;"><span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${badge}</span></td>
      <td style="padding: 8px;">[${p.ref}] ${p.name}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold;">${p.qty}</td>
      <td style="padding: 8px; text-align: right;">${formatCurrency(p.unitPrice)}</td>
      <td style="padding: 8px; text-align: center;">23%</td>
      <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(p.qty * p.unitPrice)}</td>
    </tr>
  `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento / Folha de Obra ${wo.number} - ${workshopConfig.name}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 32px;
          color: #0f172a;
          background: #ffffff;
          font-size: 12px;
          line-height: 1.5;
        }
        @page { size: A4; margin: 12mm; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
        .workshop-name { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0 0 4px 0; color: #0f172a; }
        .doc-badge { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 18px; text-align: right; border-radius: 12px; width: 260px; }
        .doc-type { color: #d97706; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: block; }
        .doc-num { font-size: 16px; font-weight: 800; font-family: monospace; display: block; margin-top: 4px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
        .section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 10px 8px; border-bottom: 2px solid #0f172a; text-align: left; }
        td { border-bottom: 1px solid #e2e8f0; }
        .totals-flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-top: 2px solid #0f172a; padding-top: 16px; margin-top: 20px; }
        .vat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; width: 280px; }
        .grand-total-box { background: #0f172a; color: #ffffff; padding: 16px; border-radius: 12px; text-align: right; min-width: 220px; }
        .grand-total-val { font-size: 24px; font-weight: 900; color: #fbbf24; display: block; }
        .no-print-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          background: #d97706;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          z-index: 9999;
        }
        @media print {
          .no-print-btn { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.print()">🖨️ Imprimir Orçamento / Folha de Obra</button>

      <div class="header">
        <div>
          <h1 class="workshop-name">${workshopConfig.name}</h1>
          <div>${workshopConfig.address}</div>
          <div>${workshopConfig.postalCode} ${workshopConfig.city} • Portugal</div>
          <div style="font-weight: bold; margin-top: 4px;">NIF / NIPC: ${workshopConfig.nif}</div>
        </div>

        <div class="doc-badge">
          <span class="doc-type">ORÇAMENTO / FOLHA OBRA</span>
          <span class="doc-num">${wo.number}</span>
          <div style="font-size: 11px; margin-top: 8px;">
            <div>Entrada: <strong>${formatDatePT(wo.entryDate)}</strong></div>
            <div>Previsão: <strong>${formatDatePT(wo.estimatedDeliveryDate)}</strong></div>
            <div>Técnico: <strong>${wo.technicianName}</strong></div>
            <div>Estado: <strong>${wo.status}</strong></div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <span class="section-label">Cliente / Proprietário:</span>
          <div style="font-size: 14px; font-weight: bold;">${client ? client.name : 'Cliente Geral'}</div>
          <div style="font-family: monospace; font-weight: bold; margin-top: 2px;">NIF: ${client ? client.nif : '-'}</div>
          <div>Telefone: ${client ? client.phone : '-'}</div>
        </div>

        <div>
          <span class="section-label">Viatura em Reparação:</span>
          ${
            vehicle
              ? `
            <div style="font-weight: bold;">${vehicle.make} ${vehicle.model} (${vehicle.year})</div>
            <div style="font-family: monospace; font-weight: bold; color: #2563eb; margin-top: 2px;">Matrícula: ${vehicle.licensePlate}</div>
            <div style="font-size: 11px; color: #64748b;">Quilometragens: ${vehicle.odometer.toLocaleString('pt-PT')} Km</div>
          `
              : '<div style="color: #64748b; italic;">Viatura não especificada</div>'
          }
        </div>
      </div>

      ${
        wo.clientComplaint
          ? `
        <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #92400e; font-size: 10px; text-transform: uppercase; display: block;">Sintomas / Pedido do Cliente:</strong>
          <div style="font-style: italic; font-size: 12px; margin-top: 4px;">"${wo.clientComplaint}"</div>
        </div>
      `
          : ''
      }

      <table>
        <thead>
          <tr>
            <th style="width: 100px;">Categoria</th>
            <th>Descrição do Serviço / Peça</th>
            <th style="text-align: center; width: 70px;">Qtd/Horas</th>
            <th style="text-align: right; width: 100px;">Valor Unid.</th>
            <th style="text-align: center; width: 60px;">IVA %</th>
            <th style="text-align: right; width: 110px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${laborRows}
          ${partsRows}
        </tbody>
      </table>

      <div class="totals-flex">
        <div class="vat-box">
          <span class="section-label">Discriminação de Valores:</span>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Mão-de-Obra:</span>
            <strong>${formatCurrency(laborTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Peças / Material:</span>
            <strong>${formatCurrency(partsTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>IVA Estimado (23%):</span>
            <strong>${formatCurrency(vatTotal)}</strong>
          </div>
        </div>

        <div class="grand-total-box">
          <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #fbbf24;">Valor Estimado Orçamento:</span>
          <span class="grand-total-val">${formatCurrency(grandTotal)}</span>
          <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Posto: ${wo.bay}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    triggerDirectPrint();
  }
}

/**
 * Opens a printable popup window for Monthly Expenses and Invoicing Report
 */
export function openMonthlyReportPrintWindow(
  year: number,
  month: number, // 1 - 12
  monthLabel: string, // e.g. "Agosto 2026"
  invoices: Invoice[],
  expenses: Expense[],
  clients: Client[],
  workshopConfig: WorkshopConfig
) {
  const monthStr = String(month).padStart(2, '0');
  const targetPrefix = `${year}-${monthStr}`;

  // Filter invoices for month
  const monthInvoices = invoices.filter((inv) => {
    if (!inv.issueDate) return false;
    return inv.issueDate.startsWith(targetPrefix);
  });

  // Filter expenses for month
  const monthExpenses = expenses.filter((exp) => {
    const d = exp.dueDate || exp.paymentDate || exp.createdAt;
    return d ? d.startsWith(targetPrefix) : false;
  });

  // Calculate Invoice Totals
  const totalInvoicedGross = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.grandTotal, 0);

  const totalInvoicedNet = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.subtotal, 0);

  const totalInvoicedVat = monthInvoices
    .filter((i) => i.status !== 'Anulada')
    .reduce((acc, i) => acc + i.totalVat, 0);

  // Calculate Expense Totals
  const totalExpensesGross = monthExpenses
    .filter((e) => e.status !== 'Cancelado')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpensesVat = monthExpenses
    .filter((e) => e.status !== 'Cancelado')
    .reduce((acc, e) => acc + (e.vatAmount || 0), 0);

  const totalExpensesNet = totalExpensesGross - totalExpensesVat;

  // Balance & VAT Settlement
  const netMargin = totalInvoicedGross - totalExpensesGross;
  const vatBalance = totalInvoicedVat - totalExpensesVat;

  // Breakdown by Expense Category
  const categoryMap: Record<string, number> = {};
  monthExpenses
    .filter((e) => e.status !== 'Cancelado')
    .forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

  const invoicesRows = monthInvoices.length > 0
    ? monthInvoices
        .map((inv) => {
          const client = clients.find((c) => c.id === inv.clientId);
          return `
            <tr>
              <td style="padding: 6px; font-weight: bold;">${inv.docType} ${inv.docNumber}</td>
              <td style="padding: 6px;">${formatDatePT(inv.issueDate)}</td>
              <td style="padding: 6px;">${client ? client.name : 'Cliente Geral'}</td>
              <td style="padding: 6px; font-family: monospace;">${client ? client.nif : '-'}</td>
              <td style="padding: 6px; text-align: right;">${formatCurrency(inv.subtotal)}</td>
              <td style="padding: 6px; text-align: right;">${formatCurrency(inv.totalVat)}</td>
              <td style="padding: 6px; text-align: right; font-weight: bold;">${formatCurrency(inv.grandTotal)}</td>
              <td style="padding: 6px; text-align: center;"><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${inv.status === 'Paga' ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">${inv.status}</span></td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="8" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">Nenhum documento de faturação emitido neste mês.</td></tr>`;

  const expensesRows = monthExpenses.length > 0
    ? monthExpenses
        .map((exp) => {
          return `
            <tr>
              <td style="padding: 6px;"><span style="background: #e2e8f0; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${exp.category}</span></td>
              <td style="padding: 6px; font-weight: 500;">${exp.description} ${exp.supplierName ? `(${exp.supplierName})` : ''}</td>
              <td style="padding: 6px;">${formatDatePT(exp.dueDate)}</td>
              <td style="padding: 6px; text-align: right;">${formatCurrency(exp.amount - (exp.vatAmount || 0))}</td>
              <td style="padding: 6px; text-align: right;">${formatCurrency(exp.vatAmount || 0)}</td>
              <td style="padding: 6px; text-align: right; font-weight: bold;">${formatCurrency(exp.amount)}</td>
              <td style="padding: 6px; text-align: center;"><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${exp.status === 'Pago' ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">${exp.status}</span></td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">Nenhuma despesa registada neste mês.</td></tr>`;

  const categoryRows = Object.keys(categoryMap).length > 0
    ? Object.entries(categoryMap)
        .map(([cat, amount]) => {
          const pct = totalExpensesGross > 0 ? ((amount / totalExpensesGross) * 100).toFixed(1) : '0';
          return `
            <tr>
              <td style="padding: 6px; font-weight: 600;">${cat}</td>
              <td style="padding: 6px; text-align: right; font-weight: bold;">${formatCurrency(amount)}</td>
              <td style="padding: 6px; text-align: right; font-weight: bold; color: #475569;">${pct}%</td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="3" style="padding: 8px; text-align: center; color: #64748b;">Sem dados de categorias.</td></tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Mensal - ${monthLabel} - ${workshopConfig.name}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 28px;
          color: #0f172a;
          background: #ffffff;
          font-size: 11px;
          line-height: 1.4;
        }
        @page { size: A4 portrait; margin: 10mm; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 16px; }
        .workshop-title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0 0 4px 0; }
        .report-badge { background: #0f172a; color: #ffffff; padding: 12px 16px; text-align: right; border-radius: 10px; min-width: 240px; }
        .report-title { color: #fbbf24; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
        .report-period { font-size: 16px; font-weight: 800; display: block; margin-top: 2px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
        .kpi-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px; }
        .kpi-value { font-size: 16px; font-weight: 900; display: block; color: #0f172a; }
        .kpi-sub { font-size: 9px; color: #475569; margin-top: 4px; display: block; }
        .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 8px; color: #0f172a; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f1f5f9; text-transform: uppercase; font-size: 9px; font-weight: 800; padding: 8px 6px; border-bottom: 2px solid #0f172a; text-align: left; }
        td { border-bottom: 1px solid #e2e8f0; }
        .two-col { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        .vat-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-top: 12px; }
        .footer-note { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
        .no-print-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          z-index: 9999;
        }
        .no-print-btn:hover { background: #1d4ed8; }
        @media print {
          .no-print-btn { display: none !important; }
        }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.print()">Imprimir / PDF</button>

      <!-- Header -->
      <div class="header">
        <div>
          <h1 class="workshop-title">${workshopConfig.name}</h1>
          <p style="margin: 0; font-weight: bold; color: #334155;">NIF / NIPC: ${workshopConfig.nif}</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">${workshopConfig.address} • ${workshopConfig.postalCode} ${workshopConfig.city}</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">IBAN: ${workshopConfig.iban}</p>
        </div>

        <div class="report-badge">
          <span class="report-title">Relatório Financeiro Mensal</span>
          <span class="report-period">${monthLabel}</span>
          <span style="font-size: 10px; opacity: 0.8; display: block; margin-top: 4px;">Emissão: ${new Date().toLocaleDateString('pt-PT')}</span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 4px solid #16a34a;">
          <span class="kpi-label">Faturação Total (Receitas)</span>
          <span class="kpi-value" style="color: #15803d;">${formatCurrency(totalInvoicedGross)}</span>
          <span class="kpi-sub">Base: ${formatCurrency(totalInvoicedNet)} | IVA: ${formatCurrency(totalInvoicedVat)}</span>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #dc2626;">
          <span class="kpi-label">Despesas Totais (Custos)</span>
          <span class="kpi-value" style="color: #b91c1c;">${formatCurrency(totalExpensesGross)}</span>
          <span class="kpi-sub">Base: ${formatCurrency(totalExpensesNet)} | IVA: ${formatCurrency(totalExpensesVat)}</span>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
          <span class="kpi-label">Resultado Líquido Operacional</span>
          <span class="kpi-value" style="color: ${netMargin >= 0 ? '#1d4ed8' : '#dc2626'};">
            ${netMargin >= 0 ? '+' : ''}${formatCurrency(netMargin)}
          </span>
          <span class="kpi-sub">Faturação - Despesas do Mês</span>
        </div>

        <div class="kpi-card" style="border-left: 4px solid #d97706;">
          <span class="kpi-label">Apuramento IVA (Estimado)</span>
          <span class="kpi-value" style="color: #b45309;">${formatCurrency(vatBalance)}</span>
          <span class="kpi-sub">${vatBalance >= 0 ? 'A Entregar ao Estado (CIVA)' : 'Crédito de IVA a Favor'}</span>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="section-title">
        <span>1. Relação de Faturação e Vendas (${monthInvoices.length} Documentos)</span>
        <span>Subtotal: ${formatCurrency(totalInvoicedGross)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>NIF</th>
            <th style="text-align: right;">Base Iliquida</th>
            <th style="text-align: right;">IVA</th>
            <th style="text-align: right;">Total c/ IVA</th>
            <th style="text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${invoicesRows}
        </tbody>
      </table>

      <!-- Expenses & Category Breakdown Grid -->
      <div class="two-col">
        <div>
          <div class="section-title">
            <span>2. Relação de Despesas e Custos (${monthExpenses.length} Registos)</span>
            <span>Total: ${formatCurrency(totalExpensesGross)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição / Fornecedor</th>
                <th>Vencimento</th>
                <th style="text-align: right;">Base</th>
                <th style="text-align: right;">IVA</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${expensesRows}
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-title">
            <span>3. Custos por Categoria</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th style="text-align: right;">Valor</th>
                <th style="text-align: right;">% Custos</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>

          <div class="vat-box">
            <span style="font-[10px]; font-weight: 800; text-transform: uppercase; color: #475569; display: block; margin-bottom: 6px;">Resumo Apuramento de IVA (CIVA PT)</span>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>IVA Cobrado em Vendas (+):</span>
              <strong>${formatCurrency(totalInvoicedVat)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>IVA Dedutível em Compras (-):</span>
              <strong>${formatCurrency(totalExpensesVat)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; font-weight: 800;">
              <span>Saldo Estimado a Entregar:</span>
              <span style="color: ${vatBalance >= 0 ? '#b45309' : '#166534'}">${formatCurrency(vatBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="footer-note">
        <div>
          <strong>${workshopConfig.name}</strong> • Processado por software de gestão oficinal com suporte SAF-T PT
        </div>
        <div style="text-align: right;">
          Relatório gerado em ${new Date().toLocaleString('pt-PT')}
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1000,height=1000');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    triggerDirectPrint();
  }
}

