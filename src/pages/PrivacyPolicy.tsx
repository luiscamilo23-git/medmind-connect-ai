import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
            <h1 className="text-4xl font-bold">Política de Privacidad</h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introducción</h2>
              <p>
                En MEDMIND, nos comprometemos a proteger la privacidad y seguridad de la información de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos la información personal y médica que usted nos proporciona al utilizar nuestra plataforma de gestión médica.
              </p>
              <p>
                Como plataforma diseñada para profesionales de la salud, entendemos la naturaleza sensible de los datos médicos y nos adherimos a los más altos estándares de protección de datos y cumplimiento normativo.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold mt-4">2.1 Información de Profesionales Médicos</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Datos de identificación: nombre completo, número de cédula profesional, especialidad médica</li>
                <li>Información de contacto: dirección de correo electrónico, número de teléfono, dirección del consultorio</li>
                <li>Credenciales de acceso: nombre de usuario, contraseña encriptada</li>
                <li>Información de facturación: datos fiscales, métodos de pago</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">2.2 Información de Pacientes</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Datos demográficos: nombre, fecha de nacimiento, género, dirección, contacto</li>
                <li>Historia clínica: diagnósticos, tratamientos, prescripciones, alergias</li>
                <li>Registros de consultas: notas clínicas, transcripciones de audio</li>
                <li>Información de citas: horarios, motivos de consulta, recordatorios</li>
                <li>Datos de salud: signos vitales, resultados de laboratorio, estudios médicos</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">2.3 Información Técnica</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Datos de uso: páginas visitadas, funciones utilizadas, tiempo de sesión</li>
                <li>Información del dispositivo: tipo de dispositivo, sistema operativo, navegador</li>
                <li>Direcciones IP y datos de ubicación geográfica</li>
                <li>Cookies y tecnologías similares de seguimiento</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Cómo Utilizamos su Información</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Prestación de servicios:</strong> Proporcionar y mantener las funcionalidades de la plataforma</li>
                <li><strong>Gestión médica:</strong> Facilitar la documentación, seguimiento y gestión de pacientes</li>
                <li><strong>Inteligencia artificial:</strong> Procesar transcripciones de voz, generar historias clínicas, análisis predictivo</li>
                <li><strong>Comunicación:</strong> Enviar notificaciones, recordatorios de citas, actualizaciones importantes</li>
                <li><strong>Mejora del servicio:</strong> Analizar patrones de uso para optimizar funcionalidades</li>
                <li><strong>Seguridad:</strong> Detectar y prevenir fraudes, abusos o accesos no autorizados</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y regulatorias aplicables</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Base Legal para el Procesamiento de Datos</h2>
              <p>Procesamos sus datos personales bajo las siguientes bases legales:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentimiento:</strong> Usted nos ha dado su consentimiento explícito</li>
                <li><strong>Ejecución contractual:</strong> Necesario para cumplir con nuestros servicios</li>
                <li><strong>Obligación legal:</strong> Requerido por normativas de salud aplicables</li>
                <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y seguridad</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Protección y Seguridad de Datos</h2>
              <p>Implementamos medidas de seguridad técnicas y organizativas robustas:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encriptación:</strong> Todos los datos se encriptan en tránsito (TLS/SSL) y en reposo (AES-256)</li>
                <li><strong>Control de acceso:</strong> Autenticación multifactor y gestión granular de permisos</li>
                <li><strong>Auditoría:</strong> Registro completo de accesos y modificaciones de datos sensibles</li>
                <li><strong>Respaldos:</strong> Copias de seguridad automáticas y encriptadas en múltiples ubicaciones</li>
                <li><strong>Aislamiento de datos:</strong> Separación estricta entre datos de diferentes consultorios</li>
                <li><strong>Seguridad física:</strong> Servidores ubicados en centros de datos certificados ISO 27001</li>
                <li><strong>Monitoreo:</strong> Vigilancia continua de amenazas y vulnerabilidades</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Compartir Información</h2>
              <p>No vendemos ni compartimos su información personal con terceros, excepto en los siguientes casos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la plataforma (hosting, analytics, soporte)</li>
                <li><strong>Profesionales autorizados:</strong> Médicos o personal autorizado por usted para acceder a información específica</li>
                <li><strong>Requerimientos legales:</strong> Cuando sea obligatorio por ley, orden judicial o autoridad competente</li>
                <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos legales o seguridad de usuarios</li>
              </ul>
              <p className="mt-4">
                Todos los proveedores de servicios están obligados contractualmente a mantener la confidencialidad y seguridad de los datos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Retención de Datos</h2>
              <p>
                Conservamos su información durante el tiempo necesario para cumplir con los fines descritos y las obligaciones legales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de pacientes:</strong> Mínimo 5 años después de la última consulta (según normativa local)</li>
                <li><strong>Datos de profesionales:</strong> Durante la vigencia de la cuenta más 2 años</li>
                <li><strong>Datos de facturación:</strong> 10 años según requisitos fiscales</li>
                <li><strong>Logs de auditoría:</strong> 1 año para fines de seguridad</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Sus Derechos</h2>
              <p>Usted tiene los siguientes derechos sobre sus datos personales:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos (con excepciones legales)</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado y transferirlos a otro servicio</li>
                <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos en ciertos casos</li>
                <li><strong>Limitación:</strong> Solicitar la restricción del procesamiento de sus datos</li>
                <li><strong>Retirar consentimiento:</strong> Revocar su consentimiento en cualquier momento</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, contáctenos en: <strong>privacidad@medmind.com</strong>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Transferencias Internacionales</h2>
              <p>
                Sus datos pueden ser transferidos y almacenados en servidores ubicados fuera de su país de residencia. Garantizamos que dichas transferencias cumplan con los estándares de protección de datos mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cláusulas contractuales estándar aprobadas</li>
                <li>Certificaciones de privacidad aplicables</li>
                <li>Medidas de seguridad adicionales</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Cookies y Tecnologías Similares</h2>
              <p>
                Utilizamos cookies y tecnologías similares para mejorar su experiencia. Consulte nuestra <Link to="/cookie-policy" className="text-primary hover:underline">Política de Cookies</Link> para más información sobre cómo las utilizamos y cómo puede gestionarlas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Privacidad de Menores</h2>
              <p>
                MEDMIND está diseñado para profesionales médicos mayores de 18 años. No recopilamos intencionalmente información de menores de edad. Los datos de pacientes menores son responsabilidad del profesional médico que utiliza la plataforma.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Cambios a esta Política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos cualquier cambio significativo mediante correo electrónico o notificación en la plataforma. La fecha de "última actualización" en la parte superior indica cuándo se realizaron los cambios más recientes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Contacto</h2>
              <p>
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el tratamiento de sus datos personales, puede contactarnos:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> privacidad@medmind.com</li>
                <li><strong>Teléfono:</strong> +52 (55) 1234-5678</li>
                <li><strong>Dirección:</strong> MEDMIND S.A. de C.V., Av. Reforma 123, CDMX, México</li>
              </ul>
              <p className="mt-4">
                También puede presentar una queja ante la autoridad de protección de datos de su jurisdicción si considera que hemos violado sus derechos de privacidad.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Cumplimiento Normativo</h2>
              <p>
                MEDMIND cumple con las siguientes normativas y estándares de protección de datos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México)</li>
                <li>HIPAA (Health Insurance Portability and Accountability Act)</li>
                <li>GDPR (General Data Protection Regulation) para usuarios europeos</li>
                <li>ISO 27001 - Gestión de Seguridad de la Información</li>
                <li>SOC 2 Type II - Certificación de seguridad y privacidad</li>
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

export default PrivacyPolicy;
