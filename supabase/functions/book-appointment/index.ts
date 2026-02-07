import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { es as esLocale } from "https://esm.sh/date-fns@3.6.0/locale";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BookAppointmentRequest {
  patient_name?: string;
  phone: string;
  date: string;
  doctor_id: string;
  reason?: string;
}

// Helper to return consistent JSON responses (always 200 OK)
function jsonResponse(data: Record<string, unknown>) {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Método no permitido. Usa POST.' });
    }

    // Authenticate using x-api-key header
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_AUTH_TOKEN');
    
    if (!expectedKey) {
      console.error('N8N_AUTH_TOKEN not configured');
      return jsonResponse({ success: false, error: 'Error de configuración del servidor.' });
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return jsonResponse({ success: false, error: 'No autorizado. API key inválido.' });
    }

    const body: BookAppointmentRequest = await req.json();
    
    // Validate required fields
    if (!body.phone) {
      return jsonResponse({ success: false, error: 'El campo "phone" es requerido.' });
    }
    
    if (!body.date) {
      return jsonResponse({ success: false, error: 'El campo "date" es requerido (formato ISO).' });
    }
    
    if (!body.doctor_id) {
      return jsonResponse({ success: false, error: 'El campo "doctor_id" es requerido.' });
    }

    // TIMEZONE-AWARE DATE PARSING
    // Extract LOCAL time from ISO string BEFORE JS converts to UTC
    console.log('Raw date received:', body.date);
    
    // Extract local hour from ISO string (e.g., "2025-12-16T14:00:00-05:00" -> 14)
    const isoMatch = body.date.match(/T(\d{2}):(\d{2})/);
    const localHour = isoMatch ? parseInt(isoMatch[1], 10) : -1;
    const localMinutes = isoMatch ? parseInt(isoMatch[2], 10) : 0;
    
    console.log('Extracted local time from ISO:', localHour + ':' + localMinutes.toString().padStart(2, '0'));
    
    let requestedDate = new Date(body.date);
    const now = new Date();
    
    // Check if date is valid using standard parsing
    if (isNaN(requestedDate.getTime())) {
      console.error('Invalid date - could not parse:', body.date);
      return jsonResponse({ success: false, error: `No pude entender la fecha "${body.date}". Intenta con formato como "21 de diciembre a las 10am".` });
    }
    
    console.log('Parsed date (UTC):', requestedDate.toISOString());
    
    // AUTO-CORRECTION: Force year to 2025 if less than 2025
    const originalYear = requestedDate.getFullYear();
    if (originalYear < 2025) {
      console.log(`AUTO-CORRECTION: Corrected year from ${originalYear} to 2025`);
      requestedDate.setFullYear(2025);
    }
    
    // Validate year is within acceptable range (2025-2026)
    const correctedYear = requestedDate.getFullYear();
    if (correctedYear > 2026) {
      console.error('Year too far in future:', correctedYear);
      return jsonResponse({ success: false, error: `Año incorrecto (${correctedYear}). Solo agenda para 2025 o 2026.` });
    }
    
    // Block past dates (AFTER year correction)
    if (requestedDate < now) {
      console.error('Date is in the past after correction:', requestedDate.toISOString());
      return jsonResponse({ success: false, error: 'No se puede agendar en el pasado. Dame una fecha futura.' });
    }
    
    // Update body.date with corrected date for database insertion
    const correctedDateISO = requestedDate.toISOString();

    console.log('Received booking request:', JSON.stringify(body));

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = body.phone.replace(/[\s\-\(\)]/g, '');

    // Step 1: Search for existing patient by phone
    console.log('Searching for patient with phone:', cleanPhone);
    
    const { data: existingPatients, error: searchError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('doctor_id', body.doctor_id)
      .eq('phone', cleanPhone)
      .limit(1);

    if (searchError) {
      console.error('Error searching for patient:', searchError);
      return jsonResponse({ success: false, error: 'Error al buscar el paciente en la base de datos.' });
    }

    let patientId: string;
    let patientName: string;

    if (existingPatients && existingPatients.length > 0) {
      // Patient exists
      patientId = existingPatients[0].id;
      patientName = existingPatients[0].full_name;
      console.log('Found existing patient:', patientId, patientName);
    } else {
      // Create new patient
      const newPatientName = body.patient_name || `Paciente ${cleanPhone}`;
      console.log('Creating new patient:', newPatientName);
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          doctor_id: body.doctor_id,
          full_name: newPatientName,
          phone: cleanPhone,
        })
        .select('id, full_name')
        .single();

      if (createError) {
        console.error('Error creating patient:', createError);
        return jsonResponse({ success: false, error: 'Error al crear el paciente.' });
      }

      patientId = newPatient.id;
      patientName = newPatient.full_name;
      console.log('Created new patient:', patientId);
    }

    // Step 2: Check for slot conflicts with SMART RECOVERY
    const appointmentStart = new Date(correctedDateISO);
    const SLOT_DURATION = 30; // 30 minute slots
    
    // Use the LOCAL hour extracted from original ISO string for display and validation
    const requestedTime = `${localHour.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
    
    console.log('Checking availability for local time:', requestedTime);
    
    // Validate working hours using LOCAL time (extracted from ISO)
    if (localHour < 8 || localHour >= 18) {
      console.log('Requested time outside working hours (local):', localHour);
      return jsonResponse({
        success: false,
        error: 'Fuera de horario',
        message: `El horario de las ${requestedTime} está fuera del horario de atención (8:00 - 18:00). Por favor elige un horario dentro de ese rango.`,
        original_requested_time: requestedTime
      });
    }
    
    // Helper function to check if a slot is available
    async function isSlotAvailable(slotStart: Date, slotLocalHour: number): Promise<boolean> {
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000);
      
      // Check working hours using LOCAL hour (not UTC)
      if (slotLocalHour < 8 || slotLocalHour >= 18) return false;
      
      // Check if slot is in the past
      if (slotStart < now) return false;
      
      // Query existing appointments that might overlap
      const { data: conflicts, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, duration_minutes')
        .eq('doctor_id', body.doctor_id)
        .neq('status', 'cancelled')
        .gte('appointment_date', new Date(slotStart.getTime() - 60 * 60 * 1000).toISOString())
        .lte('appointment_date', new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('Error checking slot:', error);
        return false;
      }
      
      console.log('Conflicts found for slot:', conflicts?.length || 0, 'at local hour:', slotLocalHour);
      
      // Check for overlaps
      for (const existing of conflicts || []) {
        const existingStart = new Date(existing.appointment_date);
        const existingEnd = new Date(existingStart.getTime() + (existing.duration_minutes || 30) * 60 * 1000);
        
        if (slotStart < existingEnd && slotEnd > existingStart) {
          return false; // Conflict found
        }
      }
      
      return true; // Slot is available
    }
    
    // Check if requested slot is available
    const isRequestedSlotAvailable = await isSlotAvailable(appointmentStart, localHour);
    
    if (!isRequestedSlotAvailable) {
      console.log('Requested slot occupied, searching for alternatives...');
      
      // SMART RECOVERY: Check next 3 slots (+30, +60, +90 mins)
      const alternativeOffsets = [30, 60, 90]; // minutes
      let suggestedSlot: Date | null = null;
      let suggestedLocalHour = localHour;
      let suggestedLocalMinutes = localMinutes;
      
      for (const offset of alternativeOffsets) {
        const alternativeSlot = new Date(appointmentStart.getTime() + offset * 60 * 1000);
        // Calculate the LOCAL hour for the alternative slot
        const altLocalMinutes = (localMinutes + offset) % 60;
        const altLocalHour = localHour + Math.floor((localMinutes + offset) / 60);
        
        if (await isSlotAvailable(alternativeSlot, altLocalHour)) {
          suggestedSlot = alternativeSlot;
          suggestedLocalHour = altLocalHour;
          suggestedLocalMinutes = altLocalMinutes;
          console.log(`Found available alternative slot: ${altLocalHour}:${altLocalMinutes.toString().padStart(2, '0')}`);
          break;
        }
      }
      
      if (suggestedSlot) {
        // Return smart suggestion
        const suggestedTime = `${suggestedLocalHour.toString().padStart(2, '0')}:${suggestedLocalMinutes.toString().padStart(2, '0')}`;
        return jsonResponse({
          success: false,
          error: 'Occupied',
          message: `El horario de las ${requestedTime} está ocupado, pero tengo libre a las ${suggestedTime}. ¿Te sirve?`,
          suggested_date: suggestedSlot.toISOString(),
          suggested_time: suggestedTime,
          original_requested_time: requestedTime
        });
      } else {
        // No alternatives found in next 90 minutes
        return jsonResponse({
          success: false,
          error: 'Occupied',
          message: `El horario de las ${requestedTime} y los siguientes 90 minutos están ocupados. Por favor elige otra hora del día.`,
          original_requested_time: requestedTime
        });
      }
    }

    // Step 3: Create the appointment
    console.log('Creating appointment for patient:', patientId);
    
    // Format title as "{patient_name} - {reason}"
    const reasonText = body.reason || 'Consulta General';
    const appointmentTitle = `${patientName} - ${reasonText}`;
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        doctor_id: body.doctor_id,
        patient_id: patientId,
        appointment_date: correctedDateISO,
        title: appointmentTitle,
        description: `Cita agendada vía WhatsApp`,
        status: 'scheduled',
        duration_minutes: 30,
      })
      .select('id, appointment_date, status')
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return jsonResponse({ success: false, error: 'Error al crear la cita en la base de datos.' });
    }

    console.log('Appointment created successfully:', appointment.id);

    // Step 4: Create notification for the doctor
    const appointmentDateFormatted = format(new Date(correctedDateISO), "d 'de' MMMM 'a las' HH:mm", { locale: esLocale });
    const notificationMessage = `Nueva cita: ${patientName} para el ${appointmentDateFormatted}`;
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        doctor_id: body.doctor_id,
        message: notificationMessage,
        is_read: false,
      });

    if (notificationError) {
      console.error('Error creating notification (non-blocking):', notificationError);
      // Don't fail the booking if notification fails
    } else {
      console.log('Notification created for doctor');
    }

    // Return success response
    return jsonResponse({
      success: true,
      message: 'Cita agendada exitosamente.',
      appointment_id: appointment.id,
      appointment_date: appointment.appointment_date,
      appointment_time: requestedTime,
      status: appointment.status,
      patient_id: patientId,
      patient_name: patientName,
      patient_created: !(existingPatients && existingPatients.length > 0),
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return jsonResponse({ success: false, error: `Error interno: ${errorMessage}` });
  }
});
