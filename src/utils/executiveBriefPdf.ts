import jsPDF from 'jspdf';

const COLORS = {
  darkBg: [10, 15, 28] as [number, number, number],
  primaryBg: [15, 23, 42] as [number, number, number],
  accent: [56, 189, 248] as [number, number, number],
  accentGreen: [52, 211, 153] as [number, number, number],
  accentPurple: [168, 85, 247] as [number, number, number],
  accentOrange: [251, 146, 60] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [203, 213, 225] as [number, number, number],
  midGray: [148, 163, 184] as [number, number, number],
  cardBg: [30, 41, 59] as [number, number, number],
};

const W = 297;
const H = 210;
const TOTAL = 8;

function bg(doc: jsPDF) {
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, W, H, 'F');
}

function line(doc: jsPDF, y: number) {
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(20, y, 80, y);
}

function num(doc: jsPDF, n: number) {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.midGray);
  doc.text(`${n} / ${TOTAL}`, W - 20, H - 8, { align: 'right' });
  doc.text('MEDMIND — Confidencial', 20, H - 8);
}

function card(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');
}

export function generateExecutiveBriefPDF(): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── SLIDE 1: Cover ──
  bg(doc);
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, 6, H, 'F');
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('MEDMIND', 30, 70);
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.accent);
  doc.text('Inteligencia Clínica con IA para Médicos', 30, 85);
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.lightGray);
  doc.text('Presentación Ejecutiva para Aliados Estratégicos', 30, 100);
  line(doc, 108);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text('Marzo 2026 · Documento Confidencial', 30, 118);
  doc.text('medmind-connect-ai.lovable.app', 30, 126);
  num(doc, 1);

  // ── SLIDE 2: El Problema Real ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('EL PROBLEMA REAL', 20, 20);
  line(doc, 24);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Los Médicos Están Ahogados en Papeleo', 20, 42);

  const problems = [
    { icon: '⏱', title: '40% del Tiempo Perdido', desc: 'Los médicos dedican casi la mitad de su jornada a tareas administrativas en lugar de atender pacientes.' },
    { icon: '😩', title: 'Burnout del 62%', desc: 'El agotamiento profesional en médicos de LatAm es alarmante, impulsado por la carga de documentación.' },
    { icon: '📋', title: 'Sistemas Fragmentados', desc: 'Notas a mano, formularios en papel y sistemas desconectados generan errores e ineficiencia clínica.' },
    { icon: '💸', title: 'Costos Ocultos Millonarios', desc: 'La sobrecarga administrativa por médico cuesta entre $50K-$150K USD al año en Latinoamérica.' },
  ];

  problems.forEach((p, i) => {
    const x = 20 + (i % 2) * 138;
    const y = 55 + Math.floor(i / 2) * 55;
    card(doc, x, y, 128, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`${p.icon}  ${p.title}`, x + 8, y + 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(p.desc, 112);
    doc.text(lines, x + 8, y + 24);
  });
  num(doc, 2);

  // ── SLIDE 3: Qué es MEDMIND ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('QUÉ ES MEDMIND', 20, 20);
  line(doc, 24);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('El Doctor Habla, la Historia se Llena Sola', 20, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const desc3 = doc.splitTextToSize(
    'MEDMIND es una plataforma clínica todo-en-uno potenciada por Inteligencia Artificial. Transforma la voz del médico en historias clínicas estructuradas, automatiza la facturación electrónica ante la DIAN, gestiona citas con un agente IA por WhatsApp, y conecta a profesionales de la salud en una red social médica — todo desde un solo lugar.',
    257
  );
  doc.text(desc3, 20, 56);

  const benefits = [
    { title: 'Para el Médico', desc: 'Recupera horas de su día. Dicta en vez de escribir. Genera documentos con un clic.', color: COLORS.accent },
    { title: 'Para la Clínica', desc: 'Facturación DIAN automática. RIPS sin errores. Control de inventario inteligente.', color: COLORS.accentGreen },
    { title: 'Para el Paciente', desc: 'Agendamiento 24/7 por WhatsApp. Atención más rápida. Mejor experiencia.', color: COLORS.accentPurple },
    { title: 'Para el Ecosistema', desc: 'Datos clínicos estructurados. Análisis predictivo. Red de referencia profesional.', color: COLORS.accentOrange },
  ];

  benefits.forEach((b, i) => {
    const x = 20 + i * 67;
    card(doc, x, 85, 62, 60);
    doc.setFillColor(b.color[0], b.color[1], b.color[2]);
    doc.roundedRect(x, 85, 62, 3, 1, 1, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(b.title, x + 6, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(b.desc, 50);
    doc.text(lines, x + 6, 108);
  });
  num(doc, 3);

  // ── SLIDE 4: Fortalezas ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('LO MEJOR QUE TENEMOS', 20, 20);
  line(doc, 24);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('6 Capacidades que nos Diferencian', 20, 42);

  const strengths = [
    { title: 'VoiceNotes MD', desc: 'Transcripción clínica con IA en tiempo real. El médico habla, la historia clínica se estructura sola.', color: COLORS.accent },
    { title: 'Agente WhatsApp 24/7', desc: 'Secretaria virtual con IA que agenda citas, responde preguntas y gestiona pacientes automáticamente.', color: COLORS.accentGreen },
    { title: 'Facturación DIAN', desc: 'Facturación electrónica automática con emisión a DIAN vía Siigo, Alegra o Alanube, sin intervención manual.', color: COLORS.accentPurple },
    { title: 'RIPS Automático', desc: 'Generación y validación automatizada de archivos RIPS para reporte regulatorio ante el MinSalud.', color: COLORS.accentOrange },
    { title: 'Análisis Predictivo', desc: 'IA que detecta tendencias clínicas, riesgos de no-show y patrones de productividad del consultorio.', color: COLORS.accent },
    { title: 'Red Social Médica', desc: 'Comunidad profesional para discusión de casos, referidos entre colegas y contenido educativo.', color: COLORS.accentGreen },
  ];

  strengths.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 20 + col * 89;
    const y = 52 + row * 55;
    card(doc, x, y, 84, 48);
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.roundedRect(x, y, 84, 3, 1, 1, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(s.title, x + 6, y + 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(s.desc, 72);
    doc.text(lines, x + 6, y + 23);
  });
  num(doc, 4);

  // ── SLIDE 5: Transparencia ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accentOrange);
  doc.text('LO QUE ESTAMOS MEJORANDO', 20, 20);
  line(doc, 24);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Transparencia: Áreas en Desarrollo', 20, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const transDesc = doc.splitTextToSize(
    'Creemos que la honestidad genera confianza. Estas son las áreas donde estamos trabajando activamente para mejorar antes del lanzamiento comercial:',
    257
  );
  doc.text(transDesc, 20, 55);

  const improvements = [
    { title: 'UX Mobile', desc: 'Estamos optimizando la experiencia en dispositivos móviles para que sea igual de fluida que en desktop. App nativa en roadmap.', icon: '📱' },
    { title: 'Onboarding Guiado', desc: 'Implementando un asistente paso a paso para que nuevos médicos configuren su consultorio en menos de 10 minutos.', icon: '🎯' },
    { title: 'Integraciones EHR', desc: 'Desarrollando conectores con sistemas de historia clínica existentes (HL7/FHIR) para migración sin fricción.', icon: '🔗' },
    { title: 'Más Especialidades', desc: 'Expandiendo plantillas y flujos clínicos para cubrir más allá de medicina general: dermatología, oftalmología, etc.', icon: '🏥' },
    { title: 'App Nativa iOS/Android', desc: 'Versión nativa con soporte offline para consultas en zonas con conectividad limitada. Planeada para Q4 2026.', icon: '📲' },
  ];

  improvements.forEach((imp, i) => {
    const x = 20;
    const y = 70 + i * 24;
    card(doc, x, y, 257, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.accentOrange);
    doc.text(`${imp.icon}  ${imp.title}`, x + 8, y + 9);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    doc.text(doc.splitTextToSize(imp.desc, 170), x + 70, y + 9);
  });
  num(doc, 5);

  // ── SLIDE 6: Etapa Actual ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accentGreen);
  doc.text('ETAPA ACTUAL', 20, 20);
  line(doc, 24);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  const stageTitle = doc.splitTextToSize('Finalizando Pruebas para Salida al Mercado', 257);
  doc.text(stageTitle, 20, 42);

  // Status cards
  const statuses = [
    { label: 'MVP Completo', value: '12+', sub: 'módulos operativos', color: COLORS.accentGreen },
    { label: 'Integración DIAN', value: '3', sub: 'proveedores conectados', color: COLORS.accent },
    { label: 'Flujos IA', value: '100%', sub: 'automatizados', color: COLORS.accentPurple },
    { label: 'Lanzamiento', value: 'Q3', sub: '2026', color: COLORS.accentOrange },
  ];

  statuses.forEach((s, i) => {
    const x = 20 + i * 67;
    card(doc, x, 55, 62, 48);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.midGray);
    doc.text(s.label, x + 31, 64, { align: 'center' });
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(s.color[0], s.color[1], s.color[2]);
    doc.text(s.value, x + 31, 82, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    doc.text(s.sub, x + 31, 92, { align: 'center' });
  });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Hitos Completados', 20, 118);

  const hitos = [
    '✅  EMR completo con transcripción IA — operativo',
    '✅  Facturación electrónica DIAN (Siigo, Alegra, Alanube) — integrada',
    '✅  Reportes RIPS regulatorios — automatizados',
    '✅  Agente IA WhatsApp — desplegado',
    '✅  Sistema multi-rol (Doctor, Paciente, Moderador) — activo',
    '🔜  Piloto con 50 médicos — Q3 2026',
  ];
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  hitos.forEach((h, i) => doc.text(h, 24, 128 + i * 9));
  num(doc, 6);

  // ── SLIDE 7: Cómo Pueden Ayudar ──
  doc.addPage();
  bg(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('OPORTUNIDAD DE ALIANZA', 20, 20);
  line(doc, 24);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Cómo Pueden Ser Parte del Cambio', 20, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const allianceDesc = doc.splitTextToSize(
    'Buscamos aliados estratégicos que compartan la visión de transformar la salud en Latinoamérica. Estas son las formas en que pueden contribuir:',
    257
  );
  doc.text(allianceDesc, 20, 55);

  const ways = [
    { title: 'Conectar con Médicos Piloto', desc: 'Recomendarnos 5-10 médicos en su red que quieran probar MEDMIND gratis durante 3 meses.', color: COLORS.accent },
    { title: 'Instituciones Educativas', desc: 'Facilitar acceso a facultades de medicina para demos y programas de adopción temprana.', color: COLORS.accentGreen },
    { title: 'Clínicas y Centros Médicos', desc: 'Presentarnos ante directores de clínicas privadas interesadas en digitalizar sus operaciones.', color: COLORS.accentPurple },
    { title: 'Validación Clínica', desc: 'Participar como evaluador del producto para dar retroalimentación experta antes del lanzamiento.', color: COLORS.accentOrange },
  ];

  ways.forEach((w, i) => {
    const x = 20 + (i % 2) * 138;
    const y = 72 + Math.floor(i / 2) * 52;
    card(doc, x, y, 128, 44);
    doc.setFillColor(w.color[0], w.color[1], w.color[2]);
    doc.roundedRect(x, y, 128, 3, 1, 1, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(w.title, x + 8, y + 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(w.desc, 112);
    doc.text(lines, x + 8, y + 25);
  });
  num(doc, 7);

  // ── SLIDE 8: Contacto ──
  doc.addPage();
  bg(doc);
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, 6, H, 'F');

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('SIGUIENTE PASO', 30, 25);
  line(doc, 29);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Agendemos una Demo Personalizada', 30, 50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const closingDesc = doc.splitTextToSize(
    'Queremos mostrarle cómo MEDMIND puede transformar la operación clínica de su institución. Una demo de 20 minutos es todo lo que necesitamos para demostrar el impacto.',
    237
  );
  doc.text(closingDesc, 30, 68);

  card(doc, 30, 88, 237, 65);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('Información de Contacto', 42, 102);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const contactInfo = [
    '🌐  Web: medmind-connect-ai.lovable.app',
    '📧  Email: contacto@medmind.ai',
    '📱  WhatsApp: Disponible en la plataforma',
    '📍  Bogotá, Colombia — Operando en toda Latinoamérica',
  ];
  contactInfo.forEach((c, i) => doc.text(c, 42, 114 + i * 10));

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Juntos Podemos Transformar la Salud', 30, 175);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text('Este documento es confidencial y está destinado únicamente al destinatario.', 30, 190);
  num(doc, 8);

  return doc;
}
