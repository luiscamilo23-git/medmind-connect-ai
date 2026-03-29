import { Link, useNavigate } from 'react-router-dom';
import { Check, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/ui/pricing';
import type { Plan } from '@/components/ui/pricing';

const PLANS: Plan[] = [
  {
    name: 'Starter',
    info: 'Para médicos recién independientes',
    price: { monthly: 89000, yearly: 89000 * 10 },
    highlighted: false,
    features: [
      { text: 'Historia clínica electrónica' },
      { text: 'VoiceNotes MD (transcripción IA)', tooltip: 'Graba la consulta y la IA genera la historia en segundos' },
      { text: 'Pacientes ilimitados' },
      { text: 'Agenda inteligente' },
      { text: '3 especialidades médicas' },
      { text: 'Asistente IA básico' },
      { text: 'Documentos médicos básicos' },
    ],
    btn: { text: 'Empezar gratis 30 días', href: '/auth?plan=starter' },
  },
  {
    name: 'Profesional',
    info: 'Para consultorios establecidos',
    price: { monthly: 189000, yearly: 189000 * 10 },
    highlighted: true,
    badge: 'Más popular',
    features: [
      { text: 'Todo Starter incluido' },
      { text: 'Facturación electrónica DIAN', tooltip: 'Generación y envío automático de facturas electrónicas a la DIAN' },
      { text: 'RIPS automatizados', tooltip: 'Registros Individuales de Prestación de Servicios generados en 1 clic' },
      { text: 'Agente IA WhatsApp 24/7', tooltip: 'Bot que confirma citas, responde pacientes y notifica al doctor' },
      { text: '10 especialidades médicas' },
      { text: 'Documentos ilimitados' },
      { text: 'Inventario clínico (SupplyLens)' },
      { text: 'Analytics avanzado' },
      { text: 'Red social médica' },
    ],
    btn: { text: 'Empezar gratis 30 días', href: '/auth?plan=profesional' },
  },
  {
    name: 'Clínica',
    info: 'Para clínicas con múltiples médicos',
    price: { monthly: 390000, yearly: 390000 * 10 },
    highlighted: false,
    features: [
      { text: 'Todo Profesional incluido' },
      { text: 'Hasta 5 médicos', tooltip: 'Cada médico con su propio perfil, agenda y pacientes' },
      { text: 'Dashboard centralizado' },
      { text: 'Análisis predictivo IA' },
      { text: 'Módulo de moderador' },
      { text: 'Reportes ejecutivos' },
      { text: 'Soporte prioritario', tooltip: 'Línea directa de soporte con respuesta en < 2 horas' },
    ],
    btn: { text: 'Hablar con ventas', href: '/auth?plan=clinica' },
  },
];

const ALL_INCLUDE = [
  'Cumplimiento DIAN',
  'Normas MinSalud',
  'HTTPS + Cifrado E2E',
  'MFA incluido',
  'Soporte en español',
  'Cancela cuando quieras',
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center pt-20 pb-4 px-4">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 text-sm px-4 py-1">
          30 días gratis · Sin tarjeta de crédito
        </Badge>
        <p className="text-muted-foreground text-base max-w-xl mx-auto mt-2">
          Planes diseñados para médicos colombianos. Cumplimiento DIAN, RIPS y MinSalud incluido.
        </p>
      </div>

      {/* Pricing cards */}
      <PricingSection
        plans={PLANS}
        heading="Planes y precios"
        description="Sin costos ocultos. Cancela cuando quieras."
        showToggle={true}
        className="pb-6"
      />

      {/* University plan */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-6 flex flex-col md:flex-row items-center gap-6 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold">Plan Universidad</h3>
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">Gratis</Badge>
              </div>
              <p className="text-muted-foreground text-sm">Para estudiantes de medicina (semestres 8-12)</p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 flex-1">
            {['Historia clínica + VoiceNotes', 'Agenda de pacientes', 'Asistente IA', 'Sin facturación DIAN'].map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => navigate('/auth?plan=universidad')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shrink-0"
          >
            Acceso gratuito
          </Button>
        </div>
      </div>

      {/* Trust row */}
      <div className="pb-16 text-center px-4">
        <p className="text-muted-foreground text-sm mb-4">Todos los planes incluyen</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {ALL_INCLUDE.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              {item}
            </span>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          ¿Tienes dudas? Escríbenos a{' '}
          <a href="mailto:soporte@medmind.co" className="text-primary hover:underline">
            soporte@medmind.co
          </a>
        </p>
      </div>
    </div>
  );
}
