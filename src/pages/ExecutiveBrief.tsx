import { Button } from "@/components/ui/button";
import { Download, Presentation } from "lucide-react";
import { generateExecutiveBriefPDF } from "@/utils/executiveBriefPdf";
import { useNavigate } from "react-router-dom";

const slides = [
  { num: 1, title: "Portada", desc: "MEDMIND — Inteligencia Clínica con IA · Presentación para Aliados Estratégicos" },
  { num: 2, title: "El Problema Real", desc: "40% del tiempo en papeleo, burnout del 62%, sistemas fragmentados" },
  { num: 3, title: "Qué es MEDMIND", desc: "El doctor habla, la historia se llena sola — plataforma todo-en-uno con IA" },
  { num: 4, title: "Fortalezas", desc: "VoiceNotes MD, Agente WhatsApp 24/7, DIAN, RIPS, Análisis Predictivo, Red Social" },
  { num: 5, title: "Transparencia", desc: "Lo que estamos mejorando: UX mobile, onboarding, integraciones EHR, app nativa" },
  { num: 6, title: "Etapa Actual", desc: "MVP completo con 12+ módulos — finalizando pruebas para salida Q3 2026" },
  { num: 7, title: "Alianza", desc: "Médicos piloto, instituciones educativas, clínicas, validación clínica" },
  { num: 8, title: "Contacto", desc: "Agendemos una demo personalizada de 20 minutos" },
];

const ExecutiveBrief = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    const doc = generateExecutiveBriefPDF();
    doc.save("MEDMIND_Executive_Brief_2026.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Presentation className="h-8 w-8 text-primary" />
              Presentación Ejecutiva
            </h1>
            <p className="text-muted-foreground mt-1">8 slides · Para aliados estratégicos y tomadores de decisión</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")}>
              ← Volver
            </Button>
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-5 w-5" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {slides.map((slide) => (
            <div
              key={slide.num}
              className="flex items-center gap-5 p-5 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                {slide.num}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{slide.title}</h3>
                <p className="text-sm text-muted-foreground">{slide.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={handleDownload} size="lg" className="gap-2 px-8">
            <Download className="h-5 w-5" />
            Descargar Presentación Ejecutiva PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveBrief;
