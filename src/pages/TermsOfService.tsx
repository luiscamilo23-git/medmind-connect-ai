import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">MEDMIND</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Términos de Servicio</h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Aceptación de los Términos</h2>
              <p>
                Bienvenido a MEDMIND. Al acceder o utilizar nuestra plataforma de gestión médica, usted acepta estar legalmente vinculado por estos Términos de Servicio ("Términos"). Si no está de acuerdo con estos Términos, no debe utilizar nuestros servicios.
              </p>
              <p>
                Estos Términos constituyen un acuerdo legal entre usted (el "Usuario" o "Profesional Médico") y MEDMIND S.A. de C.V. ("MEDMIND", "nosotros", "nuestro").
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Descripción del Servicio</h2>
              <p>
                MEDMIND es una plataforma integral de gestión médica que proporciona herramientas para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transcripción automática de consultas médicas mediante inteligencia artificial</li>
                <li>Gestión de historias clínicas y expedientes de pacientes conforme a normativa colombiana</li>
                <li>Administración de citas y agenda médica</li>
                <li>Control de inventario de suministros médicos</li>
                <li>Facturación electrónica válida ante la DIAN (Colombia)</li>
                <li>Generación automática de RIPS según Resolución 2275/2023</li>
                <li>Análisis predictivo y generación de reportes</li>
                <li>Comunicación con pacientes y red médica social</li>
              </ul>
              <p className="mt-4">
                Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto del servicio en cualquier momento, con o sin previo aviso.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Elegibilidad y Registro</h2>
              
              <h3 className="text-xl font-semibold mt-4">3.1 Requisitos de Elegibilidad</h3>
              <p>Para utilizar MEDMIND, usted debe:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ser un profesional médico con licencia válida (médico, odontólogo, especialista)</li>
                <li>Tener al menos 18 años de edad</li>
                <li>Tener la capacidad legal para aceptar estos Términos</li>
                <li>Proporcionar información precisa y completa durante el registro</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">3.2 Cuenta de Usuario</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usted es responsable de mantener la confidencialidad de sus credenciales de acceso</li>
                <li>Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
                <li>Es responsable de todas las actividades realizadas bajo su cuenta</li>
                <li>No puede compartir su cuenta con terceros ni permitir el acceso no autorizado</li>
                <li>Debe mantener actualizada su información de contacto y profesional</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Uso Aceptable</h2>
              
              <h3 className="text-xl font-semibold mt-4">4.1 Uso Permitido</h3>
              <p>Usted puede utilizar MEDMIND únicamente para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestionar su práctica médica profesional</li>
                <li>Documentar y almacenar información médica de sus pacientes legítimos</li>
                <li>Comunicarse con pacientes y colegas médicos</li>
                <li>Generar reportes y análisis relacionados con su práctica</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">4.2 Uso Prohibido</h3>
              <p>Usted NO puede:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizar la plataforma para propósitos ilegales o fraudulentos</li>
                <li>Cargar información médica falsa, engañosa o no autorizada</li>
                <li>Intentar acceder a cuentas o datos de otros usuarios</li>
                <li>Realizar ingeniería inversa, descompilar o extraer código fuente</li>
                <li>Transmitir virus, malware o código malicioso</li>
                <li>Sobrecargar o interrumpir los servidores o redes de MEDMIND</li>
                <li>Copiar, distribuir o modificar cualquier contenido de la plataforma sin autorización</li>
                <li>Usar bots, scrapers o herramientas automatizadas no autorizadas</li>
                <li>Revender o sublicenciar el servicio sin autorización previa por escrito</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Responsabilidad Médica y Profesional</h2>
              
              <h3 className="text-xl font-semibold mt-4">5.1 Responsabilidad del Profesional</h3>
              <p>
                <strong>IMPORTANTE:</strong> MEDMIND es una herramienta de apoyo administrativo y no reemplaza el juicio clínico profesional. Usted es el único responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todas las decisiones médicas y diagnósticos realizados</li>
                <li>La precisión de la información médica ingresada en la plataforma</li>
                <li>Verificar las transcripciones generadas por IA antes de su uso clínico</li>
                <li>Cumplir con todas las leyes, regulaciones y estándares médicos aplicables</li>
                <li>Obtener el consentimiento informado de los pacientes para el uso de la plataforma</li>
                <li>Mantener la confidencialidad médico-paciente</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">5.2 Limitaciones de la IA</h3>
              <p>
                Las funcionalidades de inteligencia artificial (transcripción, análisis, sugerencias) son herramientas de apoyo y pueden contener errores. Usted debe:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Revisar y verificar toda información generada por IA</li>
                <li>No confiar exclusivamente en sugerencias o análisis automatizados</li>
                <li>Mantener su criterio profesional como base de todas las decisiones médicas</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Propiedad Intelectual</h2>
              
              <h3 className="text-xl font-semibold mt-4">6.1 Propiedad de MEDMIND</h3>
              <p>
                Todo el contenido, código, diseño, funcionalidades, marcas comerciales y tecnología de MEDMIND son propiedad exclusiva de MEDMIND o sus licenciantes y están protegidos por leyes de propiedad intelectual.
              </p>

              <h3 className="text-xl font-semibold mt-4">6.2 Su Contenido</h3>
              <p>
                Usted conserva todos los derechos sobre los datos médicos y contenido que carga en la plataforma. Al usar MEDMIND, nos otorga una licencia limitada, no exclusiva y revocable para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Almacenar y procesar sus datos para proporcionar el servicio</li>
                <li>Realizar respaldos y garantizar la seguridad de sus datos</li>
                <li>Generar estadísticas agregadas y anónimas para mejorar el servicio</li>
              </ul>
              <p className="mt-4">
                Esta licencia finaliza cuando elimina su cuenta o el contenido específico.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Planes y Pagos</h2>
              
              <h3 className="text-xl font-semibold mt-4">7.1 Planes de Suscripción</h3>
              <p>
                MEDMIND ofrece diferentes planes de suscripción con funcionalidades y límites variables. Los precios y características están disponibles en nuestro sitio web y pueden cambiar con previo aviso.
              </p>

              <h3 className="text-xl font-semibold mt-4">7.2 Facturación</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Las suscripciones se facturan de forma recurrente (mensual o anual) según el plan elegido</li>
                <li>Los pagos se procesarán automáticamente en cada período de facturación</li>
                <li>Usted es responsable de mantener actualizada su información de pago</li>
                <li>Los precios no incluyen impuestos aplicables, que se añadirán según corresponda</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">7.3 Cancelación y Reembolsos</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta</li>
                <li>La cancelación será efectiva al final del período de facturación actual</li>
                <li>No ofrecemos reembolsos por pagos ya procesados, excepto según lo requiera la ley</li>
                <li>Suspenderemos el servicio si hay problemas de pago no resueltos</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Privacidad y Seguridad de Datos</h2>
              <p>
                El manejo de su información personal y de sus pacientes se rige por nuestra <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link>. Implementamos medidas de seguridad robustas, pero usted también debe:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizar contraseñas seguras y únicas</li>
                <li>Habilitar autenticación de dos factores cuando esté disponible</li>
                <li>No compartir credenciales de acceso</li>
                <li>Cerrar sesión al usar dispositivos compartidos</li>
                <li>Reportar inmediatamente cualquier violación de seguridad</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Limitación de Responsabilidad</h2>
              <p>
                <strong>EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>MEDMIND se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo</li>
                <li>No garantizamos que el servicio será ininterrumpido, libre de errores o completamente seguro</li>
                <li>No somos responsables de daños directos, indirectos, incidentales, consecuentes o punitivos</li>
                <li>No asumimos responsabilidad por decisiones médicas tomadas con base en información de la plataforma</li>
                <li>Nuestra responsabilidad total está limitada al monto pagado por usted en los últimos 12 meses</li>
              </ul>
              <p className="mt-4">
                Estas limitaciones no afectan derechos del consumidor que no puedan ser renunciados por contrato.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Indemnización</h2>
              <p>
                Usted acepta indemnizar, defender y eximir de responsabilidad a MEDMIND, sus directores, empleados, agentes y afiliados de cualquier reclamo, demanda, pérdida, daño, costo o gasto (incluyendo honorarios legales) que surjan de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Su violación de estos Términos</li>
                <li>Su uso indebido de la plataforma</li>
                <li>Violación de derechos de terceros</li>
                <li>Negligencia médica o mala praxis profesional</li>
                <li>Cualquier contenido que usted cargue o comparta</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Terminación</h2>
              
              <h3 className="text-xl font-semibold mt-4">11.1 Terminación por el Usuario</h3>
              <p>
                Puede cancelar su cuenta en cualquier momento desde la configuración de su cuenta. La terminación será efectiva al final del período de facturación actual.
              </p>

              <h3 className="text-xl font-semibold mt-4">11.2 Terminación por MEDMIND</h3>
              <p>
                Podemos suspender o terminar su cuenta inmediatamente si:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Viola estos Términos o nuestras políticas</li>
                <li>Hay actividad fraudulenta o ilegal</li>
                <li>Hay falta de pago por más de 30 días</li>
                <li>Su licencia médica profesional es revocada o suspendida</li>
                <li>Recibimos una orden judicial o requerimiento legal</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">11.3 Efectos de la Terminación</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Su acceso a la plataforma cesará inmediatamente</li>
                <li>Proporcionaremos un período de 30 días para exportar sus datos</li>
                <li>Después de 90 días, sus datos pueden ser eliminados permanentemente</li>
                <li>Las disposiciones que por su naturaleza deban sobrevivir, continuarán vigentes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Modificaciones a los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios significativos se notificarán mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Correo electrónico a su dirección registrada</li>
                <li>Notificación en la plataforma al iniciar sesión</li>
                <li>Actualización de la fecha de "última actualización"</li>
              </ul>
              <p className="mt-4">
                El uso continuado de la plataforma después de los cambios constituye su aceptación de los nuevos Términos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Ley Aplicable y Jurisdicción</h2>
              <p>
                Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa relacionada con estos Términos será resuelta en los tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otra jurisdicción.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Disposiciones Generales</h2>
              
              <h3 className="text-xl font-semibold mt-4">14.1 Acuerdo Completo</h3>
              <p>
                Estos Términos, junto con nuestra Política de Privacidad y otras políticas referenciadas, constituyen el acuerdo completo entre usted y MEDMIND.
              </p>

              <h3 className="text-xl font-semibold mt-4">14.2 Divisibilidad</h3>
              <p>
                Si alguna disposición de estos Términos se considera inválida o inaplicable, las demás disposiciones permanecerán en pleno vigor y efecto.
              </p>

              <h3 className="text-xl font-semibold mt-4">14.3 Renuncia</h3>
              <p>
                La falta de ejercicio o aplicación de cualquier derecho o disposición no constituye una renuncia a dicho derecho o disposición.
              </p>

              <h3 className="text-xl font-semibold mt-4">14.4 Cesión</h3>
              <p>
                Usted no puede ceder o transferir estos Términos sin nuestro consentimiento previo por escrito. MEDMIND puede ceder estos Términos sin restricción.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">15. Contacto</h2>
              <p>
                Si tiene preguntas sobre estos Términos, puede contactarnos:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> legal@medmind.com</li>
                <li><strong>Teléfono:</strong> +52 (55) 1234-5678</li>
                <li><strong>Dirección:</strong> MEDMIND S.A. de C.V., Av. Reforma 123, CDMX, México</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 px-4 mt-12">
        <div className="container mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          <p>© 2025 MEDMIND. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
