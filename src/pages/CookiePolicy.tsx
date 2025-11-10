import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookiePolicy = () => {
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
            <h1 className="text-4xl font-bold">Política de Cookies</h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. ¿Qué son las Cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet, smartphone) cuando visita sitios web. Las cookies permiten que el sitio web reconozca su dispositivo y recuerde información sobre su visita, como sus preferencias y acciones.
              </p>
              <p>
                MEDMIND utiliza cookies y tecnologías similares (web beacons, píxeles, almacenamiento local) para mejorar su experiencia, garantizar la seguridad y proporcionar funcionalidades esenciales de la plataforma.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Tipos de Cookies que Utilizamos</h2>
              
              <h3 className="text-xl font-semibold mt-4">2.1 Cookies Estrictamente Necesarias</h3>
              <p>
                Estas cookies son esenciales para el funcionamiento de MEDMIND y no se pueden desactivar en nuestros sistemas. Sin ellas, servicios básicos no pueden proporcionarse.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie</th>
                      <th className="border border-border p-3 text-left">Propósito</th>
                      <th className="border border-border p-3 text-left">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">session_token</td>
                      <td className="border border-border p-3">Mantiene su sesión activa y segura</td>
                      <td className="border border-border p-3">Sesión</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">auth_user</td>
                      <td className="border border-border p-3">Verifica su autenticación</td>
                      <td className="border border-border p-3">7 días</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">csrf_token</td>
                      <td className="border border-border p-3">Protección contra ataques CSRF</td>
                      <td className="border border-border p-3">Sesión</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">cookie_consent</td>
                      <td className="border border-border p-3">Almacena sus preferencias de cookies</td>
                      <td className="border border-border p-3">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold mt-4">2.2 Cookies de Funcionalidad</h3>
              <p>
                Estas cookies permiten que la plataforma recuerde sus preferencias y proporcione funciones mejoradas y personalizadas.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie</th>
                      <th className="border border-border p-3 text-left">Propósito</th>
                      <th className="border border-border p-3 text-left">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">theme_preference</td>
                      <td className="border border-border p-3">Recuerda su preferencia de tema (claro/oscuro)</td>
                      <td className="border border-border p-3">1 año</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">language_pref</td>
                      <td className="border border-border p-3">Almacena su idioma preferido</td>
                      <td className="border border-border p-3">1 año</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">dashboard_layout</td>
                      <td className="border border-border p-3">Guarda la configuración de su panel</td>
                      <td className="border border-border p-3">6 meses</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">timezone</td>
                      <td className="border border-border p-3">Almacena su zona horaria local</td>
                      <td className="border border-border p-3">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold mt-4">2.3 Cookies de Rendimiento y Analytics</h3>
              <p>
                Estas cookies nos ayudan a entender cómo los usuarios interactúan con MEDMIND, permitiéndonos mejorar el servicio. Toda la información recopilada es agregada y anónima.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie</th>
                      <th className="border border-border p-3 text-left">Propósito</th>
                      <th className="border border-border p-3 text-left">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">_ga</td>
                      <td className="border border-border p-3">Google Analytics - Distingue usuarios</td>
                      <td className="border border-border p-3">2 años</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">_gid</td>
                      <td className="border border-border p-3">Google Analytics - Distingue usuarios</td>
                      <td className="border border-border p-3">24 horas</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">_gat</td>
                      <td className="border border-border p-3">Google Analytics - Limita solicitudes</td>
                      <td className="border border-border p-3">1 minuto</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">analytics_session</td>
                      <td className="border border-border p-3">Rastrea la duración de la sesión</td>
                      <td className="border border-border p-3">30 minutos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold mt-4">2.4 Cookies de Marketing (Opcional)</h3>
              <p>
                Estas cookies se utilizan para mostrarle anuncios relevantes y realizar seguimiento de campañas publicitarias. Solo se activan con su consentimiento explícito.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Cookie</th>
                      <th className="border border-border p-3 text-left">Propósito</th>
                      <th className="border border-border p-3 text-left">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">_fbp</td>
                      <td className="border border-border p-3">Facebook Pixel - Publicidad dirigida</td>
                      <td className="border border-border p-3">3 meses</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">ads_preferences</td>
                      <td className="border border-border p-3">Almacena preferencias publicitarias</td>
                      <td className="border border-border p-3">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Cookies de Terceros</h2>
              <p>
                Utilizamos servicios de terceros que pueden establecer sus propias cookies en su dispositivo:
              </p>
              
              <h3 className="text-xl font-semibold mt-4">3.1 Google Analytics</h3>
              <p>
                Para analizar el uso de la plataforma y generar reportes estadísticos. Consulte la <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Política de Privacidad de Google</a>.
              </p>

              <h3 className="text-xl font-semibold mt-4">3.2 Servicios de Almacenamiento en la Nube</h3>
              <p>
                Para proporcionar almacenamiento seguro y respaldos de datos médicos.
              </p>

              <h3 className="text-xl font-semibold mt-4">3.3 Procesadores de Pago</h3>
              <p>
                Para procesar transacciones de suscripción de forma segura. Estos servicios tienen sus propias políticas de privacidad y cookies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Gestión de Cookies</h2>
              
              <h3 className="text-xl font-semibold mt-4">4.1 Panel de Preferencias</h3>
              <p>
                Puede gestionar sus preferencias de cookies en cualquier momento desde la configuración de su cuenta en MEDMIND. Allí puede:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Aceptar o rechazar cookies no esenciales</li>
                <li>Activar o desactivar categorías específicas de cookies</li>
                <li>Revisar qué cookies están activas</li>
                <li>Cambiar sus preferencias en cualquier momento</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">4.2 Configuración del Navegador</h3>
              <p>
                La mayoría de los navegadores web aceptan cookies automáticamente, pero puede modificar la configuración para rechazarlas o ser notificado cuando se envíen:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios</li>
                <li><strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
                <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web</li>
                <li><strong>Microsoft Edge:</strong> Configuración → Cookies y permisos del sitio → Cookies</li>
              </ul>
              <p className="mt-4">
                <strong>Nota:</strong> Bloquear todas las cookies puede afectar la funcionalidad de MEDMIND y algunas características pueden no estar disponibles.
              </p>

              <h3 className="text-xl font-semibold mt-4">4.3 Herramientas de Exclusión</h3>
              <p>
                Puede optar por no participar en el seguimiento de Google Analytics visitando: <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Almacenamiento Local</h2>
              <p>
                Además de cookies, MEDMIND utiliza tecnologías de almacenamiento local del navegador (LocalStorage, SessionStorage) para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mejorar el rendimiento almacenando datos temporalmente</li>
                <li>Guardar borradores de historias clínicas antes de ser enviados</li>
                <li>Mantener el estado de la aplicación entre recargas de página</li>
                <li>Cachear información no sensible para acceso rápido</li>
              </ul>
              <p className="mt-4">
                Estos datos se almacenan localmente en su dispositivo y nunca contienen información médica sensible sin encriptar.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Cookies en Dispositivos Móviles</h2>
              <p>
                Si accede a MEDMIND desde dispositivos móviles, las mismas políticas de cookies aplican. Además, podemos utilizar:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identificadores de dispositivo:</strong> Para reconocer su dispositivo móvil</li>
                <li><strong>Tokens de push:</strong> Para enviar notificaciones de recordatorios de citas</li>
                <li><strong>Cachés locales:</strong> Para mejorar el rendimiento de la aplicación móvil</li>
              </ul>
              <p className="mt-4">
                Puede gestionar estas configuraciones desde la sección de privacidad de su dispositivo móvil.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Seguridad de las Cookies</h2>
              <p>
                Implementamos medidas de seguridad para proteger las cookies que utilizamos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies seguras (Secure):</strong> Solo se transmiten a través de conexiones HTTPS encriptadas</li>
                <li><strong>Cookies HttpOnly:</strong> No accesibles mediante JavaScript para prevenir ataques XSS</li>
                <li><strong>Atributo SameSite:</strong> Protege contra ataques CSRF</li>
                <li><strong>Encriptación:</strong> Los datos sensibles en cookies están encriptados</li>
                <li><strong>Expiración limitada:</strong> Las cookies tienen períodos de validez definidos</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Impacto de Rechazar Cookies</h2>
              <p>
                Si rechaza cookies no esenciales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>✓ Podrá seguir utilizando las funcionalidades principales de MEDMIND</li>
                <li>✗ Algunas características personalizadas pueden no estar disponibles</li>
                <li>✗ Es posible que deba reconfigurar preferencias en cada sesión</li>
                <li>✗ Podríamos no poder recordar sus configuraciones de dashboard</li>
                <li>✗ La experiencia de usuario puede ser menos optimizada</li>
              </ul>
              <p className="mt-4">
                <strong>Nota importante:</strong> Las cookies estrictamente necesarias no pueden deshabilitarse, ya que son esenciales para la seguridad y funcionamiento de la plataforma.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Actualizaciones de la Política</h2>
              <p>
                Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en nuestras prácticas o por razones operativas, legales o regulatorias.
              </p>
              <p>
                Le notificaremos sobre cambios significativos mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notificación en la plataforma al iniciar sesión</li>
                <li>Banner de consentimiento de cookies actualizado</li>
                <li>Correo electrónico si los cambios son sustanciales</li>
              </ul>
              <p className="mt-4">
                La fecha de "última actualización" en la parte superior indica cuándo se realizó la última modificación.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Más Información</h2>
              <p>
                Para obtener más información sobre cómo protegemos su privacidad, consulte nuestra <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link> completa.
              </p>
              <p>
                Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> privacidad@medmind.com</li>
                <li><strong>Teléfono:</strong> +52 (55) 1234-5678</li>
                <li><strong>Dirección:</strong> MEDMIND S.A. de C.V., Av. Reforma 123, CDMX, México</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Recursos Adicionales</h2>
              <p>
                Para aprender más sobre cookies y cómo proteger su privacidad en línea:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://www.allaboutcookies.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">All About Cookies</a> - Guía completa sobre cookies</li>
                <li><a href="https://www.youronlinechoices.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Your Online Choices</a> - Control de publicidad comportamental</li>
                <li><a href="https://www.networkadvertising.org/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-Out</a> - Exclusión de publicidad dirigida</li>
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

export default CookiePolicy;
