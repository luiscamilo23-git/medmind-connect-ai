import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, Sparkles, Clock, DollarSign, Brain, Zap, Users, AlertTriangle, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { BorderTrail } from "@/components/ui/pricing";
import { cn } from "@/lib/utils";

const categories = [
  {
    label: "Inteligencia Artificial",
    icon: Brain,
    rows: [
      { feature: "Transcripción voz → historia clínica", tooltip: "Graba la consulta con tu voz y la IA genera el documento completo", medmind: true, traditional: false },
      { feature: "Sugerencias en tiempo real", medmind: true, traditional: false },
      { feature: "Análisis predictivo de inventario", medmind: true, traditional: false },
      { feature: "Agente WhatsApp IA 24/7", tooltip: "El bot confirma citas, notifica resultados y responde pacientes automáticamente", medmind: true, traditional: false },
      { feature: "CIE-10 automático", tooltip: "Código de diagnóstico asignado por la IA sin búsqueda manual", medmind: true, traditional: "partial" },
    ],
  },
  {
    label: "Facturación y DIAN",
    icon: DollarSign,
    rows: [
      { feature: "Facturación electrónica DIAN", medmind: true, traditional: "partial" },
      { feature: "RIPS automáticos", tooltip: "Registros Individuales de Prestación de Servicios en 1 clic", medmind: true, traditional: false },
      { feature: "0 multas por errores de RIPS", medmind: true, traditional: false },
      { feature: "Resolución de habilitación incluida", medmind: true, traditional: false },
      { feature: "Precio mensual (médico independiente)", medmind: "$89,000 COP", traditional: "+$500,000 COP" },
    ],
  },
  {
    label: "Productividad",
    icon: Clock,
    rows: [
      { feature: "Tiempo de documentación por consulta", medmind: "~3 min", traditional: "~20 min" },
      { feature: "Configuración inicial", medmind: "< 1 hora", traditional: "Semanas" },
      { feature: "Acceso desde cualquier dispositivo", medmind: true, traditional: "partial" },
      { feature: "Actualizaciones automáticas", medmind: true, traditional: false },
      { feature: "Recordatorios automáticos de citas", medmind: true, traditional: "partial" },
    ],
  },
  {
    label: "Facilidad de Uso",
    icon: Zap,
    rows: [
      { feature: "Sin capacitación extensa", medmind: true, traditional: false },
      { feature: "Sin hardware adicional", medmind: true, traditional: false },
      { feature: "Soporte en español colombiano", medmind: true, traditional: false },
      { feature: "Cancela cuando quieras", medmind: true, traditional: false },
      { feature: "Onboarding guiado incluido", medmind: true, traditional: false },
    ],
  },
];

const roi = [
  { value: "87%", label: "Menos tiempo en papeleo", sub: "de 20 min a ~3 min por consulta" },
  { value: "$1.36M", label: "Ahorro mensual estimado", sub: "vs asistente admin + software tradicional" },
  { value: "< 1h", label: "Para estar operativo", sub: "sin instalaciones ni configuraciones complejas" },
];

type CellValue = boolean | string | "partial";

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  if (value === "partial") return <Minus className="h-5 w-5 text-amber-500 mx-auto" />;
  return <span className="text-sm font-semibold text-foreground">{value}</span>;
}

export default function Comparison() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center pt-20 pb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full mb-5 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Comparativa objetiva
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          MEDMIND vs{" "}
          <span className="text-muted-foreground">EMR Tradicionales</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          La misma historia clínica que antes te tomaba 20 minutos, ahora se genera sola en 3.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-8 gap-2">
              <Sparkles className="h-4 w-4" />
              Empezar gratis 30 días
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Ver precios
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        {/* Sticky header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-0 rounded-xl border border-border/60 overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Característica
          </div>
          <div className="w-36 px-4 py-3 bg-primary/10 border-l border-primary/20 text-center">
            <span className="text-sm font-black text-primary">MEDMIND</span>
          </div>
          <div className="w-36 px-4 py-3 bg-muted/20 border-l border-border/30 text-center">
            <span className="text-sm font-semibold text-muted-foreground">Tradicional</span>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat.label} className="rounded-xl border border-border/50 overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-muted/20 border-b border-border/40">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <cat.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold text-sm">{cat.label}</span>
            </div>

            {/* Rows */}
            {cat.rows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-[1fr_auto_auto] gap-0 items-center hover:bg-muted/30 transition-colors",
                  i !== cat.rows.length - 1 && "border-b border-border/30"
                )}
              >
                <div className="px-5 py-3 text-sm text-foreground flex items-center gap-1.5">
                  {row.tooltip ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="cursor-pointer border-b border-dashed border-muted-foreground/40">
                            {row.feature}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{row.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    row.feature
                  )}
                </div>
                <div className="w-36 border-l border-primary/10 bg-primary/5 py-3 px-4 text-center flex items-center justify-center">
                  <Cell value={row.medmind as CellValue} />
                </div>
                <div className="w-36 border-l border-border/20 py-3 px-4 text-center flex items-center justify-center">
                  <Cell value={row.traditional as CellValue} />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Incluido</span>
          <span className="flex items-center gap-1.5"><Minus className="h-3.5 w-3.5 text-amber-500" /> Parcial / con costo adicional</span>
          <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5 text-muted-foreground/40" /> No disponible</span>
        </div>

        {/* ROI */}
        <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-8 overflow-hidden">
          <BorderTrail size={70} />
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">Retorno de Inversión</h2>
            <p className="text-muted-foreground text-sm">Lo que ahorras cada mes con MEDMIND vs el sistema tradicional</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {roi.map((item) => (
              <div key={item.value} className="text-center p-5 bg-background rounded-lg border border-border/40">
                <div className="text-4xl font-black text-primary mb-1">{item.value}</div>
                <div className="text-sm font-semibold mb-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center pt-6 space-y-4">
          <h2 className="text-2xl font-black">¿Listo para recuperar 2 horas diarias?</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            30 días gratis. Sin tarjeta de crédito. Si MEDMIND no te ahorra mínimo 1 hora diaria, te devolvemos cada peso.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-10 gap-2">
              <Sparkles className="h-4 w-4" />
              Empezar ahora gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
