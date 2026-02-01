import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Types
export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

// ============ CSV UTILITIES ============

export const generateCSV = (data: Record<string, any>[], columns?: string[]): string => {
  if (data.length === 0) return '';
  
  const headers = columns || Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      const strValue = value === null || value === undefined ? '' : String(value);
      // Escape quotes and wrap in quotes
      return `"${strValue.replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return `\uFEFF${[headers.join(','), ...rows].join('\n')}`;
};

export const downloadCSV = (
  data: Record<string, any>[],
  filename: string,
  columns?: string[]
): void => {
  const csv = generateCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

// ============ EXCEL UTILITIES ============

export const generateExcel = (
  sheets: { name: string; data: Record<string, any>[]; columns?: string[] }[]
): XLSX.WorkBook => {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    const headers = sheet.columns || (sheet.data.length > 0 ? Object.keys(sheet.data[0]) : []);
    const wsData = [
      headers,
      ...sheet.data.map(row => headers.map(h => row[h] ?? ''))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.data.map(row => String(row[h] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });
  
  return workbook;
};

export const downloadExcel = (
  sheets: { name: string; data: Record<string, any>[]; columns?: string[] }[],
  filename: string
): void => {
  const workbook = generateExcel(sheets);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ============ PDF UTILITIES ============

interface PDFOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export const generatePDF = (
  data: Record<string, any>[],
  columns: { key: string; label: string; width?: number }[],
  options: PDFOptions = {}
): jsPDF => {
  const { 
    title = 'Rapor', 
    subtitle, 
    orientation = 'portrait',
    pageSize = 'a4'
  } = options;
  
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 15;
  
  // Table
  const tableWidth = pageWidth - 2 * margin;
  const defaultColWidth = tableWidth / columns.length;
  const colWidths = columns.map(c => c.width || defaultColWidth);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const scale = tableWidth / totalWidth;
  const scaledWidths = colWidths.map(w => w * scale);
  
  // Table header
  doc.setFillColor(30, 58, 95); // #1e3a5f
  doc.rect(margin, y, tableWidth, 8, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  let x = margin + 2;
  columns.forEach((col, i) => {
    doc.text(col.label, x, y + 5.5, { maxWidth: scaledWidths[i] - 4 });
    x += scaledWidths[i];
  });
  y += 8;
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  
  // Table rows
  const rowHeight = 7;
  data.forEach((row, rowIndex) => {
    // Check page break
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    
    // Alternating row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, tableWidth, rowHeight, 'F');
    }
    
    x = margin + 2;
    columns.forEach((col, i) => {
      const value = String(row[col.key] ?? '');
      doc.text(value, x, y + 5, { maxWidth: scaledWidths[i] - 4 });
      x += scaledWidths[i];
    });
    y += rowHeight;
  });
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Sayfa ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const downloadPDF = (
  data: Record<string, any>[],
  columns: { key: string; label: string; width?: number }[],
  filename: string,
  options?: PDFOptions
): void => {
  const doc = generatePDF(data, columns, options);
  doc.save(`${filename}.pdf`);
};

// ============ EVENT REPORT PDF ============

interface EventReportData {
  event: {
    name: string;
    date: string;
    venue: string;
    status: string;
    totalApproved: number;
    totalTarget: number;
    participantCount: number;
    itemCount: number;
  };
  items: {
    name: string;
    current: number;
    initial_target: number;
    percentage: number;
  }[];
  topDonors: {
    name: string;
    totalDonations: number;
  }[];
  donations: {
    participant: string;
    item: string;
    quantity: number;
    status: string;
    timestamp: string;
  }[];
}

export const generateEventReportPDF = (data: EventReportData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;
  
  // Header with logo area
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('POLVAK', margin, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Bagis Etkinligi Raporu', margin, 28);
  
  // Event info on right
  doc.setFontSize(10);
  doc.text(data.event.name, pageWidth - margin, 18, { align: 'right' });
  doc.text(data.event.date, pageWidth - margin, 24, { align: 'right' });
  doc.text(data.event.venue, pageWidth - margin, 30, { align: 'right' });
  
  y = 50;
  doc.setTextColor(0);
  
  // Summary cards
  const cardWidth = (pageWidth - 2 * margin - 15) / 4;
  const cardHeight = 25;
  const cards = [
    { label: 'Toplam Bagis', value: String(data.event.totalApproved), color: [34, 197, 94] },
    { label: 'Hedef', value: String(data.event.totalTarget), color: [59, 130, 246] },
    { label: 'Katilimci', value: String(data.event.participantCount), color: [168, 85, 247] },
    { label: 'Kalem', value: String(data.event.itemCount), color: [249, 115, 22] }
  ];
  
  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 5);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.text(card.label, x + cardWidth / 2, y + 8, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, y + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  
  y += cardHeight + 15;
  doc.setTextColor(0);
  
  // Items progress section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Kalem Bazinda Durum', margin, y);
  y += 8;
  
  data.items.slice(0, 5).forEach(item => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.name}`, margin, y);
    doc.text(`${item.current}/${item.initial_target}`, pageWidth - margin - 30, y);
    doc.text(`%${Math.round(item.percentage)}`, pageWidth - margin, y, { align: 'right' });
    
    // Progress bar
    y += 3;
    const barWidth = pageWidth - 2 * margin;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, barWidth, 4, 2, 2, 'F');
    doc.setFillColor(34, 197, 94);
    const fillWidth = Math.min(barWidth * (item.percentage / 100), barWidth);
    if (fillWidth > 0) {
      doc.roundedRect(margin, y, fillWidth, 4, 2, 2, 'F');
    }
    y += 10;
  });
  
  // Top donors section
  if (data.topDonors.length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('En Cok Bagis Yapanlar', margin, y);
    y += 8;
    
    data.topDonors.slice(0, 5).forEach((donor, i) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}. ${donor.name}`, margin, y);
      doc.text(`${donor.totalDonations} adet`, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  
  return doc;
};

// ============ ZIP UTILITIES ============

export const createQRZip = async (
  qrCodes: { name: string; dataUrl: string }[],
  onProgress?: ProgressCallback
): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder('qr-codes');
  
  if (!folder) throw new Error('Failed to create folder');
  
  for (let i = 0; i < qrCodes.length; i++) {
    const qr = qrCodes[i];
    // Convert data URL to base64
    const base64 = qr.dataUrl.split(',')[1];
    folder.file(`${qr.name}.png`, base64, { base64: true });
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: qrCodes.length,
        message: `QR kodu ekleniyor: ${qr.name}`
      });
    }
  }
  
  return zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress && metadata.percent) {
      onProgress({
        current: Math.round(metadata.percent),
        total: 100,
        message: 'ZIP dosyası oluşturuluyor...'
      });
    }
  });
};

export const downloadQRZip = async (
  qrCodes: { name: string; dataUrl: string }[],
  filename: string,
  onProgress?: ProgressCallback
): Promise<void> => {
  const blob = await createQRZip(qrCodes, onProgress);
  saveAs(blob, `${filename}.zip`);
};

// ============ DONATIONS EXPORT ============

export const exportDonationsCSV = (
  donations: any[],
  participants: any[],
  items: any[],
  filename: string
): void => {
  const data = donations.map(d => {
    const participant = participants.find(p => p.id === d.participant_id);
    const item = items.find(i => i.id === d.item_id);
    return {
      id: d.id,
      participant_name: participant?.display_name || '-',
      participant_type: participant?.type || '-',
      item_name: item?.name || '-',
      quantity: d.quantity,
      status: d.status,
      timestamp: new Date(d.timestamp).toLocaleString('tr-TR')
    };
  });
  
  downloadCSV(data, filename, [
    'id', 'participant_name', 'participant_type', 'item_name', 'quantity', 'status', 'timestamp'
  ]);
};

export const exportDonationsExcel = (
  donations: any[],
  participants: any[],
  items: any[],
  filename: string
): void => {
  const donationData = donations.map(d => {
    const participant = participants.find(p => p.id === d.participant_id);
    const item = items.find(i => i.id === d.item_id);
    return {
      'ID': d.id,
      'Katilimci': participant?.display_name || '-',
      'Tip': participant?.type === 'ORG' ? 'Kurum' : 'Kisi',
      'Kalem': item?.name || '-',
      'Adet': d.quantity,
      'Durum': d.status === 'approved' ? 'Onaylandi' : d.status === 'pending' ? 'Bekliyor' : 'Reddedildi',
      'Tarih': new Date(d.timestamp).toLocaleString('tr-TR')
    };
  });
  
  const itemSummary = items.map(i => ({
    'Kalem': i.name,
    'Hedef': i.initial_target,
    'Mevcut': i.current || 0,
    'Yuzde': `%${Math.round(((i.current || 0) / i.initial_target) * 100)}`
  }));
  
  const participantSummary = participants.map(p => ({
    'Ad': p.display_name,
    'Tip': p.type === 'ORG' ? 'Kurum' : 'Kisi',
    'Masa': p.table_no || '-',
    'Koltuk': p.seat_label || '-',
    'Durum': p.status === 'active' ? 'Aktif' : 'Pasif'
  }));
  
  downloadExcel([
    { name: 'Bagislar', data: donationData },
    { name: 'Kalem Ozeti', data: itemSummary },
    { name: 'Katilimcilar', data: participantSummary }
  ], filename);
};

// ============ PARTICIPANTS EXPORT ============

export const exportParticipantsCSV = (participants: any[], filename: string): void => {
  const data = participants.map(p => ({
    id: p.id,
    display_name: p.display_name,
    type: p.type,
    table_no: p.table_no || '',
    seat_label: p.seat_label || '',
    status: p.status,
    token: p.token || '',
    total_donations: p.total_donations || 0
  }));
  
  downloadCSV(data, filename);
};

export const exportParticipantsExcel = (participants: any[], filename: string): void => {
  const data = participants.map(p => ({
    'ID': p.id,
    'Ad': p.display_name,
    'Tip': p.type === 'ORG' ? 'Kurum' : 'Kisi',
    'Masa No': p.table_no || '-',
    'Koltuk': p.seat_label || '-',
    'Durum': p.status === 'active' ? 'Aktif' : 'Pasif',
    'Token': p.token || '-',
    'Toplam Bagis': p.total_donations || 0
  }));
  
  downloadExcel([{ name: 'Katilimcilar', data }], filename);
};

// ============ ITEMS EXPORT ============

export const exportItemsCSV = (items: any[], filename: string): void => {
  const data = items.map(i => ({
    id: i.id,
    name: i.name,
    initial_target: i.initial_target,
    current: i.current || 0,
    order: i.order,
    image_url: i.image_url || ''
  }));
  
  downloadCSV(data, filename);
};

export const exportItemsExcel = (items: any[], filename: string): void => {
  const data = items.map(i => ({
    'ID': i.id,
    'Kalem Adi': i.name,
    'Hedef': i.initial_target,
    'Mevcut': i.current || 0,
    'Yuzde': `%${Math.round(((i.current || 0) / i.initial_target) * 100)}`,
    'Sira': i.order,
    'Gorsel URL': i.image_url || '-'
  }));
  
  downloadExcel([{ name: 'Kalemler', data }], filename);
};

// ============ AUDIT LOG EXPORT ============

export const exportAuditLogCSV = (logs: any[], filename: string): void => {
  const data = logs.map(log => ({
    id: log.id,
    timestamp: new Date(log.timestamp).toLocaleString('tr-TR'),
    user: log.user,
    action: log.action,
    details: log.details,
    eventId: log.eventId
  }));
  
  downloadCSV(data, filename);
};

export const exportAuditLogExcel = (logs: any[], filename: string): void => {
  const data = logs.map(log => ({
    'ID': log.id,
    'Tarih': new Date(log.timestamp).toLocaleString('tr-TR'),
    'Kullanici': log.user,
    'Islem': log.action,
    'Detay': log.details,
    'Etkinlik ID': log.eventId
  }));
  
  downloadExcel([{ name: 'Denetim Kayitlari', data }], filename);
};
