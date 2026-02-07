

# Soluciones para los Riesgos de la Migracion a GoHighLevel

## Riesgo 1: WhatsApp en GHL requiere configuracion en la plataforma GHL

**Problema:** Vincular un numero de WhatsApp Business y aprobar plantillas de Meta se hace desde GHL, no desde MEDMIND.

**Solucion: Wizard guiado dentro de MEDMIND**

No podemos hacer la vinculacion de WhatsApp desde MEDMIND (es un proceso que Meta y GHL controlan), pero podemos crear un **asistente paso a paso** que guie al doctor sin salir de la plataforma:

1. Crear un componente `ConnectHighLevel.tsx` con un wizard de 3 pasos:
   - **Paso 1 - Cuenta GHL:** Instrucciones visuales para crear/acceder a la cuenta GHL y generar el Private Integration Token. Incluir enlace directo a `Settings > Private Integrations` de GHL.
   - **Paso 2 - WhatsApp en GHL:** Checklist interactivo con enlaces directos a la configuracion de WhatsApp en GHL (Settings > Phone Numbers > WhatsApp). Cada paso tiene un checkbox que el doctor marca al completarlo.
   - **Paso 3 - Conectar a MEDMIND:** Campos para ingresar el Private Integration Token y Location ID. Boton "Verificar Conexion" que llama al Edge Function `connect-highlevel` para validar las credenciales via `GET /locations/{locationId}`.

2. Agregar un Edge Function `connect-highlevel` que:
   - Recibe Token + Location ID
   - Llama a `GET https://services.leadconnectorhq.com/locations/{locationId}` para verificar acceso
   - Si es valido, guarda `ghl_location_id` y `ghl_connected = true` en la tabla `profiles`
   - Lista los calendarios disponibles via `GET /calendars/?locationId={id}` para que el doctor seleccione cual usar

3. Agregar una seccion de "Estado de configuracion" con indicadores visuales:
   - Cuenta GHL: Verificado / Pendiente
   - WhatsApp: Conectado / No configurado
   - Calendario: Seleccionado / Pendiente

---

## Riesgo 2: La IA del chatbot se configura en GHL pero la base de conocimiento vive en MEDMIND

**Problema:** El Conversation AI de GHL usa su propia Knowledge Base, y la informacion del doctor (servicios, ubicacion, horarios) ya esta almacenada en la tabla `profiles` de MEDMIND.

**Solucion: Sincronizacion automatica de Knowledge Base via API**

GHL expone una API completa de Knowledge Base que permite crear, actualizar y eliminar bases de conocimiento programaticamente:

1. Crear un Edge Function `sync-ghl-knowledge` que:
   - Lee la base de conocimiento del doctor desde `profiles` (business_description, business_location, business_hours, business_services, business_additional_info)
   - Usa `POST /knowledge-bases/` de GHL API para crear una Knowledge Base llamada "MEDMIND - {nombre_doctor}" si no existe, o `PUT /knowledge-bases/{id}` para actualizarla
   - Crea FAQs automaticas via `POST /knowledge-bases/faqs` basadas en los servicios configurados. Ejemplo: "Cuanto cuesta una consulta general? - La consulta general tiene un costo de $80,000 COP y dura 30 minutos"
   - Guarda el `ghl_knowledge_base_id` en la tabla `profiles` para futuras sincronizaciones

2. Disparar la sincronizacion automaticamente cuando:
   - El doctor guarda cambios en la seccion "Base de Conocimiento" de MyAgentAI (despues del `handleSave` actual)
   - El doctor conecta GHL por primera vez

3. Agregar un boton "Sincronizar con GoHighLevel" en la UI que permite forzar la sincronizacion manualmente, con indicador de ultima sincronizacion.

4. Agregar columnas nuevas a `profiles`:
   - `ghl_knowledge_base_id` (text) - ID de la Knowledge Base en GHL
   - `ghl_last_kb_sync_at` (timestamptz) - Fecha de ultima sincronizacion

---

## Riesgo 3: Sincronizacion bidireccional de citas

**Problema:** Las citas creadas en GHL por el chatbot no aparecen automaticamente en el calendario de MEDMIND.

**Solucion: Webhook bidireccional GHL - MEDMIND**

GHL soporta webhooks nativos que notifican cuando ocurren eventos como creacion de citas:

1. Crear un Edge Function `webhook-ghl` (verify_jwt = false, publico) que:
   - Recibe eventos webhook de GHL (AppointmentCreate, AppointmentUpdate, ContactCreate)
   - Valida la autenticidad del webhook verificando la firma o un header personalizado
   - Para `AppointmentCreate`: Busca o crea el paciente en MEDMIND, luego inserta la cita en la tabla `appointments` con status "confirmed"
   - Para `ContactCreate`: Sincroniza el contacto como paciente nuevo en la tabla `patients`
   - Mapea los campos de GHL a los campos de MEDMIND (nombre, telefono, email, fecha/hora)

2. Configurar el webhook en GHL via API usando `POST /webhooks/`:
   - URL del webhook: La URL del Edge Function `webhook-ghl`
   - Eventos: `AppointmentCreate`, `AppointmentUpdate`, `AppointmentDelete`, `ContactCreate`
   - Esto se puede hacer automaticamente desde el Edge Function `connect-highlevel` al momento de la conexion

3. Sincronizacion MEDMIND hacia GHL (opcional):
   - Cuando se crea una cita desde MEDMIND, el Edge Function `sync-highlevel` puede crear la cita tambien en GHL via `POST /calendars/events/appointments`
   - Esto mantiene ambos calendarios sincronizados

4. Agregar columna `ghl_appointment_id` a la tabla `appointments` para rastrear la relacion y evitar duplicados.

---

## Riesgo 4: Secretos de Evolution API que dejan de usarse

**Problema:** Los secretos `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `MEDMIND_WEBHOOK` y `N8N_AUTH_TOKEN` quedan huerfanos despues de la migracion.

**Solucion: Migracion ordenada con limpieza documentada**

1. **Fase 1 - Agregar nuevos secretos** (antes de implementar):
   - `GHL_API_KEY` - Private Integration Token de GoHighLevel
   - Estos se agregan manualmente por el usuario via la interfaz de secretos

2. **Fase 2 - Migrar codigo** (implementacion):
   - Los nuevos Edge Functions (`connect-highlevel`, `sync-ghl-knowledge`, `webhook-ghl`) usan solo `GHL_API_KEY`
   - El `ghl_location_id` y `ghl_calendar_id` se guardan per-doctor en la tabla `profiles` (no como secretos globales, ya que cada doctor tiene su propia sub-cuenta GHL)

3. **Fase 3 - Eliminar funciones obsoletas**:
   - Eliminar archivos de Edge Functions: `create-whatsapp-instance`, `check-whatsapp-instance`, `disconnect-whatsapp-instance`, `reset-whatsapp-instance`, `sync-instance-settings`, `send-appointment-reminders`
   - Eliminar de `supabase/config.toml`
   - Eliminar `src/services/n8nService.ts`
   - Eliminar `src/components/ConnectWhatsApp.tsx`

4. **Fase 4 - Documentar limpieza de secretos**:
   - Proporcionar al usuario una lista clara de secretos que puede eliminar manualmente: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `MEDMIND_WEBHOOK`, `N8N_AUTH_TOKEN`
   - No se eliminan automaticamente (respetando la politica de control manual de secretos del usuario)

---

## Cambios en la Base de Datos

Nuevas columnas en `profiles`:

```text
ghl_location_id        TEXT     (nullable) - ID de la sub-cuenta/ubicacion en GHL
ghl_connected          BOOLEAN  (default false) - Estado de conexion con GHL
ghl_calendar_id        TEXT     (nullable) - ID del calendario seleccionado en GHL
ghl_knowledge_base_id  TEXT     (nullable) - ID de la Knowledge Base en GHL
ghl_last_kb_sync_at    TIMESTAMPTZ (nullable) - Ultima sincronizacion de KB
```

Nueva columna en `appointments`:

```text
ghl_appointment_id     TEXT     (nullable) - ID de la cita en GHL (para evitar duplicados)
```

---

## Resumen de Edge Functions

| Funcion | Proposito | JWT |
|---------|-----------|-----|
| `connect-highlevel` | Verificar credenciales, listar calendarios, configurar webhooks en GHL | Si |
| `sync-ghl-knowledge` | Sincronizar base de conocimiento de MEDMIND a GHL Knowledge Base API | Si |
| `webhook-ghl` | Recibir eventos de citas/contactos desde GHL y sincronizar a MEDMIND | No |

---

## Resumen de Componentes Frontend

| Componente | Cambio |
|------------|--------|
| `ConnectHighLevel.tsx` | Nuevo - Wizard de 3 pasos con verificacion de credenciales |
| `ConnectWhatsApp.tsx` | Eliminado |
| `MyAgentAI.tsx` | Actualizado - Usa ConnectHighLevel, agrega boton de sincronizacion KB |
| `n8nService.ts` | Eliminado |

---

## Orden de Implementacion

1. Migracion de base de datos (nuevas columnas)
2. Edge Function `connect-highlevel`
3. Componente `ConnectHighLevel.tsx` con wizard
4. Edge Function `sync-ghl-knowledge`
5. Actualizar `MyAgentAI.tsx` (reemplazar ConnectWhatsApp, agregar sync KB)
6. Edge Function `webhook-ghl`
7. Limpieza (eliminar funciones, componentes y archivos obsoletos)
8. Documentar secretos a eliminar manualmente

