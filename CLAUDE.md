# 🧠 MEDMIND — CONTEXTO PARA CLAUDE

> Lee este archivo COMPLETO al inicio de cada sesión. Es el mapa de todo el negocio y el producto.

---

## ¿Qué es MEDMIND?

SaaS para médicos colombianos (y pronto LatAm) que automatiza la práctica médica con IA:

- 🎙️ **VoiceNotes MD** — el médico habla durante la consulta, la historia clínica se escribe sola con IA
- 🧾 **Facturación DIAN** — facturas electrónicas automáticas sin errores ni multas
- 📅 **Agenda + WhatsApp Bot** — confirmación automática de citas
- 👩‍💼 **Módulo Secretaria** — delegación total de la agenda

**Web:** medmindsystem.com
**Repo:** github.com/luiscamilo23-git/medmind-connect-ai
**Rama de producción:** `main` → push aquí → Lovable auto-despliega

---

## 👥 Los 3 Socios

| Nombre | % | Rol | Responsabilidad |
|--------|---|-----|----------------|
| **Tomas Hoyos Velásquez** | 51% | CEO / Rep. Legal | Estrategia, ventas, decisiones finales |
| **Luis Camilo Osorio** | 25% | CTO | Todo el código, arquitectura, GitHub |
| **Juan Diego García** | 24% | CMO | Marketing, contenido, redes sociales |

---

## 📊 Estado Actual (Abril 2026)

- **MRR:** $0 — 0 clientes pagando aún
- **Usuarios:** ~41 (todos cuentas de prueba internas)
- **Empresa:** MEDMIND SAS — en proceso de registro en Cámara de Comercio de Medellín
- **Fase:** Pre-revenue. Producto terminado. Lanzamiento activo.

### Bloqueadores principales
1. Mercado Pago pendiente de conectar credenciales → sin pagos online
2. Cámara de Comercio pendiente → sin NIT → sin Wompi → sin cuenta bancaria
3. Contenido listo pero nadie ha empezado a publicar

---

## 🏆 Meta

> **$1M USD ingresos en el primer año de operación real**
> **$100M USD largo plazo — expansión LatAm + Enterprise**

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL, 36+ tablas) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Edge Functions | Deno en Supabase (35+ funciones) |
| Storage | Supabase Storage (audios, PDFs, firmas) |
| Deploy | Lovable Cloud → auto-deploy al push a `main` |
| Repo | GitHub: luiscamilo23-git/medmind-connect-ai |
| Dominio | medmindsystem.com |

### Servicios externos
| Servicio | Para qué | Estado |
|----------|---------|--------|
| Google OAuth | Login con Google | ✅ Activo |
| Alegra/Siigo/Alanube | Intermediario DIAN | ✅ Integrado |
| WhatsApp (Twilio/WA API) | Bot de citas | ✅ Activo |
| Mercado Pago | Suscripciones médicos | ⏳ Pendiente credenciales |
| Wompi | Pasarela alternativa | ⏳ Pendiente SAS registrada |

---

## 💳 Planes y Precios (COP/mes)

| Feature | Starter $89K | Profesional $189K | Clínica $389K |
|---------|:---:|:---:|:---:|
| VoiceNotes IA | 50/mes | Ilimitado | Ilimitado |
| Historia Clínica | ✅ | ✅ | ✅ |
| Agenda + Calendario | ✅ | ✅ | ✅ |
| Portal del Paciente | ✅ | ✅ | ✅ |
| WhatsApp Bot | ❌ | ✅ | ✅ |
| Facturación DIAN | ❌ | ✅ | ✅ |
| Módulo Secretaria | ❌ | ❌ | ✅ |
| Trial | 30 días gratis | 30 días gratis | 30 días gratis |

---

## ⚙️ Features en producción hoy

- ✅ VoiceNotes MD (transcripción + HC automática con IA)
- ✅ Historia Clínica Digital (SOAP + export PDF + firma médico)
- ✅ Agenda + Calendario (diario/semanal/mensual)
- ✅ WhatsApp Bot (confirmación + recordatorio 24h)
- ✅ Facturación DIAN (Alegra/Siigo/Alanube)
- ✅ Portal del Paciente + confirmación por link único
- ✅ Módulo Secretaria (invitación por email, rol separado)
- ✅ Google OAuth (activado Abril 2026)
- ✅ RLS en todas las tablas de Supabase
- ✅ CUPS autocomplete en ServiceDialog
- ✅ Dashboard con agenda en tiempo real

---

## 🚀 Cómo hacer deploy

```bash
# Desde C:/Users/user/Documents/CODE/medmind
git add <archivos específicos>
git commit -m "descripción"
git push origin main
# Lovable Cloud detecta el push y despliega automáticamente
```

**Migraciones SQL:** Correr en Lovable Cloud → SQL Editor (no hay CLI local configurado)
**Verificar TypeScript antes de commit:** `npx tsc --noEmit` → debe dar 0 errores

---

## 🔴 Reglas de Oro — NUNCA hacer esto

1. No desviar el presupuesto a features fuera del roadmap acordado
2. No cambiar precios sin consenso de los 3 socios
3. No comprometer la arquitectura de Supabase sin revisión de Luis
4. No publicar credenciales en ningún archivo del repo
5. No tomar decisiones de expansión internacional sin 100+ clientes pagando en Colombia
6. No agregar deuda técnica — mejor hacerlo bien una vez

---

## ✅ Tabla de decisiones

| Tipo | Quién aprueba |
|------|--------------|
| Feature pequeño | Luis + Claude |
| Feature estratégico | Los 3 socios |
| Gasto >$500 USD | Los 3 socios |
| Precio / plan | Los 3 socios |
| Contenido marketing | Juan Diego + Claude |
| Arquitectura técnica | Luis |
| Contratos / enterprise | Tomas |

---

## 📁 Rutas importantes

| Qué | Dónde |
|-----|-------|
| Código fuente | `C:/Users/user/Documents/CODE/medmind/` |
| Vault Obsidian (negocio) | `C:/Users/user/Documents/MEDMIND_OBSIDIAN/` |
| Contenido marketing | `C:/Users/user/Documents/MEDMIND_CONTENT/` |
| Videos Remotion | `C:/Users/user/Documents/MEDMIND_CONTENT/remotion/` |
| Migraciones DB | `supabase/migrations/` en el repo |
| Edge Functions | `supabase/functions/` en el repo |

---

## 🧭 Instrucción para Claude

Antes de cualquier acción técnica o estratégica:
1. Verifica que está alineada con la visión de MEDMIND
2. Verifica que no viola ninguna Regla de Oro
3. Al hacer código: `npx tsc --noEmit` → 0 errores → commit → push origin main
4. Al terminar sesiones importantes: actualizar el vault Obsidian si aplica

*Última actualización: Abril 7, 2026 — Tomas, Luis, Juan Diego*
