import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, Calendar, LineChart, Package, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "VoiceNotes MD",
      description: "Transcripción automática de consultas y generación de historias clínicas con IA",
      color: "text-primary"
    },
    {
      icon: Package,
      title: "SupplyLens",
      description: "Gestión inteligente de inventario con predicción de consumo y alertas",
      color: "text-secondary"
    },
    {
      icon: Calendar,
      title: "SmartScheduler",
      description: "Agenda predictiva que optimiza tus citas y reduce cancelaciones",
      color: "text-accent"
    },
    {
      icon: LineChart,
      title: "Inteligencia Operativa",
      description: "Analytics en tiempo real con recomendaciones personalizadas de IA",
      color: "text-info"
    },
    {
      icon: Users,
      title: "Red Social Médica",
      description: "Comparte casos y contenido educativo con tus pacientes",
      color: "text-success"
    },
    {
      icon: Activity,
      title: "Dashboard Completo",
      description: "Visualiza métricas clave: pacientes, satisfacción e ingresos",
      color: "text-warning"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <span className="text-sm font-semibold px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20">
                Plataforma Inteligente para Médicos
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white">
              MedLink AI
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Automatiza tu práctica médica con inteligencia artificial. 
              Reduce tareas operativas y enfócate en lo que importa: tus pacientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" className="text-lg px-8 bg-white text-primary hover:bg-white/90 shadow-glow">
                <Link to="/auth">Comenzar Gratis</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
                <Link to="/dashboard">Ver Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Todo lo que necesitas en una plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas de automatización diseñadas específicamente para médicos y odontólogos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl font-bold text-primary">85%</div>
              <div className="text-lg text-muted-foreground">Reducción en tiempo administrativo</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold text-secondary">+40%</div>
              <div className="text-lg text-muted-foreground">Aumento en productividad</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold text-accent">98%</div>
              <div className="text-lg text-muted-foreground">Satisfacción de usuarios</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            ¿Listo para transformar tu práctica médica?
          </h2>
          <p className="text-xl text-white/90">
            Únete a cientos de médicos que ya están optimizando su tiempo con IA
          </p>
          <Button size="lg" className="text-lg px-8 bg-white text-primary hover:bg-white/90 shadow-glow">
            <Link to="/auth">Comenzar Ahora</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2025 MedLink AI. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;