import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Sparkles, Clock, DollarSign, Brain, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Comparison = () => {
  const navigate = useNavigate();

  const features = [
    {
      category: "Inteligencia Artificial",
      icon: Brain,
      items: [
        { feature: "Transcripción automática de voz a texto", medmind: true, traditional: false },
        { feature: "Sugerencias inteligentes en tiempo real", medmind: true, traditional: false },
        { feature: "Análisis predictivo de inventario", medmind: true, traditional: false },
        { feature: "Generación automática de historias clínicas", medmind: true, traditional: false },
        { feature: "Asistente de notas con IA", medmind: true, traditional: false },
      ]
    },
    {
      category: "Facilidad de Uso",
      icon: Zap,
      items: [
        { feature: "Interfaz intuitiva y moderna", medmind: true, traditional: false },
        { feature: "Sin capacitación extensa requerida", medmind: true, traditional: "partial" },
        { feature: "Acceso desde cualquier dispositivo", medmind: true, traditional: "partial" },
        { feature: "Configuración en menos de 1 hora", medmind: true, traditional: false },
        { feature: "Actualizaciones automáticas", medmind: true, traditional: "partial" },
      ]
    },
    {
      category: "Costo y Escalabilidad",
      icon: DollarSign,
      items: [
        { feature: "Precio mensual accesible", medmind: "Desde $99/mes", traditional: "Desde $500/mes" },
        { feature: "Sin costos de implementación", medmind: true, traditional: false },
        { feature: "Sin hardware adicional requerido", medmind: true, traditional: false },
        { feature: "Pago por uso flexible", medmind: true, traditional: false },
        { feature: "Escalable según crecimiento", medmind: true, traditional: "partial" },
      ]
    },
    {
      category: "Tiempo y Productividad",
      icon: Clock,
      items: [
        { feature: "Reducción de tiempo de documentación", medmind: "Hasta 70%", traditional: "30%" },
        { feature: "Recordatorios automáticos de citas", medmind: true, traditional: "partial" },
        { feature: "Gestión de inventario inteligente", medmind: true, traditional: "partial" },
        { feature: "Análisis en tiempo real", medmind: true, traditional: false },
        { feature: "Integración con múltiples plataformas", medmind: true, traditional: "partial" },
      ]
    }
  ];

  const renderValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-sm font-medium">{value}</span>;
    }
    if (value === true) {
      return <Check className="h-5 w-5 text-success" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-muted-foreground" />;
    }
    return <span className="text-sm text-warning">Parcial</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Comparativa de Sistemas</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-feature-soft bg-clip-text text-transparent">
            MEDMIND vs EMR Tradicionales
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Descubre por qué MEDMIND es la elección inteligente para consultorios médicos modernos
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate("/auth")} size="lg" className="gap-2 bg-gradient-feature hover:opacity-90 shadow-feature">
              <Sparkles className="h-4 w-4" />
              Probar MEDMIND Gratis
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" size="lg">
              Volver al Inicio
            </Button>
          </div>
        </div>

        {/* Comparison Header */}
        <Card className="mb-8 p-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Característica</h3>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-primary">MEDMIND</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Con IA Integrada</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-muted px-6 py-3 rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-bold">EMR Tradicional</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Epic, Cerner, etc.</p>
            </div>
          </div>
        </Card>

        {/* Feature Categories */}
        <div className="space-y-6">
          {features.map((category, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{category.category}</h2>
              </div>

              <div className="space-y-3">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="grid md:grid-cols-3 gap-6 items-center py-3 hover:bg-muted/50 rounded-lg px-4 transition-colors">
                    <div className="text-sm font-medium">{item.feature}</div>
                    <div className="flex justify-center">
                      {renderValue(item.medmind)}
                    </div>
                    <div className="flex justify-center">
                      {renderValue(item.traditional)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* ROI Section */}
        <Card className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Retorno de Inversión</h2>
            <p className="text-muted-foreground">Ahorra tiempo y dinero desde el primer mes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-background rounded-lg">
              <div className="text-4xl font-bold text-primary mb-2">70%</div>
              <div className="text-sm text-muted-foreground">Menos tiempo en documentación</div>
            </div>
            <div className="text-center p-6 bg-background rounded-lg">
              <div className="text-4xl font-bold text-primary mb-2">$400+</div>
              <div className="text-sm text-muted-foreground">Ahorro mensual promedio</div>
            </div>
            <div className="text-center p-6 bg-background rounded-lg">
              <div className="text-4xl font-bold text-primary mb-2">&lt;1h</div>
              <div className="text-sm text-muted-foreground">Tiempo de implementación</div>
            </div>
          </div>
        </Card>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold mb-4">¿Listo para la transformación digital?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Únete a los consultorios médicos que ya están aprovechando el poder de la IA para mejorar su práctica
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Comenzar Prueba Gratuita
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Comparison;