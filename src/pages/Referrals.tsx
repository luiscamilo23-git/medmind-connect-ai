import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Gift, TrendingUp, Check, Copy, Mail, MessageSquare, Share2, Star, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Referrals = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const referralLink = "https://medmind.app/ref/TU-CODIGO";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace de referido ha sido copiado al portapapeles",
    });
  };

  const benefits = [
    {
      icon: Gift,
      title: "25% de Descuento Permanente",
      description: "Por cada médico que se registre usando tu enlace, ambos recibirán un 25% de descuento en la suscripción mensual de forma permanente.",
      highlight: "¡Ahorra hasta $75 USD mensuales!"
    },
    {
      icon: TrendingUp,
      title: "Descuentos Acumulativos",
      description: "Refiere a más médicos y aumenta tu descuento. Con 4 referidos activos, tu suscripción es completamente GRATIS.",
      highlight: "4 referidos = Suscripción GRATIS"
    },
    {
      icon: Award,
      title: "Beneficios Exclusivos",
      description: "Acceso anticipado a nuevas funcionalidades, soporte prioritario y reconocimiento en nuestra comunidad médica.",
      highlight: "Privilegios VIP"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Comparte tu enlace",
      description: "Envía tu enlace único a colegas médicos por email, WhatsApp o redes sociales"
    },
    {
      step: "2",
      title: "Ellos se registran",
      description: "Cuando un médico se registra con tu enlace y activa su suscripción"
    },
    {
      step: "3",
      title: "Ambos ganan",
      description: "Los dos reciben 25% de descuento permanente en sus suscripciones"
    },
    {
      step: "4",
      title: "Acumula descuentos",
      description: "Con 4 referidos activos, tu suscripción es completamente GRATIS"
    }
  ];

  const stats = [
    { value: "50+", label: "Médicos activos" },
    { value: "120+", label: "Referidos registrados" },
    { value: "$5K", label: "Ahorrados en total" },
    { value: "4.9/5", label: "Satisfacción" }
  ];

  const testimonials = [
    {
      name: "Dr. Carlos M.",
      specialty: "Cardiología",
      referrals: 3,
      comment: "He referido a 3 colegas y ya estoy ahorrando 75% en mi suscripción. ¡Excelente programa!",
      avatar: "CM"
    },
    {
      name: "Dra. Ana S.",
      specialty: "Pediatría",
      referrals: 2,
      comment: "Referir a MEDMIND es fácil. Mis colegas están encantados y ya tengo 50% de descuento.",
      avatar: "AS"
    },
    {
      name: "Dr. Miguel R.",
      specialty: "Medicina General",
      referrals: 4,
      comment: "Con 4 referidos mi suscripción es gratis. La plataforma es tan buena que se vende sola.",
      avatar: "MR"
    }
  ];

  const shareMessage = `¡Descubre MEDMIND! 🏥✨ La plataforma de gestión médica con IA que está revolucionando las consultas. Regístrate con mi enlace y ambos obtendremos 25% de descuento permanente: ${referralLink}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-purple flex items-center justify-center shadow-purple">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Referidos
            </span>
          </Link>
          <Link to="/auth">
            <Button variant="outline">Iniciar Sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Programa de Referidos</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">
              Comparte MEDMIND,
              <br />
              <span className="bg-gradient-purple bg-clip-text text-transparent">
                Ahorra hasta 100%
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Por cada médico que refierasç ambos reciben <span className="text-primary font-semibold">25% de descuento permanente</span>. 
              Con 4 referidos activos, <span className="text-secondary font-semibold">tu suscripción es GRATIS</span>.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Share Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 mb-12">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Share2 className="w-6 h-6 text-primary" />
                Comparte tu enlace de referido
              </CardTitle>
              <CardDescription>
                Usa cualquiera de estos métodos para compartir MEDMIND con tus colegas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-sm bg-background/50"
                />
                <Button onClick={copyToClipboard} className="flex-shrink-0">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[200px]"
                  onClick={() => window.open(`mailto:?subject=Descubre MEDMIND&body=${encodeURIComponent(shareMessage)}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[200px]"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[200px]"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Beneficios del Programa
            </h2>
            <p className="text-xl text-muted-foreground">
              Un programa diseñado para recompensar tu confianza
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{benefit.description}</p>
                  <div className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-semibold text-primary">{benefit.highlight}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-xl text-muted-foreground">
              En 4 simples pasos comienza a ahorrar
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 h-full">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4">
                      {item.step}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Historias de Éxito
            </h2>
            <p className="text-xl text-muted-foreground">
              Médicos que ya están ahorrando con nuestro programa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-card to-card/50 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm italic">"{testimonial.comment}"</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{testimonial.referrals} referidos</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border-primary/30">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl mb-4">
                ¿Listo para comenzar a ahorrar?
              </CardTitle>
              <CardDescription className="text-lg">
                Únete a miles de médicos que ya están disfrutando de los beneficios de MEDMIND
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Crear mi cuenta gratis
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar mi enlace
                </Button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm">Sin permanencia</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm">Cancela cuando quieras</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm">Soporte 24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">MEDMIND</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
              <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                Términos
              </Link>
              <a href="mailto:soporte@medmind.app" className="hover:text-primary transition-colors">
                Soporte
              </a>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            © 2024 MEDMIND. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Referrals;
