import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Send, ArrowLeft, Stethoscope, Loader2, Trophy,
  ChevronRight, RefreshCw, Star, AlertCircle, CheckCircle, BookOpen,
} from "lucide-react";

const SPECIALTIES = [
  { id: "urgencias", label: "Urgencias", emoji: "🚨" },
  { id: "medicina_interna", label: "Medicina Interna", emoji: "🏥" },
  { id: "pediatria", label: "Pediatría", emoji: "👶" },
  { id: "cardiologia", label: "Cardiología", emoji: "❤️" },
  { id: "neurologia", label: "Neurología", emoji: "🧠" },
  { id: "ginecologia", label: "Ginecología", emoji: "🌸" },
  { id: "cirugia", label: "Cirugía", emoji: "🔬" },
];

const DIFFICULTIES = [
  { id: "basico", label: "Básico", desc: "1er - 2do año", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "intermedio", label: "Intermedio", desc: "3er - 5to año", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "avanzado", label: "Avanzado", desc: "Internado / Residente", color: "bg-red-500/20 text-red-300 border-red-500/30" },
];

const QUICK_ACTIONS = [
  "¿Cuándo empezó el dolor?",
  "¿Tiene fiebre?",
  "Solicito signos vitales",
  "Solicito examen físico completo",
  "Solicito hemograma y PCR",
  "Propongo diagnóstico",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: { tipo?: string; origen?: string };
}

interface CaseData {
  paciente?: { nombre: string; edad: number; sexo: string; ciudad: string };
  motivo_consulta?: string;
  vitales?: Record<string, unknown>;
  presentacion?: string;
}

interface Evaluation {
  score: number;
  diagnostico_correcto: string;
  diagnostico_estudiante: string;
  aciertos: string[];
  errores: string[];
  lo_que_faltó_preguntar: string[];
  perlas_clinicas: string[];
  mensaje_final: string;
}

export default function StudentSimulator() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"setup" | "playing" | "evaluation">("setup");
  const [specialty, setSpecialty] = useState("urgencias");
  const [difficulty, setDifficulty] = useState("intermedio");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const callSimulator = async (messageText: string, action?: string) => {
    const { data, error } = await supabase.functions.invoke("student-simulator", {
      body: {
        action,
        specialty,
        difficulty,
        message: messageText,
        history,
      },
    });
    if (error) throw error;
    return data;
  };

  const startCase = async () => {
    setLoading(true);
    setMessages([]);
    setHistory([]);
    setTurnCount(0);
    setPhase("playing");
    try {
      const result = await callSimulator("INICIAR_CASO", "iniciar");
      const data = result?.data || {};
      setCaseData(data);

      const presentacion = data.presentacion || "Nuevo paciente listo para la consulta.";
      const intro = `**Caso iniciado — ${SPECIALTIES.find(s => s.id === specialty)?.label || specialty}**\n\n${presentacion}\n\n---\n*Puedes preguntar síntomas, pedir exámenes o explorar al paciente. Tienes total libertad.*`;

      setMessages([{ role: "assistant", content: intro, meta: { tipo: "caso_nuevo" } }]);
      setHistory([
        { role: "user", content: "INICIAR_CASO" },
        { role: "assistant", content: JSON.stringify(data) },
      ]);
    } catch (err) {
      setMessages([{ role: "assistant", content: "Error iniciando el caso. Intenta de nuevo." }]);
      setPhase("setup");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    const newHistory = [...history, { role: "user", content: msg }];
    setLoading(true);
    setTurnCount(t => t + 1);

    try {
      const result = await callSimulator(msg);
      const data = result?.data || {};
      const content = data.contenido || data.presentacion || JSON.stringify(data);
      const assistantMsg: Message = {
        role: "assistant",
        content,
        meta: { tipo: data.tipo, origen: data.origen },
      };
      const updatedHistory = [...newHistory, { role: "assistant", content: JSON.stringify(data) }];
      setHistory(updatedHistory);
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const requestEvaluation = async () => {
    setLoading(true);
    try {
      const result = await callSimulator("EVALUAR_CASO — evalúa el desempeño completo del estudiante basándote en el historial de conversación");
      const data = result?.data || {};
      if (data.score !== undefined) {
        setEvaluation(data as Evaluation);
        setPhase("evaluation");
      }
    } catch {
      alert("Error generando evaluación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setMessages([]);
    setHistory([]);
    setCaseData(null);
    setEvaluation(null);
    setTurnCount(0);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";

  // ── SETUP ──
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => navigate("/student")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="font-bold">Simulador de Casos Clínicos</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-violet-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Configura tu caso clínico</h1>
              <p className="text-slate-400">Elige especialidad y nivel. La IA generará un paciente único cada vez.</p>
            </div>

            <div className="space-y-8">
              {/* Especialidad */}
              <div>
                <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">Especialidad</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SPECIALTIES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSpecialty(s.id)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        specialty === s.id
                          ? "bg-violet-600/30 border-violet-500 text-violet-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="block text-2xl mb-1">{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dificultad */}
              <div>
                <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">Nivel</p>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        difficulty === d.id ? d.color : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <p className="font-bold">{d.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-violet-600 hover:bg-violet-500 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/20"
                onClick={startCase}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Brain className="w-5 h-5 mr-2" />}
                Iniciar caso clínico
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EVALUATION ──
  if (phase === "evaluation" && evaluation) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${scoreColor(evaluation.score)}`} />
            <h1 className="text-4xl font-bold mb-2">Evaluación Final</h1>
            <div className={`text-7xl font-bold ${scoreColor(evaluation.score)} mb-2`}>
              {evaluation.score}
              <span className="text-2xl text-slate-400">/100</span>
            </div>
            <p className="text-slate-400">{evaluation.mensaje_final}</p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Diagnóstico */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Diagnóstico</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Correcto</p>
                  <p className="text-emerald-400 font-semibold">{evaluation.diagnostico_correcto}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tu propuesta</p>
                  <p className="text-white font-semibold">{evaluation.diagnostico_estudiante || "No propuesto"}</p>
                </div>
              </div>
            </div>

            {/* Aciertos */}
            {evaluation.aciertos?.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <p className="text-xs text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Bien hecho
                </p>
                <ul className="space-y-1">
                  {evaluation.aciertos.map((a, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errores */}
            {evaluation.errores?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <p className="text-xs text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Oportunidades de mejora
                </p>
                <ul className="space-y-1">
                  {evaluation.errores.map((e, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✗</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Faltó preguntar */}
            {evaluation.lo_que_faltó_preguntar?.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
                <p className="text-xs text-yellow-400 uppercase tracking-wide mb-3">Olvidaste preguntar</p>
                <ul className="space-y-1">
                  {evaluation.lo_que_faltó_preguntar.map((q, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">?</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Perlas */}
            {evaluation.perlas_clinicas?.length > 0 && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
                <p className="text-xs text-violet-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Perlas clínicas
                </p>
                <ul className="space-y-2">
                  {evaluation.perlas_clinicas.map((p, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">💎</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Nuevo caso
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/student")}>
              <BookOpen className="w-4 h-4 mr-2" /> Portal Edu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0D1420]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white w-8 h-8" onClick={reset}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Stethoscope className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-sm font-medium">{SPECIALTIES.find(s => s.id === specialty)?.emoji} {SPECIALTIES.find(s => s.id === specialty)?.label}</p>
            {caseData?.paciente && (
              <p className="text-xs text-slate-500">{caseData.paciente.nombre} · {caseData.paciente.edad} años · {caseData.paciente.ciudad}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs bg-white/5 text-slate-400 border-white/10">{turnCount} turnos</Badge>
          {turnCount >= 5 && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-xs h-7 px-3"
              onClick={requestEvaluation}
              disabled={loading}
            >
              <Trophy className="w-3 h-3 mr-1" /> Evaluar
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : msg.meta?.origen === "paciente"
                  ? "bg-white/10 text-slate-200 rounded-bl-sm border border-white/10"
                  : msg.meta?.tipo === "caso_nuevo"
                  ? "bg-blue-900/40 text-blue-100 rounded-bl-sm border border-blue-500/20 w-full"
                  : "bg-[#1a2235] text-slate-200 rounded-bl-sm border border-white/5"
              }`}>
                {msg.role === "assistant" && msg.meta?.origen && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60 block mb-1">
                    {msg.meta.origen === "paciente" ? "🧑 Paciente" : msg.meta.origen === "sistema" ? "⚕️ Sistema" : "💬 Feedback"}
                  </span>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1a2235] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0D1420]">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-none">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="shrink-0 text-xs bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/40 px-3 py-1.5 rounded-full transition-all"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Pregunta, pide exámenes, propón diagnóstico..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-violet-600 hover:bg-violet-500 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {turnCount >= 5 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              ¿Tienes tu diagnóstico? → <button className="text-emerald-400 hover:underline" onClick={requestEvaluation}>Pedir evaluación final</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
