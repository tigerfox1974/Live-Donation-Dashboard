import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Participant, DonationItem } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============ CSV UTILITIES ============

/**
 * CSV hücresini parse eder - tırnak işaretlerini ve escape karakterlerini işler
 */
export const parseCsvCell = (cell: string): string => {
  const trimmed = cell.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').trim();
  }
  return trimmed;
};

/**
 * CSV satırındaki delimiter'ı otomatik algılar (virgül veya noktalı virgül)
 */
export const detectDelimiter = (line: string): string => {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
};

/**
 * CSV içeriğini satır ve sütunlara ayrıştırır
 */
export const parseCsvLines = (content: string): string[][] => {
  const lines = content
    .replace(/^\uFEFF/, '') // BOM karakterini kaldır
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => line.split(delimiter).map(parseCsvCell));
};

/**
 * Participant CSV satırlarını parse eder
 */
export const parseParticipantsCsvRows = (rows: string[][], eventId?: string): Partial<Participant>[] => {
  if (rows.length === 0) return [];
  
  const header = rows[0].map((cell) => cell.toLowerCase().replace(/\s+/g, '_'));
  const getIndex = (keys: string[]): number => {
    for (const key of keys) {
      const idx = header.indexOf(key);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  
  // Gerekli alanları kontrol et
  const nameIdx = getIndex(['display_name', 'name', 'isim', 'ad', 'katilimci']);
  if (nameIdx === -1) return [];
  
  const typeIdx = getIndex(['type', 'tip', 'tür']);
  const tableIdx = getIndex(['table_no', 'masa', 'masa_no', 'table']);
  const seatIdx = getIndex(['seat_label', 'koltuk', 'seat']);
  const notesIdx = getIndex(['notes', 'notlar', 'açıklama', 'aciklama']);
  const statusIdx = getIndex(['status', 'durum']);
  const tokenIdx = getIndex(['token']);
  
  return rows.slice(1).filter((row) => row.length > 0 && row[nameIdx]).map((row) => {
    const get = (idx: number) => (idx !== -1 && row[idx]) ? row[idx] : '';
    const typeValue = get(typeIdx).toUpperCase();
    
    return {
      display_name: get(nameIdx) || 'Katılımcı',
      type: (typeValue === 'ORG' || typeValue === 'KURULUŞ' || typeValue === 'KURULUS') ? 'ORG' : 'PERSON',
      table_no: get(tableIdx) || '',
      seat_label: get(seatIdx) || '',
      notes: get(notesIdx) || '',
      status: get(statusIdx) === 'inactive' || get(statusIdx) === 'pasif' ? 'inactive' : 'active',
      token: get(tokenIdx) || undefined,
      eventId: eventId || undefined,
      qr_generated: false
    } as Partial<Participant>;
  });
};

/**
 * Participant listesini CSV formatına dönüştürür
 */
export const buildParticipantsCsv = (participants: Participant[]): string => {
  const header = ['id', 'display_name', 'type', 'table_no', 'seat_label', 'notes', 'status', 'token', 'qr_generated', 'eventId'];
  const rows = participants.map((p) => [
    p.id,
    p.display_name,
    p.type,
    p.table_no,
    p.seat_label || '',
    p.notes || '',
    p.status,
    p.token || '',
    p.qr_generated ? 'true' : 'false',
    p.eventId || ''
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return `\uFEFF${csv}`; // BOM ekle (Excel uyumluluğu için)
};

/**
 * DonationItem CSV satırlarını parse eder
 */
export const parseItemsCsvRows = (rows: string[][], eventId?: string): Partial<DonationItem>[] => {
  if (rows.length === 0) return [];
  
  const header = rows[0].map((cell) => cell.toLowerCase().replace(/\s+/g, '_'));
  const getIndex = (keys: string[]): number => {
    for (const key of keys) {
      const idx = header.indexOf(key);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  
  const nameIdx = getIndex(['name', 'isim', 'kalem', 'item']);
  if (nameIdx === -1) return [];
  
  const targetIdx = getIndex(['initial_target', 'target', 'hedef', 'miktar']);
  const imageIdx = getIndex(['image_url', 'image', 'resim', 'görsel']);
  const orderIdx = getIndex(['order', 'sira', 'sıra']);
  const statusIdx = getIndex(['status', 'durum']);
  const notesIdx = getIndex(['notes', 'notlar', 'açıklama']);
  
  return rows.slice(1).filter((row) => row.length > 0 && row[nameIdx]).map((row, idx) => {
    const get = (i: number) => (i !== -1 && row[i]) ? row[i] : '';
    
    return {
      name: get(nameIdx) || 'Kalem',
      initial_target: parseInt(get(targetIdx)) || 100,
      image_url: get(imageIdx) || '/placeholder.png',
      order: parseInt(get(orderIdx)) || idx + 1,
      status: get(statusIdx) === 'inactive' || get(statusIdx) === 'pasif' ? 'inactive' : 'active',
      notes: get(notesIdx) || '',
      eventId: eventId || undefined
    } as Partial<DonationItem>;
  });
};

/**
 * DonationItem listesini CSV formatına dönüştürür
 */
export const buildItemsCsv = (items: DonationItem[]): string => {
  const header = ['id', 'name', 'initial_target', 'image_url', 'order', 'status', 'notes', 'eventId'];
  const rows = items.map((item) => [
    item.id,
    item.name,
    item.initial_target,
    item.image_url,
    item.order,
    item.status,
    item.notes || '',
    item.eventId || ''
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return `\uFEFF${csv}`;
};

/**
 * Dosya indirme yardımcısı
 */
export const downloadTextFile = (filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};