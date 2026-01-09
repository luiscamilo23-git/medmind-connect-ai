// Configuración de especialidades médicas y sus plantillas de historia clínica

export type MedicalSpecialty = 
  | "MEDICO_GENERAL"
  | "PEDIATRIA"
  | "GINECOLOGIA"
  | "MEDICINA_INTERNA"
  | "PSIQUIATRIA"
  | "CIRUGIA"
  | "ESTETICA"
  | "NUTRICION"
  | "FISIOTERAPIA"
  | "MEDICINA_LABORAL";

export interface SpecialtyConfig {
  id: MedicalSpecialty;
  name: string;
  description: string;
  hasFullClinicalRecord: boolean;
  additionalFields: SpecialtyField[];
  aiDocuments: AIDocumentType[];
}

export interface SpecialtyField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "date" | "checkbox" | "multiselect";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  section: "datos_paciente" | "antecedentes" | "examen" | "diagnostico" | "plan" | "especializado";
}

export type AIDocumentType = 
  | "formula_medica"
  | "incapacidad"
  | "orden_medica"
  | "resumen_clinico"
  | "carnet_crecimiento"
  | "indicaciones_cuidador"
  | "formula_pediatrica"
  | "orden_examenes"
  | "plan_anticonceptivo"
  | "control_prenatal"
  | "evolucion_clinica"
  | "plan_terapeutico_cronico"
  | "nota_clinica_narrativa"
  | "plan_terapeutico"
  | "certificado"
  | "consentimiento_informado"
  | "nota_operatoria"
  | "epicrisis"
  | "nota_simplificada";

// Campos base obligatorios para TODAS las historias clínicas
export const BASE_FIELDS: SpecialtyField[] = [
  // Datos del paciente
  { key: "patient_identification", label: "Identificación", type: "text", section: "datos_paciente", required: true },
  { key: "patient_name", label: "Nombre Completo", type: "text", section: "datos_paciente", required: true },
  { key: "age", label: "Edad", type: "text", section: "datos_paciente" },
  { key: "sex", label: "Sexo", type: "select", section: "datos_paciente", options: [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" }
  ]},
  { key: "phone", label: "Teléfono", type: "text", section: "datos_paciente" },
  { key: "address", label: "Dirección", type: "text", section: "datos_paciente" },
  
  // Datos del encuentro
  { key: "encounter_date", label: "Fecha y Hora", type: "text", section: "datos_paciente" },
  { key: "chief_complaint", label: "Motivo de Consulta", type: "textarea", section: "datos_paciente", required: true },
  { key: "current_illness", label: "Enfermedad Actual", type: "textarea", section: "datos_paciente" },
  
  // Antecedentes
  { key: "personal_history", label: "Antecedentes Personales", type: "textarea", section: "antecedentes" },
  { key: "family_history", label: "Antecedentes Familiares", type: "textarea", section: "antecedentes" },
  { key: "current_medications", label: "Medicamentos Actuales", type: "textarea", section: "antecedentes" },
  { key: "allergies", label: "Alergias", type: "textarea", section: "antecedentes" },
  
  // Signos vitales
  { key: "blood_pressure", label: "Presión Arterial", type: "text", section: "examen", placeholder: "120/80 mmHg" },
  { key: "heart_rate", label: "Frecuencia Cardíaca", type: "text", section: "examen", placeholder: "72 lpm" },
  { key: "respiratory_rate", label: "Frecuencia Respiratoria", type: "text", section: "examen", placeholder: "16 rpm" },
  { key: "temperature", label: "Temperatura", type: "text", section: "examen", placeholder: "36.5°C" },
  { key: "spo2", label: "SpO2", type: "text", section: "examen", placeholder: "98%" },
  { key: "weight", label: "Peso", type: "text", section: "examen", placeholder: "70 kg" },
  { key: "height", label: "Talla", type: "text", section: "examen", placeholder: "170 cm" },
  
  // Diagnóstico y Plan
  { key: "diagnosis", label: "Diagnóstico", type: "textarea", section: "diagnostico", required: true },
  { key: "cie10_code", label: "Código CIE-10", type: "text", section: "diagnostico" },
  { key: "treatment_plan", label: "Plan de Manejo", type: "textarea", section: "plan", required: true },
  
  // Firma y consentimiento
  { key: "doctor_signature", label: "Firma del Médico (Digital)", type: "text", section: "plan" },
  { key: "consent", label: "Consentimiento Informado", type: "textarea", section: "plan" },
];

// Configuración por especialidad
export const SPECIALTY_CONFIGS: Record<MedicalSpecialty, SpecialtyConfig> = {
  MEDICO_GENERAL: {
    id: "MEDICO_GENERAL",
    name: "Médico General",
    description: "Atención primaria y medicina familiar",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "ros", label: "Revisión por Sistemas", type: "textarea", section: "examen" },
      { key: "physical_exam", label: "Examen Físico General", type: "textarea", section: "examen" },
      { key: "risk_classification", label: "Clasificación de Riesgo", type: "select", section: "diagnostico", options: [
        { value: "bajo", label: "Bajo" },
        { value: "medio", label: "Medio" },
        { value: "alto", label: "Alto" },
        { value: "muy_alto", label: "Muy Alto" }
      ]},
      { key: "referrals", label: "Remisiones", type: "textarea", section: "plan" },
      { key: "disability_days", label: "Días de Incapacidad", type: "number", section: "plan" },
    ],
    aiDocuments: ["formula_medica", "incapacidad", "orden_medica", "resumen_clinico"],
  },
  
  PEDIATRIA: {
    id: "PEDIATRIA",
    name: "Pediatría",
    description: "Atención médica de niños y adolescentes",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "gestational_age", label: "Edad Gestacional", type: "text", section: "datos_paciente", placeholder: "ej: 38 semanas" },
      { key: "growth_development", label: "Control de Crecimiento y Desarrollo", type: "textarea", section: "examen" },
      { key: "vaccination_scheme", label: "Esquema de Vacunación", type: "textarea", section: "antecedentes" },
      { key: "weight_percentile", label: "Percentil Peso", type: "text", section: "examen" },
      { key: "height_percentile", label: "Percentil Talla", type: "text", section: "examen" },
      { key: "head_circumference", label: "Perímetro Cefálico", type: "text", section: "examen" },
      { key: "legal_guardian", label: "Acompañante Legal", type: "text", section: "datos_paciente" },
      { key: "perinatal_history", label: "Antecedentes Perinatales", type: "textarea", section: "antecedentes" },
      { key: "feeding_type", label: "Tipo de Alimentación", type: "select", section: "antecedentes", options: [
        { value: "lactancia_exclusiva", label: "Lactancia Materna Exclusiva" },
        { value: "lactancia_mixta", label: "Lactancia Mixta" },
        { value: "formula", label: "Fórmula" },
        { value: "alimentacion_complementaria", label: "Alimentación Complementaria" }
      ]},
    ],
    aiDocuments: ["carnet_crecimiento", "indicaciones_cuidador", "formula_pediatrica", "orden_medica"],
  },
  
  GINECOLOGIA: {
    id: "GINECOLOGIA",
    name: "Ginecología / Obstetricia",
    description: "Salud femenina y embarazo",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "gesta", label: "Gesta", type: "number", section: "antecedentes" },
      { key: "para", label: "Para (Partos)", type: "number", section: "antecedentes" },
      { key: "abortos", label: "Abortos", type: "number", section: "antecedentes" },
      { key: "cesareas", label: "Cesáreas", type: "number", section: "antecedentes" },
      { key: "fum", label: "FUM (Fecha Última Menstruación)", type: "date", section: "antecedentes" },
      { key: "menstrual_cycle", label: "Ciclo Menstrual", type: "text", section: "antecedentes", placeholder: "ej: 28 días / 5 días" },
      { key: "contraceptive_method", label: "Método Anticonceptivo", type: "select", section: "antecedentes", options: [
        { value: "ninguno", label: "Ninguno" },
        { value: "pildora", label: "Píldora" },
        { value: "diu", label: "DIU" },
        { value: "implante", label: "Implante" },
        { value: "preservativo", label: "Preservativo" },
        { value: "inyectable", label: "Inyectable" },
        { value: "ligadura", label: "Ligadura de Trompas" },
        { value: "otro", label: "Otro" }
      ]},
      { key: "prenatal_control", label: "Control Prenatal", type: "textarea", section: "especializado" },
      { key: "gestational_weeks", label: "Semanas de Gestación", type: "number", section: "especializado" },
      { key: "cytology", label: "Citología", type: "textarea", section: "antecedentes" },
      { key: "mammography", label: "Mamografía", type: "textarea", section: "antecedentes" },
    ],
    aiDocuments: ["orden_examenes", "plan_anticonceptivo", "control_prenatal", "formula_medica"],
  },
  
  MEDICINA_INTERNA: {
    id: "MEDICINA_INTERNA",
    name: "Medicina Interna",
    description: "Enfermedades de adultos y patologías complejas",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "chronic_pathologies", label: "Patologías Crónicas", type: "textarea", section: "antecedentes" },
      { key: "clinical_scales", label: "Escalas Clínicas", type: "textarea", section: "examen", placeholder: "ej: NYHA, CHA2DS2-VASc, etc." },
      { key: "deep_clinical_analysis", label: "Análisis Clínico Profundo", type: "textarea", section: "diagnostico" },
      { key: "longitudinal_followup", label: "Seguimiento Longitudinal", type: "textarea", section: "plan" },
      { key: "comorbidities", label: "Comorbilidades", type: "textarea", section: "antecedentes" },
      { key: "hospitalization_history", label: "Hospitalizaciones Previas", type: "textarea", section: "antecedentes" },
    ],
    aiDocuments: ["evolucion_clinica", "plan_terapeutico_cronico", "orden_examenes", "formula_medica"],
  },
  
  PSIQUIATRIA: {
    id: "PSIQUIATRIA",
    name: "Psiquiatría / Psicología Clínica",
    description: "Salud mental y trastornos psiquiátricos",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "mental_state_exam", label: "Examen del Estado Mental", type: "textarea", section: "examen" },
      { key: "diagnostic_scales", label: "Escalas Diagnósticas", type: "textarea", section: "examen", placeholder: "ej: Hamilton, Beck, MMSE, etc." },
      { key: "suicide_risk", label: "Riesgo Suicida", type: "select", section: "diagnostico", options: [
        { value: "ninguno", label: "Sin riesgo" },
        { value: "bajo", label: "Bajo" },
        { value: "moderado", label: "Moderado" },
        { value: "alto", label: "Alto" },
        { value: "inminente", label: "Inminente" }
      ]},
      { key: "emotional_followup", label: "Seguimiento Emocional", type: "textarea", section: "plan" },
      { key: "therapy_type", label: "Tipo de Terapia", type: "select", section: "plan", options: [
        { value: "cognitivo_conductual", label: "Cognitivo-Conductual" },
        { value: "psicodinamica", label: "Psicodinámica" },
        { value: "humanista", label: "Humanista" },
        { value: "sistemica", label: "Sistémica" },
        { value: "otra", label: "Otra" }
      ]},
      { key: "psychotropic_medications", label: "Medicamentos Psicotrópicos", type: "textarea", section: "plan" },
    ],
    aiDocuments: ["nota_clinica_narrativa", "plan_terapeutico", "certificado", "formula_medica"],
  },
  
  CIRUGIA: {
    id: "CIRUGIA",
    name: "Cirugía",
    description: "Procedimientos quirúrgicos",
    hasFullClinicalRecord: true,
    additionalFields: [
      { key: "surgical_diagnosis", label: "Diagnóstico Quirúrgico", type: "textarea", section: "diagnostico" },
      { key: "procedure", label: "Procedimiento", type: "textarea", section: "especializado" },
      { key: "surgical_risks", label: "Riesgos Quirúrgicos", type: "textarea", section: "especializado" },
      { key: "surgical_consent", label: "Consentimiento Quirúrgico", type: "textarea", section: "especializado" },
      { key: "postop_evolution", label: "Evolución Postoperatoria", type: "textarea", section: "especializado" },
      { key: "anesthesia_type", label: "Tipo de Anestesia", type: "select", section: "especializado", options: [
        { value: "local", label: "Local" },
        { value: "regional", label: "Regional" },
        { value: "general", label: "General" },
        { value: "sedacion", label: "Sedación" }
      ]},
      { key: "surgical_time", label: "Tiempo Quirúrgico", type: "text", section: "especializado" },
      { key: "bleeding", label: "Sangrado Estimado", type: "text", section: "especializado" },
    ],
    aiDocuments: ["consentimiento_informado", "nota_operatoria", "epicrisis", "formula_medica"],
  },
  
  // Especialidades sin historia clínica completa
  ESTETICA: {
    id: "ESTETICA",
    name: "Estética",
    description: "Procedimientos estéticos y cosméticos",
    hasFullClinicalRecord: false,
    additionalFields: [
      { key: "procedure_area", label: "Área del Procedimiento", type: "text", section: "especializado" },
      { key: "procedure_type", label: "Tipo de Procedimiento", type: "textarea", section: "especializado" },
      { key: "expected_results", label: "Resultados Esperados", type: "textarea", section: "especializado" },
      { key: "post_care", label: "Cuidados Post-procedimiento", type: "textarea", section: "plan" },
    ],
    aiDocuments: ["nota_simplificada", "consentimiento_informado"],
  },
  
  NUTRICION: {
    id: "NUTRICION",
    name: "Nutrición",
    description: "Nutrición y dietética",
    hasFullClinicalRecord: false,
    additionalFields: [
      { key: "nutritional_assessment", label: "Valoración Nutricional", type: "textarea", section: "examen" },
      { key: "bmi", label: "IMC", type: "text", section: "examen" },
      { key: "dietary_habits", label: "Hábitos Alimentarios", type: "textarea", section: "antecedentes" },
      { key: "meal_plan", label: "Plan Alimentario", type: "textarea", section: "plan" },
      { key: "caloric_goal", label: "Meta Calórica", type: "text", section: "plan" },
    ],
    aiDocuments: ["nota_simplificada", "plan_terapeutico"],
  },
  
  FISIOTERAPIA: {
    id: "FISIOTERAPIA",
    name: "Fisioterapia",
    description: "Rehabilitación física",
    hasFullClinicalRecord: false,
    additionalFields: [
      { key: "functional_assessment", label: "Valoración Funcional", type: "textarea", section: "examen" },
      { key: "pain_scale", label: "Escala de Dolor (EVA)", type: "number", section: "examen" },
      { key: "range_of_motion", label: "Rango de Movimiento", type: "textarea", section: "examen" },
      { key: "rehabilitation_plan", label: "Plan de Rehabilitación", type: "textarea", section: "plan" },
      { key: "exercise_prescription", label: "Prescripción de Ejercicios", type: "textarea", section: "plan" },
    ],
    aiDocuments: ["nota_simplificada", "plan_terapeutico"],
  },
  
  MEDICINA_LABORAL: {
    id: "MEDICINA_LABORAL",
    name: "Medicina Laboral",
    description: "Salud ocupacional",
    hasFullClinicalRecord: false,
    additionalFields: [
      { key: "occupational_risk", label: "Riesgo Ocupacional", type: "textarea", section: "antecedentes" },
      { key: "work_aptitude", label: "Aptitud Laboral", type: "select", section: "diagnostico", options: [
        { value: "apto", label: "Apto" },
        { value: "apto_restricciones", label: "Apto con Restricciones" },
        { value: "no_apto", label: "No Apto" },
        { value: "aplazado", label: "Aplazado" }
      ]},
      { key: "restrictions", label: "Restricciones", type: "textarea", section: "plan" },
      { key: "exam_type", label: "Tipo de Examen", type: "select", section: "datos_paciente", options: [
        { value: "ingreso", label: "Ingreso" },
        { value: "periodico", label: "Periódico" },
        { value: "egreso", label: "Egreso" },
        { value: "reubicacion", label: "Reubicación" }
      ]},
    ],
    aiDocuments: ["certificado", "nota_simplificada"],
  },
};

// Obtener todos los campos para una especialidad (base + específicos)
export const getFieldsForSpecialty = (specialty: MedicalSpecialty): SpecialtyField[] => {
  const config = SPECIALTY_CONFIGS[specialty];
  if (!config) return BASE_FIELDS;
  
  // Para especialidades sin historia clínica completa, retornar campos reducidos
  if (!config.hasFullClinicalRecord) {
    const simplifiedBaseFields = BASE_FIELDS.filter(f => 
      f.required || 
      f.section === "datos_paciente" || 
      ["diagnosis", "treatment_plan"].includes(f.key)
    );
    return [...simplifiedBaseFields, ...config.additionalFields];
  }
  
  return [...BASE_FIELDS, ...config.additionalFields];
};

// Obtener configuración de documentos AI para una especialidad
export const getAIDocumentsForSpecialty = (specialty: MedicalSpecialty): AIDocumentType[] => {
  const config = SPECIALTY_CONFIGS[specialty];
  return config?.aiDocuments || ["formula_medica", "orden_medica"];
};

// Etiquetas legibles para documentos AI
export const AI_DOCUMENT_LABELS: Record<AIDocumentType, string> = {
  formula_medica: "Fórmula Médica",
  incapacidad: "Incapacidad",
  orden_medica: "Orden Médica",
  resumen_clinico: "Resumen Clínico",
  carnet_crecimiento: "Carnet de Crecimiento",
  indicaciones_cuidador: "Indicaciones al Cuidador",
  formula_pediatrica: "Fórmula Pediátrica",
  orden_examenes: "Orden de Exámenes",
  plan_anticonceptivo: "Plan Anticonceptivo",
  control_prenatal: "Control Prenatal",
  evolucion_clinica: "Evolución Clínica",
  plan_terapeutico_cronico: "Plan Terapéutico Crónico",
  nota_clinica_narrativa: "Nota Clínica Narrativa",
  plan_terapeutico: "Plan Terapéutico",
  certificado: "Certificado Médico",
  consentimiento_informado: "Consentimiento Informado",
  nota_operatoria: "Nota Operatoria",
  epicrisis: "Epicrisis",
  nota_simplificada: "Nota Clínica Simplificada",
};

// Lista de especialidades para selects
export const SPECIALTY_OPTIONS = Object.values(SPECIALTY_CONFIGS).map(config => ({
  value: config.id,
  label: config.name,
  description: config.description,
  hasFullRecord: config.hasFullClinicalRecord,
}));
