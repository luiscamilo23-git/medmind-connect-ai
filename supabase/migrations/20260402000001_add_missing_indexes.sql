-- v2.0: Add critical missing indexes for query performance

-- book-appointment: searches by phone+doctor_id without index
CREATE INDEX IF NOT EXISTS idx_patients_doctor_phone
  ON patients(doctor_id, phone);

-- slot checking in appointments
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments(doctor_id, appointment_date DESC);

-- DIAN idempotency check
CREATE INDEX IF NOT EXISTS idx_invoices_doctor_dian_number
  ON invoices(doctor_id, numero_factura_dian)
  WHERE numero_factura_dian IS NOT NULL;

-- expiration alerts in inventory
CREATE INDEX IF NOT EXISTS idx_inventory_expiration
  ON inventory(doctor_id, expiration_date)
  WHERE expiration_date IS NOT NULL;

-- WhatsApp conversation list
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_doctor_updated
  ON whatsapp_conversations(doctor_id, updated_at DESC);

-- medical records by service
CREATE INDEX IF NOT EXISTS idx_medical_records_service
  ON medical_records(service_id);
