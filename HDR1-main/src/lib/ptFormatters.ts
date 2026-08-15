/**
 * Utilities for Portuguese (PT) Workshop Management, NIF validation, license plates, and Euro formatting.
 */

export function validateNIF(nifRaw: string): { isValid: boolean; message: string } {
  const nif = nifRaw.replace(/\s+/g, '');
  if (!/^\d{9}$/.test(nif)) {
    return { isValid: false, message: 'O NIF deve conter exatamente 9 dígitos numéricos.' };
  }

  const validPrefixes = ['1', '2', '3', '5', '6', '8', '9'];
  if (!validPrefixes.includes(nif[0])) {
    return { isValid: false, message: 'Prefixo de NIF/NIPC português inválido.' };
  }

  let total = 0;
  for (let i = 0; i < 8; i++) {
    total += parseInt(nif[i], 10) * (9 - i);
  }

  const modulo = total % 11;
  const expectedCheckDigit = modulo === 0 || modulo === 1 ? 0 : 11 - modulo;
  const actualCheckDigit = parseInt(nif[8], 10);

  if (expectedCheckDigit !== actualCheckDigit) {
    return { isValid: false, message: 'Dígito de controlo do NIF incorreto.' };
  }

  return { isValid: true, message: 'NIF Válido' };
}

export function formatLicensePlate(raw: string): string {
  // Remove non-alphanumeric characters and force uppercase
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
}

export function isValidLicensePlatePT(plate: string): boolean {
  const cleaned = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length !== 6) return false;

  // Patterns for Portuguese plates:
  // 1937-1992: AA-00-00 (Letters, Digits, Digits)
  // 1992-2005: 00-00-AA (Digits, Digits, Letters)
  // 2005-2020: 00-AA-00 (Digits, Letters, Digits)
  // 2020+: AA-00-AA (Letters, Digits, Letters)
  const p1 = /^[A-Z]{2}\d{2}\d{2}$/;
  const p2 = /^\d{2}\d{2}[A-Z]{2}$/;
  const p3 = /^\d{2}[A-Z]{2}\d{2}$/;
  const p4 = /^[A-Z]{2}\d{2}[A-Z]{2}$/;

  return p1.test(cleaned) || p2.test(cleaned) || p3.test(cleaned) || p4.test(cleaned);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDatePT(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generateATDocumentHash(docNumber: string, date: string, grandTotal: number): string {
  // Simulated AT SAF-T PT 4-character signature hash
  const seed = `${docNumber}-${date}-${grandTotal.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let absHash = Math.abs(hash);
  for (let i = 0; i < 4; i++) {
    result += chars[absHash % chars.length];
    absHash = Math.floor(absHash / chars.length);
  }
  return result;
}
