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
      color: "from-blue-500 to-cyan-500",
      howItWorks: "Graba la consulta con tu voz, la IA transcribe literalmente y genera una historia clínica estructurada. ¡NUEVO! Descarga el audio de cada consulta.",
      savings: "Ahorra 15-20 minutos por consulta en documentación",
      isNew: true
    },
    {
      icon: Package,
      title: "SupplyLens",
      description: "Gestión inteligente de inventario con predicción de consumo y alertas",
      color: "from-emerald-500 to-teal-500",
      howItWorks: "Registra tu inventario y la IA analiza tus citas diarias para sugerir automáticamente el consumo de materiales.",
      savings: "Reduce pérdidas por vencimiento y sobre-stock en un 30%"
    },
    {
      icon: Calendar,
      title: "SmartScheduler",
      description: "Agenda predictiva que optimiza tus citas y reduce cancelaciones",
      color: "from-purple-500 to-pink-500",
      howItWorks: "Gestiona citas con recordatorios automáticos, visualiza tu agenda semanal con indicadores de citas en el calendario.",
      savings: "Reduce cancelaciones en 40% y optimiza tu agenda",
      isNew: true
    },
    {
      icon: LineChart,
      title: "Facturación Electrónica DIAN",
      description: "Facturación electrónica y RIPS integrados para Colombia",
      color: "from-orange-500 to-red-500",
      howItWorks: "Genera facturas electrónicas válidas ante la DIAN, exporta RIPS en JSON y recibe notificaciones en tiempo real.",
      savings: "Cumple normativa colombiana 100% automático",
      isNew: true
    },
    {
      icon: Users,
      title: "Gestión de Pacientes",
      description: "Base de datos completa con historiales médicos digitalizados",
      color: "from-indigo-500 to-blue-500",
      howItWorks: "Almacena información de pacientes, consultas, diagnósticos y tratamientos. Accede al historial completo en segundos.",
      savings: "Elimina 100% el uso de papel y archivos físicos"
    },
    {
      icon: Activity,
      title: "Notificaciones Inteligentes",
      description: "Alertas de citas, recordatorios y actualizaciones en tiempo real",
      color: "from-yellow-500 to-amber-500",
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
    "✓ Diseñado específicamente para médicos y odontólogos latinoamericanos",
    "✓ IA entrenada en terminología médica en español",
    "✓ Cumple 100% con normativa colombiana (DIAN, RIPS, Ley 1581)",
    "✓ Facturación electrónica válida ante la DIAN integrada",
    "✓ Historia clínica conforme a Resolución 1995/1999",
    "✓ Implementación en menos de 24 horas sin capacitación técnica",
    "✓ Soporte 24/7 en tu idioma por profesionales de salud",
    "✓ Precios transparentes sin sorpresas ni contratos largos"
  ];

  const stats = [
    { value: "85%", label: "Reducción de costos", icon: DollarSign },
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
    <div className="min-h-screen overflow-hidden">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground py-3 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap relative z-10">
          <Gift className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-lg">🎉 OFERTA ESPECIAL DE LANZAMIENTO</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sm sm:text-base">Primeros 3 meses con <span className="font-black text-xl">50% OFF</span></span>
          <span className="hidden sm:inline">•</span>
          <Link to="/auth" className="bg-white text-primary px-4 py-1 rounded-full font-bold text-sm hover:scale-105 transition-transform">
            ¡Aprovechar Ahora!
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-background py-40 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-40 left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-40 right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-12">
            {/* Main Title - Estilo bold y grande */}
            <div className="space-y-6 animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-foreground leading-[0.9] tracking-tight">
                MEDMIND
              </h1>
            </div>

            {/* Subtitle */}
            <div className="space-y-4 animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
              <p className="text-3xl md:text-4xl lg:text-5xl text-foreground max-w-5xl mx-auto font-bold leading-tight">
                Automatiza tu Práctica Médica con Inteligencia Artificial
              </p>
              <p className="text-xl md:text-2xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto font-light">
                Reduce <span className="font-bold text-primary px-2 py-1 bg-primary/10 rounded">85%</span> de tareas administrativas y aumenta <span className="font-bold text-primary px-2 py-1 bg-primary/10 rounded">40%</span> tu productividad. 
                Enfócate en lo que realmente importa: <span className="font-bold text-foreground">tus pacientes</span>.
              </p>
            </div>

            {/* CTA Button - Con efecto glow */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 animate-fade-in-up opacity-0" style={{ animationDelay: "0.6s" }}>
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="relative text-lg px-12 py-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_rgba(var(--primary-glow),0.5)] hover:shadow-[0_0_60px_rgba(var(--primary-glow),0.8)] hover:scale-105 transition-all duration-500 group font-semibold rounded-xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Probar Demo
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Button>
              </Link>
            </div>

            {/* Secondary CTA */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="text-base px-8 py-6 text-foreground hover:text-primary hover:bg-muted/50 transition-all duration-300 group font-medium"
                >
                  Comenzar Gratis
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

            {/* Stats Row - Minimalista */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto pt-20 animate-fade-in opacity-0" style={{ animationDelay: "1s" }}>
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="group relative p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/50 transition-all duration-500 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="relative space-y-3">
                    <stat.icon className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
                    <div className="text-5xl font-black text-foreground tracking-tight">{stat.value}</div>
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
        className="py-32 px-4 bg-background relative overflow-hidden"
        id="why-section"
        ref={(el) => (observerRefs.current["why-section"] = el)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-glow),0.03),transparent_70%)]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center mb-20 space-y-6 transition-all duration-1000 ${isVisible["why-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-5xl lg:text-7xl font-black mb-6 text-foreground">
              ¿Por Qué <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">MEDMIND</span>?
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              No somos solo otro software médico.<br/>
              Somos la <span className="text-foreground font-semibold">solución completa</span> diseñada por médicos, para médicos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {whyUs.map((reason, index) => (
              <div 
                key={index} 
                className={`group flex items-start gap-4 bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-card/70 hover:shadow-[0_0_30px_rgba(var(--primary-glow),0.1)] transition-all duration-500 ${
                  isVisible["why-section"] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <p className="text-base text-foreground/90 font-medium">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section 
        className="py-32 px-4 bg-muted/20"
        id="video-section"
        ref={(el) => (observerRefs.current["video-section"] = el)}
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 space-y-6 transition-all duration-1000 ${isVisible["video-section"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <h2 className="text-5xl lg:text-7xl font-black text-foreground">
              Mira <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">MEDMIND</span> en Acción
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Descubre cómo transformamos tu práctica médica en <span className="text-foreground font-semibold">solo 2 minutos</span>
            </p>
          </div>

          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${isVisible["video-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "200ms" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(var(--primary-glow),0.2)] border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_120px_rgba(var(--primary-glow),0.3)] transition-all duration-500 group">
              <div className="aspect-video bg-gradient-to-br from-card to-background flex items-center justify-center cursor-pointer relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 group-hover:opacity-80 transition-opacity" />
                <div className="text-center space-y-6 p-12 relative z-10">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-glow),0.6)] group-hover:shadow-[0_0_50px_rgba(var(--primary-glow),0.9)] group-hover:scale-110 transition-all duration-500">
                      <Play className="w-12 h-12 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold text-foreground">Demo Interactiva de MEDMIND</h3>
                    <p className="text-lg text-muted-foreground">Ver cómo funciona en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Brain, title: "VoiceNotes MD", description: "Transcripción automática", color: "from-blue-500 to-cyan-500" },
                { icon: Package, title: "SupplyLens", description: "Gestión de inventario", color: "from-emerald-500 to-teal-500" },
                { icon: Calendar, title: "SmartScheduler", description: "Agenda optimizada", color: "from-purple-500 to-pink-500" }
              ].map((feature, index) => (
                <Card 
                  key={index} 
                  className="text-center p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
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
              Herramientas <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Poderosas</span>
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
                <Card className="group h-full hover:shadow-[0_0_40px_rgba(var(--primary-glow),0.15)] transition-all duration-500 hover:-translate-y-1 border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {(feature as any).isNew && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        ✨ NUEVO
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-105 transition-all duration-500">
                      <feature.icon className="w-6 h-6 text-primary" />
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

      {/* Benefits Section */}
      <section 
        className="py-32 px-4 bg-muted/20 relative overflow-hidden"
        id="benefits-section"
        ref={(el) => (observerRefs.current["benefits-section"] = el)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary-glow),0.08),transparent_50%)]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${isVisible["benefits-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-5xl lg:text-7xl font-black mb-6 text-foreground">
              Ventajas <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Competitivas</span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Invierte en MEDMIND y recupera tu inversión<br/>
              en <span className="text-foreground font-semibold">el primer mes</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible["benefits-section"] 
                    ? "opacity-100 translate-x-0" 
                    : `opacity-0 ${index % 2 === 0 ? "-translate-x-10" : "translate-x-10"}`
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="h-full border border-border/50 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(var(--primary-glow),0.15)] transition-all duration-500 group bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 font-bold group-hover:text-primary transition-colors">{benefit.title}</CardTitle>
                        <CardDescription className="text-sm font-semibold text-primary/80">
                          {benefit.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {benefit.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
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

      {/* Cost Savings Calculator Section */}
      <section 
        className="py-20 px-4 bg-muted/30"
        id="calculator-section"
        ref={(el) => (observerRefs.current["calculator-section"] = el)}
      >
        <div className="container mx-auto max-w-5xl">
          <Card className={`border-2 border-primary/20 shadow-xl transition-all duration-1000 ${isVisible["calculator-section"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-4xl mb-4">Calcula tu Ahorro Mensual</CardTitle>
              <CardDescription className="text-lg">
                Ejemplo típico de consultorio con 100 pacientes al mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-destructive">Costos Tradicionales</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex justify-between border-b pb-2">
                      <span>Asistente administrativo (medio tiempo)</span>
                      <span className="font-semibold">$800/mes</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Papelería y archivos</span>
                      <span className="font-semibold">$150/mes</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Software básico de gestión</span>
                      <span className="font-semibold">$100/mes</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Pérdidas por cancelaciones</span>
                      <span className="font-semibold">$300/mes</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Sobre-stock y vencimientos</span>
                      <span className="font-semibold">$200/mes</span>
                    </div>
                    <div className="flex justify-between pt-4 text-xl font-bold text-destructive">
                      <span>Total Mensual:</span>
                      <span>$1,550</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary">Con MEDMIND</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex justify-between border-b pb-2">
                      <span>Suscripción MEDMIND</span>
                      <span className="font-semibold">$99/mes</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Sin personal adicional</span>
                      <span className="font-semibold text-success">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>100% digital</span>
                      <span className="font-semibold text-success">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Recordatorios automáticos</span>
                      <span className="font-semibold text-success">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Control inteligente de stock</span>
                      <span className="font-semibold text-success">$0</span>
                    </div>
                    <div className="flex justify-between pt-4 text-xl font-bold text-primary">
                      <span>Total Mensual:</span>
                      <span>$99</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/30 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <TrendingDown className="w-8 h-8 text-primary" />
                  <h4 className="text-3xl font-bold text-primary">Ahorras $1,451 / mes</h4>
                </div>
                <p className="text-lg text-muted-foreground">
                  Eso es <strong className="text-foreground">$17,412 al año</strong> que puedes reinvertir en tu práctica
                </p>
              </div>
              
              {/* Special Offer */}
              <div className="mt-6 p-6 bg-gradient-to-r from-secondary to-primary rounded-xl text-primary-foreground text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Percent className="w-6 h-6" />
                  <span className="font-black text-2xl">OFERTA DE LANZAMIENTO</span>
                </div>
                <p className="text-lg mb-3">
                  <span className="line-through opacity-70">$99/mes</span> → <span className="font-black text-3xl">$49/mes</span> los primeros 3 meses
                </p>
                <Link to="/auth">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                    ¡Aprovechar Ahora!
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What's New Section */}
      <section 
        className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
        id="whats-new-section"
        ref={(el) => (observerRefs.current["whats-new-section"] = el)}
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible["whats-new-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Actualizaciones Recientes</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-foreground mb-4">
              ¿Qué Hay de <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Nuevo</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mejoras continuas para hacer tu práctica más eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bell,
                title: "Notificaciones de Citas",
                description: "Recibe alertas de citas del día y mañana directamente en la campana de notificaciones. Nunca pierdas una cita.",
                date: "Diciembre 2024"
              },
              {
                icon: Calendar,
                title: "Calendario con Indicadores",
                description: "El mini-calendario ahora muestra puntos en las fechas con citas programadas para una vista rápida.",
                date: "Diciembre 2024"
              },
              {
                icon: FileText,
                title: "Descarga de Audio",
                description: "Descarga las grabaciones de consultas en formato WebM para archivar o revisar más tarde.",
                date: "Diciembre 2024"
              },
              {
                icon: LineChart,
                title: "Facturación DIAN",
                description: "Genera facturas electrónicas válidas ante la DIAN con notificaciones en tiempo real de aprobación.",
                date: "Noviembre 2024"
              },
              {
                icon: Brain,
                title: "IA Mejorada",
                description: "El asistente de IA ahora autocompleta campos y sugiere preguntas en una sola operación.",
                date: "Noviembre 2024"
              },
              {
                icon: Users,
                title: "Programa de Referidos",
                description: "Refiere colegas y obtén hasta 100% de descuento en tu suscripción.",
                date: "Octubre 2024"
              }
            ].map((update, index) => (
              <Card 
                key={index}
                className={`group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 hover:border-primary/30 ${
                  isVisible["whats-new-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <update.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {update.date}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{update.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{update.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        className="py-24 px-4 bg-background"
        id="testimonials-section"
        ref={(el) => (observerRefs.current["testimonials-section"] = el)}
      >
        <div className="container mx-auto max-w-7xl">
          <div className={`text-center mb-20 transition-all duration-1000 ${isVisible["testimonials-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6">
              Lo que dicen los médicos
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Profesionales que ya confían en MEDMIND
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible["testimonials-section"] 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/30 group">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                        {testimonial.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.comment}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Notes Section */}
      <section
        id="smart-notes-section"
        ref={(el) => (observerRefs.current["smart-notes-section"] = el)}
        className={`py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 transition-all duration-700 ${
          isVisible["smart-notes-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Notas Inteligentes</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Transforma tus notas en
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  acciones concretas
                </span>
              </h2>
              <p className="text-lg text-foreground/80">
                La IA analiza tus notas clínicas (escritas o por voz) y extrae automáticamente <span className="text-primary font-semibold">tareas pendientes</span>, 
                <span className="text-primary font-semibold"> ideas principales</span> y <span className="text-primary font-semibold">recordatorios importantes</span>.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Extracción automática de tareas</h3>
                    <p className="text-sm text-foreground/70">Identifica acciones pendientes como estudios, seguimientos o referencias</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Ideas principales destacadas</h3>
                    <p className="text-sm text-foreground/70">Resume los puntos clave de cada consulta automáticamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Recordatorios inteligentes</h3>
                    <p className="text-sm text-foreground/70">Alertas sobre alergias, medicaciones y fechas de seguimiento</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/smart-notes")} className="bg-primary hover:bg-primary/90">
                  Probar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/smart-notes")}>
                  Ver funcionalidad completa
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl opacity-20"></div>
              <Card className="relative border-2 border-primary/20 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <CardTitle className="text-lg">Análisis de Nota Clínica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Nota original:</p>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      "Paciente con dolor torácico. Solicitar ECG urgente y troponinas. 
                      Revisar historial de hipertensión. Programar seguimiento en 48h..."
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">✓ Tareas</p>
                      <p className="text-xs text-foreground">• Solicitar ECG urgente<br/>• Solicitar troponinas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Ideas</p>
                      <p className="text-xs text-foreground">• Dolor torácico agudo<br/>• Descartar isquemia</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">🔔 Recordatorios</p>
                      <p className="text-xs text-foreground">• Seguimiento en 48 horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section
        id="referral-section"
        ref={(el) => (observerRefs.current["referral-section"] = el)}
        className={`py-20 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent transition-all duration-700 ${
          isVisible["referral-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Programa de Referidos</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Comparte MEDMIND,
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Ahorra hasta 100%
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Por cada médico que refieras, <span className="text-primary font-semibold">ambos reciben 25% de descuento permanente</span>. 
                Con 4 referidos activos, <span className="text-secondary font-semibold">tu suscripción es completamente GRATIS</span>.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Descuento permanente del 25%</h3>
                    <p className="text-sm text-muted-foreground">Para ti y cada médico que se registre con tu enlace</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Descuentos acumulativos</h3>
                    <p className="text-sm text-muted-foreground">4 referidos activos = Suscripción 100% GRATIS</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Beneficios exclusivos</h3>
                    <p className="text-sm text-muted-foreground">Acceso anticipado a nuevas funciones y soporte prioritario</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/referrals">
                  <Button size="lg" className="w-full sm:w-auto">
                    Ver programa completo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Crear cuenta gratis
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-card to-card/50 border-primary/30 shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-2xl">Médicos que ya refieren</CardTitle>
                <CardDescription>Historias reales de ahorro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-border/40">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                      50+
                    </div>
                    <div className="text-xs text-muted-foreground">Médicos refieren</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                      120+
                    </div>
                    <div className="text-xs text-muted-foreground">Referidos activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                      $5K
                    </div>
                    <div className="text-xs text-muted-foreground">Ahorrados total</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        CM
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Dr. Carlos M.</div>
                        <div className="text-xs text-muted-foreground">4 referidos • Cardiología</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"Mi suscripción es gratis gracias al programa"</p>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        AS
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Dra. Ana S.</div>
                        <div className="text-xs text-muted-foreground">2 referidos • Pediatría</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"Ya tengo 50% de descuento"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-32 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10 space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            ¿Listo para Transformar tu Práctica?
          </h2>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Únete a miles de médicos que ya están ahorrando tiempo y dinero con MEDMIND
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Link to="/auth">
              <Button size="lg" className="text-xl px-16 py-8 bg-white text-primary hover:bg-white/90 shadow-2xl hover:scale-110 transition-all duration-300 group">
                Comenzar Ahora Gratis
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>

          <p className="text-white/80 text-lg pt-8 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            ✓ Sin tarjeta de crédito  •  ✓ Configuración en 5 minutos  •  ✓ Cumple normativa DIAN  •  ✓ Soporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12 px-4 border-t">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MEDMIND</span>
          </div>
          <p className="text-muted-foreground mb-4">
            La plataforma médica más avanzada de Latinoamérica
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Política de Privacidad
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
              Términos de Servicio
            </Link>
            <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Política de Cookies
            </Link>
            <Link to="/legal-notice" className="text-muted-foreground hover:text-primary transition-colors">
              Aviso Legal
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 MEDMIND. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
