import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   MEDMIND — Cinematic Intro / Motion Graphic
   Secuencia de ~8 segundos + idle loop
   Ruta: /intro
   ───────────────────────────────────────────── */

// Timing map (ms)
const T = {
  curtainStart: 400,
  curtainEnd: 1600,
  burstPeak: 1700,
  logoIn: 1800,
  taglineIn: 2600,
  featuresIn: 3200,
  statsIn: 4800,
  ctaIn: 6200,
};

// ── Particle canvas ───────────────────────────
const ParticleCanvas = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      o: Math.random() * 0.4 + 0.05,
      hue: Math.random() > 0.5 ? 250 : 200, // indigo / cyan
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!active) { rafRef.current = requestAnimationFrame(draw); return; }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.o})`;
        ctx.fill();
      });
      // Subtle connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [active]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// ── Animated counter ──────────────────────────
const Counter = ({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) => {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return <span ref={ref}>{val.toLocaleString("es-CO")}{suffix}</span>;
};

// ── Feature chip ──────────────────────────────
const FeatureChip = ({ icon, label, delay }: { icon: string; label: string; delay: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
      if (ref.current) obs.observe(ref.current);
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
        transition: "opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-colors cursor-default"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </div>
  );
};

// ── Main component ────────────────────────────
export default function MedmindIntro() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [muted] = useState(true); // Web Audio not implemented, but kept for future

  const features = [
    { icon: "🎙️", label: "VoiceNotes MD — Historia clínica por voz" },
    { icon: "🤖", label: "Agente WhatsApp 24/7 con IA" },
    { icon: "📊", label: "Análisis predictivo de pacientes" },
    { icon: "📄", label: "Facturación electrónica DIAN + RIPS" },
    { icon: "💊", label: "Gestión de inventario clínico" },
    { icon: "🌐", label: "Red social médica colaborativa" },
  ];

  const stats = [
    { value: 12, suffix: "+", label: "Módulos integrados" },
    { value: 98, suffix: "%", label: "Tiempo ahorrado en HCs" },
    { value: 3, suffix: "×", label: "Más pacientes por día" },
    { value: 100, suffix: "%", label: "Cumplimiento DIAN/RIPS" },
  ];

  const startSequence = useCallback(() => {
    setPhase(0);
    // Fase 1 — curtain
    setTimeout(() => setPhase(1), T.curtainStart);
    // Fase 2 — burst
    setTimeout(() => setPhase(2), T.burstPeak);
    // Fase 3 — logo
    setTimeout(() => setPhase(3), T.logoIn);
    // Fase 4 — tagline
    setTimeout(() => setPhase(4), T.taglineIn);
    // Fase 5 — features
    setTimeout(() => setPhase(5), T.featuresIn);
    // Fase 6 — stats
    setTimeout(() => setPhase(6), T.statsIn);
    // Fase 7 — CTA
    setTimeout(() => setPhase(7), T.ctaIn);
  }, []);

  useEffect(() => {
    startSequence();
  }, [replayKey, startSequence]);

  const replay = () => setReplayKey(k => k + 1);

  return (
    <div
      key={replayKey}
      className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      {/* ── Background mesh ─────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at -5% 60%, rgba(79,131,255,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 105% 80%, rgba(168,85,247,0.12) 0%, transparent 50%),
            #000
          `,
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 2s ease",
        }}
      />

      {/* ── Grid lines ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 1.5s ease 0.5s",
        }}
      />

      {/* ── Particles ──────────────────────── */}
      <ParticleCanvas active={phase >= 3} />

      {/* ── CURTAIN — fondo negro que sube ─── */}
      <div
        className="fixed inset-0 z-40 bg-black"
        style={{
          transform: phase >= 1 ? "translateY(-100%)" : "translateY(0)",
          transition: phase >= 1 ? "transform 1.2s cubic-bezier(0.76,0,0.24,1)" : "none",
          transformOrigin: "top",
        }}
      >
        {/* Energy line que cruza antes del reveal */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: "50%",
            background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.8), rgba(255,255,255,0.9), rgba(99,102,241,0.8), transparent)",
            filter: "blur(1px)",
            opacity: phase >= 1 ? 1 : 0,
            animation: phase >= 1 ? "energySweep 0.6s ease-in-out forwards" : "none",
          }}
        />
      </div>

      {/* ── BURST — destello blanco central ── */}
      {phase === 2 && (
        <div
          className="fixed z-30 rounded-full bg-white pointer-events-none"
          style={{
            top: "50%", left: "50%",
            width: 24, height: 24,
            transform: "translate(-50%, -50%)",
            animation: "burstExpand 0.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
          }}
        />
      )}

      {/* ── MAIN CONTENT ──────────────────── */}
      <div className="relative z-20 w-full max-w-5xl px-6 text-center">

        {/* Logo + nombre */}
        <div
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "scale(1) translateY(0)" : "scale(1.4) translateY(10px)",
            filter: phase >= 3 ? "blur(0px)" : "blur(12px)",
            transition: "all 1.4s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
          className="mb-2"
        >
          {/* Logo icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
              boxShadow: "0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.2)",
            }}
          >
            <svg viewBox="0 0 40 40" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 4 L36 13 L36 27 L20 36 L4 27 L4 13 Z"
                strokeDasharray="120"
                strokeDashoffset="0"
                style={{ animation: phase >= 3 ? "drawPath 1.5s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s both" : "none" }}
              />
              <circle cx="20" cy="20" r="5" fill="white" opacity="0.9"
                style={{ animation: phase >= 3 ? "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 1s both" : "none" }}
              />
            </svg>
          </div>

          <h1
            className="font-black tracking-tighter"
            style={{
              fontSize: "clamp(64px, 12vw, 140px)",
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MEDMIND
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.9s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <p
            className="mb-1 font-medium"
            style={{
              fontSize: "clamp(18px, 3vw, 28px)",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontSize: "13px",
            }}
          >
            Inteligencia Clínica con IA
          </p>
          <p
            style={{
              fontSize: "clamp(20px, 3.5vw, 36px)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            El doctor habla.{" "}
            <span style={{
              background: "linear-gradient(90deg, #6366f1, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 700,
            }}>
              La historia se llena sola.
            </span>
          </p>
        </div>

        {/* Divider */}
        {phase >= 4 && (
          <div
            className="mx-auto my-10"
            style={{
              height: 1,
              maxWidth: 500,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
              opacity: phase >= 5 ? 1 : 0,
              transition: "opacity 1s ease",
            }}
          />
        )}

        {/* Features grid */}
        {phase >= 5 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12 text-left">
            {features.map((f, i) => (
              <FeatureChip key={f.label} icon={f.icon} label={f.label} delay={i * 100} />
            ))}
          </div>
        )}

        {/* Stats */}
        {phase >= 6 && (
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            style={{
              opacity: phase >= 6 ? 1 : 0,
              transform: phase >= 6 ? "translateY(0)" : "translateY(30px)",
              transition: "all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  style={{
                    fontSize: "clamp(36px, 6vw, 64px)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    background: "linear-gradient(180deg, #fff 0%, rgba(99,102,241,0.9) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <Counter target={s.value} suffix={s.suffix} duration={1600} />
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {phase >= 7 && (
          <div
            style={{
              opacity: 1,
              animation: "ctaReveal 1s cubic-bezier(0.25,0.46,0.45,0.94) both",
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/auth")}
              className="relative group px-8 py-4 rounded-full font-semibold text-white overflow-hidden"
              style={{
                fontSize: 16,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15)",
                animation: "glowPulse 3s ease-in-out infinite",
              }}
            >
              <span className="relative z-10">Comenzar ahora — Es gratis</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 rounded-full font-medium border border-white/15 hover:border-white/30 transition-colors"
              style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}
            >
              Ver demo
            </button>
          </div>
        )}
      </div>

      {/* ── Controls ────────────────────────── */}
      {phase >= 7 && (
        <div className="absolute bottom-8 right-8 flex gap-3 z-20">
          <button
            onClick={replay}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 transition-colors text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.9-1M20 15a9 9 0 01-15.9 1" />
            </svg>
            Repetir
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 transition-colors text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Volver al inicio
          </button>
        </div>
      )}

      {/* ── Keyframes ─────────────────────── */}
      <style>{`
        @keyframes energySweep {
          0%   { transform: translateX(-100vw) scaleY(1); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(100vw) scaleY(1); opacity: 0; }
        }

        @keyframes burstExpand {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          60%  { opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(200); opacity: 0; }
        }

        @keyframes drawPath {
          from { stroke-dashoffset: 120; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 0.9; }
        }

        @keyframes ctaReveal {
          from { opacity: 0; transform: translateY(30px); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15); }
          50%       { box-shadow: 0 0 60px rgba(99,102,241,0.7), 0 0 120px rgba(99,102,241,0.3); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
