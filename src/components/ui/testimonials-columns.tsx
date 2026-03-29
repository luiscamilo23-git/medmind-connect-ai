"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
  result?: string;
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 10,
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...Array(2)].map((_, idx) => (
          <React.Fragment key={idx}>
            {testimonials.map(({ text, image, name, role, result }, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary-glow),0.08)] transition-all duration-300 max-w-xs w-full"
              >
                {result && (
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                    {result}
                  </div>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed">"{text}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                  <img
                    src={image}
                    alt={name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <div className="text-sm font-semibold text-foreground leading-tight">{name}</div>
                    <div className="text-xs text-muted-foreground leading-tight mt-0.5">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export const MEDMIND_TESTIMONIALS: Testimonial[] = [
  // Column 1
  {
    text: "Con VoiceNotes MD ya no escribo historias clínicas. Grabo la consulta y la IA genera todo en segundos. Recuperé casi 2 horas diarias.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Dr. Andrés Vargas",
    role: "Medicina General · Bogotá",
    result: "-87% tiempo administrativo",
  },
  {
    text: "La facturación a la DIAN me generaba pánico. Ahora MEDMIND la hace automáticamente y nunca me han rechazado una factura.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Dra. Carolina Reyes",
    role: "Ginecología · Medellín",
    result: "0 rechazos DIAN",
  },
  {
    text: "El agente de WhatsApp confirmó el 94% de mis citas del último mes. Los no-shows bajaron drásticamente.",
    image: "https://randomuser.me/api/portraits/men/55.jpg",
    name: "Dr. Felipe Mora",
    role: "Dermatología · Cali",
    result: "-87% no-shows",
  },
  {
    text: "Implementé MEDMIND en un día. Sin capacitación técnica, sin migraciones complicadas. Todo funcionó desde el primer momento.",
    image: "https://randomuser.me/api/portraits/women/28.jpg",
    name: "Dra. Valentina Torres",
    role: "Pediatría · Barranquilla",
    result: "Listo en 24 horas",
  },
  {
    text: "Los RIPS se generan solos. Antes me tomaba medio día hacerlos manualmente, ahora es un clic y listo.",
    image: "https://randomuser.me/api/portraits/men/18.jpg",
    name: "Dr. Miguel Ángel Rueda",
    role: "Cardiología · Bogotá",
    result: "RIPS en 1 clic",
  },
  {
    text: "Soy médico independiente y no tenía cómo pagar un asistente. MEDMIND me hace las veces de tres personas.",
    image: "https://randomuser.me/api/portraits/women/67.jpg",
    name: "Dra. Laura Quintero",
    role: "Medicina Interna · Bucaramanga",
    result: "Ahorra $800k/mes",
  },
  {
    text: "El inventario de mi consultorio siempre estaba desorganizado. SupplyLens me avisa cuando algo está por vencerse o agotarse.",
    image: "https://randomuser.me/api/portraits/men/41.jpg",
    name: "Dr. Sebastián Castro",
    role: "Ortopedia · Manizales",
    result: "0 vencimientos",
  },
  {
    text: "Mis pacientes me dicen que el bot de WhatsApp les parece muy profesional. Confirman citas y hacen preguntas sin que yo intervenga.",
    image: "https://randomuser.me/api/portraits/women/52.jpg",
    name: "Dra. Isabella Ramírez",
    role: "Psiquiatría · Medellín",
    result: "Atención 24/7",
  },
  {
    text: "Paso consulta a 30 pacientes al día. Con MEDMIND puedo ver 4 pacientes más sin trabajar horas extra.",
    image: "https://randomuser.me/api/portraits/men/63.jpg",
    name: "Dr. Juan Carlos Ospina",
    role: "Medicina Familiar · Bogotá",
    result: "+4 pacientes/día",
  },
  {
    text: "La garantía de 30 días me convenció de probarlo. Antes de que terminara ya sabía que me quedaría para siempre.",
    image: "https://randomuser.me/api/portraits/women/35.jpg",
    name: "Dra. Natalia Gómez",
    role: "Neurología · Cali",
    result: "ROI desde semana 1",
  },

  // Column 2
  {
    text: "Llegué a MEDMIND buscando solo facturación DIAN y me quedé por todo lo demás. La historia clínica por voz es una maravilla.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "Dr. Hernán Muñoz",
    role: "Endocrinología · Pereira",
    result: "Historia por voz",
  },
  {
    text: "Lo que más me sorprendió fue la rapidez del soporte. Respondieron mis dudas en menos de 10 minutos, en español.",
    image: "https://randomuser.me/api/portraits/women/19.jpg",
    name: "Dra. Marcela Pinto",
    role: "Reumatología · Bogotá",
    result: "Soporte <10 min",
  },
  {
    text: "Tengo 5 médicos en mi clínica. El panel centralizado me muestra el estado de todos en tiempo real. Imprescindible.",
    image: "https://randomuser.me/api/portraits/men/47.jpg",
    name: "Dr. Ricardo Londoño",
    role: "Director Médico · Medellín",
    result: "5 médicos, 1 panel",
  },
  {
    text: "Los análisis predictivos me ayudaron a identificar que los martes y jueves son mis días con más cancelaciones. Lo optimicé y aumenté ingresos.",
    image: "https://randomuser.me/api/portraits/women/58.jpg",
    name: "Dra. Alejandra Vega",
    role: "Odontología · Cali",
    result: "+23% ingresos",
  },
  {
    text: "Antes usaba tres aplicaciones diferentes para agenda, historias y facturación. MEDMIND las reemplazó a todas con creces.",
    image: "https://randomuser.me/api/portraits/men/76.jpg",
    name: "Dr. Camilo Herrera",
    role: "Oftalmología · Bogotá",
    result: "3 apps en 1",
  },
  {
    text: "La red social médica me ha permitido conectar con colegas de otras ciudades y hacer referencias de pacientes fácilmente.",
    image: "https://randomuser.me/api/portraits/women/83.jpg",
    name: "Dra. Patricia Salcedo",
    role: "Oncología · Barranquilla",
    result: "Red médica activa",
  },
  {
    text: "Empecé como universitaria en el plan gratuito y cuando me gradué ya sabía manejar MEDMIND mejor que cualquier software del mercado.",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    name: "Dra. Daniela Moreno",
    role: "Medicina General · Bogotá",
    result: "Desde la universidad",
  },
  {
    text: "El cumplimiento normativo era mi mayor preocupación. Con MEDMIND tengo paz mental de que estoy al día con MinSalud y la DIAN.",
    image: "https://randomuser.me/api/portraits/men/38.jpg",
    name: "Dr. Alejandro Duarte",
    role: "Cirugía General · Cali",
    result: "100% normativo",
  },
  {
    text: "Me ahorré el asistente de medio tiempo que tenía. Con ese dinero pagué MEDMIND 4 veces y me sobró para reinvertir en equipos.",
    image: "https://randomuser.me/api/portraits/women/71.jpg",
    name: "Dra. Camila Suárez",
    role: "Nutrición · Medellín",
    result: "Ahorra $800k/mes",
  },
  {
    text: "El precio es ridículamente bajo para todo lo que incluye. Comparé con otras soluciones y MEDMIND gana en todo.",
    image: "https://randomuser.me/api/portraits/men/29.jpg",
    name: "Dr. Simón Betancourt",
    role: "Traumatología · Manizales",
    result: "Mejor precio del mercado",
  },

  // Column 3
  {
    text: "Mis pacientes adultos mayores se sorprenden de que les escriba por WhatsApp para recordarles sus citas. Dicen que soy el médico más moderno que conocen.",
    image: "https://randomuser.me/api/portraits/men/84.jpg",
    name: "Dr. Jorge Williamson",
    role: "Geriatría · Bogotá",
    result: "Pacientes más felices",
  },
  {
    text: "La IA entiende mis abreviaciones médicas y las expande correctamente en la historia clínica. Impresionante para una herramienta colombiana.",
    image: "https://randomuser.me/api/portraits/women/46.jpg",
    name: "Dra. Sofía Arango",
    role: "Hematología · Medellín",
    result: "IA especializada",
  },
  {
    text: "Instalé MEDMIND el lunes, el martes ya estaba facturando. No exagero. La migración fue más fácil de lo que esperaba.",
    image: "https://randomuser.me/api/portraits/men/57.jpg",
    name: "Dr. Mauricio Peña",
    role: "Urología · Bucaramanga",
    result: "Migración en 1 día",
  },
  {
    text: "Probé otros tres sistemas antes de MEDMIND. Este es el único que funciona de verdad para la realidad colombiana.",
    image: "https://randomuser.me/api/portraits/women/39.jpg",
    name: "Dra. Andrea Molina",
    role: "Medicina Estética · Bogotá",
    result: "El mejor del mercado",
  },
  {
    text: "El módulo de inventario me salvó de perder $300.000 en medicamentos vencidos. Ya lleva 8 meses sin ninguna pérdida.",
    image: "https://randomuser.me/api/portraits/men/65.jpg",
    name: "Dr. Guillermo Sánchez",
    role: "Medicina Interna · Cali",
    result: "$0 en vencimientos",
  },
  {
    text: "Trabajo en dos consultorios distintos. Con MEDMIND accedo a mis pacientes y agenda desde cualquier dispositivo sin problema.",
    image: "https://randomuser.me/api/portraits/women/77.jpg",
    name: "Dra. Lina Cardona",
    role: "Psicología Clínica · Pereira",
    result: "Acceso multiplataforma",
  },
  {
    text: "La historia clínica por voz me parece magia. Mientras examino al paciente hablo en voz alta y la IA estructura todo perfectamente.",
    image: "https://randomuser.me/api/portraits/men/48.jpg",
    name: "Dr. Nicolás Jiménez",
    role: "Pediatría · Bogotá",
    result: "Manos libres",
  },
  {
    text: "Tuve una duda técnica a las 11 pm y el equipo de soporte respondió en 7 minutos. Eso no lo da ningún otro proveedor.",
    image: "https://randomuser.me/api/portraits/women/62.jpg",
    name: "Dra. Viviana Trujillo",
    role: "Ginecología · Manizales",
    result: "Soporte 24/7",
  },
  {
    text: "El analytics me mostró que estaba perdiendo $600.000 al mes por citas reagendadas mal gestionadas. Lo corregí en dos semanas.",
    image: "https://randomuser.me/api/portraits/men/73.jpg",
    name: "Dr. Eduardo Mejía",
    role: "Cardiología · Bogotá",
    result: "+$600k recuperados",
  },
  {
    text: "Soy muy escéptico de las soluciones tecnológicas, pero MEDMIND me convenció desde el primer día de prueba. Ahora lo recomiendo a todos mis colegas.",
    image: "https://randomuser.me/api/portraits/women/88.jpg",
    name: "Dra. Gloria Fernández",
    role: "Endocrinología · Medellín",
    result: "Convertida en fan",
  },
];

export const firstColumn = MEDMIND_TESTIMONIALS.slice(0, 10);
export const secondColumn = MEDMIND_TESTIMONIALS.slice(10, 20);
export const thirdColumn = MEDMIND_TESTIMONIALS.slice(20, 30);
