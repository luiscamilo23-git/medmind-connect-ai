import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookAppointmentRequest {
  patient_phone: string;
  patient_name?: string;
  appointment_date: string;
  reason: string;
  doctor_id: string;
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

    const body: BookAppointmentRequest = await req.json();
    
    // Validate required fields
    if (!body.patient_phone) {
      return new Response(
        JSON.stringify({ error: 'patient_phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.appointment_date) {
      return new Response(
        JSON.stringify({ error: 'appointment_date is required (ISO format)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.reason) {
      return new Response(
        JSON.stringify({ error: 'reason is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.doctor_id) {
      return new Response(
        JSON.stringify({ error: 'doctor_id is required' }),
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
    const cleanPhone = body.patient_phone.replace(/[\s\-\(\)]/g, '');

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

    // Step 2: Create the appointment
    console.log('Creating appointment for patient:', patientId);
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        doctor_id: body.doctor_id,
        patient_id: patientId,
        appointment_date: body.appointment_date,
        title: body.reason,
        description: `Cita agendada vía n8n - ${body.reason}`,
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
