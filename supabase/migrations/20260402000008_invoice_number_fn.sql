-- Función para obtener el siguiente número de factura de forma atómica
-- Previene duplicados con SELECT ... FOR UPDATE

CREATE OR REPLACE FUNCTION get_next_invoice_number(p_doctor_id UUID)
RETURNS JSON AS $$
DECLARE
  v_config dian_software_config%ROWTYPE;
  v_siguiente BIGINT;
  v_numero TEXT;
BEGIN
  -- Lock exclusivo para este doctor (evita concurrencia)
  SELECT * INTO v_config
  FROM dian_software_config
  WHERE doctor_id = p_doctor_id AND activo = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay configuración DIAN activa para este médico';
  END IF;

  v_siguiente := v_config.ultimo_numero + 1;

  IF v_siguiente > v_config.rango_hasta THEN
    RAISE EXCEPTION 'Se agotó el rango de numeración DIAN. Solicita un nuevo rango ante la DIAN.';
  END IF;

  -- Construir número completo
  IF v_config.prefijo IS NOT NULL AND v_config.prefijo != '' THEN
    v_numero := v_config.prefijo || '-' || LPAD(v_siguiente::TEXT, 8, '0');
  ELSE
    v_numero := LPAD(v_siguiente::TEXT, 8, '0');
  END IF;

  -- Incrementar el contador
  UPDATE dian_software_config
  SET ultimo_numero = v_siguiente, updated_at = NOW()
  WHERE doctor_id = p_doctor_id;

  RETURN json_build_object('numero', v_numero, 'secuencia', v_siguiente);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
