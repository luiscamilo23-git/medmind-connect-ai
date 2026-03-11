

## Presentación Ejecutiva para Stakeholders / Aliados Estratégicos

Lo que necesitas se llama un **"Executive Brief"** o **"Partnership Deck"** — diferente al Pitch Deck para inversionistas. Este va dirigido a **rectores, directores de clínicas, líderes de opinión, y aliados estratégicos** que pueden abrir puertas a clientes.

### Estructura: 8 slides PDF (landscape, mismo estilo visual del Pitch Deck existente)

| # | Slide | Contenido |
|---|-------|-----------|
| 1 | **Cover** | "MEDMIND — Inteligencia Clínica con IA" + subtítulo: "Presentación Ejecutiva para Aliados Estratégicos" |
| 2 | **El Problema Real** | Datos duros: 40% del tiempo en papeleo, burnout del 62%, sistemas fragmentados. Enfocado en el dolor del médico que ellos conocen. |
| 3 | **Qué es MEDMIND** | Resumen ejecutivo: plataforma todo-en-uno con IA. No técnico, centrado en beneficios: "El doctor habla, la historia se llena sola." |
| 4 | **Lo Mejor que Tenemos (Fortalezas)** | Las 6 capacidades más impactantes: VoiceNotes MD, Agente WhatsApp 24/7, Facturación DIAN automática, RIPS automático, Análisis Predictivo, Red Social Médica. Cada una con su beneficio en una frase. |
| 5 | **Lo que Estamos Mejorando (Transparencia)** | Honestidad estratégica: UX en mobile, onboarding guiado, integraciones con EHR existentes, expansión de especialidades, app nativa. Esto genera confianza. |
| 6 | **Etapa Actual** | "Finalizando pruebas de producto para salida al mercado" — MVP completo con 12+ módulos, integración DIAN operativa, pruebas con médicos piloto Q3 2026. |
| 7 | **Cómo Pueden Ayudar** | Call-to-action claro: conectar con médicos piloto, instituciones educativas, clínicas privadas, validación clínica, co-branding. |
| 8 | **Contacto y Siguiente Paso** | Datos de contacto + URL de la plataforma + QR code + "Agendemos una demo personalizada" |

### Implementación técnica

- Crear `src/utils/executiveBriefPdf.ts` — reutilizando las funciones helper del pitch deck existente (`drawBackground`, `drawCard`, etc.)
- Crear `src/pages/ExecutiveBrief.tsx` — página con preview de slides y botón de descarga
- Agregar ruta `/executive-brief` en `App.tsx`
- Todo en **español** (audiencia LatAm)
- Mismo diseño dark/premium del Pitch Deck actual

