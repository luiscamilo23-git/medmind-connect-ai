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
      y += 8;
    }
    
    doc.line(20, y, 190, y);
    y += 8;
    
    // Función helper para agregar secciones
    const addSection = (title: string, content: string) => {
      if (!content) return;
      
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(content, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 4;
    };
    
    // Agregar todas las secciones
    addSection("2. Motivo de Consulta", medicalRecord.chief_complaint);
    addSection("3. Enfermedad Actual", medicalRecord.current_illness);
    addSection("4. Revisión por Sistemas (ROS)", medicalRecord.ros);
    addSection("5. Antecedentes Médicos", medicalRecord.medical_history);
    
    // Signos vitales
    if (medicalRecord.vital_signs && Object.keys(medicalRecord.vital_signs).length > 0) {
      if (y > 260) {
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
      if (vs.blood_pressure) {
        doc.text(`Presión Arterial: ${vs.blood_pressure}`, 20, y);
        y += 5;
      }
      if (vs.heart_rate) {
        doc.text(`Frecuencia Cardíaca: ${vs.heart_rate}`, 20, y);
        y += 5;
      }
      if (vs.respiratory_rate) {
        doc.text(`Frecuencia Respiratoria: ${vs.respiratory_rate}`, 20, y);
        y += 5;
      }
      if (vs.temperature) {
        doc.text(`Temperatura: ${vs.temperature}`, 20, y);
        y += 5;
      }
      if (vs.spo2) {
        doc.text(`SpO2: ${vs.spo2}`, 20, y);
        y += 5;
      }
      if (vs.weight) {
        doc.text(`Peso: ${vs.weight}`, 20, y);
        y += 5;
      }
      if (vs.height) {
        doc.text(`Altura: ${vs.height}`, 20, y);
        y += 5;
      }
      y += 4;
    }
    
    addSection("7. Examen Físico", medicalRecord.physical_exam);
    addSection("8. Ayudas Diagnósticas", medicalRecord.diagnostic_aids);
    addSection("9. Diagnóstico", medicalRecord.diagnosis);
    
    if (medicalRecord.cie10_code) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Código CIE-10: ${medicalRecord.cie10_code}`, 20, y);
      y += 6;
    }
    
    addSection("10. Plan de Manejo - Tratamiento", medicalRecord.treatment);
    addSection("10. Plan de Manejo - Educación al Paciente", medicalRecord.education);
    addSection("10. Plan de Manejo - Seguimiento", medicalRecord.followup);
    
    // Medicamentos
    if (medicalRecord.medications && medicalRecord.medications.length > 0) {
      if (y > 260) {
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
        doc.text(`${i + 1}. ${med}`, 25, y);
        y += 5;
      });
      y += 4;
    }
    
    addSection("11. Consentimiento Informado", medicalRecord.consent);
    addSection("13. Notas de Evolución (SOAP)", medicalRecord.evolution_notes);
    addSection("Notas Adicionales", medicalRecord.notes);
    
    // 12. Firma Médica
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("12. Firma Médica", 20, y);
    y += 8;
    
    if (doctorSignature) {
      try {
        doc.addImage(doctorSignature, 'PNG', 20, y, 50, 20);
        y += 22;
      } catch (error) {
        console.error("Error adding signature:", error);
      }
    }
    
    doc.line(20, y, 80, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(doctorName, 20, y);
    if (doctorLicense) {
      y += 4;
      doc.text(`Reg. ${doctorLicense}`, 20, y);
    }
    
    // Guardar PDF
    const fileName = `Historia_Clinica_${patientName.replace(/ /g, '_')}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    toast.success("Historia clínica exportada a PDF");
  };
  
  return (
    <Button onClick={exportToPDF} variant="default" size="sm">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar Historia a PDF
    </Button>
  );
};
