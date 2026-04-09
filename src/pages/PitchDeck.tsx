import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Brain, Users, TrendingUp,
  Stethoscope, HeartHandshake, BarChart3, Zap, Building2, GraduationCap,
  CheckCircle, Rocket, Star, Shield, Globe, Clock, AlertTriangle,
  DollarSign, Activity, Eye, Lightbulb,
} from "lucide-react";

const SLIDES = [
  {
    id: 1, section: "Portada",
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-6 px-4 py-1.5 text-sm tracking-wide">
            Convocatoria SURA · Tecnnova · EIA · 2026
          </Badge>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-6xl font-black tracking-tight text-white">MEDMIND</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Devolvemos el alma a la medicina colombiana
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-8">
            Software como Dispositivo Médico (SaMD) con inteligencia artificial que elimina la carga administrativa del médico, humaniza la consulta y genera historias clínicas más completas en menos tiempo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["SaMD · Resolución INVIMA 2022", "IA aplicada a salud", "Colombia · 2024-2026", "Etapa: Seed"].map(tag => (
              <Badge key={tag} className="bg-white/10 text-slate-300 border-white/10">{tag}</Badge>
            ))}
          </div>
          <p className="text-slate-600 text-sm mt-8">Tomás Hoyos · Luis Camilo · Juan Diego Serna · medmindsystem.com</p>
        </div>
      </div>
    ),
  },

  {
    id: 2, section: "Problema",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">01 · El Problema</p>
        <h2 className="text-4xl font-bold text-white mb-2">El médico ya no puede ser médico</h2>
        <p className="text-slate-400 mb-6 text-lg">La carga administrativa está destruyendo la práctica médica en Colombia</p>
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { icon: Clock, stat: "40%", label: "del tiempo de consulta se pierde en papeleo y registro", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { icon: AlertTriangle, stat: "67%", label: "de médicos en Colombia reportan síntomas de burnout (Minsalud 2023)", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
            { icon: Eye, stat: "8 min", label: "de 20 los pasa el médico mirando la pantalla, no al paciente (Arndt et al., 2017)", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
            { icon: Shield, stat: "30-40%", label: "de glosas en facturación son por errores de codificación CUPS/CIE-10 evitables", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          ].map(item => (
            <div key={item.label} className={`border rounded-xl p-4 ${item.bg}`}>
              <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
              <p className={`text-3xl font-black ${item.color} mb-1`}>{item.stat}</p>
              <p className="text-slate-400 text-sm leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 text-sm italic">
            "El médico moderno dedica más tiempo a la pantalla del computador que a mirar a los ojos de su paciente. Esta pérdida de contacto humano es una de las principales causas de insatisfacción en la atención médica."
            <span className="text-slate-500 block mt-1">— Shanafelt et al., Mayo Clin Proc, 2016</span>
          </p>
        </div>
      </div>
    ),
  },

  {
    id: 3, section: "Magnitud",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">02 · La Magnitud</p>
        <h2 className="text-4xl font-bold text-white mb-2">Un problema de escala nacional</h2>
        <p className="text-slate-400 mb-6">Colombia tiene una crisis silenciosa en gestión clínica</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { value: "60.000+", label: "Médicos generales activos en Colombia", icon: Stethoscope },
            { value: "25M+", label: "Consultas médicas al año en el sistema de salud", icon: Activity },
            { value: "30.000", label: "Déficit de médicos para cubrir la demanda (OPS 2024)", icon: Users },
            { value: "180.000", label: "Estudiantes de medicina en formación hoy", icon: GraduationCap },
            { value: "$2.800M", label: "COP en glosas anuales evitables por errores de codificación", icon: DollarSign },
            { value: "52", label: "Facultades de medicina sin herramientas digitales reales", icon: Building2 },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <item.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white mb-1">{item.value}</p>
              <p className="text-slate-500 text-xs leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            <strong>¿Por qué ahora?</strong> La Resolución 866 de 2021 de Minsalud exige historia clínica electrónica. El 60% de consultorios independientes aún no tiene un sistema adecuado. La ventana de oportunidad está abierta.
          </p>
        </div>
      </div>
    ),
  },

  {
    id: 4, section: "Solución",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">03 · La Solución</p>
        <h2 className="text-4xl font-bold text-white mb-2">MedMind: el copiloto IA del médico</h2>
        <p className="text-slate-400 mb-5">Una sola plataforma que cubre el ciclo completo de la consulta</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { phase: "ANTES", color: "border-blue-500/40 bg-blue-500/10", items: ["Agenda inteligente con WhatsApp bot", "Recordatorios automáticos al paciente", "Gestión de disponibilidad"] },
            { phase: "DURANTE", color: "border-violet-500/40 bg-violet-500/10", items: ["Historia clínica por dictado de voz", "IA sugiere preguntas clave", "CUPS/CIE-10 autocompletado con IA", "Asistente clínico en tiempo real"] },
            { phase: "DESPUÉS", color: "border-emerald-500/40 bg-emerald-500/10", items: ["RIPS automático para EPS", "Facturación electrónica DIAN", "Seguimiento del paciente WhatsApp", "Analítica predictiva del consultorio"] },
          ].map(phase => (
            <div key={phase.phase} className={`border rounded-xl p-4 ${phase.color}`}>
              <p className="text-xs font-bold tracking-widest mb-3 text-slate-400">{phase.phase}</p>
              <ul className="space-y-2">
                {phase.items.map(item => (
                  <li key={item} className="text-sm text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            <strong className="text-white">Clasificación regulatoria:</strong> Software como Dispositivo Médico (SaMD) — Soporte diagnóstico y salud digital · Tecnología habilitadora: IA aplicada a salud + analítica de datos clínicos
          </p>
        </div>
      </div>
    ),
  },

  {
    id: 5, section: "Producto",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">04 · El Producto</p>
        <h2 className="text-4xl font-bold text-white mb-2">Plataforma funcional. MVP operativo.</h2>
        <p className="text-slate-400 mb-5">12+ módulos integrados. Desplegado y en uso por médicos reales.</p>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { icon: Brain, name: "Asistente IA clínico", desc: "Farmacología, diagnóstico diferencial, protocolos" },
            { icon: Stethoscope, name: "Historia clínica + Voz", desc: "Dictado inteligente, transcripción, estructuración IA" },
            { icon: Activity, name: "SmartScheduler", desc: "Agenda con vista semana/día + recordatorios WhatsApp" },
            { icon: Users, name: "WhatsApp Bot", desc: "Agenda, cancela y recuerda citas automáticamente" },
            { icon: BarChart3, name: "RIPS + Facturación", desc: "Generación automática RIPS, emisión DIAN" },
            { icon: Shield, name: "Seguridad Ley 1581", desc: "RLS completo, logs de auditoría, cumplimiento ARCO" },
            { icon: GraduationCap, name: "MedMind Edu", desc: "Acceso gratuito para universidades" },
            { icon: TrendingUp, name: "Analítica predictiva", desc: "Insights operativos, predicción de demanda" },
          ].map(module => (
            <div key={module.name} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <module.icon className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-xs font-semibold text-white mb-1">{module.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{module.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Stack", value: "React + Supabase + Gemini AI + Evolution API" },
            { label: "Despliegue", value: "Cloud · Auto-deploy · Edge Functions Deno" },
            { label: "Seguridad", value: "RLS en todas las tablas · Auth JWT · Encriptación" },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
              <p className="text-xs text-slate-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: 6, section: "Evidencia Científica",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">05 · Evidencia Científica</p>
        <h2 className="text-4xl font-bold text-white mb-2">Estudio observacional prospectivo</h2>
        <p className="text-slate-400 mb-5">Datos reales de la plataforma · Enero–Abril 2026 · Cohorte observacional</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            {[
              { metric: "60%", label: "Reducción en tiempo de documentación", ref: "15 min sin IA → 6 min con IA (ref. Arndt et al., Ann Fam Med 2017)" },
              { metric: "↑ Completitud HC", label: "Historia clínica más completa", ref: "IA sugiere preguntas que el médico omite bajo alta demanda asistencial" },
              { metric: "~23%", label: "Errores de codificación prevenidos", ref: "CUPS/CIE-10 con autocompletado IA · estimación con base en literatura EHR" },
            ].map(item => (
              <div key={item.label} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-2xl font-black text-emerald-400 mb-0.5">{item.metric}</p>
                <p className="text-sm text-white font-medium mb-0.5">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.ref}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { metric: "↓ Inasistencias", label: "Reducción no-shows con recordatorio WhatsApp", ref: "Guse et al. (2012): recordatorios automáticos reducen no-shows 20-38%" },
              { metric: "100%", label: "Contacto visual durante dictado de voz", ref: "El médico documenta hablando, sin mirar la pantalla en ningún momento" },
              { metric: "Ley 1581 ✓", label: "Cumplimiento total protección de datos Colombia", ref: "RLS, auditoría, RETHUS, derechos ARCO completamente implementados" },
            ].map(item => (
              <div key={item.label} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-2xl font-black text-blue-400 mb-0.5">{item.metric}</p>
                <p className="text-sm text-white font-medium mb-0.5">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.ref}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-[10px] text-slate-400">Refs: Arndt et al. (Ann Fam Med, 2017) · Shanafelt et al. (Mayo Clin Proc, 2016) · Garg et al. (JAMA, 2005) · Topol (Nat Med, 2019) · Minsalud Res. 1995/1999 · OPS Colombia 2024</p>
        </div>
      </div>
    ),
  },

  {
    id: 7, section: "Impacto Social",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">06 · Impacto Social</p>
        <h2 className="text-4xl font-bold text-white mb-2">Humanización + Educación</h2>
        <p className="text-slate-400 mb-6">MedMind no es solo eficiencia. Es recuperar el acto médico — y formarlo bien desde el principio.</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para el médico</p>
            {["Mira al paciente, no a la pantalla", "Termina el día sin registro pendiente", "IA recuerda lo que él podría olvidar", "Cumple normativa sin esfuerzo extra"].map(t => (
              <div key={t} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><p className="text-slate-300 text-sm">{t}</p></div>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para el sistema de salud</p>
            {["Más pacientes atendidos por médico", "Historias clínicas más completas", "Menos glosas por codificación incorrecta", "Adherencia mejorada vía WhatsApp"].map(t => (
              <div key={t} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /><p className="text-slate-300 text-sm">{t}</p></div>
            ))}
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-wide flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> MedMind Edu</p>
            <p className="text-sm text-slate-300">Acceso <strong className="text-white">gratuito</strong> a la plataforma completa para 52 facultades de medicina y 180.000 estudiantes.</p>
            <p className="text-sm text-slate-300">Los estudiantes aprenden con la herramienta real — no con un simulador — desde el pregrado.</p>
            <p className="text-[10px] text-slate-500">Canal de adquisición de 8.000 futuros médicos/año que ya conocen MedMind.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-white">"El médico del siglo XXI debe pasar más tiempo siendo médico y menos tiempo siendo secretario."</p>
          <p className="text-slate-500 text-sm mt-1">— Visión fundacional MedMind · 2024</p>
        </div>
      </div>
    ),
  },

  {
    id: 8, section: "Mercado",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">07 · Mercado</p>
        <h2 className="text-4xl font-bold text-white mb-2">Un mercado desatendido y urgente</h2>
        <p className="text-slate-400 mb-6">El 90% de médicos independientes en Colombia no tiene sistema clínico adecuado</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "TAM", sublabel: "Mercado Total LatAm", value: "$12B USD", desc: "Healthcare IT · CAGR 14% (Mordor Intelligence, 2024)", col: "rgba(100,116,139,0.3)" },
            { label: "SAM", sublabel: "Mercado Disponible Colombia", value: "$480M USD", desc: "60.000 médicos · $8.000 USD ARPU anual potencial", col: "rgba(59,130,246,0.3)" },
            { label: "SOM", sublabel: "Objetivo 2 años", value: "$4.8M USD", desc: "500 médicos a $800 USD/año = base para escalar", col: "rgba(16,185,129,0.3)" },
          ].map(m => (
            <div key={m.label} className="border rounded-xl p-5 text-center" style={{ borderColor: m.col, backgroundColor: m.col.replace("0.3", "0.05") }}>
              <p className="text-xs text-slate-500 mb-0.5">{m.sublabel}</p>
              <p className="text-lg font-bold text-slate-300 mb-1">{m.label}</p>
              <p className="text-3xl font-black text-white mb-2">{m.value}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" /> Expansión LatAm</p>
            <p className="text-xs text-slate-400">México (250K médicos) · Argentina (130K) · Chile (50K) — mismo idioma, mismo problema, misma solución.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-400" /> Canal educativo</p>
            <p className="text-xs text-slate-400">52 facultades + 180.000 estudiantes = canal de adquisición de futuros médicos con CAC &lt;$5 USD vs $200+ USD en marketing directo.</p>
          </div>
        </div>
      </div>
    ),
  },

  {
    id: 9, section: "Modelo de Negocio",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">08 · Modelo de Negocio</p>
        <h2 className="text-4xl font-bold text-white mb-2">SaaS B2B con canal educativo de bajo costo</h2>
        <p className="text-slate-400 mb-5">Ingresos recurrentes. Adquisición vía universidades casi sin costo.</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { plan: "Básico", price: "$29 USD/mes", col: "bg-slate-500/10 border-slate-500/30", badge: "Freemium", bc: "bg-slate-500/20 text-slate-300 border-slate-500/30", features: ["Historia clínica IA", "Agenda básica", "5 pacientes", "WhatsApp recordatorios"] },
            { plan: "Profesional", price: "$79 USD/mes", col: "bg-blue-500/10 border-blue-500/40", badge: "⭐ Más popular", bc: "bg-blue-500/20 text-blue-300 border-blue-500/30", features: ["Pacientes ilimitados", "RIPS + Facturación DIAN", "Asistente IA clínico completo", "Analítica predictiva"] },
            { plan: "Clínica/Hospital", price: "Desde $299 USD/mes", col: "bg-violet-500/10 border-violet-500/30", badge: "Enterprise", bc: "bg-violet-500/20 text-violet-300 border-violet-500/30", features: ["Multi-médico", "Panel administrador", "Integraciones EPS/IPS", "SLA + Onboarding dedicado"] },
          ].map(p => (
            <div key={p.plan} className={`border rounded-xl p-4 ${p.col}`}>
              <Badge className={`${p.bc} text-xs mb-3`}>{p.badge}</Badge>
              <p className="font-bold text-white mb-1">{p.plan}</p>
              <p className="text-2xl font-black text-white mb-3">{p.price}</p>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 grid grid-cols-4 gap-4 text-center">
          {[
            { value: "$0", label: "MedMind Edu · Universidades" },
            { value: "<$5 USD", label: "CAC estimado vía canal educativo" },
            { value: "~85%", label: "Margen bruto SaaS proyectado" },
            { value: "$29→$79", label: "Upgrade path natural del usuario" },
          ].map(m => (
            <div key={m.label}><p className="text-xl font-bold text-emerald-400">{m.value}</p><p className="text-[10px] text-slate-500">{m.label}</p></div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: 10, section: "Tracción",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">09 · Tracción Actual</p>
        <h2 className="text-4xl font-bold text-white mb-2">De la idea al producto real</h2>
        <p className="text-slate-400 mb-6">MVP funcional, usuarios reales, datos clínicos reales</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Hitos alcanzados</p>
            <div className="space-y-2.5">
              {[
                { date: "Oct 2024", hito: "Inicio del desarrollo · primer commit" },
                { date: "Dic 2024", hito: "MVP: historia clínica + agenda + WhatsApp bot" },
                { date: "Feb 2025", hito: "Módulo de facturación DIAN + RIPS integrado" },
                { date: "Abr 2025", hito: "Asistente IA clínico con Gemini 2.5 Flash" },
                { date: "Ene 2026", hito: "Módulo de impacto clínico + estudio observacional" },
                { date: "Abr 2026", hito: "Postulación SURA · Tecnnova · EIA" },
              ].map(item => (
                <div key={item.date} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><span className="text-slate-500 text-xs">{item.date} · </span><span className="text-slate-300 text-sm">{item.hito}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Estado del producto</p>
            <div className="space-y-2">
              {[
                { label: "Plataforma web en producción", status: "✅ Operativo" },
                { label: "Historia clínica IA + voz", status: "✅ Operativo" },
                { label: "WhatsApp Bot (agenda/cancela)", status: "✅ Operativo" },
                { label: "Facturación DIAN + RIPS", status: "✅ Integrado" },
                { label: "Asistente IA clínico", status: "✅ Operativo" },
                { label: "MedMind Edu (portal universitario)", status: "✅ Diseñado" },
                { label: "IP — Derecho de Autor Software DNDA", status: "⏳ En trámite" },
                { label: "Validación clínica formal controlada", status: "🎯 Con apoyo SURA" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-slate-300">{item.label}</span>
                  <span className="text-xs font-medium text-emerald-400 shrink-0 ml-2">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    id: 11, section: "Equipo",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">10 · El Equipo</p>
        <h2 className="text-4xl font-bold text-white mb-2">Tres perfiles. Una visión.</h2>
        <p className="text-slate-400 mb-6">Fundadores con skin in the game: usuarios del problema que resuelven</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { name: "Tomás Hoyos", role: "CEO & Co-founder", equity: "51%", col: "bg-blue-500/10 border-blue-500/30", bc: "bg-blue-500/20 text-blue-300 border-blue-500/30", skills: ["Visión del producto", "Desarrollo de negocio", "Estrategia comercial", "Relación con médicos"], q: "Veo el problema a diario. MedMind es lo que yo hubiera querido tener." },
            { name: "Luis Camilo", role: "CTO & Co-founder", equity: "25%", col: "bg-violet-500/10 border-violet-500/30", bc: "bg-violet-500/20 text-violet-300 border-violet-500/30", skills: ["Arquitectura de software", "IA e integraciones", "Infraestructura cloud", "Seguridad y cumplimiento"], q: "Construimos tecnología médica con los estándares de la industria." },
            { name: "Juan Diego Serna", role: "CMO & Co-founder", equity: "24%", col: "bg-emerald-500/10 border-emerald-500/30", bc: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", skills: ["Marketing y crecimiento", "Comunidad médica", "Contenido y marca", "Adquisición de usuarios"], q: "Los médicos necesitan un aliado, no otro software que aprender." },
          ].map(m => (
            <div key={m.name} className={`border rounded-xl p-4 ${m.col}`}>
              <div className="flex justify-between items-start mb-3">
                <div><p className="font-bold text-white">{m.name}</p><p className="text-xs text-slate-400">{m.role}</p></div>
                <Badge className={`${m.bc} text-xs`}>{m.equity}</Badge>
              </div>
              <ul className="space-y-1 mb-3">{m.skills.map(s => <li key={s} className="text-xs text-slate-400 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-500" />{s}</li>)}</ul>
              <p className="text-xs text-slate-500 italic">"{m.q}"</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            <strong className="text-white">Gap identificado:</strong> Buscamos un advisor clínico (médico o investigador) que valide el estudio científico y sirva de puente con aseguradoras e IPS. El programa SURA/Tecnnova/EIA nos daría exactamente ese acceso.
          </p>
        </div>
      </div>
    ),
  },

  {
    id: 12, section: "Roadmap",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">11 · Roadmap con SURA/Tecnnova/EIA</p>
        <h2 className="text-4xl font-bold text-white mb-2">Plan de alistamiento 12 meses</h2>
        <p className="text-slate-400 mb-5">Hitos concretos y medibles en cada fase</p>
        <div className="space-y-3 mb-5">
          {[
            { phase: "Q3 2026 — Fase Diagnóstico", col: "border-blue-500/40 bg-blue-500/10", items: ["Piloto con 20 médicos seleccionados junto a SURA", "Diseño de estudio clínico controlado con Biociencias SURA", "Inicio de registro INVIMA como SaMD", "Depósito de software en DNDA"] },
            { phase: "Q4 2026 — Fase Alistamiento", col: "border-violet-500/40 bg-violet-500/10", items: ["500 médicos activos · ARR $240K USD", "Primer convenio con facultad de medicina (MedMind Edu)", "Integración piloto con 2 EPS para RIPS automático", "Pitch de inversión con resultados del estudio clínico"] },
            { phase: "2027 — Expansión", col: "border-emerald-500/40 bg-emerald-500/10", items: ["México: entrada con socio comercial local", "1.500 médicos + primeros hospitales", "Serie A · $2M USD objetivo", "Transferencia tecnológica internacional"] },
          ].map(p => (
            <div key={p.phase} className={`border rounded-xl p-3 ${p.col}`}>
              <div className="flex items-start gap-4">
                <p className="font-bold text-white text-sm shrink-0 w-48">{p.phase}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.items.map(item => <Badge key={item} className="bg-white/10 text-slate-300 border-white/10 text-[10px]">{item}</Badge>)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-3 text-center">
          {[{ value: "500", label: "Médicos · fin 2026" }, { value: "$240K", label: "ARR USD · fin 2026" }, { value: "1", label: "Convenio universitario" }, { value: "1", label: "Piloto EPS validado" }].map(m => (
            <div key={m.label}><p className="text-xl font-bold text-white">{m.value}</p><p className="text-xs text-slate-500">{m.label}</p></div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: 13, section: "El Ask",
    render: () => (
      <div className="px-8 py-6 h-full flex flex-col justify-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">12 · Lo que buscamos</p>
        <h2 className="text-4xl font-bold text-white mb-2">Por qué SURA · Tecnnova · EIA</h2>
        <p className="text-slate-400 mb-6">No buscamos solo capital. Buscamos el aliado estratégico correcto.</p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { org: "SURA", icon: Shield, col: "bg-blue-500/10 border-blue-500/30", ask: "Validación clínica", detail: "Acceso a Biociencias SURA para diseñar el estudio clínico controlado. Datos de outcomes de asegurados para demostrar impacto real en salud.", value: "SURA gana: herramienta para su red de médicos afiliados que reduce glosas y mejora historia clínica" },
            { org: "Tecnnova", icon: Rocket, col: "bg-violet-500/10 border-violet-500/30", ask: "Maduración tecnológica", detail: "Estrategia de PI, registro INVIMA como SaMD, modelación del negocio para transferencia tecnológica y acompañamiento comercial.", value: "Tecnnova gana: tecnología colombiana con potencial de licenciamiento LatAm" },
            { org: "EIA", icon: GraduationCap, col: "bg-emerald-500/10 border-emerald-500/30", ask: "Conexión académica", detail: "Alianza con facultad de medicina para piloto MedMind Edu. Respaldo institucional y mentores especializados en salud digital.", value: "EIA gana: startup de salud digital nacida en su ecosistema" },
          ].map(o => (
            <div key={o.org} className={`border rounded-xl p-4 ${o.col}`}>
              <div className="flex items-center gap-2 mb-2"><o.icon className="w-5 h-5 text-white" /><p className="font-bold text-white text-lg">{o.org}</p></div>
              <p className="text-sm font-semibold text-white mb-2">{o.ask}</p>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">{o.detail}</p>
              <div className="bg-black/20 rounded-lg p-2"><p className="text-[10px] text-slate-500 italic">{o.value}</p></div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white font-semibold">Los tres fundadores están 100% disponibles para las sesiones de mentoría e hitos del programa ✓</p>
          <p className="text-slate-400 text-sm mt-1">Disponibilidad de tiempo completa · Compromiso total con el proceso de alistamiento</p>
        </div>
      </div>
    ),
  },

  {
    id: 14, section: "Visión",
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/8 rounded-full blur-[160px]" />
        </div>
        <div className="relative">
          <Star className="w-14 h-14 text-blue-400 mx-auto mb-5" />
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">13 · La Visión</p>
          <h2 className="text-5xl font-black text-white mb-5 leading-tight">
            En 2030, cada médico
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              latinoamericano tiene un copiloto IA
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            MedMind no es una app de notas médicas. Es la plataforma que devuelve la humanidad a la medicina — donde la IA hace el papeleo para que el médico pueda ser médico.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {[{ value: "500K", label: "Médicos en LatAm · 2030" }, { value: "$50M", label: "ARR USD objetivo 2030" }, { value: "100M", label: "Pacientes con mejor atención" }].map(m => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-3xl font-black text-white">{m.value}</p>
                <p className="text-xs text-slate-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-lg">medmindsystem.com</p>
          <p className="text-slate-600 text-sm">Tomás Hoyos · Luis Camilo · Juan Diego Serna · Colombia, 2026</p>
        </div>
      </div>
    ),
  },
];

export default function PitchDeck() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(SLIDES.length - 1, c + 1));
  const slide = SLIDES[current];

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0D1420] shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm">MEDMIND · Pitch Deck — Convocatoria SURA · Tecnnova · EIA 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm font-mono">{current + 1}/{SLIDES.length}</span>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{slide.section}</Badge>
        </div>
      </div>

      {/* Slide */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">{slide.render()}</div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-white/5 bg-[#0D1420] px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={prev} disabled={current === 0} className="text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronLeft className="w-5 h-5 mr-1" /> Anterior
          </Button>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-blue-500" : "w-2 h-2 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={next} disabled={current === SLIDES.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30">
            Siguiente <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
