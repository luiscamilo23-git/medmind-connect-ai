import { Button } from "./ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ExportMedicalRecordPDFProps {
  medicalRecord: any;
  patientName: string;
  doctorName: string;
  doctorLicense?: string;
  doctorSignature?: string;
}

// Helper to format ROS from specialty fields
const formatROS = (record: any): string => {
  const rosFields = [
    { key: 'ros_general', label: 'General' },
    { key: 'ros_cardiovascular', label: 'Cardiovascular' },
    { key: 'ros_respiratorio', label: 'Respiratorio' },
    { key: 'ros_digestivo', label: 'Digestivo' },
    { key: 'ros_genitourinario', label: 'Genitourinario' },
    { key: 'ros_musculoesqueletico', label: 'Musculoesquelético' },
    { key: 'ros_neurologico', label: 'Neurológico' },
    { key: 'ros_piel', label: 'Piel y Faneras' },
    { key: 'ros_endocrino', label: 'Endocrino' },
    { key: 'ros_psiquiatrico', label: 'Psiquiátrico' },
  ];

  // Check notes field for specialty values (they're stored there)
  let specialtyData: Record<string, any> = {};
  if (record.notes) {
    try {
      // Notes may contain key: value pairs
      const lines = record.notes.split('\n');
      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          specialtyData[match[1].trim()] = match[2].trim();
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const rosItems: string[] = [];
  for (const field of rosFields) {
    const value = specialtyData[field.key] || record[field.key];
    if (value && value.trim()) {
      rosItems.push(`• ${field.label}: ${value}`);
    }
  }

  // Also include legacy ros field if no structured data
  if (rosItems.length === 0 && record.ros) {
    return record.ros;
  }

  return rosItems.join('\n');
};

// Helper to format companion info
const formatCompanionInfo = (record: any): string | null => {
  let specialtyData: Record<string, any> = {};
  if (record.notes) {
    try {
      const lines = record.notes.split('\n');
      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          specialtyData[match[1].trim()] = match[2].trim();
        }
      }
    } catch (e) {}
  }

  const hasCompanion = specialtyData.has_companion === 'si';
  if (!hasCompanion) return null;

  const parts = [];
  if (specialtyData.companion_name) parts.push(`Nombre: ${specialtyData.companion_name}`);
  if (specialtyData.companion_relationship) parts.push(`Parentesco: ${specialtyData.companion_relationship}`);
  if (specialtyData.companion_phone) parts.push(`Teléfono: ${specialtyData.companion_phone}`);
  if (specialtyData.companion_id) parts.push(`Identificación: ${specialtyData.companion_id}`);

  return parts.length > 0 ? parts.join(' | ') : null;
};

// Helper to format surgical info
const formatSurgicalInfo = (record: any): { preop: string[], intraop: string[], postop: string[] } | null => {
  let specialtyData: Record<string, any> = {};
  if (record.notes) {
    try {
      const lines = record.notes.split('\n');
      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          specialtyData[match[1].trim()] = match[2].trim();
        }
      }
    } catch (e) {}
  }

  const surgicalFieldsPreop = [
    { key: 'preoperative_diagnosis', label: 'Diagnóstico Preoperatorio' },
    { key: 'proposed_surgery', label: 'Cirugía Propuesta' },
    { key: 'surgical_indication', label: 'Indicación Quirúrgica' },
    { key: 'asa_classification', label: 'Clasificación ASA' },
    { key: 'surgical_risks', label: 'Riesgos Quirúrgicos' },
  ];

  const surgicalFieldsIntraop = [
    { key: 'surgery_date', label: 'Fecha de Cirugía' },
    { key: 'surgery_start_time', label: 'Hora Inicio' },
    { key: 'surgery_end_time', label: 'Hora Fin' },
    { key: 'surgical_team', label: 'Equipo Quirúrgico' },
    { key: 'anesthesia_type', label: 'Tipo de Anestesia' },
    { key: 'patient_position', label: 'Posición del Paciente' },
    { key: 'surgical_technique', label: 'Técnica Quirúrgica' },
    { key: 'surgical_findings', label: 'Hallazgos Quirúrgicos' },
    { key: 'specimens_sent', label: 'Especímenes Enviados' },
    { key: 'estimated_blood_loss', label: 'Sangrado Estimado' },
    { key: 'complications_intraop', label: 'Complicaciones' },
  ];

  const surgicalFieldsPostop = [
    { key: 'postoperative_diagnosis', label: 'Diagnóstico Postoperatorio' },
    { key: 'immediate_postop_condition', label: 'Estado Postoperatorio Inmediato' },
    { key: 'postop_orders', label: 'Órdenes Postoperatorias' },
  ];

  const preop: string[] = [];
  const intraop: string[] = [];
  const postop: string[] = [];

  for (const field of surgicalFieldsPreop) {
    const value = specialtyData[field.key];
    if (value && value.trim()) {
      preop.push(`${field.label}: ${value}`);
    }
  }

  for (const field of surgicalFieldsIntraop) {
    const value = specialtyData[field.key];
    if (value && value.trim()) {
      intraop.push(`${field.label}: ${value}`);
    }
  }

  for (const field of surgicalFieldsPostop) {
    const value = specialtyData[field.key];
    if (value && value.trim()) {
      postop.push(`${field.label}: ${value}`);
    }
  }

  if (preop.length === 0 && intraop.length === 0 && postop.length === 0) {
    return null;
  }

  return { preop, intraop, postop };
};

export const ExportMedicalRecordPDF = ({
  medicalRecord,
  patientName,
  doctorName,
  doctorLicense,
  doctorSignature,
}: ExportMedicalRecordPDFProps) => {
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    const recordTypeLabelMap: Record<string, string> = {
      consultation: "Consulta",
      procedure: "Procedimiento",
      diagnosis: "Diagnóstico",
      prescription: "Prescripción",
      lab_result: "Resultado de Laboratorio",
      imaging: "Estudio de Imágenes",
    };

    const recordTypeLabel =
      medicalRecord.record_type && recordTypeLabelMap[medicalRecord.record_type]
        ? recordTypeLabelMap[medicalRecord.record_type]
        : medicalRecord.record_type;

    // Header - Datos del médico
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(doctorName, 20, y);
    y += 6;
    
    if (doctorLicense) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Registro Médico: ${doctorLicense}`, 20, y);
      y += 10;
    } else {
      y += 6;
    }
    
    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HISTORIA CLÍNICA", 105, y, { align: 'center' });
    y += 10;
    
    // 1. Identificación del Paciente
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Identificación del Paciente", 20, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${patientName}`, 20, y);
    y += 5;
    doc.text(`Fecha: ${new Date(medicalRecord.created_at).toLocaleDateString('es-CO')}`, 20, y);
    y += 5;

    if (recordTypeLabel) {
      doc.text(`Tipo de Registro: ${recordTypeLabel}`, 20, y);
      y += 5;
    }
    
    if (medicalRecord.patient_identification) {
      doc.text(`Identificación: ${medicalRecord.patient_identification}`, 20, y);
      y += 5;
    }

    // Companion info
    const companionInfo = formatCompanionInfo(medicalRecord);
    if (companionInfo) {
      doc.text(`Acompañante: ${companionInfo}`, 20, y);
      y += 5;
    }
    
    y += 3;
    doc.line(20, y, 190, y);
    y += 8;
    
    // Función helper para agregar secciones con mejor manejo de página
    const addSection = (title: string, content: string, sectionNumber?: string) => {
      if (!content || !content.trim()) return;
      
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(sectionNumber ? `${sectionNumber}. ${title}` : title, 20, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(content, 170);
      
      // Check if content will fit, if not add new page
      if (y + (lines.length * 5) > 270) {
        doc.addPage();
        y = 20;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(sectionNumber ? `${sectionNumber}. ${title} (cont.)` : `${title} (cont.)`, 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 4;
    };
    
    // Agregar todas las secciones
    addSection("Motivo de Consulta", medicalRecord.chief_complaint, "2");
    addSection("Enfermedad Actual", medicalRecord.current_illness, "3");
    
    // ROS estructurado
    const rosContent = formatROS(medicalRecord);
    if (rosContent) {
      addSection("Revisión por Sistemas (ROS)", rosContent, "4");
    }
    
    addSection("Antecedentes Médicos", medicalRecord.medical_history, "5");
    
    // Signos vitales
    if (medicalRecord.vital_signs && Object.keys(medicalRecord.vital_signs).length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("6. Signos Vitales", 20, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const vs = medicalRecord.vital_signs;
      
      const vitalSignsItems = [
        { key: 'blood_pressure', label: 'Presión Arterial' },
        { key: 'heart_rate', label: 'Frecuencia Cardíaca' },
        { key: 'respiratory_rate', label: 'Frecuencia Respiratoria' },
        { key: 'temperature', label: 'Temperatura' },
        { key: 'spo2', label: 'SpO2' },
        { key: 'weight', label: 'Peso' },
        { key: 'height', label: 'Talla' },
      ];

      for (const item of vitalSignsItems) {
        if (vs[item.key]) {
          doc.text(`${item.label}: ${vs[item.key]}`, 20, y);
          y += 5;
        }
      }
      y += 4;
    }
    
    addSection("Examen Físico", medicalRecord.physical_exam, "7");
    addSection("Ayudas Diagnósticas", medicalRecord.diagnostic_aids, "8");
    addSection("Diagnóstico", medicalRecord.diagnosis, "9");
    
    if (medicalRecord.cie10_code) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Código CIE-10: ${medicalRecord.cie10_code}`, 20, y);
      y += 6;
    }
    
    // Surgical info if present
    const surgicalInfo = formatSurgicalInfo(medicalRecord);
    if (surgicalInfo) {
      if (y > 200) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("INFORMACIÓN QUIRÚRGICA", 105, y, { align: 'center' });
      y += 8;

      if (surgicalInfo.preop.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Preoperatorio:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const item of surgicalInfo.preop) {
          if (y > 270) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(item, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5;
        }
        y += 3;
      }

      if (surgicalInfo.intraop.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Intraoperatorio:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const item of surgicalInfo.intraop) {
          if (y > 270) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(item, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5;
        }
        y += 3;
      }

      if (surgicalInfo.postop.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Postoperatorio:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const item of surgicalInfo.postop) {
          if (y > 270) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(item, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5;
        }
        y += 3;
      }
    }
    
    addSection("Plan de Manejo - Tratamiento", medicalRecord.treatment, "10");
    addSection("Plan de Manejo - Educación al Paciente", medicalRecord.education);
    addSection("Plan de Manejo - Seguimiento", medicalRecord.followup);
    
    // Medicamentos
    if (medicalRecord.medications && medicalRecord.medications.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("MEDICAMENTOS", 20, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      medicalRecord.medications.forEach((med: string, i: number) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`${i + 1}. ${med}`, 165);
        doc.text(lines, 25, y);
        y += lines.length * 5;
      });
      y += 4;
    }
    
    addSection("Consentimiento Informado", medicalRecord.consent, "11");
    addSection("Notas de Evolución (SOAP)", medicalRecord.evolution_notes, "12");
    
    // Additional notes (excluding specialty field data)
    if (medicalRecord.notes) {
      // Filter out specialty field key-value pairs
      const notesLines = medicalRecord.notes.split('\n').filter((line: string) => {
        return !line.match(/^[a-z_]+:\s*.+$/i);
      }).join('\n').trim();
      
      if (notesLines) {
        addSection("Notas Adicionales", notesLines);
      }
    }
    
    // 13. Firma Médica - SIEMPRE en página final con espacio adecuado
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("13. Firma Médica", 20, y);
    y += 10;
    
    // Signature with better sizing and positioning
    if (doctorSignature) {
      try {
        // Draw signature background box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, y - 2, 60, 25);
        
        doc.addImage(doctorSignature, 'PNG', 22, y, 56, 21);
        y += 27;
      } catch (error) {
        console.error("Error adding signature:", error);
        y += 5;
      }
    } else {
      // Draw signature line if no signature
      doc.line(20, y + 15, 80, y + 15);
      y += 20;
    }
    
    y += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(doctorName, 20, y);
    if (doctorLicense) {
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`Registro Médico: ${doctorLicense}`, 20, y);
    }
    
    // Footer with timestamp
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Historia Clínica generada por MEDMIND - ${new Date().toLocaleString('es-CO')} - Página ${i} de ${pageCount}`,
        105, 
        290, 
        { align: 'center' }
      );
    }
    
    // Guardar PDF
    const fileName = `Historia_Clinica_${patientName.replace(/ /g, '_')}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    toast.success("Historia clínica exportada a PDF");
  };
  
  return (
    <Button onClick={exportToPDF} variant="default" size="sm" className="w-full sm:w-auto">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar Historia a PDF
    </Button>
  );
};
