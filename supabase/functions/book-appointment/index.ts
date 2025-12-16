import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface BookAppointmentRequest {
  patient_name?: string;
  phone: string;
  date: string;
  doctor_id: string;
  reason?: string;
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
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate using x-api-key header
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_AUTH_TOKEN');
    
    if (!expectedKey) {
      console.error('N8N_AUTH_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid or missing x-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: BookAppointmentRequest = await req.json();
    
    // Validate required fields
    if (!body.phone) {
      return new Response(
        JSON.stringify({ error: 'phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.date) {
      return new Response(
        JSON.stringify({ error: 'date is required (ISO format)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.doctor_id) {
      return new Response(
        JSON.stringify({ error: 'doctor_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STRICT DATE VALIDATION - Block AI hallucinations
    const requestedDate = new Date(body.date);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(requestedDate.getTime())) {
      console.error('Invalid date format received:', body.date);
      return new Response(
        JSON.stringify({ error: 'Formato de fecha inválido. Usa formato ISO (YYYY-MM-DDTHH:mm:ss).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Block past dates
    if (requestedDate < now) {
      console.error('Attempted to book in the past:', body.date);
      return new Response(
        JSON.stringify({ error: 'No se puede agendar en el pasado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Enforce current/next year only (2025-2026)
    const requestedYear = requestedDate.getFullYear();
    if (requestedYear < 2025 || requestedYear > 2026) {
      console.error('Invalid year received:', requestedYear);
      return new Response(
        JSON.stringify({ error: 'El año es incorrecto. Solo agenda para 2025 en adelante.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Error searching for patient', details: searchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        return new Response(
          JSON.stringify({ error: 'Error creating patient', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      patientId = newPatient.id;
      patientName = newPatient.full_name;
      console.log('Created new patient:', patientId);
    }

    // Step 2: Check for slot conflicts (30 minute slots)
    const appointmentStart = new Date(body.date);
    const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60 * 1000); // 30 min duration
    
    // Query existing appointments that might overlap
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id, appointment_date, duration_minutes, title')
      .eq('doctor_id', body.doctor_id)
      .neq('status', 'cancelled')
      .gte('appointment_date', new Date(appointmentStart.getTime() - 60 * 60 * 1000).toISOString()) // 1 hour before
      .lte('appointment_date', new Date(appointmentStart.getTime() + 60 * 60 * 1000).toISOString()); // 1 hour after

    if (conflictError) {
      console.error('Error checking for conflicts:', conflictError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar disponibilidad.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for actual overlaps
    if (conflictingAppointments && conflictingAppointments.length > 0) {
      for (const existing of conflictingAppointments) {
        const existingStart = new Date(existing.appointment_date);
        const existingEnd = new Date(existingStart.getTime() + (existing.duration_minutes || 30) * 60 * 1000);
        
        // Check if times overlap
        if (appointmentStart < existingEnd && appointmentEnd > existingStart) {
          console.error('Slot conflict detected:', {
            requested: body.date,
            existing: existing.appointment_date,
            existingTitle: existing.title
          });
          return new Response(
            JSON.stringify({ error: 'Ese horario ya está ocupado. Por favor elige otra hora.' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Step 3: Create the appointment
    console.log('Creating appointment for patient:', patientId);
    
    const appointmentTitle = body.reason || 'Cita agendada vía n8n';
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        doctor_id: body.doctor_id,
        patient_id: patientId,
        appointment_date: body.date,
        title: appointmentTitle,
        description: `Cita agendada vía n8n - ${appointmentTitle}`,
        status: 'scheduled',
        duration_minutes: 30,
      })
      .select('id, appointment_date, status')
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Error creating appointment', details: appointmentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Appointment created successfully:', appointment.id);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment_id: appointment.id,
          appointment_date: appointment.appointment_date,
          status: appointment.status,
          patient_id: patientId,
          patient_name: patientName,
          patient_created: !(existingPatients && existingPatients.length > 0),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
