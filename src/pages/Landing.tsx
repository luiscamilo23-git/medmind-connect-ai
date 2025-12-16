import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, Calendar, LineChart, Package, Users, CheckCircle2, TrendingDown, Clock, Shield, Zap, DollarSign, ArrowRight, Star, Sparkles, Play, Gift, Percent, FileText, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Landing = () => {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const observerRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const navigate = useNavigate();

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
      howItWorks: "Graba la consulta con tu voz, la IA transcribe literalmente y genera una historia clínica estructurada.",
      savings: "Ahorra 15-20 minutos por consulta",
      isNew: true
    },
    {
      icon: Package,
      title: "SupplyLens",
      description: "Gestión inteligente de inventario con predicción de consumo y alertas",
      howItWorks: "Registra tu inventario y la IA analiza tus citas diarias para sugerir el consumo de materiales.",
      savings: "Reduce pérdidas en un 30%"
    },
    {
      icon: Calendar,
      title: "SmartScheduler",
      description: "Agenda predictiva que optimiza tus citas y reduce cancelaciones",
      howItWorks: "Gestiona citas con recordatorios automáticos y visualiza tu agenda con indicadores.",
      savings: "Reduce cancelaciones en 40%",
      isNew: true
    },
    {
      icon: LineChart,
      title: "Facturación DIAN",
      description: "Facturación electrónica y RIPS integrados para Colombia",
      howItWorks: "Genera facturas electrónicas válidas ante la DIAN y exporta RIPS en JSON.",
      savings: "100% cumplimiento normativo",
      isNew: true
    },
    {
      icon: Users,
      title: "Gestión de Pacientes",
      description: "Base de datos completa con historiales médicos digitalizados",
      howItWorks: "Almacena información de pacientes y accede al historial completo en segundos.",
      savings: "Elimina 100% el papel"
    },
    {
      icon: Activity,
      title: "Notificaciones IA",
      description: "Alertas de citas, recordatorios y actualizaciones en tiempo real",
      howItWorks: "Recibe notificaciones de citas y alertas directamente en la app.",
      savings: "Nunca pierdas una cita",
      isNew: true
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Reducción de Costos",
      description: "Hasta 85% menos en gastos administrativos",
      items: [
        "Elimina costos de papelería y archivos",
        "Reduce horas de personal administrativo",
        "Minimiza pérdidas por mal inventario",
        "Optimiza uso de recursos"
      ]
    },
    {
      icon: Clock,
      title: "Más Tiempo para Pacientes",
      description: "40% más de productividad clínica",
      items: [
        "Automatiza documentación médica",
        "Reduce tareas repetitivas",
        "Agenda optimizada sin huecos",
        "Acceso instantáneo a información"
      ]
    },
    {
      icon: Shield,
      title: "Cumplimiento Legal Total",
      description: "100% conforme a normativa colombiana",
      items: [
        "Facturación electrónica DIAN",
        "RIPS automático Res. 2275/2023",
        "Historia clínica Ley 1995/1999",
        "Protección datos Ley 1581/2012"
      ]
    },
    {
      icon: Zap,
      title: "Inteligencia Artificial",
      description: "IA especializada en salud",
      items: [
        "Transcripción de consultas",
        "Sugerencias basadas en evidencia",
        "Predicción de consumo",
        "Análisis de tendencias"
      ]
    }
  ];

  const whyUs = [
    "✓ Diseñado específicamente para médicos latinoamericanos",
    "✓ IA entrenada en terminología médica en español",
    "✓ Cumple 100% normativa colombiana (DIAN, RIPS, Ley 1581)",
    "✓ Facturación electrónica válida ante la DIAN",
    "✓ Historia clínica conforme a Resolución 1995/1999",
    "✓ Implementación en menos de 24 horas",
    "✓ Soporte 24/7 por profesionales de salud",
    "✓ Precios transparentes sin contratos largos"
  ];

  const stats = [
    { value: "85%", label: "Reducción costos", icon: DollarSign },
    { value: "40%", label: "Más productividad", icon: TrendingDown },
    { value: "24/7", label: "Soporte técnico", icon: Clock },
    { value: "99.9%", label: "Tiempo activo", icon: Shield }
  ];

  const testimonials = [
    {
      name: "Dr. Carlos M.",
      specialty: "Odontólogo",
      comment: "MEDMIND ha simplificado enormemente mi documentación clínica. La transcripción por voz es muy precisa.",
      rating: 5,
      avatar: "CM"
    },
    {
      name: "Dra. Ana R.",
      specialty: "Medicina General",
      comment: "La generación automática de historias clínicas me ahorra mucho tiempo en cada consulta.",
      rating: 5,
      avatar: "AR"
    },
    {
      name: "Dr. Luis T.",
      specialty: "Dermatólogo",
      comment: "El control de inventario me ayuda a mantener mis insumos siempre al día sin desperdicios.",
      rating: 5,
      avatar: "LT"
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Glassmorphism Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-gradient-primary flex items-center justify-center animate-glow-pulse">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">MEDMIND</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-gradient-primary text-white">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Promo Banner */}
      <div className="pt-20 bg-gradient-to-r from-primary via-secondary to-primary-glow text-white py-3 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap relative z-10">
          <Gift className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-lg">OFERTA DE LANZAMIENTO</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sm sm:text-base">Primeros 3 meses con <span className="font-black text-xl">50% OFF</span></span>
          <Link to="/auth" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-1 rounded-full font-bold text-sm hover:bg-white/30 transition-all hover:scale-105">
            ¡Aprovechar Ahora!
          </Link>
        </div>
      </div>

      {/* Hero Section - AI Command Center */}
      <section className="relative py-32 md:py-40 px-4 overflow-hidden">
        {/* Animated Background - Deep Space */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-glow/10 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-10">
            {/* AI Badge */}
            <div className="animate-fade-in-down opacity-0" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-primary/30 animate-border-glow">
                <div className="w-2 h-2 rounded-full bg-primary-glow animate-pulse" />
                <span className="text-sm font-medium text-primary-glow">Potenciado por Inteligencia Artificial</span>
              </div>
            </div>

            {/* Main Title */}
            <div className="space-y-6 animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight">
                <span className="text-foreground">MED</span>
                <span className="text-gradient-primary">MIND</span>
              </h1>
            </div>

            {/* Subtitle */}
            <div className="space-y-4 animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
              <p className="text-2xl md:text-3xl lg:text-4xl text-foreground max-w-5xl mx-auto font-bold leading-tight">
                Centro de Comando <span className="text-gradient-primary">IA</span> para tu Práctica Médica
              </p>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Reduce <span className="font-bold text-primary px-2 py-1 rounded-lg glass">85%</span> de tareas administrativas.
                Aumenta <span className="font-bold text-primary-glow px-2 py-1 rounded-lg glass">40%</span> tu productividad.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6 animate-fade-in-up opacity-0" style={{ animationDelay: "0.6s" }}>
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="btn-gradient-primary text-lg px-10 py-7 rounded-2xl animate-glow-pulse group"
                >
                  <span className="flex items-center gap-3">
                    Probar Demo
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="btn-outline-glow text-lg px-10 py-7 rounded-2xl group"
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats - Bento Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto pt-16 animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bento-card group p-6 md:p-8 hover-glow"
                >
                  <div className="space-y-3">
                    <stat.icon className="h-6 w-6 text-primary group-hover:text-primary-glow transition-colors" />
                    <div className="text-4xl md:text-5xl font-black text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why MEDMIND Section */}
      <section 
        className="py-28 px-4 relative overflow-hidden"
        id="why-section"
        ref={(el) => (observerRefs.current["why-section"] = el)}
      >
        <div className="absolute inset-0 bg-glow-top" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center mb-16 space-y-6 transition-all duration-1000 ${isVisible["why-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-4xl lg:text-6xl font-black text-foreground">
              ¿Por Qué <span className="text-gradient-primary">MEDMIND</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              No somos solo otro software médico.
              Somos la <span className="text-foreground font-semibold">solución completa</span> diseñada por médicos, para médicos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {whyUs.map((reason, index) => (
              <div 
                key={index} 
                className={`group bento-card p-6 hover-glow ${
                  isVisible["why-section"] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                }`}
                style={{ transitionDelay: `${index * 80}ms`, transition: "all 0.6s ease" }}
              >
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-primary-glow flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <p className="text-foreground/90 font-medium">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section 
        className="py-28 px-4 bg-muted/30"
        id="video-section"
        ref={(el) => (observerRefs.current["video-section"] = el)}
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-14 space-y-6 transition-all duration-1000 ${isVisible["video-section"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <h2 className="text-4xl lg:text-6xl font-black text-foreground">
              Mira <span className="text-gradient-secondary">MEDMIND</span> en Acción
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Descubre cómo transformamos tu práctica médica en <span className="text-foreground font-semibold">solo 2 minutos</span>
            </p>
          </div>

          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible["video-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="relative rounded-3xl overflow-hidden glass-modal hover:shadow-glow-intense transition-all duration-500 group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-card to-background flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <div className="text-center space-y-6 p-12 relative z-10">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all animate-pulse-slow" />
                    <div className="relative w-24 h-24 btn-gradient-primary rounded-full flex items-center justify-center animate-glow-pulse group-hover:scale-110 transition-all duration-500">
                      <Play className="w-12 h-12 text-white ml-1" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground">Demo Interactiva</h3>
                    <p className="text-muted-foreground">Ver cómo funciona en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Quick Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Brain, title: "VoiceNotes MD", description: "Transcripción IA" },
                { icon: Package, title: "SupplyLens", description: "Inventario inteligente" },
                { icon: Calendar, title: "SmartScheduler", description: "Agenda optimizada" }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="bento-card p-5 text-center hover-glow"
                >
                  <div className="w-12 h-12 mx-auto mb-4 btn-gradient-primary rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section 
        className="py-28 px-4 relative overflow-hidden"
        id="features-section"
        ref={(el) => (observerRefs.current["features-section"] = el)}
      >
        <div className="absolute inset-0 bg-glow-center" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className={`text-center mb-20 space-y-6 transition-all duration-1000 ${isVisible["features-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-4xl lg:text-6xl font-black text-foreground">
              Herramientas <span className="text-gradient-hero">Poderosas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Todo lo que necesitas para gestionar tu práctica médica en <span className="text-foreground font-semibold">un solo lugar</span>
            </p>
          </div>
          
          <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible["features-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="bento-card h-full hover-glow group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {feature.isNew && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="btn-gradient-primary text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse-glow">
                        ✨ NUEVO
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-all duration-500 glow-primary">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 relative">
                    <div className="glass p-4 rounded-xl">
                      <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        Cómo Funciona
                      </h4>
                      <p className="text-sm text-foreground/80">{feature.howItWorks}</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-primary-glow" />
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

      {/* Benefits Section */}
      <section 
        className="py-28 px-4 bg-muted/20 relative overflow-hidden"
        id="benefits-section"
        ref={(el) => (observerRefs.current["benefits-section"] = el)}
      >
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible["benefits-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 text-foreground">
              Ventajas <span className="text-gradient-secondary">Competitivas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Invierte en MEDMIND y recupera tu inversión en <span className="text-foreground font-semibold">el primer mes</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible["benefits-section"] ? "opacity-100 translate-x-0" : `opacity-0 ${index % 2 === 0 ? "-translate-x-10" : "translate-x-10"}`
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Card className="bento-card h-full hover-glow group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl btn-gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform glow-primary">
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{benefit.title}</CardTitle>
                        <CardDescription className="text-sm font-semibold text-primary/80 mt-1">
                          {benefit.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {benefit.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                          <CheckCircle2 className="w-4 h-4 text-primary-glow flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Calculator Section */}
      <section 
        className="py-20 px-4"
        id="calculator-section"
        ref={(el) => (observerRefs.current["calculator-section"] = el)}
      >
        <div className="container mx-auto max-w-5xl">
          <Card className={`glass-modal transition-all duration-1000 ${isVisible["calculator-section"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl mb-4 text-foreground">Calcula tu Ahorro Mensual</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Ejemplo típico de consultorio con 100 pacientes al mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-destructive">Costos Tradicionales</h3>
                  <div className="space-y-3 text-muted-foreground">
                    {[
                      ["Asistente administrativo", "$800/mes"],
                      ["Papelería y archivos", "$150/mes"],
                      ["Software básico", "$100/mes"],
                      ["Pérdidas por cancelaciones", "$300/mes"],
                      ["Sobre-stock y vencimientos", "$200/mes"]
                    ].map(([label, value], i) => (
                      <div key={i} className="flex justify-between border-b border-border/50 pb-2">
                        <span>{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 text-xl font-bold text-destructive">
                      <span>Total Mensual:</span>
                      <span>$1,550</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary">Con MEDMIND</h3>
                  <div className="space-y-3 text-muted-foreground">
                    {[
                      ["Suscripción MEDMIND", "$99/mes", false],
                      ["Sin personal adicional", "$0", true],
                      ["100% digital", "$0", true],
                      ["Recordatorios automáticos", "$0", true],
                      ["Control inteligente de stock", "$0", true]
                    ].map(([label, value, isSuccess], i) => (
                      <div key={i} className="flex justify-between border-b border-border/50 pb-2">
                        <span>{label}</span>
                        <span className={`font-semibold ${isSuccess ? 'text-success' : ''}`}>{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 text-xl font-bold text-primary">
                      <span>Total Mensual:</span>
                      <span>$99</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 btn-gradient-primary rounded-2xl text-center text-white glow-primary-intense">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <TrendingDown className="w-8 h-8" />
                  <h4 className="text-3xl font-bold">Ahorras $1,451 / mes</h4>
                </div>
                <p className="text-lg text-white/90">
                  Eso es <strong>$17,412 al año</strong> que puedes reinvertir
                </p>
              </div>
              
              {/* Special Offer */}
              <div className="mt-6 p-6 bg-gradient-to-r from-secondary to-primary rounded-2xl text-white text-center animate-glow-pulse">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Percent className="w-6 h-6" />
                  <span className="font-black text-2xl">OFERTA DE LANZAMIENTO</span>
                </div>
                <p className="text-lg mb-4">
                  <span className="line-through opacity-70">$99/mes</span> → <span className="font-black text-3xl">$49/mes</span> los primeros 3 meses
                </p>
                <Link to="/auth">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl">
                    ¡Aprovechar Ahora!
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        className="py-28 px-4 bg-muted/30"
        id="testimonials-section"
        ref={(el) => (observerRefs.current["testimonials-section"] = el)}
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible["testimonials-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-4">
              Lo que Dicen <span className="text-gradient-primary">Nuestros Doctores</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className={`bento-card hover-glow transition-all duration-700 ${
                  isVisible["testimonials-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full btn-gradient-primary flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black text-foreground">
              ¿Listo para <span className="text-gradient-hero">Transformar</span> tu Práctica?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Únete a los doctores que ya están ahorrando tiempo y dinero con MEDMIND
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="btn-gradient-primary text-lg px-10 py-7 rounded-2xl animate-glow-pulse">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" className="btn-outline-glow text-lg px-10 py-7 rounded-2xl">
                  Ver Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl btn-gradient-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">MEDMIND</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Términos</Link>
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookies</Link>
              <Link to="/legal-notice" className="hover:text-foreground transition-colors">Legal</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 MEDMIND. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
