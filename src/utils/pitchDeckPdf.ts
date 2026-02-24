import jsPDF from 'jspdf';

const COLORS = {
  darkBg: [10, 15, 28] as [number, number, number],
  primaryBg: [15, 23, 42] as [number, number, number],
  accent: [56, 189, 248] as [number, number, number],
  accentGreen: [52, 211, 153] as [number, number, number],
  accentPurple: [168, 85, 247] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [203, 213, 225] as [number, number, number],
  midGray: [148, 163, 184] as [number, number, number],
  cardBg: [30, 41, 59] as [number, number, number],
};

const W = 297; // A4 landscape width
const H = 210; // A4 landscape height

function drawBackground(doc: jsPDF) {
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, W, H, 'F');
}

function drawAccentLine(doc: jsPDF, y: number) {
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(20, y, 80, y);
}

function drawSlideNumber(doc: jsPDF, num: number, total: number) {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.midGray);
  doc.text(`${num} / ${total}`, W - 20, H - 8, { align: 'right' });
  doc.text('MEDMIND', 20, H - 8);
}

function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');
}

export function generatePitchDeckPDF(): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalSlides = 10;

  // ── SLIDE 1: Cover ──
  drawBackground(doc);
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, 6, H, 'F');
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('MEDMIND', 30, 75);
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.accent);
  doc.text('AI-Powered Clinical Intelligence for Doctors', 30, 90);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.lightGray);
  doc.text('Pitch Deck 2025', 30, 108);
  drawAccentLine(doc, 115);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text('medmind-connect-ai.lovable.app', 30, 125);
  drawSlideNumber(doc, 1, totalSlides);

  // ── SLIDE 2: Problem ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('THE PROBLEM', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Doctors Are Drowning in Paperwork', 20, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const problems = [
    { icon: '⏱', title: '40% of Time Lost', desc: 'Physicians spend nearly half their day on administrative tasks instead of patient care.' },
    { icon: '📋', title: 'Manual Record-Keeping', desc: 'Handwritten notes, paper forms, and disconnected systems cause errors and inefficiencies.' },
    { icon: '💸', title: '$150K+ Annual Cost', desc: 'Administrative overhead per physician in Latin America averages $50-150K yearly.' },
    { icon: '😩', title: 'Burnout Epidemic', desc: '62% of physicians in LatAm report burnout, primarily driven by documentation burden.' },
  ];

  problems.forEach((p, i) => {
    const x = 20 + (i % 2) * 138;
    const y = 55 + Math.floor(i / 2) * 55;
    drawCard(doc, x, y, 128, 45);
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
  drawSlideNumber(doc, 2, totalSlides);

  // ── SLIDE 3: Solution ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('THE SOLUTION', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('MEDMIND: Your AI Clinical Co-Pilot', 20, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const solDesc = doc.splitTextToSize(
    'MEDMIND transforms clinical workflows with real-time AI transcription, automated document generation, and intelligent billing—all unified in one platform designed for Latin American healthcare.',
    257
  );
  doc.text(solDesc, 20, 55);

  const features = [
    { title: 'VoiceNotes MD', desc: 'Speak naturally during consultations. AI transcribes, structures, and populates the medical record in real-time.', color: COLORS.accent },
    { title: 'Smart Documents', desc: 'Auto-generate prescriptions, lab orders, referrals, disability certificates—all from voice input.', color: COLORS.accentGreen },
    { title: 'AI WhatsApp Agent', desc: '24/7 virtual secretary that books appointments, answers patient queries, and handles scheduling.', color: COLORS.accentPurple },
    { title: 'DIAN Billing', desc: 'Compliant Colombian electronic invoicing with automatic RIPS generation and tax reporting.', color: COLORS.accent },
  ];

  features.forEach((f, i) => {
    const x = 20 + i * 67;
    drawCard(doc, x, 75, 62, 65);
    doc.setFillColor(...f.color);
    doc.roundedRect(x, 75, 62, 3, 1, 1, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(f.title, x + 6, 90);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(f.desc, 50);
    doc.text(lines, x + 6, 98);
  });
  drawSlideNumber(doc, 3, totalSlides);

  // ── SLIDE 4: Product ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('PRODUCT', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Full-Stack Clinical Platform', 20, 42);

  const modules = [
    ['VoiceNotes MD', 'Real-time AI transcription & structured clinical records'],
    ['Smart Scheduler', 'AI-optimized appointment management with auto-reminders'],
    ['Patient Management', 'Complete EMR with medical history, allergies, vitals'],
    ['Document Generator', 'Prescriptions, lab orders, referrals, certificates from voice'],
    ['DIAN E-Invoicing', 'Compliant Colombian billing via Siigo, Alegra, or Alanube'],
    ['RIPS Generator', 'Automated regulatory health records for Colombian reporting'],
    ['SupplyLens', 'Inventory management with expiration alerts & usage analytics'],
    ['Medical Social Network', 'Professional community for case discussions & referrals'],
    ['Analytics Dashboard', 'Revenue, patient flow, and clinical productivity insights'],
    ['WhatsApp AI Agent', '24/7 automated patient communication & appointment booking'],
    ['Predictive Analysis', 'AI-driven clinical risk assessment and trend detection'],
    ['Multi-Role Access', 'Doctor, patient, moderator portals with granular permissions'],
  ];

  modules.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 20 + col * 89;
    const y = 52 + row * 35;
    drawCard(doc, x, y, 84, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text(m[0], x + 5, y + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(m[1], 74);
    doc.text(lines, x + 5, y + 17);
  });
  drawSlideNumber(doc, 4, totalSlides);

  // ── SLIDE 5: Market ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('MARKET OPPORTUNITY', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('A $12B Untapped LatAm Market', 20, 42);

  const marketData = [
    { label: 'TAM', value: '$12B', desc: 'Healthcare IT in Latin America' },
    { label: 'SAM', value: '$3.2B', desc: 'Clinical software for private practice' },
    { label: 'SOM', value: '$180M', desc: 'Colombia + initial LatAm expansion' },
  ];

  marketData.forEach((m, i) => {
    const x = 20 + i * 89;
    drawCard(doc, x, 52, 84, 45);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.midGray);
    doc.text(m.label, x + 42, 62, { align: 'center' });
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text(m.value, x + 42, 80, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    doc.text(m.desc, x + 42, 90, { align: 'center' });
  });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Why Now?', 20, 115);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const whyNow = [
    '• 1.2M+ physicians in LatAm, 85% still use paper or fragmented systems',
    '• Colombia mandated electronic invoicing (DIAN) — creating urgent digital adoption',
    '• Post-pandemic telehealth boom normalized AI in healthcare workflows',
    '• No dominant AI-native clinical platform exists in Spanish-speaking markets',
  ];
  whyNow.forEach((w, i) => doc.text(w, 24, 125 + i * 8));
  drawSlideNumber(doc, 5, totalSlides);

  // ── SLIDE 6: Business Model ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('BUSINESS MODEL', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('SaaS + Usage-Based Revenue', 20, 42);

  const plans = [
    { name: 'Starter', price: '$29/mo', features: ['Basic EMR & scheduling', 'Up to 50 patients', 'Manual billing', 'Email support'] },
    { name: 'Professional', price: '$79/mo', features: ['VoiceNotes MD (AI)', 'Unlimited patients', 'DIAN e-invoicing', 'WhatsApp Agent', 'Priority support'] },
    { name: 'Enterprise', price: '$149/mo', features: ['All Professional features', 'Multi-location support', 'Custom integrations', 'Dedicated account manager', 'Advanced analytics'] },
  ];

  plans.forEach((p, i) => {
    const x = 20 + i * 89;
    const isPro = i === 1;
    if (isPro) {
      doc.setFillColor(...COLORS.accent);
      doc.roundedRect(x - 1, 51, 86, 108, 4, 4, 'F');
    }
    drawCard(doc, x, 52, 84, 105);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const textColor = isPro ? COLORS.accent : COLORS.white;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(p.name, x + 42, 66, { align: 'center' });
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.white);
    doc.text(p.price, x + 42, 82, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    p.features.forEach((f, fi) => doc.text(`✓  ${f}`, x + 8, 95 + fi * 9));
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text('Additional revenue: AI usage overage fees, marketplace commissions, premium integrations', 20, H - 20);
  drawSlideNumber(doc, 6, totalSlides);

  // ── SLIDE 7: Traction ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('TRACTION', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Early Momentum & Validation', 20, 42);

  const metrics = [
    { value: 'MVP Live', label: 'Full platform deployed' },
    { value: '12+', label: 'Core modules built' },
    { value: '3', label: 'DIAN providers integrated' },
    { value: '100%', label: 'AI-powered workflows' },
  ];

  metrics.forEach((m, i) => {
    const x = 20 + i * 67;
    drawCard(doc, x, 52, 62, 40);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.accentGreen);
    doc.text(m.value, x + 31, 70, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    doc.text(m.label, x + 31, 82, { align: 'center' });
  });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Key Milestones', 20, 108);

  const milestones = [
    '✅  Full EMR with AI transcription — operational',
    '✅  DIAN electronic invoicing (Siigo, Alegra, Alanube) — integrated',
    '✅  RIPS regulatory reporting — automated',
    '✅  WhatsApp AI Agent — deployed',
    '✅  Multi-role system (Doctor, Patient, Moderator) — live',
    '🔜  Beta launch with 50 pilot physicians — Q1 2025',
  ];
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  milestones.forEach((m, i) => doc.text(m, 24, 118 + i * 9));
  drawSlideNumber(doc, 7, totalSlides);

  // ── SLIDE 8: Roadmap ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('ROADMAP', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Path to Market Leadership', 20, 42);

  const phases = [
    { q: 'Q1-Q2 2025', title: 'Launch', items: ['Beta with 50 physicians', 'Onboarding optimization', 'Patient mobile app', 'Collect NPS & iterate'] },
    { q: 'Q3-Q4 2025', title: 'Scale', items: ['500+ active doctors', 'Marketplace launch', 'Telehealth integration', 'Peru & Mexico expansion'] },
    { q: '2026', title: 'Expand', items: ['5,000+ physicians', 'Insurance integrations', 'Clinical decision AI', 'Series A fundraise'] },
    { q: '2027+', title: 'Dominate', items: ['LatAm market leader', 'Hospital partnerships', 'Population health data', 'IPO preparation'] },
  ];

  phases.forEach((p, i) => {
    const x = 20 + i * 67;
    drawCard(doc, x, 52, 62, 100);
    const phaseColor = [COLORS.accent, COLORS.accentGreen, COLORS.accentPurple, COLORS.accent][i];
    doc.setFillColor(phaseColor[0], phaseColor[1], phaseColor[2]);
    doc.roundedRect(x, 52, 62, 3, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.midGray);
    doc.text(p.q, x + 6, 64);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(p.title, x + 6, 74);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    p.items.forEach((item, ii) => doc.text(`• ${item}`, x + 6, 85 + ii * 10));
  });
  drawSlideNumber(doc, 8, totalSlides);

  // ── SLIDE 9: Team ──
  doc.addPage();
  drawBackground(doc);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('TEAM', 20, 20);
  drawAccentLine(doc, 24);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Built by Healthcare + AI Experts', 20, 42);

  const team = [
    { role: 'CEO & Founder', desc: 'Healthcare technology entrepreneur with deep understanding of clinical workflows and physician pain points in LatAm.' },
    { role: 'CTO', desc: 'Full-stack engineer specialized in AI/ML, real-time systems, and scalable cloud architecture.' },
    { role: 'Medical Advisor', desc: 'Practicing physician with 15+ years experience. Ensures clinical accuracy and regulatory compliance.' },
    { role: 'Head of Growth', desc: 'B2B SaaS growth expert with track record scaling healthcare startups in Latin America.' },
  ];

  team.forEach((t, i) => {
    const x = 20 + (i % 2) * 138;
    const y = 55 + Math.floor(i / 2) * 55;
    drawCard(doc, x, y, 128, 45);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text(t.role, x + 8, y + 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(t.desc, 112);
    doc.text(lines, x + 8, y + 24);
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text('Advisors from leading healthcare institutions and technology companies across Colombia and Latin America.', 20, 170);
  drawSlideNumber(doc, 9, totalSlides);

  // ── SLIDE 10: Vision / Ask ──
  doc.addPage();
  drawBackground(doc);
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, 6, H, 'F');

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accent);
  doc.text('VISION & ASK', 30, 25);
  drawAccentLine(doc, 29);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  const visionLines = doc.splitTextToSize('Every Doctor in Latin America Deserves an AI Co-Pilot', 237);
  doc.text(visionLines, 30, 50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const visionDesc = doc.splitTextToSize(
    'We envision a future where no physician loses time to paperwork. Where every patient interaction is captured, structured, and actionable. Where healthcare administration is invisible—powered entirely by AI.',
    237
  );
  doc.text(visionDesc, 30, 75);

  drawCard(doc, 30, 100, 237, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('Pre-Seed Round: $500K', 40, 115);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightGray);
  const useOfFunds = [
    '40% — Engineering & AI development',
    '30% — Go-to-market & physician acquisition',
    '20% — Operations & compliance',
    '10% — Reserve',
  ];
  useOfFunds.forEach((u, i) => doc.text(u, 40, 126 + i * 8));

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text("Let's Transform Healthcare Together", 30, 175);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.accent);
  doc.text('medmind-connect-ai.lovable.app', 30, 186);
  drawSlideNumber(doc, 10, totalSlides);

  return doc;
}
