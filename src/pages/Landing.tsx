import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, Calendar, LineChart, Package, Users, CheckCircle2, TrendingDown, Clock, Shield, Zap, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "VoiceNotes MD",
      description: "Transcripción automática de consultas y generación de historias clínicas con IA",
      color: "text-primary",
      howItWorks: "Graba la consulta con tu voz, la IA transcribe literalmente lo que dice el paciente y genera automáticamente una historia clínica estructurada y profesional.",
      savings: "Ahorra 15-20 minutos por consulta en documentación"
    },
    {
      icon: Package,
      title: "SupplyLens",
      description: "Gestión inteligente de inventario con predicción de consumo y alertas",
      color: "text-secondary",
      howItWorks: "Registra tu inventario y la IA analiza tus citas diarias para sugerir automáticamente el consumo de materiales, actualizando el stock en tiempo real.",
      savings: "Reduce pérdidas por vencimiento y sobre-stock en un 30%"
    },
    {
      icon: Calendar,
      title: "SmartScheduler",
      description: "Agenda predictiva que optimiza tus citas y reduce cancelaciones",
      color: "text-accent",
      howItWorks: "Gestiona citas con recordatorios automáticos, visualiza tu agenda semanal y recibe notificaciones de cancelaciones y confirmaciones.",
      savings: "Reduce cancelaciones en 40% y optimiza tu agenda"
    },
    {
      icon: LineChart,
      title: "Inteligencia Operativa",
      description: "Analytics en tiempo real con recomendaciones personalizadas de IA",
      color: "text-info",
      howItWorks: "Dashboards con métricas clave: pacientes atendidos, satisfacción, ingresos y tendencias. La IA identifica patrones y oportunidades de mejora.",
      savings: "Aumenta ingresos en 25% identificando oportunidades"
    },
    {
      icon: Users,
      title: "Gestión de Pacientes",
      description: "Base de datos completa con historiales médicos digitalizados",
      color: "text-success",
      howItWorks: "Almacena información de pacientes, consultas, diagnósticos y tratamientos. Accede al historial completo en segundos desde cualquier dispositivo.",
      savings: "Elimina 100% el uso de papel y archivos físicos"
    },
    {
      icon: Activity,
      title: "Dashboard Completo",
      description: "Visualiza métricas clave: pacientes, satisfacción e ingresos",
      color: "text-warning",
      howItWorks: "Panel central que muestra el estado de tu práctica en tiempo real con estadísticas, alertas y accesos rápidos a todas las funciones.",
      savings: "Ahorra 2-3 horas diarias en tareas administrativas"
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
      title: "Seguridad y Cumplimiento",
      description: "Datos protegidos y organizados",
      items: [
        "Respaldo automático en la nube",
        "Acceso controlado y encriptado",
        "Trazabilidad completa de cambios",
        "Cumplimiento de normativas de salud"
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
    "✓ Implementación en menos de 24 horas sin capacitación técnica",
    "✓ Soporte 24/7 en tu idioma por profesionales de salud",
    "✓ Actualización automática con nuevas funciones sin costo adicional",
    "✓ Precios transparentes sin sorpresas ni contratos largos"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 px-4">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <span className="text-sm font-semibold px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20">
                🚀 La Plataforma Médica Más Avanzada
              </span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-bold text-white">
              MEDMIND
            </h1>
            <p className="text-2xl lg:text-3xl text-white/95 max-w-4xl mx-auto font-semibold">
              Automatiza tu Práctica Médica con IA
            </p>
            <p className="text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto">
              Reduce <strong className="text-white">85%</strong> de tareas administrativas y aumenta <strong className="text-white">40%</strong> tu productividad. 
              Enfócate en lo que realmente importa: <strong className="text-white">tus pacientes</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="text-lg px-10 py-6 bg-white text-primary hover:bg-white/90 shadow-glow">
                <Link to="/auth">Comenzar Gratis Ahora</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 border-white text-white hover:bg-white/10">
                <Link to="/dashboard">Ver Demo en Vivo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why MEDMIND Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              ¿Por Qué MEDMIND es la Mejor Opción?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              No somos solo otro software médico. Somos la solución completa diseñada por médicos, para médicos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whyUs.map((reason, index) => (
              <div key={index} className="flex items-start gap-3 bg-card p-6 rounded-lg border shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-lg">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Mira MEDMIND en Acción
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre cómo MEDMIND transforma tu práctica médica en solo 2 minutos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
              <div className="aspect-video bg-gradient-hero flex items-center justify-center">
                {/* Placeholder for video - Replace with actual YouTube/Vimeo embed */}
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="text-white space-y-2">
                    <h3 className="text-2xl font-bold">Demo Interactiva de MEDMIND</h3>
                    <p className="text-white/80">Ver cómo funciona en tiempo real</p>
                  </div>
                  {/* Example YouTube embed - replace VIDEO_ID with actual video */}
                  {/* <iframe 
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/VIDEO_ID" 
                    title="MEDMIND Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  /> */}
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">VoiceNotes MD</h4>
                <p className="text-sm text-muted-foreground">Transcripción automática de consultas</p>
              </Card>
              <Card className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-semibold mb-2">SupplyLens</h4>
                <p className="text-sm text-muted-foreground">Gestión inteligente de inventario</p>
              </Card>
              <Card className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">SmartScheduler</h4>
                <p className="text-sm text-muted-foreground">Agenda optimizada con IA</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Cómo Funcionan Nuestras Herramientas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu práctica médica en un solo lugar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-border/50">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-primary">Cómo Funciona:</h4>
                    <p className="text-sm text-muted-foreground">{feature.howItWorks}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-primary">{feature.savings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ventajas Competitivas
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Invierte en MEDMIND y recupera tu inversión en el primer mes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{benefit.title}</CardTitle>
                      <CardDescription className="text-base font-semibold text-primary">
                        {benefit.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefit.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Savings Calculator Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2 border-primary/20 shadow-xl">
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
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>100% Digital</span>
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Recordatorios automáticos</span>
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Gestión inteligente de inventario</span>
                      <span className="font-semibold">$0</span>
                    </div>
                    <div className="flex justify-between pt-4 text-xl font-bold text-primary">
                      <span>Total Mensual:</span>
                      <span>$99</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-primary/10 rounded-xl border-2 border-primary">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-primary">¡Ahorra $1,451/mes!</p>
                  <p className="text-xl text-muted-foreground">Eso es $17,412 USD al año que puedes invertir en tu práctica o en ti</p>
                  <p className="text-sm text-muted-foreground mt-4">*Cálculos basados en promedios del mercado. Los ahorros pueden variar según tu práctica.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Resultados Comprobados
            </h2>
            <p className="text-xl text-white/80">Médicos que ya transformaron su práctica con MEDMIND</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
              <div className="text-6xl font-bold text-white">85%</div>
              <div className="text-xl text-white/90 font-semibold">Reducción en tiempo administrativo</div>
              <div className="text-sm text-white/70">De 4 horas a 30 minutos por día</div>
            </div>
            <div className="space-y-3 bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
              <div className="text-6xl font-bold text-white">+40%</div>
              <div className="text-xl text-white/90 font-semibold">Aumento en productividad</div>
              <div className="text-sm text-white/70">Más tiempo para atender pacientes</div>
            </div>
            <div className="space-y-3 bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
              <div className="text-6xl font-bold text-white">98%</div>
              <div className="text-xl text-white/90 font-semibold">Satisfacción de usuarios</div>
              <div className="text-sm text-white/70">Recomiendan MEDMIND a colegas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-5xl lg:text-6xl font-bold">
            Transforma tu Práctica Médica Hoy
          </h2>
          <p className="text-2xl text-muted-foreground">
            Únete a cientos de médicos que ya están optimizando su tiempo y aumentando sus ingresos con MEDMIND
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" className="text-xl px-12 py-7 bg-primary hover:bg-primary/90 shadow-glow">
              <Link to="/auth">Comenzar Prueba Gratuita</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Sin tarjeta de crédito • Configuración en 5 minutos • Soporte incluido
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-card border-t">
        <div className="container mx-auto max-w-6xl text-center space-y-4">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold">MEDMIND</h3>
          </div>
          <p className="text-muted-foreground">&copy; 2025 MEDMIND. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground">Plataforma diseñada para profesionales de la salud en Latinoamérica</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
