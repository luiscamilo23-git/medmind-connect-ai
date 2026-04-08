export interface CupsEntry {
  codigo: string;
  nombre: string;
  tipo: "CONSULTA" | "PROCEDIMIENTO" | "CIRUGIA" | "LABORATORIO" | "IMAGENES" | "TERAPIA" | "OTRO";
  keywords: string[];
}

export const CUPS_CATALOG: CupsEntry[] = [
  // ─── CONSULTAS GENERALES ───────────────────────────────────────────────────
  { codigo: "890201", nombre: "Consulta de primera vez por medicina general", tipo: "CONSULTA", keywords: ["consulta", "primera vez", "medicina general", "médico general", "general"] },
  { codigo: "890202", nombre: "Consulta de control o seguimiento por medicina general", tipo: "CONSULTA", keywords: ["consulta", "control", "seguimiento", "medicina general", "general"] },
  { codigo: "890203", nombre: "Consulta de urgencias por medicina general", tipo: "CONSULTA", keywords: ["urgencias", "urgencia", "emergencia", "medicina general"] },
  { codigo: "890206", nombre: "Consulta domiciliaria por medicina general", tipo: "CONSULTA", keywords: ["domiciliaria", "domicilio", "visita domiciliaria", "casa"] },

  // ─── CONSULTAS ESPECIALIZADAS ──────────────────────────────────────────────
  { codigo: "890301", nombre: "Consulta de primera vez por médico especialista", tipo: "CONSULTA", keywords: ["consulta", "primera vez", "especialista", "especialidad"] },
  { codigo: "890302", nombre: "Consulta de control o seguimiento por médico especialista", tipo: "CONSULTA", keywords: ["consulta", "control", "seguimiento", "especialista"] },
  { codigo: "890303", nombre: "Consulta de urgencias por médico especialista", tipo: "CONSULTA", keywords: ["urgencias", "especialista", "urgencia especialista"] },

  // ─── CARDIOLOGÍA ──────────────────────────────────────────────────────────
  { codigo: "890401", nombre: "Consulta primera vez por cardiología", tipo: "CONSULTA", keywords: ["cardiología", "cardiólogo", "corazón", "cardiovascular"] },
  { codigo: "890402", nombre: "Consulta control por cardiología", tipo: "CONSULTA", keywords: ["cardiología", "control cardio", "cardiólogo", "corazón"] },
  { codigo: "881501", nombre: "Electrocardiograma de 12 derivaciones", tipo: "PROCEDIMIENTO", keywords: ["electrocardiograma", "ecg", "ekg", "corazón", "ritmo"] },
  { codigo: "886101", nombre: "Ecocardiograma transtorácico", tipo: "PROCEDIMIENTO", keywords: ["ecocardiograma", "eco corazón", "ecografía cardiaca", "cardio"] },
  { codigo: "890601", nombre: "Holter de ritmo cardiaco 24 horas", tipo: "PROCEDIMIENTO", keywords: ["holter", "monitoreo cardiaco", "24 horas", "ritmo"] },
  { codigo: "890602", nombre: "Prueba de esfuerzo", tipo: "PROCEDIMIENTO", keywords: ["prueba esfuerzo", "ergometría", "treadmill", "stress test"] },

  // ─── DERMATOLOGÍA ─────────────────────────────────────────────────────────
  { codigo: "890451", nombre: "Consulta primera vez por dermatología", tipo: "CONSULTA", keywords: ["dermatología", "dermatologo", "piel", "dermatosis"] },
  { codigo: "890452", nombre: "Consulta control por dermatología", tipo: "CONSULTA", keywords: ["dermatología", "control piel", "dermatologo"] },
  { codigo: "441501", nombre: "Biopsia de piel", tipo: "PROCEDIMIENTO", keywords: ["biopsia", "piel", "muestra piel", "dermatología"] },
  { codigo: "441601", nombre: "Extirpación de lesión benigna de piel", tipo: "PROCEDIMIENTO", keywords: ["extirpación", "lesión piel", "quiste", "verruga", "lunar", "nevus"] },
  { codigo: "441602", nombre: "Crioterapia de lesiones cutáneas", tipo: "PROCEDIMIENTO", keywords: ["crioterapia", "nitrógeno líquido", "verrugas", "queratosis"] },

  // ─── GINECOLOGÍA Y OBSTETRICIA ────────────────────────────────────────────
  { codigo: "890501", nombre: "Consulta primera vez por ginecología", tipo: "CONSULTA", keywords: ["ginecología", "ginecólogo", "mujer", "gineco"] },
  { codigo: "890502", nombre: "Consulta control por ginecología", tipo: "CONSULTA", keywords: ["ginecología", "control ginecológico", "ginecólogo"] },
  { codigo: "890503", nombre: "Consulta control prenatal", tipo: "CONSULTA", keywords: ["prenatal", "embarazo", "control prenatal", "obstetricia", "gestante"] },
  { codigo: "883501", nombre: "Ecografía obstétrica", tipo: "IMAGENES", keywords: ["ecografía obstétrica", "eco embarazo", "ultrasonido embarazo", "feto"] },
  { codigo: "883502", nombre: "Ecografía transvaginal", tipo: "IMAGENES", keywords: ["ecografía transvaginal", "eco transvaginal", "pélvica"] },
  { codigo: "482201", nombre: "Citología cervicovaginal (Papanicolau)", tipo: "LABORATORIO", keywords: ["citología", "papanicolau", "cuello uterino", "cervix", "pap"] },
  { codigo: "572001", nombre: "Inserción de dispositivo intrauterino (DIU)", tipo: "PROCEDIMIENTO", keywords: ["diu", "espiral", "anticoncepción", "dispositivo intrauterino"] },
  { codigo: "572101", nombre: "Colposcopia", tipo: "PROCEDIMIENTO", keywords: ["colposcopia", "cuello uterino", "cervix", "ginecología"] },

  // ─── PEDIATRÍA ────────────────────────────────────────────────────────────
  { codigo: "890551", nombre: "Consulta primera vez por pediatría", tipo: "CONSULTA", keywords: ["pediatría", "pediatra", "niño", "niña", "infante"] },
  { codigo: "890552", nombre: "Consulta control por pediatría", tipo: "CONSULTA", keywords: ["pediatría", "control niño", "pediatra", "crecimiento desarrollo"] },
  { codigo: "890553", nombre: "Control de crecimiento y desarrollo", tipo: "CONSULTA", keywords: ["crecimiento", "desarrollo", "niño", "pediatría", "seguimiento"] },

  // ─── ORTOPEDIA Y TRAUMATOLOGÍA ────────────────────────────────────────────
  { codigo: "890651", nombre: "Consulta primera vez por ortopedia", tipo: "CONSULTA", keywords: ["ortopedia", "ortopédico", "traumatología", "hueso", "articulación"] },
  { codigo: "890652", nombre: "Consulta control por ortopedia", tipo: "CONSULTA", keywords: ["ortopedia", "control ortopédico", "traumatología"] },
  { codigo: "790101", nombre: "Radiografía de columna lumbar", tipo: "IMAGENES", keywords: ["radiografía", "columna", "lumbar", "rx columna", "espalda"] },
  { codigo: "790102", nombre: "Radiografía de columna cervical", tipo: "IMAGENES", keywords: ["radiografía", "columna cervical", "cuello", "rx cervical"] },
  { codigo: "790201", nombre: "Radiografía de rodilla", tipo: "IMAGENES", keywords: ["radiografía", "rodilla", "rx rodilla", "menisco"] },
  { codigo: "790301", nombre: "Radiografía de pie", tipo: "IMAGENES", keywords: ["radiografía", "pie", "tobillo", "rx pie"] },
  { codigo: "790401", nombre: "Radiografía de tórax", tipo: "IMAGENES", keywords: ["radiografía", "tórax", "rx tórax", "pulmón", "chest x-ray"] },

  // ─── OFTALMOLOGÍA ─────────────────────────────────────────────────────────
  { codigo: "890701", nombre: "Consulta primera vez por oftalmología", tipo: "CONSULTA", keywords: ["oftalmología", "ojos", "visión", "oftalmólogo"] },
  { codigo: "890702", nombre: "Consulta control por oftalmología", tipo: "CONSULTA", keywords: ["oftalmología", "control visual", "ojos"] },
  { codigo: "920201", nombre: "Examen de agudeza visual", tipo: "PROCEDIMIENTO", keywords: ["agudeza visual", "visión", "optometría", "graduación"] },
  { codigo: "920301", nombre: "Tonometría ocular", tipo: "PROCEDIMIENTO", keywords: ["tonometría", "presión ocular", "glaucoma"] },

  // ─── OTORRINOLARINGOLOGÍA ─────────────────────────────────────────────────
  { codigo: "890751", nombre: "Consulta primera vez por otorrinolaringología", tipo: "CONSULTA", keywords: ["otorrino", "oído", "nariz", "garganta", "otorrinolaringología"] },
  { codigo: "890752", nombre: "Consulta control por otorrinolaringología", tipo: "CONSULTA", keywords: ["otorrino", "control oído", "garganta"] },
  { codigo: "931201", nombre: "Audiometría tonal", tipo: "PROCEDIMIENTO", keywords: ["audiometría", "audición", "oído", "sordera"] },

  // ─── NEUROLOGÍA ───────────────────────────────────────────────────────────
  { codigo: "890801", nombre: "Consulta primera vez por neurología", tipo: "CONSULTA", keywords: ["neurología", "neurólogo", "cerebro", "nervios"] },
  { codigo: "890802", nombre: "Consulta control por neurología", tipo: "CONSULTA", keywords: ["neurología", "control neurológico", "neurólogo"] },
  { codigo: "881401", nombre: "Electroencefalograma", tipo: "PROCEDIMIENTO", keywords: ["electroencefalograma", "eeg", "cerebro", "epilepsia"] },

  // ─── PSIQUIATRÍA Y PSICOLOGÍA ─────────────────────────────────────────────
  { codigo: "890851", nombre: "Consulta primera vez por psiquiatría", tipo: "CONSULTA", keywords: ["psiquiatría", "psiquiatra", "salud mental", "mental"] },
  { codigo: "890852", nombre: "Consulta control por psiquiatría", tipo: "CONSULTA", keywords: ["psiquiatría", "control psiquiátrico", "salud mental"] },
  { codigo: "900301", nombre: "Consulta de primera vez por psicología", tipo: "CONSULTA", keywords: ["psicología", "psicólogo", "terapia psicológica", "mental"] },
  { codigo: "900302", nombre: "Sesión de psicoterapia individual", tipo: "TERAPIA", keywords: ["psicoterapia", "terapia individual", "psicología", "sesión"] },

  // ─── ENDOCRINOLOGÍA ───────────────────────────────────────────────────────
  { codigo: "890901", nombre: "Consulta primera vez por endocrinología", tipo: "CONSULTA", keywords: ["endocrinología", "endocrinólogo", "diabetes", "tiroides", "hormonas"] },
  { codigo: "890902", nombre: "Consulta control por endocrinología", tipo: "CONSULTA", keywords: ["endocrinología", "control diabetes", "tiroides"] },

  // ─── GASTROENTEROLOGÍA ────────────────────────────────────────────────────
  { codigo: "890951", nombre: "Consulta primera vez por gastroenterología", tipo: "CONSULTA", keywords: ["gastroenterología", "gastro", "estómago", "colon", "digestivo"] },
  { codigo: "890952", nombre: "Consulta control por gastroenterología", tipo: "CONSULTA", keywords: ["gastroenterología", "control gastro", "digestivo"] },
  { codigo: "451201", nombre: "Endoscopia digestiva alta", tipo: "PROCEDIMIENTO", keywords: ["endoscopia", "gastroscopia", "estómago", "endoscopía alta"] },
  { codigo: "451301", nombre: "Colonoscopia", tipo: "PROCEDIMIENTO", keywords: ["colonoscopia", "colon", "intestino", "colonoscopía"] },

  // ─── UROLOGÍA ─────────────────────────────────────────────────────────────
  { codigo: "891001", nombre: "Consulta primera vez por urología", tipo: "CONSULTA", keywords: ["urología", "urólogo", "próstata", "riñón", "vejiga"] },
  { codigo: "891002", nombre: "Consulta control por urología", tipo: "CONSULTA", keywords: ["urología", "control urológico", "próstata"] },

  // ─── MEDICINA INTERNA ─────────────────────────────────────────────────────
  { codigo: "891051", nombre: "Consulta primera vez por medicina interna", tipo: "CONSULTA", keywords: ["medicina interna", "internista", "internista"] },
  { codigo: "891052", nombre: "Consulta control por medicina interna", tipo: "CONSULTA", keywords: ["medicina interna", "control internista"] },

  // ─── REUMATOLOGÍA ─────────────────────────────────────────────────────────
  { codigo: "891101", nombre: "Consulta primera vez por reumatología", tipo: "CONSULTA", keywords: ["reumatología", "reumatólogo", "artritis", "lupus", "articulaciones"] },
  { codigo: "891102", nombre: "Consulta control por reumatología", tipo: "CONSULTA", keywords: ["reumatología", "control reumático", "artritis"] },

  // ─── LABORATORIO CLÍNICO ──────────────────────────────────────────────────
  { codigo: "903801", nombre: "Hemograma completo", tipo: "LABORATORIO", keywords: ["hemograma", "cuadro hemático", "sangre completo", "hematología"] },
  { codigo: "903802", nombre: "Glucosa en sangre", tipo: "LABORATORIO", keywords: ["glucosa", "azúcar", "glicemia", "diabetes"] },
  { codigo: "903803", nombre: "Perfil lipídico (colesterol total, HDL, LDL, triglicéridos)", tipo: "LABORATORIO", keywords: ["colesterol", "triglicéridos", "perfil lipídico", "lípidos", "hdl", "ldl"] },
  { codigo: "903804", nombre: "Creatinina sérica", tipo: "LABORATORIO", keywords: ["creatinina", "riñón", "función renal"] },
  { codigo: "903805", nombre: "Urea en sangre", tipo: "LABORATORIO", keywords: ["urea", "nitrógeno ureico", "función renal", "bun"] },
  { codigo: "903806", nombre: "TSH - Hormona estimulante de tiroides", tipo: "LABORATORIO", keywords: ["tsh", "tiroides", "tiroxina", "hipotiroidismo"] },
  { codigo: "903807", nombre: "Proteína C reactiva (PCR)", tipo: "LABORATORIO", keywords: ["proteína c reactiva", "pcr", "inflamación", "infección"] },
  { codigo: "903808", nombre: "Parcial de orina (uroanálisis)", tipo: "LABORATORIO", keywords: ["parcial de orina", "uroanálisis", "orina", "urina"] },
  { codigo: "903809", nombre: "Hemoglobina glicosilada (HbA1c)", tipo: "LABORATORIO", keywords: ["hemoglobina glicosilada", "hba1c", "diabetes", "glucosilada"] },
  { codigo: "903810", nombre: "Antígeno prostático específico (PSA)", tipo: "LABORATORIO", keywords: ["psa", "próstata", "antígeno prostático", "cáncer próstata"] },
  { codigo: "903811", nombre: "Prueba de embarazo (beta-HCG)", tipo: "LABORATORIO", keywords: ["beta hcg", "embarazo", "prueba embarazo", "gonadotropina"] },
  { codigo: "903812", nombre: "Prueba de COVID-19 (PCR)", tipo: "LABORATORIO", keywords: ["covid", "coronavirus", "pcr covid", "sars-cov-2"] },
  { codigo: "903813", nombre: "Prueba rápida de antígenos COVID-19", tipo: "LABORATORIO", keywords: ["prueba rápida", "antígeno covid", "covid rápida"] },
  { codigo: "903814", nombre: "Cultivo y antibiograma", tipo: "LABORATORIO", keywords: ["cultivo", "antibiograma", "bacteria", "antibiotic"] },
  { codigo: "903815", nombre: "Tiempo de protrombina (PT/INR)", tipo: "LABORATORIO", keywords: ["protrombina", "pt", "inr", "coagulación", "warfarina"] },
  { codigo: "903816", nombre: "Transaminasas (ALT/AST)", tipo: "LABORATORIO", keywords: ["transaminasas", "alt", "ast", "hígado", "enzimas hepáticas"] },

  // ─── IMÁGENES DIAGNÓSTICAS ────────────────────────────────────────────────
  { codigo: "883201", nombre: "Ecografía abdominal y pélvica", tipo: "IMAGENES", keywords: ["ecografía abdominal", "eco abdominal", "ultrasonido", "abdomen"] },
  { codigo: "883202", nombre: "Ecografía de tiroides y paratiroides", tipo: "IMAGENES", keywords: ["eco tiroides", "ecografía tiroides", "paratiroides"] },
  { codigo: "883203", nombre: "Ecografía de partes blandas", tipo: "IMAGENES", keywords: ["ecografía partes blandas", "eco tejidos", "ultrasonido partes blandas"] },
  { codigo: "883204", nombre: "Ecografía doppler venoso de miembros inferiores", tipo: "IMAGENES", keywords: ["doppler venoso", "eco doppler", "trombosis", "várices"] },
  { codigo: "870101", nombre: "Tomografía computarizada de cráneo", tipo: "IMAGENES", keywords: ["tomografía cráneo", "tac cabeza", "scanner cerebro", "ct scan"] },
  { codigo: "870201", nombre: "Tomografía de tórax", tipo: "IMAGENES", keywords: ["tomografía tórax", "tac tórax", "pulmón scanner"] },
  { codigo: "870301", nombre: "Resonancia magnética de columna lumbar", tipo: "IMAGENES", keywords: ["resonancia", "rmn", "mri", "columna lumbar", "disco"] },
  { codigo: "870302", nombre: "Resonancia magnética de rodilla", tipo: "IMAGENES", keywords: ["resonancia rodilla", "rmn rodilla", "mri rodilla", "menisco"] },

  // ─── PROCEDIMIENTOS GENERALES ─────────────────────────────────────────────
  { codigo: "991001", nombre: "Sutura de herida simple", tipo: "PROCEDIMIENTO", keywords: ["sutura", "puntos", "herida", "laceracion", "costura"] },
  { codigo: "991002", nombre: "Retiro de puntos o suturas", tipo: "PROCEDIMIENTO", keywords: ["retiro puntos", "quitar puntos", "suturas", "retiro sutura"] },
  { codigo: "991003", nombre: "Curación de herida", tipo: "PROCEDIMIENTO", keywords: ["curación", "cura herida", "limpieza herida", "úlcera"] },
  { codigo: "991004", nombre: "Inyección intramuscular", tipo: "PROCEDIMIENTO", keywords: ["inyección", "intramuscular", "ampolla", "im"] },
  { codigo: "991005", nombre: "Aplicación de vacuna", tipo: "PROCEDIMIENTO", keywords: ["vacuna", "vacunación", "immunización", "biológico"] },
  { codigo: "991006", nombre: "Toma de muestra de sangre venosa", tipo: "PROCEDIMIENTO", keywords: ["toma de muestra", "flebotomía", "venopunción", "sangre"] },
  { codigo: "991007", nombre: "Nebulización", tipo: "PROCEDIMIENTO", keywords: ["nebulización", "nebulizar", "inhalación", "broncoespasmo"] },
  { codigo: "991008", nombre: "Electrocardiograma", tipo: "PROCEDIMIENTO", keywords: ["electrocardiograma", "ecg", "ekg", "corazón"] },
  { codigo: "991009", nombre: "Espirometría", tipo: "PROCEDIMIENTO", keywords: ["espirometría", "función pulmonar", "pulmón", "epoc", "asma"] },
  { codigo: "991010", nombre: "Drenaje de absceso", tipo: "PROCEDIMIENTO", keywords: ["drenaje", "absceso", "colección", "infección piel"] },

  // ─── EXAMEN MÉDICO ────────────────────────────────────────────────────────
  { codigo: "891001", nombre: "Examen médico general", tipo: "CONSULTA", keywords: ["examen médico", "chequeo", "check up", "examen general", "examen ingreso"] },
  { codigo: "891002", nombre: "Examen médico para certificado", tipo: "CONSULTA", keywords: ["certificado médico", "certificado laboral", "apto", "certificado"] },
  { codigo: "891003", nombre: "Examen médico preoperatorio", tipo: "CONSULTA", keywords: ["preoperatorio", "pre quirúrgico", "antes de cirugía", "preanestésico"] },
];

export function searchCups(query: string): CupsEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return CUPS_CATALOG.filter(entry => {
    const nombre = entry.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keywords = entry.keywords.join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return nombre.includes(q) || keywords.includes(q) || entry.codigo.includes(q);
  }).slice(0, 6);
}
