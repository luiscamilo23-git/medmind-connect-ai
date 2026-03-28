import { useRef } from "react";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { TrendingDown } from "lucide-react";

const GRID_OVERLAY = "absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]";

const revealVariants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.18, duration: 0.55, ease: "easeOut" },
  }),
  hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
};

interface Testimonial {
  name: string;
  specialty: string;
  comment: string;
  result: string;
  photo: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Dr. Andrés Vargas",
    specialty: "Medicina General · Bogotá",
    comment: "Pasé de 3 horas de papeleo diario a 25 minutos. Ahora tengo tiempo para almorzar y ver más pacientes. La historia clínica se genera sola mientras hablo.",
    result: "-87% tiempo administrativo",
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Dra. Carolina Reyes",
    specialty: "Ginecología · Medellín",
    comment: "Mis RIPS ahora los genera en 2 minutos. Antes me demoraba medio día y aún así venían con errores. Cero rechazos DIAN en 6 meses.",
    result: "0 rechazos DIAN",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Dr. Felipe Mora",
    specialty: "Dermatología · Cali",
    comment: "El agente de WhatsApp confirmó 43 citas esta semana. Solo tuve 1 no-show. Antes perdía $600,000 por semana en no-shows.",
    result: "-87% en no-shows",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Dra. Valentina Torres",
    specialty: "Pediatría · Barranquilla",
    comment: "Lo que más me sorprendió fue el CIE-10 automático. Antes buscaba el código a mano en cada consulta. Ahora la IA lo asigna solo.",
    result: "30 min ganados/día",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Dr. Miguel Rueda",
    specialty: "Cardiología · Bogotá",
    comment: "La facturación electrónica integrada con la DIAN fue lo que me convenció. En clínicas tradicionales eso cuesta $800,000/mes extra.",
    result: "-85% en errores factura",
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face",
  },
  {
    name: "Dra. Laura Quintero",
    specialty: "Medicina Interna · Medellín",
    comment: "MEDMIND ha sido un verdadero cambio de paradigma. Tengo más tiempo para mis pacientes, menos estrés al final del día y mis finanzas están en orden.",
    result: "2h liberadas por día",
    photo: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=300&h=300&fit=crop&crop=face",
  },
];

function TestimonialCard({
  testimonial,
  animNum,
  variant,
  timelineRef,
}: {
  testimonial: Testimonial;
  animNum: number;
  variant: "featured" | "accent" | "dark";
  timelineRef: React.RefObject<HTMLDivElement | null>;
}) {
  const base = "flex flex-col justify-between relative overflow-hidden rounded-xl border p-5 h-full";
  const styles = {
    featured: "bg-muted/20 border-border/50",
    accent: "bg-primary text-primary-foreground border-primary",
    dark: "bg-foreground/90 text-background border-foreground/80",
  };

  return (
    <TimelineContent
      animationNum={animNum}
      customVariants={revealVariants}
      timelineRef={timelineRef as React.RefObject<HTMLElement | null>}
      className={`${base} ${styles[variant]}`}
    >
      {variant === "featured" && <div className={GRID_OVERLAY} />}
      <article className="mt-auto relative z-10">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-sm ${variant === "accent" ? "text-primary-foreground" : "text-yellow-400"}`}>★</span>
          ))}
        </div>
        <p className={`text-sm leading-relaxed mb-4 ${variant === "dark" ? "text-background/90" : variant === "accent" ? "text-primary-foreground/90" : "text-foreground/80"}`}>
          "{testimonial.comment}"
        </p>
        <div className="flex justify-between items-end gap-3">
          <div>
            <h2 className={`font-bold text-base leading-tight ${variant === "featured" ? "text-foreground" : ""}`}>
              {testimonial.name}
            </h2>
            <p className={`text-xs mt-0.5 ${variant === "featured" ? "text-muted-foreground" : variant === "accent" ? "text-primary-foreground/70" : "text-background/60"}`}>
              {testimonial.specialty}
            </p>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
              variant === "accent"
                ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                : variant === "dark"
                ? "bg-background/10 text-background border-background/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              <TrendingDown className="w-3 h-3" />
              {testimonial.result}
            </div>
          </div>
          <img
            src={testimonial.photo}
            alt={testimonial.name}
            width={64}
            height={64}
            className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-md"
          />
        </div>
      </article>
    </TimelineContent>
  );
}

export function TestimonialsGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [t0, t1, t2, t3, t4, t5] = testimonials;

  return (
    <section className="w-full bg-background">
      <div
        className="relative container mx-auto rounded-xl py-16 px-4 lg:px-10"
        ref={sectionRef}
      >
        {/* Heading */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <TimelineContent
            as="h2"
            animationNum={0}
            customVariants={revealVariants}
            timelineRef={sectionRef as React.RefObject<HTMLElement | null>}
            className="text-3xl xl:text-5xl font-black"
          >
            Resultados reales.{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Médicos reales.
            </span>
          </TimelineContent>
          <TimelineContent
            as="p"
            animationNum={1}
            customVariants={revealVariants}
            timelineRef={sectionRef as React.RefObject<HTMLElement | null>}
            className="text-muted-foreground"
          >
            No son promesas. Son los números de médicos colombianos que ya usan MEDMIND a diario.
          </TimelineContent>
        </div>

        {/* 3-column masonry grid */}
        <div className="lg:grid lg:grid-cols-3 gap-3 flex flex-col w-full lg:py-6">
          {/* Col 1 */}
          <div className="flex lg:flex-col lg:space-y-3 flex-col space-y-3">
            <div className="lg:flex-[7]">
              <TestimonialCard testimonial={t0} animNum={0} variant="featured" timelineRef={sectionRef} />
            </div>
            <div className="lg:flex-[3]">
              <TestimonialCard testimonial={t1} animNum={1} variant="accent" timelineRef={sectionRef} />
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex lg:flex-col lg:space-y-3 flex-col space-y-3">
            <TestimonialCard testimonial={t2} animNum={2} variant="dark" timelineRef={sectionRef} />
            <TestimonialCard testimonial={t3} animNum={3} variant="dark" timelineRef={sectionRef} />
            <TestimonialCard testimonial={t4} animNum={4} variant="dark" timelineRef={sectionRef} />
          </div>

          {/* Col 3 */}
          <div className="flex lg:flex-col lg:space-y-3 flex-col space-y-3">
            <div className="lg:flex-[3]">
              <TestimonialCard testimonial={t5} animNum={5} variant="accent" timelineRef={sectionRef} />
            </div>
            <div className="lg:flex-[7]">
              <TestimonialCard testimonial={t0} animNum={6} variant="featured" timelineRef={sectionRef} />
            </div>
          </div>
        </div>

        {/* Bottom border decoration */}
        <div className="absolute border-b-2 border-border/30 bottom-4 h-16 z-[2] md:w-full w-[90%] md:left-0 left-[5%]">
          <div className="container mx-auto w-full h-full relative before:absolute before:-left-2 before:-bottom-2 before:w-4 before:h-4 before:bg-background before:border before:border-border after:absolute after:-right-2 after:-bottom-2 after:w-4 after:h-4 after:bg-background after:border after:border-border" />
        </div>
      </div>
    </section>
  );
}
