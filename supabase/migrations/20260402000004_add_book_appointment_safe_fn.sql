-- v2.0: Race-condition-safe appointment booking via advisory lock

CREATE OR REPLACE FUNCTION book_appointment_safe(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_appointment_date TIMESTAMPTZ,
  p_duration INT,
  p_service_name TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_appointment_id UUID;
  v_overlap_count INT;
BEGIN
  -- Advisory lock per doctor+timeslot to prevent concurrent double-booking
  PERFORM pg_advisory_xact_lock(
    hashtext(p_doctor_id::text || p_appointment_date::text)
  );

  -- Check for overlapping appointments
  SELECT COUNT(*) INTO v_overlap_count
  FROM appointments
  WHERE doctor_id = p_doctor_id
    AND status != 'cancelled'
    AND appointment_date < p_appointment_date + (p_duration || ' minutes')::interval
    AND appointment_date + (duration_minutes || ' minutes')::interval > p_appointment_date;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'SLOT_TAKEN: El horario solicitado ya está ocupado.';
  END IF;

  INSERT INTO appointments (
    doctor_id, patient_id, appointment_date,
    duration_minutes, service_name, notes, status
  ) VALUES (
    p_doctor_id, p_patient_id, p_appointment_date,
    p_duration, p_service_name, p_notes, 'scheduled'
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
