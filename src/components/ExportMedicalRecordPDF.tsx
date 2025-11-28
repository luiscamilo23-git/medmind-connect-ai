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
    
    // Datos del paciente
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Paciente: ${patientName}`, 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date(medicalRecord.created_at).toLocaleDateString('es-CO')}`, 20, y);
    y += 6;
    
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
    addSection("MOTIVO DE CONSULTA", medicalRecord.chief_complaint);
    addSection("ENFERMEDAD ACTUAL", medicalRecord.current_illness);
    addSection("REVISIÓN POR SISTEMAS (ROS)", medicalRecord.ros);
    addSection("ANTECEDENTES", medicalRecord.medical_history);
    
    // Signos vitales
    if (medicalRecord.vital_signs && Object.keys(medicalRecord.vital_signs).length > 0) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("SIGNOS VITALES", 20, y);
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
    
    addSection("EXAMEN FÍSICO", medicalRecord.physical_exam);
    addSection("AYUDAS DIAGNÓSTICAS", medicalRecord.diagnostic_aids);
    addSection("DIAGNÓSTICO", medicalRecord.diagnosis);
    
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
    
    addSection("PLAN DE TRATAMIENTO", medicalRecord.treatment);
    addSection("EDUCACIÓN AL PACIENTE", medicalRecord.education);
    addSection("SEGUIMIENTO", medicalRecord.followup);
    
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
    
    addSection("CONSENTIMIENTO", medicalRecord.consent);
    addSection("NOTAS DE EVOLUCIÓN", medicalRecord.evolution_notes);
    addSection("NOTAS ADICIONALES", medicalRecord.notes);
    
    // Firma
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;
    
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
