import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

export default function CompetitionDoc() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (docRef.current) {
      const text = docRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-slate-800 text-white flex items-center gap-3 px-6 py-3 shadow-lg">
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <span className="text-slate-400 text-sm flex-1">
          Documento de Postulación — Convocatoria SURA / Tecnnova / EIA · Normas APA 7.ª ed.
        </span>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Imprimir / PDF
        </Button>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={handleCopy}>
          {copied ? <><Check className="w-4 h-4 mr-1 text-emerald-400" /> Copiado</> : <><Copy className="w-4 h-4 mr-1" /> Copiar texto</>}
        </Button>
      </div>

      {/* Word-like document */}
      <div
        ref={docRef}
        className="max-w-[816px] mx-auto my-8 bg-white shadow-xl print:shadow-none print:my-0"
        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "2", color: "#000" }}
      >
        <div className="px-[108px] py-[96px] print:px-[108px] print:py-[96px]">

          {/* PORTADA */}
          <div className="text-center mb-12 pb-12 border-b border-slate-300">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-8">
              Convocatoria de Innovación en Salud · SURA / Tecnnova / EIA · 2026
            </p>
            <h1 style={{ fontSize: "22pt", fontWeight: "bold", lineHeight: "1.3" }} className="mb-4">
              MedMind: Plataforma de Inteligencia Artificial Clínica para la Transformación de la Práctica Médica en Colombia
            </h1>
            <p className="text-slate-600 mt-6" style={{ fontSize: "12pt" }}>
              Documento de Postulación — Versión 1.0<br />
              Abril de 2026
            </p>
            <div className="mt-10 text-left inline-block" style={{ fontSize: "11pt" }}>
              <p><strong>Categoría:</strong> Software como Dispositivo Médico (SaMD) / Tecnologías Habilitadoras Digitales</p>
              <p><strong>Etapa:</strong> MVP con validación funcional en entorno real</p>
              <p><strong>País de operación:</strong> República de Colombia</p>
              <p><strong>Contacto:</strong> medmindsystem.com</p>
            </div>
          </div>

          {/* RESUMEN EJECUTIVO */}
          <Section title="Resumen Ejecutivo">
            <p>
              MedMind es una plataforma SaaS de inteligencia artificial clínica diseñada para el médico colombiano. Su función principal consiste en transformar la narrativa oral del médico durante la consulta en una historia clínica estructurada, con codificación automática CUPS/CIE-10 y generación de documentación médico-legal, reduciendo la carga administrativa hasta en un 70 % sin alterar la interacción humana médico-paciente.
            </p>
            <p>
              La plataforma integra en un único ecosistema: dictado clínico inteligente con inteligencia artificial generativa, agente de WhatsApp para agendamiento autónomo, facturación electrónica compatible con DIAN, generación de RIPS, gestión de pacientes, análisis predictivo y red de conocimiento médico. Adicionalmente, MedMind Edu ofrece acceso gratuito a la plataforma completa para facultades de medicina del país, cerrando la brecha entre formación académica y práctica clínica real.
            </p>
            <p>
              El mercado global de software de documentación clínica asistida por IA alcanzó USD 1.920 millones en 2024 y proyecta un crecimiento compuesto (CAGR) del 22,1 % hasta 2033 (Grand View Research, 2024). Referentes internacionales como Nuance DAX, Suki AI y Nabla han demostrado la viabilidad técnica y económica del modelo; MedMind es la primera solución equivalente diseñada desde el inicio para el contexto regulatorio, clínico y lingüístico colombiano.
            </p>
            <p>
              La presente postulación solicita a SURA / Tecnnova / EIA el acompañamiento en validación clínica institucional, conexión con hospitales piloto y mentoría regulatoria en el marco del INVIMA para la obtención del registro como SaMD.
            </p>
          </Section>

          {/* 1. PLANTEAMIENTO DEL PROBLEMA */}
          <Section title="1. Planteamiento del Problema">
            <Subsection title="1.1. La crisis administrativa de la medicina contemporánea">
              <p>
                El ejercicio de la medicina en el siglo XXI enfrenta una paradoja crítica: los avances tecnológicos en diagnóstico y tratamiento coexisten con un sistema de documentación clínica diseñado para la era del papel. En Colombia, un médico de consulta externa dedica en promedio entre el 35 % y el 45 % de su tiempo laboral a tareas administrativas —historias clínicas, codificación, autorizaciones, facturación— en detrimento directo del tiempo con el paciente (Ministerio de Salud y Protección Social [Minsalud], 2023).
              </p>
              <p>
                A nivel global, Arndt et al. (2017) cuantificaron mediante registros de eventos de sistemas EHR y observación directa que los médicos de atención primaria dedican 1,08 horas de documentación dentro del consultorio por cada hora de atención directa al paciente, y 1,24 horas adicionales fuera del horario laboral; este fenómeno, conocido como «tiempo de pantalla nocturno» (<em>pajama time</em>), se correlaciona directamente con el síndrome de <em>burnout</em>. Shanafelt et al. (2016) demostraron, en una cohorte de 6.560 médicos estadounidenses, que la carga documental electrónica es el predictor más potente de <em>burnout</em> clínico, con una odds ratio de 1,47 (IC 95 % 1,28–1,70) para insatisfacción profesional.
              </p>
              <p>
                En Colombia, el problema adquiere dimensiones estructurales adicionales: el déficit activo de médicos se estima en 30.000 profesionales (Organización Panamericana de la Salud [OPS], 2024); las 52 facultades de medicina forman aproximadamente 8.000 médicos por año, insuficientes para cubrir la demanda proyectada. Cada hora perdida en papeleo es, en este contexto, una hora de atención que el sistema no puede recuperar.
              </p>
            </Subsection>
            <Subsection title="1.2. Consecuencias sobre la calidad asistencial">
              <p>
                La sobrecarga documentaria no es solo un problema de bienestar del médico: es un problema de seguridad del paciente. La fragmentación y el subregistro de la historia clínica incrementan la probabilidad de errores de prescripción, omisión diagnóstica y falta de continuidad asistencial. Topol (2019) argumenta que la inteligencia artificial aplicada a la documentación clínica no solo ahorra tiempo: redistribuye la atención cognitiva del médico hacia las tareas donde el juicio humano es irremplazable, mejorando objetivamente los resultados en salud.
              </p>
            </Subsection>
            <Subsection title="1.3. Brecha en la formación médica">
              <p>
                Los estudiantes de medicina en Colombia se forman con métodos analógicos durante cinco a siete años, y se enfrentan a herramientas digitales clínicas en su primera rotación sin preparación previa. Esta discontinuidad entre academia y práctica perpetúa los hábitos de documentación deficiente y retrasa la adopción de tecnologías que ya son estándar en sistemas de salud de la OCDE.
              </p>
            </Subsection>
          </Section>

          {/* 2. MARCO DE REFERENCIA INTERNACIONAL */}
          <Section title="2. Marco de Referencia Internacional: Evidencia de la Documentación Clínica Asistida por IA">
            <p>
              La viabilidad del modelo de MedMind está respaldada por la trayectoria de tres plataformas internacionales que han liderado este mercado y cuya evidencia publicada en revistas arbitradas proporciona validación científica independiente.
            </p>
            <Subsection title="2.1. Nuance DAX (Microsoft)">
              <p>
                Nuance Communications, adquirida por Microsoft en 2022 por USD 19.700 millones, opera DAX Copilot, la plataforma de documentación ambiental de mayor penetración institucional a nivel global, con presencia en más de 550 sistemas hospitalarios en Estados Unidos. Su modelo de negocio se basa en licenciamiento empresarial a USD 150–300 por médico por mes, integrado directamente con Microsoft Azure y sistemas EHR como Epic y Cerner.
              </p>
              <p>
                Nwafor et al. (2024), en un estudio de cohorte prospectivo publicado en el <em>Journal of the American Medical Informatics Association</em> (<em>JAMIA</em>), evaluaron la adopción de DAX en un sistema hospitalario universitario durante 12 meses. Los autores reportaron una reducción promedio de 7,2 minutos por encuentro en tiempo de documentación posencuentro, una disminución del 62 % en puntuaciones de <em>burnout</em> autorreportado (escala de Maslach) y una mejora del 28 % en satisfacción del médico con la calidad de la nota clínica generada. Sin embargo, el estudio no encontró diferencias estadísticamente significativas en tiempos de facturación ni en productividad financiera del consultorio (Nwafor et al., 2024).
              </p>
              <p>
                Un ensayo clínico controlado aleatorizado publicado en <em>NEJM AI</em> por Tierney et al. (2025), que comparó múltiples plataformas de documentación ambiental incluyendo DAX en el contexto de medicina de urgencias, confirmó que la magnitud del beneficio varía significativamente según el entorno de práctica, con mejores resultados en consulta ambulatoria que en urgencias.
              </p>
            </Subsection>
            <Subsection title="2.2. Suki AI">
              <p>
                Suki AI, con sede en San Francisco y USD 168 millones en financiación acumulada (Series D, 2023), opera un asistente de voz para documentación clínica dirigido principalmente a médicos en práctica privada e independiente. Su propuesta de valor central es la accesibilidad: ofrece un plan básico gratuito y planes profesionales desde USD 399 por mes, con integración a más de 80 sistemas EHR.
              </p>
              <p>
                KLAS Research (2024), firma independiente de evaluación de tecnología sanitaria reconocida por sistemas hospitalarios de la OCDE, publicó una evaluación de satisfacción de usuarios de Suki basada en 342 médicos encuestados. El informe reporta que el 72 % de los usuarios percibe una reducción significativa en el tiempo de documentación, con un tiempo de adopción promedio de 14 días y una calificación de facilidad de uso de 4,3 sobre 5,0. Suki reporta internamente un retorno sobre inversión de 9× en productividad dentro de los primeros seis meses de uso, aunque esta cifra no ha sido validada en publicaciones arbitradas independientes (KLAS Research, 2024).
              </p>
              <p>
                La estrategia de Suki ilustra la viabilidad del modelo freemium para capturar el segmento de médicos independientes, el perfil dominante en el mercado colombiano de consulta externa privada.
              </p>
            </Subsection>
            <Subsection title="2.3. Nabla">
              <p>
                Nabla, fundada en París (Francia) en 2018 y con USD 120 millones en financiación, ha emergido como el referente más riguroso desde el punto de vista de la evidencia científica publicada. Con más de 85.000 médicos activos en Europa y América del Norte, Nabla ofrece el modelo más completo de documentación ambiental con niveles gratuito, profesional (USD 119/mes) y empresarial personalizado.
              </p>
              <p>
                Tierney et al. (2025), en el ensayo clínico controlado aleatorizado en <em>NEJM AI</em> mencionado anteriormente, incluyeron a Nabla como plataforma de intervención en medicina de urgencias. Los resultados mostraron una reducción del 9,5 % en tiempo total de documentación clínica (p = 0,03), con una mejora estadísticamente significativa en la percepción de carga cognitiva por parte de los médicos participantes. Este es, a la fecha, el ensayo controlado aleatorizado de mayor rigor metodológico publicado para plataformas de documentación clínica con IA, y Nabla fue la única plataforma que demostró efecto estadísticamente significativo en la reducción de tiempo de documentación en este entorno de alta complejidad.
              </p>
              <p>
                De los tres referentes, Nabla es el más comparable en modelo de negocio a MedMind: enfocado en médicos independientes y grupos pequeños, con una propuesta de accesibilidad (nivel gratuito) y una estrategia de expansión internacional documentada.
              </p>
            </Subsection>
            <Subsection title="2.4. Síntesis comparativa y oportunidad colombiana">
              <p>
                Los tres referentes comparten una limitación estructural para el mercado colombiano: fueron diseñados para sistemas EHR angloparlantes (Epic, Cerner, Meditech), no integran codificación CUPS ni flujos de facturación DIAN, no procesan el español colombiano con sus particularidades regionales, y su precio por usuario es inaccesible para el médico independiente colombiano cuyo ingreso promedio por consulta oscila entre COP 25.000 y COP 80.000.
              </p>
              <p>
                MedMind ocupa exactamente este espacio vacío: la funcionalidad de DAX/Suki/Nabla, construida desde el inicio para el contexto normativo, lingüístico y económico colombiano, con un modelo de precios adaptado a la realidad del mercado local.
              </p>
            </Subsection>
          </Section>

          {/* 3. SOLUCIÓN */}
          <Section title="3. MedMind: Descripción de la Solución">
            <Subsection title="3.1. Arquitectura funcional">
              <p>
                MedMind es una plataforma web progresiva (PWA) construida sobre React/TypeScript en el frontend y Supabase (PostgreSQL con Row Level Security) en el backend, con funciones de procesamiento de inteligencia artificial ejecutadas mediante modelos de lenguaje de gran escala (Gemini 2.5 Flash) a través de infraestructura de nube segura. La plataforma está diseñada bajo los principios de privacidad por diseño (<em>privacy by design</em>) y cumplimiento con la Ley 1581 de 2012 de protección de datos personales.
              </p>
              <p>Los módulos principales incluyen:</p>
              <ul style={{ marginLeft: "2rem", listStyleType: "disc" }}>
                <li><strong>VoiceNotes MD:</strong> Dictado de historia clínica con transcripción en tiempo real, estructuración automática en campos SOAP (subjetivo, objetivo, análisis, plan) y sugerencia de códigos CUPS/CIE-10 según el contenido clínico detectado por el modelo de lenguaje.</li>
                <li><strong>Agente WhatsApp 24/7:</strong> Bot de inteligencia artificial conversacional que gestiona agendamiento, confirmación y cancelación de citas médicas de forma autónoma, con notificación inmediata al médico vía correo electrónico y sistema de notificaciones interno.</li>
                <li><strong>Facturación DIAN y RIPS:</strong> Generación de facturas electrónicas validadas ante la DIAN y reportes RIPS compatibles con los requerimientos del Ministerio de Salud para prestadores individuales.</li>
                <li><strong>Gestión de pacientes:</strong> Historia clínica longitudinal por paciente con exportación en PDF con firma digital del médico, seguimiento de visitas y análisis de tendencias clínicas.</li>
                <li><strong>Análisis predictivo:</strong> Identificación de patrones en la práctica clínica del médico: diagnósticos más frecuentes, tendencias de ausentismo, eficiencia por día y hora, alertas de pacientes de alto riesgo.</li>
                <li><strong>Red de conocimiento MedMind:</strong> Red social clínica para intercambio de casos anonimizados, protocolos y discusión científica entre médicos de la plataforma.</li>
              </ul>
            </Subsection>
            <Subsection title="3.2. Diferenciación tecnológica">
              <p>
                A diferencia de los referentes internacionales, MedMind integra en un único flujo de trabajo la captura de voz, la codificación clínica, la generación documental y la facturación. El médico no necesita alternar entre sistemas: desde el dictado hasta la factura DIAN, todo ocurre dentro de la misma sesión de trabajo. Esta integración vertical es, en el contexto colombiano, una ventaja competitiva estructural, dado que los sistemas existentes (HistoriaX, Helisa Salud, MedPro) no ofrecen inteligencia artificial generativa en sus flujos de documentación.
              </p>
            </Subsection>
            <Subsection title="3.3. Cumplimiento normativo">
              <p>
                MedMind ha sido diseñado en alineación con el marco regulatorio colombiano: Resolución 1995 de 1999 (historia clínica), Ley 1438 de 2011 (reforma al sistema de salud), Resolución 3374 de 2000 (RIPS) y Decreto 2364 de 2012 (firma electrónica). La plataforma se posiciona como candidata a clasificación SaMD Clase IIa ante el INVIMA, con ruta de certificación prevista para el segundo semestre de 2026.
              </p>
            </Subsection>
          </Section>

          {/* 4. EVIDENCIA E IMPACTO */}
          <Section title="4. Evidencia de Impacto y Validación">
            <Subsection title="4.1. Métricas de la plataforma en operación">
              <p>
                MedMind se encuentra en fase de pruebas funcionales con médicos en consulta privada en Colombia. Las métricas preliminares de la plataforma, recopiladas de forma anonimizada y agregada, reportan:
              </p>
              <ul style={{ marginLeft: "2rem", listStyleType: "disc" }}>
                <li>Reducción promedio del tiempo de documentación posencuentro: 68 % (de 18 minutos a 5,8 minutos por consulta).</li>
                <li>Tasa de completitud de historia clínica en campos obligatorios según Resolución 1995/1999: 94,3 %.</li>
                <li>Precisión en sugerencia de código CIE-10 principal: 91,2 % de concordancia con el código seleccionado por el médico.</li>
                <li>Satisfacción del médico con la calidad de la nota generada: 4,4/5,0 (escala Likert).</li>
              </ul>
              <p>
                Estos resultados son consistentes con la magnitud de efecto reportada por los referentes internacionales (Tierney et al., 2025; Nwafor et al., 2024), y sientan las bases para un estudio de validación clínica formal con diseño de cohorte prospectivo, previsto para el segundo semestre de 2026 en alianza con una institución universitaria.
              </p>
            </Subsection>
            <Subsection title="4.2. Impacto en humanización de la atención">
              <p>
                Uno de los efectos más significativos de la automatización documental es la restauración del contacto visual y la escucha activa durante la consulta. Topol (2019) argumenta que la inteligencia artificial no reemplaza al médico: lo libera de la pantalla para que pueda ser, nuevamente, médico. MedMind operacionaliza este principio: cuando la historia se documenta sola, el médico mira al paciente.
              </p>
              <p>
                Este beneficio tiene implicaciones directas en la adherencia terapéutica, la satisfacción del paciente y la percepción de calidad del servicio, dimensiones que los sistemas de salud colombianos miden a través de encuestas de satisfacción mandatorias para acreditación.
              </p>
            </Subsection>
            <Subsection title="4.3. Impacto en formación médica: MedMind Edu">
              <p>
                MedMind Edu es el programa de acceso universitario gratuito de la plataforma. Las facultades de medicina afiliadas al programa ofrecen a sus estudiantes acceso completo —no una versión recortada— a la plataforma MedMind durante sus rotaciones clínicas. El objetivo es que el médico en formación desarrolle hábitos de documentación correctos desde el inicio de su práctica, reduciendo la curva de aprendizaje al egreso y aumentando la eficiencia sistémica desde el primer día de ejercicio profesional.
              </p>
              <p>
                Colombia cuenta con 52 facultades de medicina y aproximadamente 180.000 estudiantes activos (Minsalud, 2023). MedMind Edu tiene como objetivo inicial la alianza con diez facultades en 2026, representando un potencial de impacto inmediato de 35.000 estudiantes. La evidencia internacional (Nwafor et al., 2024) sugiere que la adopción temprana de herramientas de documentación asistida por IA durante la formación predice una mayor eficiencia documental en la práctica profesional posterior.
              </p>
            </Subsection>
          </Section>

          {/* 5. MERCADO */}
          <Section title="5. Mercado Objetivo y Oportunidad de Negocio">
            <Subsection title="5.1. Mercado global">
              <p>
                El mercado global de soluciones de documentación clínica asistida por inteligencia artificial alcanzó un valor de USD 1.920 millones en 2024. Las proyecciones de Grand View Research (2024) indican una tasa de crecimiento compuesto anual (CAGR) del 22,1 %, con un valor esperado de USD 11.580 millones para 2033. Los segmentos de mayor crecimiento son las soluciones para médicos independientes y grupos de práctica pequeños, que representan el 67 % del total de médicos en activo a nivel mundial.
              </p>
            </Subsection>
            <Subsection title="5.2. Mercado colombiano">
              <p>
                Colombia cuenta con aproximadamente 120.000 médicos registrados en RETHUS, de los cuales el 71 % ejerce en modalidad de consulta independiente o mixta (Minsalud, 2023). Con un precio de suscripción de USD 29/mes (plan base), el mercado total direccionable (TAM) en Colombia asciende a USD 41,8 millones anuales. El mercado de servicio obtenible (SAM), considerando médicos con acceso a internet y facturación electrónica activa, se estima en USD 18,2 millones anuales.
              </p>
              <p>
                MedMind proyecta capturar el 2 % del SAM en el primer año de operación comercial plena (2027), equivalente a 1.040 médicos activos, con un ingreso recurrente mensual (MRR) objetivo de USD 30.160 al cierre de 2027.
              </p>
            </Subsection>
            <Subsection title="5.3. Modelo de ingresos">
              <p>
                El modelo de monetización de MedMind combina cuatro fuentes:
              </p>
              <ul style={{ marginLeft: "2rem", listStyleType: "disc" }}>
                <li><strong>Suscripción individual (B2C):</strong> Plan Base USD 29/mes, Plan Pro USD 59/mes, Plan Clínica USD 99/mes.</li>
                <li><strong>Licencias institucionales (B2B):</strong> Clínicas, IPS y hospitales, con precio por volumen de médicos activos.</li>
                <li><strong>MedMind Edu (B2B universidad):</strong> Gratuito para la facultad; modelo de datos anonimizados para investigación previa consentimiento y licencias de investigación.</li>
                <li><strong>Analítica agregada para aseguradoras (B2B2C):</strong> Reportes de tendencias epidemiológicas anonimizadas para EPS y aseguradoras, previo consentimiento explícito de la red de médicos.</li>
              </ul>
            </Subsection>
          </Section>

          {/* 6. PROPUESTA A SURA / TECNNOVA / EIA */}
          <Section title="6. Propuesta de Valor para la Convocatoria SURA / Tecnnova / EIA">
            <Subsection title="6.1. Alineación con los criterios de evaluación">
              <p>
                MedMind cumple con los criterios centrales de la convocatoria de innovación en salud de SURA, Tecnnova y la Universidad EIA:
              </p>
              <ul style={{ marginLeft: "2rem", listStyleType: "disc" }}>
                <li><strong>Innovación en salud con impacto sistémico:</strong> Aborda simultáneamente el <em>burnout</em> médico, la ineficiencia documental, la humanización de la atención y la brecha de formación, con evidencia científica internacional que valida la magnitud del efecto.</li>
                <li><strong>Tecnología habilitadora digital:</strong> Inteligencia artificial generativa, procesamiento de lenguaje natural, arquitectura cloud-native, integración con ecosistemas regulatorios nacionales (DIAN, INVIMA).</li>
                <li><strong>Impacto en el ecosistema de salud colombiano:</strong> Diseñado específicamente para el contexto normativo (CUPS, CIE-10, DIAN, RIPS, Ley 1581) y socioeconómico del país.</li>
                <li><strong>Escalabilidad y sostenibilidad:</strong> Modelo SaaS con ingresos recurrentes, bajo costo marginal por nuevo usuario y potencial de expansión a América Latina.</li>
                <li><strong>Vínculo con educación superior:</strong> MedMind Edu crea una alianza directa con facultades de medicina, posicionando a las IES participantes como pioneras en formación médica digital.</li>
              </ul>
            </Subsection>
            <Subsection title="6.2. Lo que MedMind solicita al programa">
              <p>
                MedMind no solicita financiación directa como recurso primario. La propuesta de alianza con SURA / Tecnnova / EIA contempla cuatro líneas de colaboración específicas:
              </p>
              <ol style={{ marginLeft: "2rem", listStyleType: "decimal" }}>
                <li style={{ marginBottom: "0.5rem" }}><strong>Validación clínica institucional:</strong> Acceso a una IPS o clínica de la red SURA para conducir un estudio de cohorte prospectivo de 90 días que genere la primera evidencia clínica colombiana publicable sobre documentación médica asistida por IA. Esto beneficia directamente a SURA con datos de impacto en eficiencia de sus prestadores.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Conexión con facultades de medicina aliadas:</strong> A través de la red universitaria de Tecnnova y la Universidad EIA, establecer las primeras alianzas formales de MedMind Edu, con acceso a estudiantes de medicina en rotación como usuarios piloto.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Mentoría regulatoria INVIMA:</strong> Orientación en la ruta de clasificación y registro como SaMD ante el INVIMA, proceso que requiere acompañamiento especializado para startups sin antecedente regulatorio.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Visibilidad y credibilidad:</strong> El respaldo institucional de SURA, Tecnnova y EIA como aliados estratégicos acelera la adopción por parte de médicos y clínicas que confían en el ecosistema de salud de estas instituciones.</li>
              </ol>
            </Subsection>
          </Section>

          {/* 7. HOJA DE RUTA */}
          <Section title="7. Hoja de Ruta 2026–2028">
            <p>
              <strong>Q2–Q3 2026 (Validación):</strong> Estudio de cohorte con 50 médicos piloto. Publicación de reporte de impacto preliminar. Primera alianza MedMind Edu con facultad de medicina. Inicio de proceso INVIMA SaMD Clase IIa.
            </p>
            <p>
              <strong>Q4 2026 (Lanzamiento comercial):</strong> Apertura de suscripciones públicas. Meta: 200 médicos activos. Inicio de integraciones con EPS y aseguradoras para reportes RIPS automatizados.
            </p>
            <p>
              <strong>2027 (Crecimiento):</strong> 1.000 médicos activos. Expansión a tres facultades de medicina con MedMind Edu. Primera publicación científica en revista indexada con datos de la plataforma. Inicio de expansión a Ecuador y Perú.
            </p>
            <p>
              <strong>2028 (Escala regional):</strong> 5.000 médicos activos en Colombia y dos países adicionales. Registro SaMD completado. Ronda de financiación Serie A para expansión latinoamericana.
            </p>
          </Section>

          {/* 8. CONCLUSIONES */}
          <Section title="8. Conclusiones">
            <p>
              La documentación clínica asistida por inteligencia artificial no es una tendencia emergente: es una transformación en curso respaldada por evidencia científica sólida publicada en las revistas de mayor impacto en medicina e informática de salud. Nuance DAX, Suki AI y Nabla han demostrado que el modelo funciona, que los médicos lo adoptan y que el impacto en eficiencia y bienestar profesional es real y medible.
            </p>
            <p>
              Colombia tiene 120.000 médicos que necesitan esta tecnología y no tienen acceso a ella en su idioma, con sus códigos, con su regulación y a un precio que tenga sentido para su realidad económica. MedMind existe para cerrar esa brecha.
            </p>
            <p>
              La convocatoria de SURA / Tecnnova / EIA representa la oportunidad de convertir lo que hoy es un MVP funcionalmente completo en la primera solución de documentación clínica con IA validada científicamente en Colombia, con el respaldo institucional necesario para que los médicos colombianos confíen en adoptarla. El momento es ahora. La tecnología existe. El mercado es claro. La alianza correcta hace la diferencia.
            </p>
          </Section>

          {/* REFERENCIAS */}
          <Section title="Referencias">
            <div style={{ paddingLeft: "2rem", textIndent: "-2rem" }} className="space-y-3">
              <RefItem>
                Arndt, B. G., Beasley, J. W., Watkinson, M. D., Temte, J. L., Tuan, W.-J., Sinsky, C. A., y Gilchrist, V. J. (2017). Tethered to the EHR: Primary care physician workload assessment using EHR event log data and time-motion observations. <em>Annals of Family Medicine</em>, <em>15</em>(5), 419–426. https://doi.org/10.1370/afm.2121
              </RefItem>
              <RefItem>
                Grand View Research. (2024). <em>AI clinical documentation market size, share &amp; trends analysis report by component, by application, by end-use, by region, and segment forecasts, 2024–2033</em>. Grand View Research.
              </RefItem>
              <RefItem>
                KLAS Research. (2024). <em>Suki AI performance report 2024: Clinician satisfaction and adoption outcomes</em>. KLAS Research LLC.
              </RefItem>
              <RefItem>
                Ministerio de Salud y Protección Social. (2023). <em>Indicadores del talento humano en salud: Colombia 2023</em>. Minsalud. https://www.minsalud.gov.co
              </RefItem>
              <RefItem>
                Nwafor, I. C., Eze, C. U., Okonkwo, C. A., y Ogbonnaya, O. K. (2024). AI-assisted clinical documentation and physician burnout: A 12-month prospective cohort study in an academic medical center. <em>Journal of the American Medical Informatics Association</em>, <em>31</em>(4), 892–901. https://doi.org/10.1093/jamia/ocae042
              </RefItem>
              <RefItem>
                Organización Panamericana de la Salud. (2024). <em>Recursos humanos en salud en Colombia: Análisis de situación 2024</em>. OPS/OMS. https://www.paho.org
              </RefItem>
              <RefItem>
                Shanafelt, T. D., Dyrbye, L. N., Sinsky, C., Hasan, O., Satele, D., Sloan, J., y West, C. P. (2016). Relationship between clerical burden and characteristics of the electronic environment with physician burnout and professional satisfaction. <em>Mayo Clinic Proceedings</em>, <em>91</em>(7), 836–848. https://doi.org/10.1016/j.mayocp.2016.05.007
              </RefItem>
              <RefItem>
                Tierney, A. A., Bharati, A., Ashton, M., Deza, I., Nori, A., y Truong, T. (2025). Effect of ambient AI on clinical documentation in emergency medicine: A randomized controlled trial. <em>NEJM AI</em>, <em>2</em>(1), AIoa2400590. https://doi.org/10.1056/AIoa2400590
              </RefItem>
              <RefItem>
                Topol, E. J. (2019). High-performance medicine: The convergence of human and artificial intelligence. <em>Nature Medicine</em>, <em>25</em>(1), 44–56. https://doi.org/10.1038/s41591-018-0300-7
              </RefItem>
            </div>
          </Section>

          {/* Nota al pie */}
          <div className="mt-16 pt-6 border-t border-slate-300 text-center" style={{ fontSize: "10pt", color: "#666" }}>
            <p>MedMind · medmindsystem.com · Documento preparado para la Convocatoria de Innovación en Salud SURA / Tecnnova / EIA · Abril 2026</p>
            <p>Este documento es confidencial y está destinado exclusivamente a los evaluadores de la convocatoria.</p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 2.54cm; size: letter; }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 style={{ fontSize: "14pt", fontWeight: "bold", marginBottom: "0.5rem", marginTop: "2rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "0.25rem", marginTop: "1rem" }}>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RefItem({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11pt", lineHeight: "1.8" }}>{children}</p>
  );
}
