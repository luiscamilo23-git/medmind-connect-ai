import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Invoice {
  id: string;
  numero_factura_dian: string | null;
  cufe: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  notas: string | null;
  proveedor_dian: string | null;
}

interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  impuestos_linea: number;
  total_linea: number;
  codigo_cups: string | null;
}

interface Patient {
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

interface DoctorProfile {
  full_name: string;
  license_number: string | null;
  phone: string | null;
  clinic_name: string | null;
  city: string | null;
}

export function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient: Patient,
  doctor: DoctorProfile
): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA ELECTRÓNICA', 105, 20, { align: 'center' });
  
  // Provider info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESTADOR DE SERVICIOS:', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(doctor.clinic_name || doctor.full_name, 14, 42);
  if (doctor.license_number) {
    doc.text(`Registro Médico: ${doctor.license_number}`, 14, 48);
  }
  if (doctor.phone) {
    doc.text(`Teléfono: ${doctor.phone}`, 14, 54);
  }
  if (doctor.city) {
    doc.text(`Ciudad: ${doctor.city}`, 14, 60);
  }
  
  // Invoice info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE FACTURA:', 120, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`No. Factura DIAN: ${invoice.numero_factura_dian || 'N/A'}`, 120, 42);
  doc.text(`CUFE: ${invoice.cufe?.substring(0, 20) || 'N/A'}...`, 120, 48);
  doc.text(`Fecha Emisión: ${new Date(invoice.fecha_emision).toLocaleDateString()}`, 120, 54);
  doc.text(`Fecha Vencimiento: ${new Date(invoice.fecha_vencimiento).toLocaleDateString()}`, 120, 60);
  if (invoice.proveedor_dian) {
    doc.text(`Proveedor DIAN: ${invoice.proveedor_dian}`, 120, 66);
  }
  
  // Patient info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PACIENTE:', 14, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${patient.full_name}`, 14, 82);
  doc.text(`Teléfono: ${patient.phone}`, 14, 88);
  if (patient.email) {
    doc.text(`Email: ${patient.email}`, 14, 94);
  }
  if (patient.address) {
    doc.text(`Dirección: ${patient.address}`, 14, 100);
  }
  
  // Items table
  const tableStartY = patient.address ? 110 : 105;
  
  (doc as any).autoTable({
    startY: tableStartY,
    head: [['Descripción', 'Cód. CUPS', 'Cant.', 'Precio Unit.', 'Subtotal', 'Impuestos', 'Total']],
    body: items.map(item => [
      item.descripcion,
      item.codigo_cups || 'N/A',
      item.cantidad.toString(),
      `$${item.precio_unitario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `$${item.subtotal_linea.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `$${item.impuestos_linea.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `$${item.total_linea.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBTOTAL:', 140, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${invoice.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 190, finalY, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('IMPUESTOS:', 140, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${invoice.impuestos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 190, finalY + 7, { align: 'right' });
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 140, finalY + 15);
  doc.text(`$${invoice.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 190, finalY + 15, { align: 'right' });
  
  // Notes
  if (invoice.notas) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS:', 14, finalY + 25);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notas, 180);
    doc.text(splitNotes, 14, finalY + 32);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Factura electrónica generada según normativa DIAN', 105, 280, { align: 'center' });
  doc.text(`CUFE completo: ${invoice.cufe || 'N/A'}`, 105, 285, { align: 'center' });
  
  return doc;
}
