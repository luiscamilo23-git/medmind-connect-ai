import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Building2, GraduationCap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 89000,
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    badge: null,
    description: 'Ideal para médicos recién independientes',
    features: [
      'Historia clínica electrónica',
      'VoiceNotes MD (transcripción IA)',
      'Pacientes ilimitados',
      'Agenda inteligente',
      '3 especialidades médicas',
      'Asistente IA',
      'Documentos médicos básicos',
    ],
    excluded: [
      'Facturación DIAN',
      'RIPS automatizados',
      'Agente WhatsApp IA',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 189000,
    icon: Star,
    color: 'from-emerald-500 to-emerald-600',
    badge: 'Más popular',
    description: 'Para médicos con consultorio establecido',
    features: [
      'Todo Starter incluido',
      'Facturación electrónica DIAN',
      'RIPS automatizados',
      'Agente IA WhatsApp 24/7',
      '10 especialidades médicas',
      'Documentos ilimitados',
      'Inventario clínico (SupplyLens)',
      'Analytics avanzado',
      'Red social médica',
    ],
    excluded: [],
  },
  {
    id: 'clinica',
    name: 'Clínica',
    price: 390000,
    icon: Building2,
    color: 'from-violet-500 to-violet-600',
    badge: null,
    description: 'Para clínicas con múltiples médicos',
    features: [
      'Todo Profesional incluido',
      'Hasta 5 médicos',
      'Dashboard centralizado',
      'Análisis predictivo IA',
      'Módulo de moderador',
      'Reportes ejecutivos',
      'Soporte prioritario',
    ],
    excluded: [],
  },
];

const universityPlan = {
  id: 'universidad',
  name: 'Universidad',
  price: 0,
  icon: GraduationCap,
  description: 'Para estudiantes de medicina (semestres 8-12)',
  features: [
    'Acceso completo para práctica',
    'Historia clínica + VoiceNotes',
    'Agenda de pacientes',
    'Asistente IA',
    'Sin facturación DIAN',
  ],
};

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);
    // Redirige al registro con el plan preseleccionado
    navigate(`/auth?plan=${planId}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-[#0D1B3E] text-white">
      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-4 py-1">
          30 días gratis · Sin tarjeta de crédito
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          El doctor habla,<br />
          <span className="text-emerald-400">la historia se escribe sola.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Planes diseñados para médicos colombianos. Cumplimiento DIAN, RIPS y MinSalud incluido.
        </p>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPro = plan.id === 'profesional';
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                  isPro
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-900/30 scale-[1.02]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white border-0 px-4 py-1 text-xs font-semibold">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-gray-400 mb-1">/mes</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">+ IVA · Cancela cuando quieras</p>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full mb-6 font-semibold ${
                    isPro
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {loading === plan.id ? 'Cargando...' : 'Comenzar gratis 30 días'}
                </Button>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                      <span className="w-4 h-4 mt-0.5 shrink-0 text-center leading-4">✕</span>
                      <span className="text-gray-500">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* University plan */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Plan Universidad</h3>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Gratis</Badge>
              </div>
              <p className="text-gray-400 text-sm">{universityPlan.description}</p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-3 flex-1">
            {universityPlan.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-sm text-gray-300">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleSelectPlan('universidad')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shrink-0"
          >
            Acceso gratuito
          </Button>
        </div>

        {/* Bottom trust */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Todos los planes incluyen</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            {['Cumplimiento DIAN', 'Normas MinSalud', 'HTTPS + Cifrado E2E', 'MFA incluido', 'Soporte en español', 'Cancela cuando quieras'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
