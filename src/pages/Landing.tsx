import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, Calendar, LineChart, Package, Users, CheckCircle2, TrendingDown, Clock, Shield, Zap, DollarSign, ArrowRight, Sparkles, Play, Gift, Percent, FileText, Bell, Twitter, Linkedin, Instagram, Mail, Menu, X, Phone, MapPin } from "lucide-react";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/ui/hover-footer";
import { Link, useNavigate } from "react-router-dom";
import { HeartbeatLine } from "@/components/HeartbeatLine";
import ParticlesBackground from "@/components/ui/particles-background";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { motion, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { TestimonialsColumn, firstColumn, secondColumn, thirdColumn } from "@/components/ui/testimonials-columns";

const LAUNCH_END = new Date("2026-04-07T23:59:59-05:00");

const navItems = [
  { name: "Funciones", href: "#features" },
  { name: "Precios", href: "/pricing" },
  { name: "Comparativa", href: "/comparison" },
];

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => setScrolled(v > 0.03));
    return unsub;
  }, [scrollYProgress]);

  return (
    <header className="fixed top-12 left-0 right-0 z-40 pointer-events-none">
      <nav
        data-state={menuOpen ? "active" : undefined}
        className="group pointer-events-auto mx-auto max-w-7xl px-4 lg:px-12"
      >
        <div
          className={cn(
            "rounded-2xl px-6 transition-all duration-300",
            scrolled && "bg-background/70 backdrop-blur-xl shadow-lg border border-border/40"
          )}
        >
          <motion.div
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 py-3 duration-200 lg:py-4",
              scrolled && "lg:py-3"
            )}
          >
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-xl font-extrabold tracking-tight text-foreground">MEDMIND</span>
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden -m-2 p-2"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop nav */}
            <ul className="hidden lg:flex gap-8 text-sm">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden lg:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="rounded-full px-5">Empezar gratis</Button>
              </Link>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
              <div className="w-full pb-4 lg:hidden space-y-4">
                <ul className="space-y-3 text-sm border-t border-border/40 pt-4">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-muted-foreground hover:text-foreground transition-colors block"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Link to="/auth" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Iniciar sesión</Button>
                  </Link>
                  <Link to="/auth" className="flex-1">
                    <Button size="sm" className="w-full rounded-full">Empezar gratis</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </nav>
    </header>
  );
}

const Landing = () => {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const observerRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ h: "00", m: "00", s: "00", cupos: 37 });

  useEffect(() => {
    const tick = () => {
      const diff = LAUNCH_END.getTime() - Date.now();
      if (diff <= 0) return;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown((c) => ({
        ...c,
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Brain,
      title: "VoiceNotes MD",
      description: "Transcripción automática de consultas y generación de historias clínicas con IA",
      color: "bg-primary",
      howItWorks: "Graba la consulta con tu voz, la IA transcribe literalmente y genera una historia clínica estructurada. ¡NUEVO! Descarga el audio de cada consulta.",
      savings: "Ahorra 15-20 minutos por consulta en documentación",
      isNew: true
    },
    {
      icon: Package,
      title: "SupplyLens",
      description: "Gestión inteligente de inventario con predicción de consumo y alertas",
      color: "bg-primary",
      howItWorks: "Registra tu inventario y la IA analiza tus citas diarias para sugerir automáticamente el consumo de materiales.",
      savings: "Reduce pérdidas por vencimiento y sobre-stock en un 30%"
    },
    {
      icon: Calendar,
      title: "SmartScheduler",
      description: "Agenda predictiva que optimiza tus citas y reduce cancelaciones",
      color: "bg-primary",
      howItWorks: "Gestiona citas con recordatorios automáticos, visualiza tu agenda semanal con indicadores de citas en el calendario.",
      savings: "Reduce cancelaciones en 40% y optimiza tu agenda",
      isNew: true
    },
    {
      icon: LineChart,
      title: "Facturación Electrónica DIAN",
      description: "Facturación electrónica y RIPS integrados para Colombia",
      color: "bg-primary",
      howItWorks: "Genera facturas electrónicas válidas ante la DIAN, exporta RIPS en JSON y recibe notificaciones en tiempo real.",
      savings: "Cumple normativa colombiana 100% automático",
      isNew: true
    },
    {
      icon: Users,
      title: "Gestión de Pacientes",
      description: "Base de datos completa con historiales médicos digitalizados",
      color: "bg-primary",
      howItWorks: "Almacena información de pacientes, consultas, diagnósticos y tratamientos. Accede al historial completo en segundos.",
      savings: "Elimina 100% el uso de papel y archivos físicos"
    },
    {
      icon: Activity,
      title: "Notificaciones Inteligentes",
      description: "Alertas de citas, recordatorios y actualizaciones en tiempo real",
      color: "bg-primary",
      howItWorks: "Recibe notificaciones de citas del día, recordatorios de seguimiento y alertas de facturación directamente en la app.",
      savings: "Nunca pierdas una cita o seguimiento importante",
      isNew: true
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Reducción de Costos Operativos",
      description: "Hasta 85% menos en gastos administrativos",
      items: [
        "Elimina costos de papelería y archivos físicos",
        "Reduce horas de personal administrativo",
        "Minimiza pérdidas por mal manejo de inventario",
        "Optimiza uso de recursos y materiales"
      ]
    },
    {
      icon: Clock,
      title: "Más Tiempo para Pacientes",
      description: "40% más de productividad clínica",
      items: [
        "Automatiza documentación médica",
        "Reduce tiempo en tareas repetitivas",
        "Agenda optimizada sin huecos perdidos",
        "Acceso instantáneo a información crítica"
      ]
    },
    {
      icon: Shield,
      title: "Cumplimiento Legal Total",
      description: "100% conforme a normativa colombiana",
      items: [
        "Facturación electrónica DIAN integrada",
        "RIPS automático según Resolución 2275/2023",
        "Historia clínica conforme a Ley 1995/1999",
        "Protección de datos según Ley 1581/2012"
      ]
    },
    {
      icon: Zap,
      title: "Inteligencia Artificial Médica",
      description: "IA especializada en salud",
      items: [
        "Transcripción y análisis de consultas",
        "Sugerencias basadas en evidencia",
        "Predicción de consumo de materiales",
        "Análisis de tendencias y patrones"
      ]
    }
  ];

  const whyUs = [
    {
      icon: Brain,
      title: "IA entrenada para medicina colombiana",
      desc: "No es un chatbot genérico. Entiende terminología médica en español, genera historias clínicas SOAP, prescripciones y RIPS en segundos.",
    },
    {
      icon: Shield,
      title: "100% cumplimiento DIAN y MinSalud",
      desc: "Facturación electrónica válida ante la DIAN, RIPS automáticos y historia clínica conforme a Resolución 1995/1999. Sin multas, sin estrés.",
    },
    {
      icon: Zap,
      title: "Listo en 24 horas, garantía 30 días",
      desc: "Sin capacitación técnica, sin contratos, sin letra pequeña. Si en 30 días no ahorras mínimo 1 hora diaria, te devolvemos cada peso.",
    },
  ];

  const stats = [
    { value: "2h+", label: "Tiempo diario que recuperas", icon: Clock },
    { value: "$0", label: "Multas DIAN con facturación correcta", icon: DollarSign },
    { value: "30 días", label: "Prueba gratis · sin tarjeta", icon: Shield },
    { value: "100%", label: "Cumplimiento normativo Colombia", icon: TrendingDown }
  ];


  return (
    <div className="min-h-screen overflow-hidden">
      <LandingNav />
      {/* Promo Banner */}
      <div className="bg-primary text-white py-3 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap relative z-10">
          <Gift className="w-5 h-5 animate-bounce" />
          <span className="font-bold">🔥 LANZAMIENTO</span>
          <span className="hidden sm:inline">—</span>
          <span className="text-sm sm:text-base">Solo para los primeros <span className="font-black">100 médicos</span>: Plan Profesional al precio de Starter.</span>
          <span className="hidden sm:inline text-white/50">|</span>
          <span className="text-sm font-mono bg-white/20 px-2 py-0.5 rounded">
            Quedan {countdown.cupos} cupos · {countdown.h}:{countdown.m}:{countdown.s}
          </span>
          <Link to="/auth" className="bg-white text-primary px-4 py-1 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-feature">
            Activar precio →
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-background py-16 sm:py-24 md:py-32 lg:py-40 px-4 overflow-hidden">
        {/* WebGL Shader Background */}
        <ParticlesBackground />
        
        {/* Heartbeat line at the bottom of hero - More visible */}
        <HeartbeatLine color="primary" variant="hero" intensity="high" speed="slow" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-12">
            {/* Main Title - Responsive */}
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                MEDMIND
              </h1>
            </div>

            {/* Subtitle - Responsive */}
            <div className="space-y-3 sm:space-y-4 animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-foreground max-w-5xl mx-auto font-bold leading-tight px-2">
                El médico habla.<br className="hidden sm:block" /> La historia se escribe sola.
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-light px-4">
                Más de <span className="font-bold text-primary px-1 bg-primary/10 rounded">2 horas diarias</span> de papeleo te están costando dinero y pacientes.
                MEDMIND automatiza todo — historia clínica, <span className="font-bold text-foreground">DIAN, WhatsApp y agenda</span> — en uno.
              </p>
            </div>

            {/* CTA Button - Con efecto glow */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 animate-fade-in-up opacity-0" style={{ animationDelay: "0.6s" }}>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="relative text-lg px-12 py-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_rgba(var(--primary-glow),0.5)] hover:shadow-[0_0_60px_rgba(var(--primary-glow),0.8)] hover:scale-105 transition-all duration-500 group font-semibold rounded-xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Empezar gratis 30 días
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Button>
              </Link>
            </div>

            {/* Secondary CTA */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
              <Link to="/pricing">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base px-8 py-6 text-foreground hover:text-primary hover:bg-muted/50 transition-all duration-300 group font-medium"
                >
                  Ver planes y precios
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/comparison">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-base px-8 py-6 border-primary/30 text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 group font-medium"
                >
                  Ver Comparativa
                  <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                </Button>
              </Link>
            </div>


            {/* Stats Row */}
            <div className="animate-fade-in opacity-0 pt-14 md:pt-20 w-full max-w-5xl mx-auto" style={{ animationDelay: "1s" }}>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">

                {/* Stat: 2h+ */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-foreground">2h+</span>
                  <span className="text-sm text-muted-foreground leading-tight">Ahorradas<br/>por día</span>
                </div>

                <div className="w-px h-8 bg-border/50 hidden sm:block" />

                {/* Stat: médicos con avatares */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["JR","MC","AP"].map((initials, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">+</div>
                  </div>
                  <span className="text-sm text-muted-foreground leading-tight">340+ médicos<br/>ya usan MEDMIND</span>
                </div>

                <div className="w-px h-8 bg-border/50 hidden sm:block" />

                {/* Stat: 99% */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-foreground">99%</span>
                  <span className="text-sm text-muted-foreground leading-tight">Precisión<br/>clínica</span>
                </div>

                <div className="w-px h-8 bg-border/50 hidden sm:block" />

                {/* Stat: estrellas */}
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < 5 ? "text-yellow-400" : "text-yellow-400/30"}`}>★</span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">4.9/5 en reseñas</span>
                </div>


              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Slider */}
      <section className="bg-background border-y border-border/30 py-6">
        <div className="group relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="shrink-0 md:border-r md:pr-6 md:max-w-44">
              <p className="text-xs text-muted-foreground text-center md:text-right leading-snug">
                Integrado con<br className="hidden md:block" /> las herramientas<br className="hidden md:block" /> que ya usas
              </p>
            </div>
            <div className="relative w-full md:w-[calc(100%-11rem)]">
              <InfiniteSlider speed={30} speedOnHover={10} gap={80}>
                {[
                  { name: "WhatsApp Business", color: "text-primary" },
                  { name: "DIAN Colombia", color: "text-blue-700" },
                  { name: "Alegra", color: "text-orange-500" },
                  { name: "Siigo", color: "text-purple-600" },
                  { name: "MercadoPago", color: "text-sky-500" },
                  { name: "Evolution API", color: "text-primary" },
                  { name: "Google Gemini", color: "text-indigo-500" },
                  { name: "Alanube", color: "text-red-500" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center shrink-0">
                    <span className={cn("text-sm font-bold tracking-tight opacity-60 hover:opacity-100 transition-opacity", item.color)}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </InfiniteSlider>
              <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-16" direction="left" blurIntensity={0.8} />
              <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-16" direction="right" blurIntensity={0.8} />
            </div>
          </div>
        </div>
      </section>

      {/* ¿Cómo Funciona? Section */}
      <section className="py-24 px-4 bg-muted/20" id="how-it-works">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">
              Tres pasos. <span className="text-primary">Sin complicaciones.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empieza a ahorrar tiempo desde la primera consulta.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "①",
                title: "Graba la consulta con tu voz",
                desc: "Habla normalmente mientras atiendes. MEDMIND escucha en segundo plano. Sin interrupciones, sin typing.",
                color: "bg-primary"
              },
              {
                step: "②",
                title: "La IA escribe la historia clínica",
                desc: "Diagnóstico, tratamiento, medicamentos y código CIE-10 — estructurados y listos en segundos. Tú solo revisas.",
                color: "bg-primary"
              },
              {
                step: "③",
                title: "Firma, factura y envía a la DIAN",
                desc: "Un clic. La factura va a la DIAN, el RIPS se genera solo, y el paciente recibe su comprobante por WhatsApp.",
                color: "bg-primary"
              }
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center gap-4 p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center text-white text-3xl font-black shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/auth">
              <Button size="lg" className="px-10">
                Quiero empezar hoy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">30 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* Why MEDMIND Section */}
      <section
        className="py-24 px-4 bg-background relative overflow-hidden"
        id="why-section"
        ref={(el) => (observerRefs.current["why-section"] = el)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-glow),0.04),transparent_70%)]" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className={`text-center mb-16 space-y-4 transition-all duration-1000 ${isVisible["why-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Por qué elegirnos</p>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">
              Construido para el médico colombiano
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No adaptamos software extranjero. Construimos MEDMIND desde cero para la realidad del sistema de salud colombiano.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, index) => (
              <div
                key={index}
                className={`group flex flex-col gap-4 bg-card/60 backdrop-blur-sm p-7 rounded-2xl border border-border/50 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(var(--primary-glow),0.1)] transition-all duration-500 ${
                  isVisible["why-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        className="py-32 px-4 bg-background relative overflow-hidden"
        id="features-section"
        ref={(el) => (observerRefs.current["features-section"] = el)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(var(--secondary),0.05),transparent_60%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className={`text-center mb-24 space-y-6 transition-all duration-1000 ${isVisible["features-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-5xl lg:text-7xl font-black text-foreground">
              Herramientas <span className="text-primary">Poderosas</span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Todo lo que necesitas para gestionar tu práctica médica<br/>
              en <span className="text-foreground font-semibold">un solo lugar</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible["features-section"] 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="group h-full hover:shadow-[0_0_40px_rgba(var(--primary-glow),0.15)] transition-all duration-500 hover-float-glow border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {(feature as any).isNew && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-feature">
                        ✨ NUEVO
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="relative">
                    <div className="hover-icon-circle w-12 h-12 mb-6">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-3 font-bold group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 relative">
                    <div className="bg-muted/50 p-4 rounded-lg group-hover:bg-muted/70 transition-colors border border-border/50">
                      <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        Cómo Funciona
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed">{feature.howItWorks}</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border border-primary/10 group-hover:border-primary/20 transition-colors">
                      <div className="flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-primary">{feature.savings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(var(--primary-glow),0.04),transparent_60%)]" />
        <div className="container mx-auto max-w-5xl relative z-10 space-y-16">
          {/* Loss cost cards */}
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold text-destructive uppercase tracking-widest">El costo de no actuar</p>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">
              Cada mes sin MEDMIND te cuesta
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: "$800.000", label: "Asistente administrativo (medio tiempo)", icon: "👤" },
              { value: "$400.000", label: "Pérdidas por citas sin confirmar", icon: "📅" },
              { value: "$1.000.000", label: "Riesgo multa DIAN por RIPS con errores", icon: "⚠️" },
              { value: "44 horas", label: "Tu tiempo en papeleo al mes", icon: "⏱️" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-destructive/20 rounded-2xl p-6 text-center space-y-3 hover:border-destructive/40 transition-colors">
                <div className="text-3xl">{item.icon}</div>
                <div className="text-3xl font-black text-destructive">{item.value}</div>
                <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="grid md:grid-cols-2 gap-6 bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-8 space-y-4 border-b md:border-b-0 md:border-r border-border/50">
              <h3 className="text-xl font-bold text-destructive flex items-center gap-2">
                <span className="text-2xl">✗</span> Sin MEDMIND
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Asistente administrativo", "$800.000/mes"],
                  ["Papelería y archivos físicos", "$150.000/mes"],
                  ["Software básico de gestión", "$200.000/mes"],
                  ["Pérdidas por no-shows", "$400.000/mes"],
                  ["Sobre-stock e inventario manual", "$200.000/mes"],
                ].map(([label, price]) => (
                  <div key={label} className="flex justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-destructive">{price}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-lg font-black text-destructive">
                  <span>Total mensual</span>
                  <span>$1.750.000</span>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-4 bg-primary/5">
              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="text-2xl">✓</span> Con MEDMIND
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  ["MEDMIND Profesional (todo incluido)", "$189.000/mes"],
                  ["Sin personal adicional", "$0"],
                  ["100% digital, sin papelería", "$0"],
                  ["Recordatorios WhatsApp automáticos", "$0"],
                  ["Control inteligente de stock", "$0"],
                ].map(([label, price]) => (
                  <div key={label} className="flex justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-semibold ${price === "$0" ? "text-primary" : "text-primary"}`}>{price}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-lg font-black text-primary">
                  <span>Total mensual</span>
                  <span>$189.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center space-y-4">
            <p className="text-muted-foreground text-lg">Ahorras cada mes:</p>
            <p className="text-6xl font-black text-primary">$1.561.000</p>
            <p className="text-muted-foreground">Eso es <strong className="text-foreground">$18.732.000 al año</strong> que puedes reinvertir en tu práctica</p>
            <Link to="/auth">
              <Button size="lg" className="mt-2 px-10">
                Empezar gratis 30 días
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-14 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              Lo que dicen nuestros médicos
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">
              Más de 200 médicos ya confían en MEDMIND
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Resultados reales de consultorios colombianos.
            </p>
          </motion.div>
          <div className="flex justify-center gap-5 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[780px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={38} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={47} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={43} />
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-32 px-4 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10 space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            ¿Cuántas horas más vas a<br />perder en papeleo?
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Empieza hoy. 30 días gratis. Sin tarjeta de crédito.
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Si en 30 días MEDMIND no te ahorra mínimo 1 hora diaria,<br />
            <strong>te devolvemos cada peso — sin preguntas.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Link to="/auth">
              <Button size="lg" className="text-xl px-16 py-8 bg-white text-primary hover:bg-white/90 shadow-2xl hover:scale-110 transition-all duration-300 group">
                Comenzar Ahora Gratis
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>

          <p className="text-white/80 text-base pt-8 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            ✓ Sin tarjeta de crédito  •  ✓ Listo en 24 horas  •  ✓ Cumplimiento DIAN garantizado  •  ✓ Garantía 30 días
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-[#0F0F11] border-t border-white/5 mt-0">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 z-10 relative">
          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">
            {/* Brand */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-7 w-7 text-[#3ca2fa]" />
                <span className="text-white text-2xl font-extrabold tracking-tight">MEDMIND</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                La plataforma médica con IA más completa de Colombia. Historia clínica, facturación DIAN y agente WhatsApp en un solo lugar.
              </p>
              <div className="flex gap-3 pt-1">
                {[
                  { href: "https://twitter.com", icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
                  { href: "https://linkedin.com", icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
                  { href: "https://instagram.com", icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
                  { href: "mailto:contacto@medmind.co", icon: <Mail className="w-4 h-4" />, label: "Email" },
                ].map(({ href, icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#3ca2fa] hover:border-[#3ca2fa]/40 transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-white font-semibold mb-5">Producto</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  { label: "VoiceNotes MD", href: "/#features" },
                  { label: "Facturación DIAN", href: "/#features" },
                  { label: "Agente IA WhatsApp", href: "/#features" },
                  { label: "SupplyLens", href: "/#features" },
                  { label: "Planes y precios", href: "/pricing" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="hover:text-[#3ca2fa] transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-white font-semibold mb-5">Empresa</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  { label: "Política de Privacidad", href: "/privacy-policy" },
                  { label: "Términos de Servicio", href: "/terms-of-service" },
                  { label: "Política de Cookies", href: "/cookie-policy" },
                  { label: "Aviso Legal", href: "/legal-notice" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="hover:text-[#3ca2fa] transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-5">Contacto</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#3ca2fa] shrink-0" />
                  <a href="mailto:soporte@medmind.co" className="hover:text-[#3ca2fa] transition-colors">soporte@medmind.co</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#3ca2fa] shrink-0" />
                  <a href="tel:+573001234567" className="hover:text-[#3ca2fa] transition-colors">+57 300 123 4567</a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#3ca2fa] shrink-0" />
                  <span>Bogotá, Colombia</span>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-white/10 mb-6" />

          <p className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} MEDMIND. Todos los derechos reservados. Hecho con ❤️ en Colombia.
          </p>
        </div>

        {/* TextHoverEffect MEDMIND */}
        <div className="lg:flex hidden h-72 -mt-16 -mb-20 px-4">
          <TextHoverEffect text="MEDMIND" className="z-10" />
        </div>

        <FooterBackgroundGradient />
      </footer>
    </div>
  );
};

export default Landing;
