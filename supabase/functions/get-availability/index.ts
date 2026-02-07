import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GetAvailabilityRequest {
  date: string; // YYYY-MM-DD
  doctor_id: string;
}

// Define working hours (8:00 AM to 6:00 PM, 30-minute slots)
const WORKING_HOURS_START = 8;
const WORKING_HOURS_END = 18;
const SLOT_DURATION_MINUTES = 30;

function generateAllSlots(): string[] {
  const slots: string[] = [];
  for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método no permitido. Usa POST.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate using x-api-key header
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_AUTH_TOKEN');
    
    if (!expectedKey) {
      console.error('N8N_AUTH_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Error de configuración del servidor.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado. API key inválido.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GetAvailabilityRequest = await req.json();
    
    // Validate required fields
    if (!body.date) {
      return new Response(
        JSON.stringify({ success: false, error: 'El campo "date" es requerido (formato YYYY-MM-DD).' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.doctor_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'El campo "doctor_id" es requerido.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de fecha inválido. Usa YYYY-MM-DD.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the date
    let dateParts = body.date.split('-');
    let year = parseInt(dateParts[0]);
    const month = dateParts[1];
    const day = dateParts[2];
    
    // AUTO-CORRECTION: Force year to 2025 if less than 2025
    if (year < 2025) {
      console.log(`AUTO-CORRECTION: Corrected year from ${year} to 2025`);
      year = 2025;
    }
    
    // Validate year is within acceptable range (2025-2026)
    if (year > 2026) {
      return new Response(
        JSON.stringify({ success: false, error: `Año incorrecto (${year}). Solo consulta para 2025 o 2026.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Rebuild corrected date string
    const correctedDateStr = `${year}-${month}-${day}`;
    const requestedDate = new Date(correctedDateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Block past dates (AFTER year correction)
    if (requestedDate < today) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se puede consultar disponibilidad para fechas pasadas.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking availability for:', correctedDateStr, 'doctor:', body.doctor_id);

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Query appointments for this doctor on this date
    const startOfDay = `${correctedDateStr}T00:00:00`;
    const endOfDay = `${correctedDateStr}T23:59:59`;

    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select('appointment_date, duration_minutes, status')
      .eq('doctor_id', body.doctor_id)
      .neq('status', 'cancelled')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay);

    if (queryError) {
      console.error('Error querying appointments:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al consultar la base de datos.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all possible slots
    const allSlots = generateAllSlots();
    
    // Find occupied slots
    const occupiedSlots = new Set<string>();
    
    for (const apt of appointments || []) {
      const aptDate = new Date(apt.appointment_date);
      const duration = apt.duration_minutes || 30;
      
      // Mark all slots that this appointment covers
      for (let i = 0; i < duration; i += SLOT_DURATION_MINUTES) {
        const slotTime = new Date(aptDate.getTime() + i * 60 * 1000);
        const slotString = `${slotTime.getHours().toString().padStart(2, '0')}:${slotTime.getMinutes().toString().padStart(2, '0')}`;
        occupiedSlots.add(slotString);
      }
    }

    // Filter out occupied slots and past slots (if checking today)
    const availableSlots = allSlots.filter(slot => {
      if (occupiedSlots.has(slot)) return false;
      
      // If checking today, exclude past hours
      if (requestedDate.toDateString() === now.toDateString()) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(now);
        slotTime.setHours(hours, minutes, 0, 0);
        if (slotTime <= now) return false;
      }
      
      return true;
    });

    console.log('Available slots:', availableSlots.length, 'Occupied:', occupiedSlots.size);

    return new Response(
      JSON.stringify({
        success: true,
        date: correctedDateStr,
        original_date: body.date,
        year_corrected: year !== parseInt(body.date.split('-')[0]),
        doctor_id: body.doctor_id,
        available_slots: availableSlots,
        total_available: availableSlots.length,
        working_hours: `${WORKING_HOURS_START}:00 - ${WORKING_HOURS_END}:00`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: `Error interno: ${errorMessage}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
