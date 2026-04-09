import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Stethoscope, Brain, Users, ArrowLeft, CheckCircle, Building2, BookOpen, Zap, HeartHandshake } from "lucide-react";

const BENEFITS = [
  { icon: Brain, title: "IA clínica real", desc: "Los estudiantes usan el mismo asistente IA que los médicos en ejercicio. No un simulador — la herramienta real." },
  { icon: Stethoscope, title: "Historia clínica con voz", desc: "Aprenden a documentar con dictado inteligente y autocompletado CUPS/CIE-10 desde el primer día de rotación." },
  { icon: Zap, title: "CUPS y CIE-10 automático", desc: "Olvidan el tarifario de memoria. La IA sugiere el código correcto según el diagnóstico, igual que en la práctica real." },
  { icon: HeartHandshake, title: "Humanización desde el pregrado", desc: "Aprenden desde el principio a mirar al paciente, no a la pantalla. Forman el hábito correcto." },
  { icon: Users, title: "Sin costo para instituciones", desc: "MedMind Edu es 100% gratuito para facultades de medicina y universidades que formen parte del programa." },
  { icon: BookOpen, title: "Herramienta del presente", desc: "El médico del futuro debe formarse con las herramientas del presente. MedMind cierra la brecha entre academia y práctica." },
];

const UNIVERSITIES = [
  "Universidad de Antioquia", "Universidad Nacional", "Universidad del Rosario",
  "Pontificia Universidad Javeriana", "Universidad CES", "Universidad EIA",
];

export default function StudentPortal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070B14] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#070B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold">MedMind <span className="text-violet-400">Edu</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a MedMind
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/auth")}>
            Acceder
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-6 px-4 py-1.5 text-sm">
            MedMind Edu · Gratuito para universidades
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Los médicos del futuro
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              merecen herramientas del presente
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Las facultades de medicina siguen enseñando con papel y bolígrafo.
            MedMind ofrece acceso <strong className="text-white">gratuito</strong> a su plataforma completa para que las universidades formen médicos con IA clínica real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-500 px-8 py-6 text-lg rounded-xl" onClick={() => navigate("/dashboard")}>
              <Building2 className="w-5 h-5 mr-2" />
              Solicitar acceso universitario
            </Button>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">La brecha que nadie cierra</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
            Los estudiantes aprenden medicina con métodos del siglo XX y llegan a la guardia con herramientas del siglo XXI sin saber usarlas.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "📚", title: "5-7 años de carrera", desc: "Formados en teoría. Sin exposición real a herramientas digitales clínicas." },
              { emoji: "😰", title: "Primera guardia sin prep", desc: "El primer día de práctica real es la primera vez que usan un sistema clínico." },
              { emoji: "⏱️", title: "40% del tiempo = papeleo", desc: "Un hábito que aprenden tarde y que les costará años de burnout superar." },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">La misma herramienta. Sin costo.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              No un simulador. No una versión recortada. Los estudiantes acceden a la plataforma MedMind completa — la misma que usan los médicos en ejercicio — de forma gratuita a través de su universidad.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:-translate-y-1 transition-all">
                <b.icon className="w-7 h-7 text-violet-400 mb-3" />
                <h3 className="font-bold text-white mb-2">{b.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACTO */}
      <section className="py-20 px-6 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">Impacto medible</Badge>
              <h2 className="text-4xl font-bold mb-6">Lo que cambia cuando formas médicos con IA</h2>
              <div className="space-y-4">
                {[
                  "Estudiantes que desde el pregrado documentan correctamente",
                  "Menos errores de codificación CUPS/CIE-10 en rotaciones",
                  "Historia clínica completa como hábito desde el primer día",
                  "Médicos que miran al paciente en lugar de a la pantalla",
                  "Reducción del burnout desde la formación inicial",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0D1420] border border-violet-500/20 rounded-2xl p-6 space-y-4">
              <p className="text-xs text-violet-400 uppercase tracking-wide font-semibold">Colombia en números</p>
              {[
                { label: "Estudiantes de medicina", value: "180.000+" },
                { label: "Facultades de medicina", value: "52" },
                { label: "Médicos que se gradúan/año", value: "~8.000" },
                { label: "Déficit de médicos activos", value: "30.000" },
                { label: "Tiempo perdido en papeleo", value: "40% de la consulta" },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-sm">{stat.label}</span>
                  <span className="text-white font-bold text-sm">{stat.value}</span>
                </div>
              ))}
              <p className="text-xs text-slate-600 mt-2">Fuentes: Minsalud, OPS Colombia 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* UNIVERSIDADES */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Universidades objetivo</h2>
          <p className="text-slate-400 mb-10">MedMind Edu busca alianzas con las principales facultades de medicina de Colombia</p>
          <div className="flex flex-wrap justify-center gap-3">
            {UNIVERSITIES.map(u => (
              <Badge key={u} className="bg-white/5 border-white/10 text-slate-300 px-4 py-2 text-sm">{u}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <GraduationCap className="w-12 h-12 text-violet-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Forma los médicos que Colombia necesita</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Sin costo para la universidad. Sin versión recortada. Con el respaldo científico de datos reales de la plataforma.
          </p>
          <Button size="lg" className="bg-violet-600 hover:bg-violet-500 px-10 py-6 text-lg rounded-xl" onClick={() => navigate("/dashboard")}>
            Solicitar programa universitario
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center space-y-2">
        <button className="text-slate-500 hover:text-white text-sm transition-colors" onClick={() => navigate("/dashboard")}>
          ← Volver al dashboard de MedMind
        </button>
        <p className="text-slate-700 text-xs">MedMind Edu — parte de la plataforma MedMind para médicos colombianos.</p>
      </footer>
    </div>
  );
}
