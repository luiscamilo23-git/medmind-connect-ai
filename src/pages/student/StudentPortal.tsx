import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Brain, Users, ArrowRight, CheckCircle,
  Zap, BookOpen, Eye, Trophy, Clock, Star,
} from "lucide-react";

const STATS = [
  { value: "180.000", label: "Estudiantes de medicina en Colombia" },
  { value: "40%", label: "De la consulta se pierde en papeleo" },
  { value: "6 min", label: "Tiempo promedio de historia clínica con IA" },
  { value: "100%", label: "Gratis para estudiantes" },
];

const SIMULATOR_STEPS = [
  { icon: Brain, title: "Elige especialidad y dificultad", desc: "Urgencias, Pediatría, Medicina Interna, Cardiología, Neurología y más." },
  { icon: Stethoscope, title: "Enfrenta el caso real", desc: "La IA actúa como paciente. Pregunta síntomas, pide exámenes, examina. Sin trampa." },
  { icon: Trophy, title: "Recibe tu evaluación", desc: "Score, diagnóstico correcto, qué te faltó preguntar y perlas clínicas para no olvidar." },
];

const ROTATION_STEPS = [
  { icon: Users, title: "Tu médico genera un código", desc: "En su plataforma MedMind, el doctor crea un código de rotación de 6 dígitos." },
  { icon: Eye, title: "Ingresa al código", desc: "Ves en tiempo real cómo la IA ayuda al médico: historia, CUPS, sugerencias clínicas." },
  { icon: BookOpen, title: "Aprende y toma notas", desc: "Toma notas privadas durante la consulta. Al final recibes un resumen de aprendizaje." },
];

const FEATURES = [
  { icon: Brain, title: "Simulador de Casos Clínicos", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", desc: "La IA genera pacientes ficticios ultra-realistas. Practica diagnóstico diferencial, manejo y tratamiento sin riesgo para ningún paciente real." },
  { icon: Eye, title: "Modo Rotación", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", desc: "Observa consultas reales en tiempo real junto a tu médico tutor. Ve cómo la IA asiste, aprende el flujo real de la consulta moderna." },
  { icon: Zap, title: "Sin instalación, sin costo", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Accede desde cualquier dispositivo. MedMind Edu es 100% gratuito para estudiantes de medicina en Colombia." },
];

export default function StudentPortal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070B14] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#070B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">MedMind <span className="text-violet-400">Edu</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            ← Volver a MedMind
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate("/auth")}>
            Iniciar sesión
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/student/simulador")}>
            Empezar gratis
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        {/* Glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-6 px-4 py-1.5 text-sm">
            ✨ Nuevo — MedMind Edu para estudiantes
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Aprende medicina
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              como en la consulta real
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practica diagnóstico diferencial con pacientes simulados por IA.<br />
            Observa consultas reales junto a tu médico tutor.<br />
            <strong className="text-white">Sin riesgo. Sin costo. Sin excusas.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5"
              onClick={() => navigate("/student/simulador")}
            >
              <Brain className="w-5 h-5 mr-2" />
              Simular un caso clínico
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
              onClick={() => navigate("/student/rotacion")}
            >
              <Eye className="w-5 h-5 mr-2" />
              Unirme a una rotación
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA REAL ── */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">El problema que nadie habla en la facultad</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
            Te enseñan semiología en libros. Te mandan a la rotación sin preparación real.
            El primer paciente es tu primera práctica. <strong className="text-white">Eso tiene que cambiar.</strong>
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "📚", title: "Teoría sin práctica", desc: "Miles de horas de clase, cero horas de diagnóstico diferencial real antes de ver pacientes." },
              { icon: "😰", title: "Primera guardia = terror", desc: "El primer paciente complejo sin guía es una experiencia que marca a los médicos para siempre — y no siempre bien." },
              { icon: "⏱️", title: "El médico no tiene tiempo", desc: "En rotación el tutor está desbordado. No puede explicarte todo mientras ve 40 pacientes." },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Dos herramientas. Un solo propósito.</h2>
            <p className="text-slate-400 text-lg">Aprender medicina en el siglo XXI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className={`border rounded-2xl p-6 ${f.bg} transition-all hover:-translate-y-1`}>
                <f.icon className={`w-8 h-8 ${f.color} mb-4`} />
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULADOR DETALLE ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">Simulador de Casos</Badge>
              <h2 className="text-4xl font-bold mb-6">Practica hasta que sea instinto</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                La IA genera un paciente diferente cada vez. Tú preguntas, examinas, pides laboratorios
                y propones diagnóstico. Exactamente como en la guardia — pero sin las consecuencias.
              </p>
              <div className="space-y-4 mb-8">
                {SIMULATOR_STEPS.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-300 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{step.title}</p>
                      <p className="text-slate-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/student/simulador")}>
                Empezar simulación <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Mock UI */}
            <div className="bg-[#0D1420] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate-500 ml-2">Simulador — Urgencias</span>
              </div>
              {[
                { role: "sistema", text: "Paciente: Carlos Mendoza, 58 años. Llega al servicio de urgencias refiriendo dolor en el pecho..." },
                { role: "estudiante", text: "¿Desde hace cuánto tiene el dolor y cómo lo describe?" },
                { role: "paciente", text: "Desde hace 2 horas doctor, como una presión fuerte aquí en el pecho, me baja al brazo izquierdo..." },
                { role: "estudiante", text: "Solicito EKG de 12 derivaciones y troponinas urgentes" },
                { role: "sistema", text: "EKG: Elevación ST en V1-V4. Troponina I: 2.8 ng/mL (↑ referencia <0.04)" },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.role === "estudiante" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "estudiante"
                      ? "bg-violet-600/80 text-white"
                      : m.role === "paciente"
                      ? "bg-white/10 text-slate-300"
                      : "bg-blue-900/50 text-blue-200 border border-blue-500/20"
                  }`}>
                    {m.role !== "estudiante" && (
                      <span className="font-semibold block mb-0.5 opacity-70 uppercase text-[10px]">
                        {m.role === "paciente" ? "🧑 Paciente" : "⚕️ Sistema"}
                      </span>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROTACIÓN DETALLE ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Mock */}
            <div className="bg-[#0D1420] border border-blue-500/20 rounded-2xl p-5 space-y-3 order-2 md:order-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Rotación activa · Dr. Ramírez
                </span>
                <Badge className="bg-blue-500/20 text-blue-300 text-xs border-blue-500/30">En vivo</Badge>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Historia clínica en construcción</p>
                <p className="text-xs text-slate-300">Paciente masculino 45 años consulta por cefalea pulsátil 3/10...</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">✓ CUPS: 890200</Badge>
                  <Badge className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">CIE-10: G43</Badge>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-xs text-yellow-300 font-medium mb-1">💡 Sugerencia IA al médico</p>
                <p className="text-xs text-slate-400">¿Preguntó fotofobia, fonofobia y náuseas asociadas?</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <p className="text-[10px] text-slate-500 mb-2">TUS NOTAS PRIVADAS</p>
                <div className="bg-white/5 rounded-lg p-2 text-xs text-slate-400">
                  Diagnóstico diferencial: migraña vs. cefalea tensional vs. HTA...
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-4">Modo Rotación</Badge>
              <h2 className="text-4xl font-bold mb-6">Ve la consulta real desde adentro</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Tu médico tutor genera un código. Tú lo ingresas y ves exactamente
                cómo la IA asiste la consulta en tiempo real: sugerencias, historia clínica,
                códigos CUPS. Aprende el flujo de la medicina moderna.
              </p>
              <div className="space-y-4 mb-8">
                {ROTATION_STEPS.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-300 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{step.title}</p>
                      <p className="text-slate-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10" onClick={() => navigate("/student/rotacion")}>
                <Eye className="w-4 h-4 mr-2" />
                Unirme a rotación
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── POR QUÉ MEDMIND EDU ── */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Por qué es diferente a estudiar con libros?</h2>
          <p className="text-slate-400 mb-12">Porque los libros no te hacen preguntas. No se quejan. No tienen signos vitales.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { check: true, text: "El paciente te da síntomas vagos, como en la vida real" },
              { check: true, text: "Puedes equivocarte sin consecuencias y aprender por qué" },
              { check: true, text: "Los resultados de laboratorio son consistentes y realistas" },
              { check: true, text: "La evaluación final te muestra qué olvidaste preguntar" },
              { check: true, text: "Disponible 24/7 — practica a las 3am antes del examen" },
              { check: true, text: "Perlas clínicas que no están en el Harrison" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-white/5 rounded-xl p-4 text-left">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <Star className="w-12 h-12 text-violet-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">El médico que serás mañana<br />empieza hoy.</h2>
          <p className="text-slate-400 mb-8 text-lg">Gratis. Sin registro requerido para el simulador.</p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-500 px-10 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25"
            onClick={() => navigate("/student/simulador")}
          >
            Simular mi primer caso <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-slate-600 text-sm mt-4 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Primer caso listo en menos de 30 segundos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center space-y-3">
        <div className="flex justify-center gap-4">
          <button className="text-slate-500 hover:text-white text-sm transition-colors" onClick={() => navigate("/dashboard")}>
            ← Volver al dashboard
          </button>
          <span className="text-slate-700">·</span>
          <button className="text-slate-500 hover:text-white text-sm transition-colors" onClick={() => navigate("/student/simulador")}>
            Simulador de casos
          </button>
          <span className="text-slate-700">·</span>
          <button className="text-slate-500 hover:text-white text-sm transition-colors" onClick={() => navigate("/student/rotacion")}>
            Modo Rotación
          </button>
        </div>
        <p className="text-slate-700 text-xs">
          MedMind Edu — parte de la plataforma MedMind para médicos colombianos.
        </p>
      </footer>
    </div>
  );
}
