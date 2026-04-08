import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LegalNotice = () => {
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
            <h1 className="text-4xl font-bold">Aviso Legal</h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Información General</h2>
              <p>
                En cumplimiento de lo dispuesto en la Estatuto del Consumidor colombiano (Ley 1480 de 2011) y demás normativas aplicables, MEDMIND proporciona la siguiente información:
              </p>
              
              <div className="bg-muted/30 p-6 rounded-lg space-y-2">
                <p><strong>Razón Social:</strong> MEDMIND SAS</p>
                <p><strong>Domicilio:</strong> Medellín, Antioquia, Colombia</p>
                <p><strong>Teléfono:</strong> +57 305 3943965</p>
                <p><strong>Email de Contacto:</strong> soporte@medmindsystem.com</p>
                <p><strong>Email Legal:</strong> soporte@medmindsystem.com</p>
                <p><strong>Sitio Web:</strong> https://medmindsystem.com</p>
                <p><strong>Representante Legal:</strong> Tomas Hoyos Velásquez</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Objeto de la Plataforma</h2>
              <p>
                MEDMIND es una plataforma digital de gestión médica diseñada para profesionales de la salud en Latinoamérica. El servicio proporciona herramientas tecnológicas para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestión de consultorios y clínicas médicas</li>
                <li>Administración de historias clínicas digitales</li>
                <li>Transcripción automática de consultas mediante IA</li>
                <li>Control de inventarios médicos</li>
                <li>Gestión de citas y agenda médica</li>
                <li>Análisis predictivo y generación de reportes</li>
                <li>Comunicación segura entre profesionales y pacientes</li>
              </ul>
              <p className="mt-4">
                <strong>Importante:</strong> MEDMIND es una herramienta de apoyo administrativo y tecnológico. No proporciona servicios médicos directos, diagnósticos ni tratamientos. El profesional médico es el único responsable de las decisiones clínicas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Condiciones de Uso</h2>
              <p>
                El acceso y uso de la plataforma MEDMIND está sujeto a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Aceptación de los <Link to="/terms-of-service" className="text-primary hover:underline">Términos de Servicio</Link></li>
                <li>Cumplimiento de la <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link></li>
                <li>Respeto a la <Link to="/cookie-policy" className="text-primary hover:underline">Política de Cookies</Link></li>
                <li>Acatamiento de las leyes y regulaciones aplicables en materia de salud</li>
              </ul>
              <p className="mt-4">
                El usuario debe ser un profesional médico con licencia válida y cumplir con todos los requisitos legales para el ejercicio de su profesión.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Propiedad Intelectual</h2>
              
              <h3 className="text-xl font-semibold mt-4">4.1 Derechos de MEDMIND</h3>
              <p>
                Todos los elementos que componen MEDMIND, incluyendo pero no limitándose a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Diseño gráfico, logotipos y marca MEDMIND</li>
                <li>Código fuente, software y algoritmos</li>
                <li>Bases de datos y estructura de información</li>
                <li>Textos, imágenes, videos y contenidos multimedia</li>
                <li>Documentación técnica y manuales</li>
              </ul>
              <p className="mt-4">
                Son propiedad exclusiva de MEDMIND SAS o de sus licenciantes, y están protegidos por las leyes colombianas e internacionales de propiedad intelectual, derechos de autor y marcas registradas.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.2 Marcas Registradas</h3>
              <p>
                MEDMIND® es una marca registrada de MEDMIND SAS Está prohibido el uso no autorizado de la marca o cualquier elemento distintivo de la plataforma.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.3 Uso Permitido</h3>
              <p>
                Se otorga una licencia limitada, no exclusiva, no transferible y revocable para utilizar la plataforma exclusivamente para los fines previstos. Queda expresamente prohibido:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Copiar, modificar o distribuir el software o contenido de MEDMIND</li>
                <li>Realizar ingeniería inversa o descompilar el código</li>
                <li>Crear trabajos derivados sin autorización expresa</li>
                <li>Utilizar la marca o logotipo sin permiso por escrito</li>
                <li>Extraer o reutilizar partes sustanciales de las bases de datos</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Protección de Datos Personales</h2>
              <p>
                MEDMIND es responsable del tratamiento de datos personales de acuerdo con:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</li>
                <li>Su Reglamento</li>
                <li>Lineamientos del Aviso de Privacidad</li>
                <li>HIPAA (Health Insurance Portability and Accountability Act)</li>
                <li>GDPR (General Data Protection Regulation) para usuarios europeos</li>
              </ul>
              <p className="mt-4">
                Para más información, consulte nuestra <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link> integral.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Responsabilidad y Limitaciones</h2>
              
              <h3 className="text-xl font-semibold mt-4">6.1 Responsabilidad Médica</h3>
              <p>
                <strong>MEDMIND NO es responsable de:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Diagnósticos, tratamientos o decisiones médicas tomadas por los profesionales de salud</li>
                <li>Negligencia médica, mala praxis o errores clínicos</li>
                <li>Resultados adversos en pacientes derivados del uso de la información médica</li>
                <li>Interpretación incorrecta de transcripciones o análisis generados por IA</li>
                <li>Relación médico-paciente, que es responsabilidad exclusiva del profesional</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">6.2 Disponibilidad del Servicio</h3>
              <p>
                Aunque nos esforzamos por mantener la plataforma disponible 24/7, MEDMIND no garantiza:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceso ininterrumpido o sin errores</li>
                <li>Ausencia total de fallos técnicos o bugs</li>
                <li>Inmunidad a ataques cibernéticos o brechas de seguridad</li>
                <li>Compatibilidad con todos los dispositivos y navegadores</li>
              </ul>
              <p className="mt-4">
                Realizamos mantenimientos programados que pueden interrumpir temporalmente el servicio. Notificaremos con anticipación cuando sea posible.
              </p>

              <h3 className="text-xl font-semibold mt-4">6.3 Precisión de la IA</h3>
              <p>
                Las funcionalidades de inteligencia artificial (transcripción, análisis, sugerencias) son herramientas de apoyo y pueden contener errores o imprecisiones. El profesional médico debe:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Verificar toda información generada automáticamente</li>
                <li>Ejercer su criterio profesional independiente</li>
                <li>No confiar exclusivamente en sugerencias automatizadas</li>
                <li>Confirmar datos críticos antes de tomar decisiones clínicas</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">6.4 Contenido de Terceros</h3>
              <p>
                La plataforma puede contener enlaces a sitios web o recursos de terceros. MEDMIND no es responsable del contenido, precisión, políticas o prácticas de estos terceros.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Exclusión de Garantías</h2>
              <p>
                En la máxima medida permitida por la ley aplicable, MEDMIND se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo pero no limitándose a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Garantías implícitas de comerciabilidad</li>
                <li>Idoneidad para un propósito particular</li>
                <li>No infracción de derechos de terceros</li>
                <li>Ausencia de virus o componentes dañinos</li>
                <li>Precisión, integridad o utilidad de la información</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Limitación de Responsabilidad</h2>
              <p>
                En ningún caso MEDMIND, sus directores, empleados, socios, proveedores o afiliados serán responsables por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Daños indirectos, incidentales, especiales, consecuentes o punitivos</li>
                <li>Pérdida de beneficios, datos, uso, goodwill u otras pérdidas intangibles</li>
                <li>Daños superiores al monto pagado por el usuario en los últimos 12 meses</li>
                <li>Pérdida o corrupción de datos médicos (se recomienda mantener respaldos externos)</li>
                <li>Daños derivados del uso o incapacidad de uso de la plataforma</li>
              </ul>
              <p className="mt-4">
                Estas limitaciones aplican independientemente de la base legal de la reclamación y aunque se haya advertido de la posibilidad de dichos daños.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Jurisdicción y Ley Aplicable</h2>
              <p>
                Este Aviso Legal se rige por las leyes de los Estados Unidos Mexicanos. Cualquier controversia relacionada con el uso de MEDMIND será sometida a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero que pudiera corresponder.
              </p>
              <p className="mt-4">
                Para usuarios internacionales, se aplicarán adicionalmente las leyes de protección al consumidor y privacidad de datos de su jurisdicción cuando sean más favorables.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Resolución de Controversias</h2>
              
              <h3 className="text-xl font-semibold mt-4">10.1 Proceso de Quejas</h3>
              <p>
                Antes de iniciar cualquier acción legal, le solicitamos que intente resolver la disputa contactándonos en:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email de soporte:</strong> soporte@medmindsystem.com</li>
                <li><strong>Email legal:</strong> soporte@medmindsystem.com</li>
                <li><strong>Teléfono:</strong> +57 305 3943965</li>
              </ul>
              <p className="mt-4">
                Nos comprometemos a responder quejas dentro de 5 días hábiles e intentar resolverlas en un plazo máximo de 30 días.
              </p>

              <h3 className="text-xl font-semibold mt-4">10.2 Arbitraje (Opcional)</h3>
              <p>
                Las partes pueden acordar someter las controversias a arbitraje conforme al Reglamento de Arbitraje de la Cámara de Comercio Internacional (ICC) o de la Comisión Interamericana de Arbitraje Comercial (CIAC).
              </p>

              <h3 className="text-xl font-semibold mt-4">10.3 PROFECO</h3>
              <p>
                Los usuarios mexicanos pueden presentar quejas ante la Procuraduría Federal del Consumidor (PROFECO) en caso de controversias no resueltas relacionadas con servicios de consumo.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Políticas de Devolución y Cancelación</h2>
              
              <h3 className="text-xl font-semibold mt-4">11.1 Período de Prueba</h3>
              <p>
                MEDMIND ofrece un período de prueba gratuito de 14 días para nuevos usuarios. Durante este período, puede cancelar sin cargo alguno.
              </p>

              <h3 className="text-xl font-semibold mt-4">11.2 Cancelación de Suscripción</h3>
              <p>
                Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta. La cancelación será efectiva al final del período de facturación actual, sin derecho a reembolso prorrateado.
              </p>

              <h3 className="text-xl font-semibold mt-4">11.3 Política de Reembolsos</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>No reembolsable:</strong> Los pagos de suscripción no son reembolsables, excepto según lo requiera la ley</li>
                <li><strong>Excepciones:</strong> Casos de falla técnica prolongada imputable a MEDMIND (más de 48 horas continuas)</li>
                <li><strong>Solicitud:</strong> Las solicitudes de reembolso excepcional deben presentarse dentro de 7 días del cargo</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Modificaciones al Aviso Legal</h2>
              <p>
                MEDMIND se reserva el derecho de modificar este Aviso Legal en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma.
              </p>
              <p>
                Cambios significativos serán notificados mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Correo electrónico a la dirección registrada</li>
                <li>Notificación destacada en la plataforma</li>
                <li>Actualización de la fecha de "última actualización"</li>
              </ul>
              <p className="mt-4">
                El uso continuado de MEDMIND después de las modificaciones constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Certificaciones y Cumplimiento</h2>
              <p>
                MEDMIND cuenta con las siguientes certificaciones y cumple con:
              </p>
              
              <h3 className="text-xl font-semibold mt-4">13.1 Seguridad y Privacidad</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>ISO 27001:</strong> Gestión de Seguridad de la Información</li>
                <li><strong>SOC 2 Type II:</strong> Certificación de seguridad y privacidad</li>
                <li><strong>HIPAA Compliance:</strong> Cumplimiento de normativa de privacidad médica (EE.UU.)</li>
                <li><strong>GDPR Ready:</strong> Preparado para el Reglamento General de Protección de Datos (UE)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">13.2 Normativa Colombiana de Salud</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Resolución 1995/1999:</strong> Historia clínica electrónica con inmutabilidad, marca de tiempo e identificación profesional</li>
                <li><strong>Ley 1581/2012:</strong> Protección de datos personales de pacientes con encriptación y control de acceso</li>
                <li><strong>NOM-024-SSA3-2012:</strong> Sistemas de información de registro electrónico para la salud (México)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">13.3 Facturación Electrónica DIAN Colombia</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Resolución DIAN 000042:</strong> Cumplimiento de facturación electrónica con CUFE</li>
                <li><strong>Resolución 558/2024:</strong> Modelo de validación previa de factura electrónica</li>
                <li><strong>Resolución 2275/2023:</strong> Generación de RIPS en formato JSON obligatorio</li>
                <li><strong>Ley 527/1999:</strong> Validez jurídica de documentos electrónicos</li>
                <li><strong>Proveedores Autorizados DIAN:</strong> Integración con tecnológicos autorizados (Alegra, Siigo, Alanube)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Información de Contacto</h2>
              <p>
                Para cualquier consulta relacionada con este Aviso Legal, puede contactarnos:
              </p>
              
              <div className="bg-muted/30 p-6 rounded-lg space-y-4 mt-4">
                <div>
                  <p className="font-semibold mb-2">Contacto General:</p>
                  <ul className="list-none space-y-1">
                    <li>Email: soporte@medmindsystem.com</li>
                    <li>Teléfono: +57 305 3943965</li>
                    <li>WhatsApp: +57 305 3943965</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Asuntos Legales:</p>
                  <ul className="list-none space-y-1">
                    <li>Email: soporte@medmindsystem.com</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Privacidad y Datos:</p>
                  <ul className="list-none space-y-1">
                    <li>Email: soporte@medmindsystem.com</li>
                    <li>Oficial de Protección de Datos (DPO)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Soporte Técnico:</p>
                  <ul className="list-none space-y-1">
                    <li>Email: soporte@medmindsystem.com</li>
                    <li>Chat en vivo: Disponible 24/7 en la plataforma</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Dirección Postal:</p>
                  <p>MEDMIND SAS</p>
                  <p>Medellín, Antioquia</p>
                  <p></p>
                  <p>Colombia</p>
                </div>

                <div>
                  <p className="font-semibold mb-2">Horario de Atención:</p>
                  <p>Lunes a Viernes: 8:00 AM - 6:00 PM (GMT-5)</p>
                  <p>Soporte técnico 24/7 disponible</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">15. Disposiciones Finales</h2>
              <p>
                Este Aviso Legal, junto con los <Link to="/terms-of-service" className="text-primary hover:underline">Términos de Servicio</Link>, <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link> y <Link to="/cookie-policy" className="text-primary hover:underline">Política de Cookies</Link>, constituyen el acuerdo completo entre MEDMIND y el usuario respecto al uso de la plataforma.
              </p>
              <p className="mt-4">
                Si alguna disposición de este Aviso Legal se considera inválida o inaplicable, las demás disposiciones permanecerán en pleno vigor y efecto.
              </p>
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

export default LegalNotice;
