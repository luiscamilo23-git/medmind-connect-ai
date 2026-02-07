

# Plan Completo: Migracion de Evolution API + n8n a GoHighLevel

## Inventario completo de lo que se reemplaza

### Edge Functions a ELIMINAR (6 funciones)
1. `create-whatsapp-instance` - Crea instancia en Evolution API, genera QR
2. `check-whatsapp-instance` - Verifica estado de conexion en Evolution API
3. `disconnect-whatsapp-instance` - Elimina instancia de Evolution API
4. `reset-whatsapp-instance` - Reinicia instancia sin desconectar
5. `sync-instance-settings` - Sincroniza webhook y comportamiento en Evolution API
6. `send-appointment-reminders` - Envio de recordatorios via Twilio (GHL lo maneja nativamente)

### Edge Functions a ELIMINAR (3 funciones de orquestacion n8n)
7. `book-appointment` - Agenda citas via webhook publico (autenticado con N8N_AUTH_TOKEN)
8. `get-availability` - Consulta disponibilidad de slots (autenticado con N8N_AUTH_TOKEN)
9. `get-doctor-context` - Obtiene base de conocimiento del doctor (autenticado con N8N_AUTH_TOKEN)

### Archivos Frontend a ELIMINAR
10. `src/components/ConnectWhatsApp.tsx` (675 lineas) - Componente completo de QR, polling, sync
11. `src/services/n8nService.ts` (56 lineas) - Servicio de webhooks a n8n

### Archivos Frontend a MODIFICAR
12. `src/pages/MyAgentAI.tsx` - Reemplazar ConnectWhatsApp por ConnectHighLevel, agregar sync KB
13. `src/pages/SmartScheduler.tsx` - Eliminar referencia a n8nService, eliminar checkWhatsAppStatus con Evolution API, actualizar seccion WhatsApp y IA Asistente

---

## Paso 1: Migracion de Base de Datos

Nuevas columnas en `profiles`:

```text
ghl_location_id        TEXT        (nullable)     - ID de sub-cuenta GHL
ghl_connected          BOOLEAN     (default false) - Estado de conexion
ghl_calendar_id        TEXT        (nullable)     - Calendario seleccionado en GHL
ghl_knowledge_base_id  TEXT        (nullable)     - Knowledge Base ID en GHL
ghl_last_kb_sync_at    TIMESTAMPTZ (nullable)     - Ultima sincronizacion KB
```

Nueva columna en `appointments`:

```text
ghl_appointment_id     TEXT        (nullable)     - ID de cita en GHL (evita duplicados)
```

Las columnas `whatsapp_instance_name` y `whatsapp_last_sync_at` se mantienen por compatibilidad pero dejan de usarse activamente.

---

## Paso 2: Nuevos Edge Functions (3 funciones reemplazan 9)

### 2a. `connect-highlevel` (verify_jwt = true)
Reemplaza: create-whatsapp, check-whatsapp, disconnect-whatsapp, reset-whatsapp, sync-instance-settings

Acciones via campo `action`:
- `verify` - Valida credenciales con `GET /locations/{locationId}` de GHL API v2
- `list_calendars` - Lista calendarios del doctor via `GET /calendars/?locationId={id}`
- `select_calendar` - Guarda `ghl_calendar_id` seleccionado
- `disconnect` - Limpia campos GHL del perfil
- `status` - Retorna estado actual de conexion

Usa `GHL_API_KEY` como secreto global + `ghl_location_id` per-doctor desde profiles.

### 2b. `sync-ghl-knowledge` (verify_jwt = true)
Reemplaza: get-doctor-context (la logica pasa a vivir en GHL)

- Lee datos de la base de conocimiento del doctor desde `profiles`
- Usa `POST /knowledge-bases/` para crear o `PUT /knowledge-bases/{id}` para actualizar
- Genera FAQs automaticas desde los servicios configurados via `POST /knowledge-bases/faqs`
- Guarda `ghl_knowledge_base_id` y `ghl_last_kb_sync_at`

### 2c. `webhook-ghl` (verify_jwt = false, publico)
Reemplaza: book-appointment, get-availability (la logica de agendamiento vive en GHL)

- Recibe eventos webhook de GHL: AppointmentCreate, AppointmentUpdate, AppointmentDelete, ContactCreate
- Valida autenticidad via header personalizado o firma
- Sincroniza citas y contactos de GHL a las tablas `appointments` y `patients` de MEDMIND
- Usa `ghl_appointment_id` para evitar duplicados
- Sigue el patron de "soft error" (HTTP 200 con JSON de error)

---

## Paso 3: Nuevo Componente Frontend

### `ConnectHighLevel.tsx` (reemplaza ConnectWhatsApp.tsx)

Wizard de 3 pasos:

**Paso 1 - Cuenta GHL:**
- Instrucciones visuales para crear cuenta GHL
- Enlace directo a Settings > Private Integrations
- Checkbox que el doctor marca al completar

**Paso 2 - WhatsApp en GHL:**
- Checklist interactivo con enlaces directos a la configuracion de WhatsApp en GHL
- Cada sub-paso tiene checkbox (vincular numero, aprobar plantillas, activar Conversation AI)

**Paso 3 - Conectar a MEDMIND:**
- Campo para Location ID
- Boton "Verificar Conexion" que llama a `connect-highlevel`
- Selector de calendario (lista calendarios disponibles)
- Estado de conexion con indicadores visuales (verde/rojo)

Estado de configuracion visible:
- Cuenta GHL: Verificado / Pendiente
- WhatsApp: Conectado / No configurado
- Calendario: Seleccionado / Pendiente

---

## Paso 4: Actualizar MyAgentAI.tsx

- Reemplazar `import ConnectWhatsApp` por `import ConnectHighLevel`
- Cambiar `<ConnectWhatsApp />` por `<ConnectHighLevel />`
- Cambiar deteccion de conexion: de `whatsapp_instance_name` a `ghl_connected`
- Agregar boton "Sincronizar Base de Conocimiento con GoHighLevel" que llama a `sync-ghl-knowledge`
- Mostrar ultima sincronizacion (`ghl_last_kb_sync_at`)
- Actualizar textos de "WhatsApp" a "GoHighLevel"

---

## Paso 5: Actualizar SmartScheduler.tsx

- Eliminar import de `n8nService` y toda la funcion `sendToN8N`
- Eliminar `checkWhatsAppStatus` (que usa `check-whatsapp-instance`)
- Actualizar la seccion "WhatsApp" en la sidebar para verificar `ghl_connected` en vez de `whatsapp_instance_name`
- Redirigir a `/my-agent` en vez de `/profile` cuando no esta conectado
- Los botones de IA (auto-organizar, sugerir, recordatorios) se pueden mantener pero sin enviar a n8n - se marcaran como "Disponible via GoHighLevel" ya que GHL maneja esto nativamente

---

## Paso 6: Actualizar supabase/config.toml

Eliminar las 9 funciones obsoletas y agregar las 3 nuevas:

```text
ELIMINAR:
[functions.create-whatsapp-instance]
[functions.check-whatsapp-instance] (no aparece en config actual pero existe el archivo)
[functions.disconnect-whatsapp-instance] (no aparece en config actual)
[functions.reset-whatsapp-instance] (no aparece en config actual)
[functions.sync-instance-settings] (no aparece en config actual)
[functions.send-appointment-reminders]
[functions.book-appointment]
[functions.get-availability]
[functions.get-doctor-context]

AGREGAR:
[functions.connect-highlevel]
verify_jwt = true

[functions.sync-ghl-knowledge]
verify_jwt = true

[functions.webhook-ghl]
verify_jwt = false
```

---

## Paso 7: Limpieza y Secretos

### Secreto nuevo requerido:
- `GHL_API_KEY` - Private Integration Token de GoHighLevel (se pedira al usuario antes de implementar)

### Secretos que el usuario puede eliminar manualmente despues de la migracion:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `MEDMIND_WEBHOOK`
- `N8N_AUTH_TOKEN`

(No se eliminan automaticamente. Se documenta la lista para control manual del usuario.)

---

## Flujo Final

```text
Paciente escribe por WhatsApp
        |
        v
GoHighLevel recibe (WhatsApp nativo integrado)
        |
        v
GHL Conversation AI responde usando:
  - Knowledge Base (sincronizada desde MEDMIND)
  - Calendario GHL (disponibilidad real)
  - Contactos GHL
        |
        v
Si se agenda cita --> GHL crea evento
        |
        v
GHL webhook notifica a MEDMIND (webhook-ghl)
  - Sincroniza cita a tabla appointments
  - Sincroniza contacto a tabla patients
        |
        v
Doctor ve la cita en SmartScheduler de MEDMIND
```

---

## Orden de Implementacion

1. Pedir al usuario el secreto `GHL_API_KEY`
2. Migracion de base de datos (nuevas columnas en profiles y appointments)
3. Edge Function `connect-highlevel`
4. Componente `ConnectHighLevel.tsx`
5. Edge Function `sync-ghl-knowledge`
6. Actualizar `MyAgentAI.tsx`
7. Edge Function `webhook-ghl`
8. Actualizar `SmartScheduler.tsx`
9. Limpieza: eliminar 9 Edge Functions, ConnectWhatsApp.tsx, n8nService.ts
10. Documentar secretos obsoletos para eliminacion manual

