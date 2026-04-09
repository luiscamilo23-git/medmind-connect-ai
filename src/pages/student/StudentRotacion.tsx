import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, ArrowLeft, Loader2, CheckCircle, XCircle,
  BookOpen, Clock, Stethoscope, Brain, PenLine, Send,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RotationData {
  id: string;
  code: string;
  doctor_id: string;
  is_active: boolean;
  expires_at: string;
  profiles?: { full_name: string; clinic_name: string };
}

interface Note {
  text: string;
  time: string;
}

export default function StudentRotacion() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"enter_code" | "active" | "expired">("enter_code");
  const [code, setCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState<RotationData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [learningPoints, setLearningPoints] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase === "active") {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const validateCode = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setError("El código debe tener exactamente 6 caracteres.");
      return;
    }
    if (!studentName.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("student_rotations")
        .select("*, profiles(full_name, clinic_name)")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (dbError) throw dbError;
      if (!data) {
        setError("Código no encontrado o inactivo. Pídele a tu médico que lo regenere.");
        return;
      }
      if (new Date(data.expires_at) < new Date()) {
        setError("Este código ya expiró. Pídele a tu médico uno nuevo.");
        setPhase("expired");
        return;
      }

      // Update student name
      await supabase
        .from("student_rotations")
        .update({ student_name: studentName.trim() })
        .eq("id", data.id);

      setRotation(data as RotationData);
      setLearningPoints(generateLearningPoints());
      setPhase("active");
    } catch {
      setError("Error validando el código. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPoints = () => [
    "Observa cómo la IA detecta los síntomas clave y los estructura automáticamente.",
    "Nota cómo el médico puede mantener contacto visual con el paciente en todo momento.",
    "Los códigos CUPS/CIE-10 se sugieren automáticamente — sin memorizar tarifarios.",
    "La IA hace preguntas que el médico podría olvidar en consultas rápidas.",
    "La historia clínica queda documentada en tiempo real — nada se pierde.",
  ];

  const addNote = () => {
    if (!noteInput.trim()) return;
    setNotes(prev => [...prev, {
      text: noteInput.trim(),
      time: format(new Date(), "HH:mm", { locale: es }),
    }]);
    setNoteInput("");
  };

  const saveAndFinish = async () => {
    if (rotation && notes.length > 0) {
      for (const note of notes) {
        await supabase.from("student_rotation_notes").insert({
          rotation_id: rotation.id,
          content: `[${note.time}] ${note.text}`,
        });
      }
    }
    setPhase("expired");
  };

  // ── CODE ENTRY ──
  if (phase === "enter_code") {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Eye className="w-5 h-5 text-blue-400" />
          <span className="font-bold">Modo Rotación</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
                <Eye className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Unirme a una rotación</h1>
              <p className="text-slate-400">
                Pídele a tu médico tutor su código de rotación de 6 dígitos.<br />
                Observarás la consulta en tiempo real.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Tu nombre completo</label>
                <Input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Juan Diego Ríos"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-base py-5"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Código de rotación</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && validateCode()}
                  placeholder="ABC123"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-center text-2xl font-mono tracking-widest py-6"
                  maxLength={6}
                />
                <p className="text-xs text-slate-500 mt-1.5 text-center">6 caracteres · mayúsculas automáticas</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-base rounded-xl"
                onClick={validateCode}
                disabled={loading || code.length !== 6 || !studentName.trim()}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                Entrar a la rotación
              </Button>
            </div>

            {/* Info */}
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
              <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> ¿Qué verás durante la rotación?
              </h3>
              <ul className="space-y-2">
                {[
                  "La historia clínica construyéndose en tiempo real",
                  "Las sugerencias de la IA al médico",
                  "Códigos CUPS/CIE-10 asignados automáticamente",
                  "Un espacio privado para tus notas de aprendizaje",
                ].map(item => (
                  <li key={item} className="text-sm text-slate-400 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EXPIRED / SUMMARY ──
  if (phase === "expired") {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Rotación completada</h1>
          <p className="text-slate-400 mb-8">Duración: {formatElapsed(elapsed)} · {notes.length} notas guardadas</p>

          {notes.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Tus notas de la sesión</p>
              <div className="space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 text-xs shrink-0 mt-0.5">[{n.time}]</span>
                    <span>{n.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 text-left mb-8">
            <p className="text-xs text-violet-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Puntos de reflexión post-rotación
            </p>
            <ul className="space-y-2">
              {learningPoints.map((p, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-violet-400">💎</span> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-white/10 text-white" onClick={() => { setPhase("enter_code"); setCode(""); setNotes([]); setElapsed(0); }}>
              Nueva rotación
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/student/simulador")}>
              Ir al simulador
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE ROTATION ──
  const doctorName = (rotation as RotationData & { profiles?: { full_name: string; clinic_name: string } })?.profiles?.full_name || "Tu médico tutor";
  const clinicName = (rotation as RotationData & { profiles?: { full_name: string; clinic_name: string } })?.profiles?.clinic_name || "";

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#0D1420]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-white">Rotación activa · {doctorName}</p>
              {clinicName && <p className="text-xs text-slate-500">{clinicName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/5 border-white/10 text-slate-400 text-xs">
              <Clock className="w-3 h-3 mr-1" /> {formatElapsed(elapsed)}
            </Badge>
            <Button size="sm" variant="outline" className="border-white/10 text-slate-400 text-xs h-7" onClick={saveAndFinish}>
              Terminar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
        {/* Panel izquierdo — Lo que ve el doctor */}
        <div className="border-r border-white/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Consulta en tiempo real</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Vitales mock */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Signos vitales</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "TA", value: "120/80", unit: "mmHg", ok: true },
                  { label: "FC", value: "88", unit: "lpm", ok: true },
                  { label: "FR", value: "18", unit: "rpm", ok: true },
                  { label: "Temp", value: "37.2", unit: "°C", ok: true },
                  { label: "SatO₂", value: "97", unit: "%", ok: true },
                  { label: "Peso", value: "72", unit: "kg", ok: true },
                ].map(v => (
                  <div key={v.label} className="text-center">
                    <p className="text-xs text-slate-500">{v.label}</p>
                    <p className={`text-lg font-bold ${v.ok ? "text-white" : "text-red-400"}`}>{v.value}</p>
                    <p className="text-[10px] text-slate-600">{v.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Historia clínica en construcción */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Historia clínica (IA)</p>
                <div className="flex gap-1.5 animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-violet-400" />
                  <div className="w-1 h-1 rounded-full bg-violet-400" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1 h-1 rounded-full bg-violet-400" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p><span className="text-slate-500">Motivo:</span> Cefalea pulsátil de 72h de evolución, 7/10</p>
                <p><span className="text-slate-500">Antecedentes:</span> HTA controlada, sin alergias conocidas</p>
                <p><span className="text-slate-500">Medicamentos:</span> Losartán 50mg/día</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">CUPS: 890201</Badge>
                <Badge className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">CIE-10: G43.9</Badge>
              </div>
            </div>

            {/* Sugerencia IA */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400 font-semibold mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Sugerencia de la IA al médico
              </p>
              <p className="text-sm text-slate-300">
                ¿Ha preguntado sobre fotofobia, fonofobia y náuseas? Son criterios diagnósticos de migraña (IHS 2018).
              </p>
            </div>

            {/* Nota educativa */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-semibold mb-1">📚 Punto de aprendizaje</p>
              <p className="text-sm text-slate-300">
                La clasificación ICHD-3 requiere ≥5 episodios de cefalea de 4-72h + 2 características cualitativas + 1 síntoma acompañante para diagnóstico de migraña sin aura.
              </p>
            </div>
          </div>
        </div>

        {/* Panel derecho — Notas del estudiante */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Tus notas privadas</span>
            <Badge className="ml-auto bg-white/5 border-white/10 text-xs text-slate-500">{notes.length} notas</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notes.length === 0 && (
              <div className="text-center py-12">
                <PenLine className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">Tus notas aparecerán aquí.</p>
                <p className="text-slate-700 text-xs">Nadie más las ve.</p>
              </div>
            )}
            {notes.map((note, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{note.time}</span>
                </div>
                <p className="text-sm text-slate-300">{note.text}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <Textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                  }
                }}
                placeholder="Escribe tu observación... (Enter para guardar)"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl resize-none text-sm min-h-[60px]"
              />
              <Button
                onClick={addNote}
                disabled={!noteInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 rounded-xl shrink-0 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Solo tú ves estas notas · Se guardan al terminar la rotación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
