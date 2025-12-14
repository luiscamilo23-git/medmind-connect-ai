export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_wellness_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          patient_id: string
          priority: string
          tip_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          patient_id: string
          priority?: string
          tip_type: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          patient_id?: string
          priority?: string
          tip_type?: string
          title?: string
        }
        Relationships: []
      }
      api_configurations: {
        Row: {
          api_url: string | null
          config_data: Json | null
          created_at: string | null
          doctor_id: string
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          provider_name: string
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          api_url?: string | null
          config_data?: Json | null
          created_at?: string | null
          doctor_id: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          provider_name: string
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          api_url?: string | null
          config_data?: Json | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          provider_name?: string
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          description: string | null
          doctor_id: string
          duration_minutes: number
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          description?: string | null
          doctor_id: string
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          description?: string | null
          doctor_id?: string
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_room_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          last_message_at: string | null
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          last_message_at?: string | null
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          last_message_at?: string | null
          patient_id?: string
        }
        Relationships: []
      }
      device_verifications: {
        Row: {
          created_at: string
          device_fingerprint: string
          id: string
          last_verified_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          id?: string
          last_verified_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          id?: string
          last_verified_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dian_emission_logs: {
        Row: {
          created_at: string | null
          cufe: string | null
          doctor_id: string
          error_message: string | null
          id: string
          invoice_id: string
          numero_dian: string | null
          provider: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          cufe?: string | null
          doctor_id: string
          error_message?: string | null
          id?: string
          invoice_id: string
          numero_dian?: string | null
          provider: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string | null
          cufe?: string | null
          doctor_id?: string
          error_message?: string | null
          id?: string
          invoice_id?: string
          numero_dian?: string | null
          provider?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dian_emission_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      dian_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          invoice_id: string | null
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          invoice_id?: string | null
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          invoice_id?: string | null
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "dian_webhook_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_questions: {
        Row: {
          created_at: string
          doctor_id: string
          frequency: number
          id: string
          last_used_at: string
          question_text: string
          specialty: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          frequency?: number
          id?: string
          last_used_at?: string
          question_text: string
          specialty?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          frequency?: number
          id?: string
          last_used_at?: string
          question_text?: string
          specialty?: string | null
        }
        Relationships: []
      }
      doctor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          photos: string[] | null
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          photos?: string[] | null
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          photos?: string[] | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          doctor_id: string
          document_type: string
          id: string
          is_default: boolean | null
          specialty: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          doctor_id: string
          document_type: string
          id?: string
          is_default?: boolean | null
          specialty?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          doctor_id?: string
          document_type?: string
          id?: string
          is_default?: boolean | null
          specialty?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: Database["public"]["Enums"]["inventory_category"]
          created_at: string
          current_stock: number
          description: string | null
          doctor_id: string
          expiration_date: string | null
          id: string
          last_restock_date: string | null
          location: string | null
          minimum_stock: number
          name: string
          notes: string | null
          sku: string | null
          supplier: string | null
          unit_cost: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["inventory_category"]
          created_at?: string
          current_stock?: number
          description?: string | null
          doctor_id: string
          expiration_date?: string | null
          id?: string
          last_restock_date?: string | null
          location?: string | null
          minimum_stock?: number
          name: string
          notes?: string | null
          sku?: string | null
          supplier?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["inventory_category"]
          created_at?: string
          current_stock?: number
          description?: string | null
          doctor_id?: string
          expiration_date?: string | null
          id?: string
          last_restock_date?: string | null
          location?: string | null
          minimum_stock?: number
          name?: string
          notes?: string | null
          sku?: string | null
          supplier?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_usage: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          medical_record_id: string | null
          notes: string | null
          quantity_used: number
          used_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          medical_record_id?: string | null
          notes?: string | null
          quantity_used: number
          used_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          medical_record_id?: string | null
          notes?: string | null
          quantity_used?: number
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cantidad: number
          codigo_cups: string | null
          created_at: string | null
          descripcion: string
          id: string
          impuestos_linea: number
          invoice_id: string
          precio_unitario: number
          service_id: string | null
          subtotal_linea: number
          total_linea: number
        }
        Insert: {
          cantidad?: number
          codigo_cups?: string | null
          created_at?: string | null
          descripcion: string
          id?: string
          impuestos_linea?: number
          invoice_id: string
          precio_unitario: number
          service_id?: string | null
          subtotal_linea: number
          total_linea: number
        }
        Update: {
          cantidad?: number
          codigo_cups?: string | null
          created_at?: string | null
          descripcion?: string
          id?: string
          impuestos_linea?: number
          invoice_id?: string
          precio_unitario?: number
          service_id?: string | null
          subtotal_linea?: number
          total_linea?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          cufe: string | null
          doctor_id: string
          errores_validacion: Json | null
          estado: Database["public"]["Enums"]["invoice_status"]
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          impuestos: number
          metodo_emision: string | null
          notas: string | null
          numero_factura_dian: string | null
          patient_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          pdf_url: string | null
          proveedor_dian: string | null
          subtotal: number
          total: number
          updated_at: string | null
          xml_url: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          cufe?: string | null
          doctor_id: string
          errores_validacion?: Json | null
          estado?: Database["public"]["Enums"]["invoice_status"]
          fecha_emision?: string
          fecha_vencimiento: string
          id?: string
          impuestos?: number
          metodo_emision?: string | null
          notas?: string | null
          numero_factura_dian?: string | null
          patient_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pdf_url?: string | null
          proveedor_dian?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          xml_url?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          cufe?: string | null
          doctor_id?: string
          errores_validacion?: Json | null
          estado?: Database["public"]["Enums"]["invoice_status"]
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          impuestos?: number
          metodo_emision?: string | null
          notas?: string | null
          numero_factura_dian?: string | null
          patient_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pdf_url?: string | null
          proveedor_dian?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          created_at: string
          doctor_id: string
          document_data: Json
          document_type: string
          id: string
          medical_record_id: string | null
          patient_id: string
          pdf_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          document_data: Json
          document_type: string
          id?: string
          medical_record_id?: string | null
          patient_id: string
          pdf_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          document_data?: Json
          document_type?: string
          id?: string
          medical_record_id?: string | null
          patient_id?: string
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: string[] | null
          chief_complaint: string | null
          cie10_code: string | null
          consent: string | null
          created_at: string
          current_illness: string | null
          diagnosis: string | null
          diagnostic_aids: string | null
          doctor_id: string
          doctor_signature: string | null
          education: string | null
          evolution_notes: string | null
          followup: string | null
          id: string
          medical_history: string | null
          medications: string[] | null
          notes: string | null
          patient_id: string
          patient_identification: string | null
          physical_exam: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          ros: string | null
          symptoms: string[] | null
          title: string
          treatment: string | null
          treatment_plan: string | null
          updated_at: string
          vital_signs: Json | null
          voice_transcript: string | null
        }
        Insert: {
          appointment_id?: string | null
          attachments?: string[] | null
          chief_complaint?: string | null
          cie10_code?: string | null
          consent?: string | null
          created_at?: string
          current_illness?: string | null
          diagnosis?: string | null
          diagnostic_aids?: string | null
          doctor_id: string
          doctor_signature?: string | null
          education?: string | null
          evolution_notes?: string | null
          followup?: string | null
          id?: string
          medical_history?: string | null
          medications?: string[] | null
          notes?: string | null
          patient_id: string
          patient_identification?: string | null
          physical_exam?: string | null
          record_type: Database["public"]["Enums"]["record_type"]
          ros?: string | null
          symptoms?: string[] | null
          title: string
          treatment?: string | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
          voice_transcript?: string | null
        }
        Update: {
          appointment_id?: string | null
          attachments?: string[] | null
          chief_complaint?: string | null
          cie10_code?: string | null
          consent?: string | null
          created_at?: string
          current_illness?: string | null
          diagnosis?: string | null
          diagnostic_aids?: string | null
          doctor_id?: string
          doctor_signature?: string | null
          education?: string | null
          evolution_notes?: string | null
          followup?: string | null
          id?: string
          medical_history?: string | null
          medications?: string[] | null
          notes?: string | null
          patient_id?: string
          patient_identification?: string | null
          physical_exam?: string | null
          record_type?: Database["public"]["Enums"]["record_type"]
          ros?: string | null
          symptoms?: string[] | null
          title?: string
          treatment?: string | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
          voice_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      moderator_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          moderator_id: string
          module: string
          record_id: string | null
          record_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          moderator_id: string
          module: string
          record_id?: string | null
          record_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          moderator_id?: string
          module?: string
          record_id?: string | null
          record_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      notes_analysis: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          is_voice_recording: boolean | null
          main_ideas: string[] | null
          original_text: string
          reminders: string[] | null
          tasks: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          is_voice_recording?: boolean | null
          main_ideas?: string[] | null
          original_text: string
          reminders?: string[] | null
          tasks?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          is_voice_recording?: boolean | null
          main_ideas?: string[] | null
          original_text?: string
          reminders?: string[] | null
          tasks?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_audit_logs: {
        Row: {
          accessed_by: string
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          patient_id: string
        }
        Insert: {
          accessed_by: string
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          patient_id: string
        }
        Update: {
          accessed_by?: string
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          patient_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          doctor_id: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          doctor_id: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          doctor_id?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateway_configs: {
        Row: {
          api_key: string | null
          config_data: Json | null
          created_at: string | null
          doctor_id: string
          gateway_provider: Database["public"]["Enums"]["payment_gateway_provider"]
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          merchant_id: string | null
          private_key: string | null
          public_key: string | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          config_data?: Json | null
          created_at?: string | null
          doctor_id: string
          gateway_provider: Database["public"]["Enums"]["payment_gateway_provider"]
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          merchant_id?: string | null
          private_key?: string | null
          public_key?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          config_data?: Json | null
          created_at?: string | null
          doctor_id?: string
          gateway_provider?: Database["public"]["Enums"]["payment_gateway_provider"]
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          merchant_id?: string | null
          private_key?: string | null
          public_key?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          gateway_provider: Database["public"]["Enums"]["payment_gateway_provider"]
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          gateway_provider: Database["public"]["Enums"]["payment_gateway_provider"]
          id?: string
          payload: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          gateway_provider?: Database["public"]["Enums"]["payment_gateway_provider"]
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          comprobante_url: string | null
          created_at: string | null
          doctor_id: string
          error_message: string | null
          estado: Database["public"]["Enums"]["payment_transaction_status"]
          fecha_aprobacion: string | null
          fecha_pago: string | null
          gateway_provider:
            | Database["public"]["Enums"]["payment_gateway_provider"]
            | null
          gateway_response: Json | null
          id: string
          invoice_id: string
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          monto: number
          notas: string | null
          transaction_id: string | null
          transaction_ref: string | null
          updated_at: string | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string | null
          doctor_id: string
          error_message?: string | null
          estado?: Database["public"]["Enums"]["payment_transaction_status"]
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          gateway_provider?:
            | Database["public"]["Enums"]["payment_gateway_provider"]
            | null
          gateway_response?: Json | null
          id?: string
          invoice_id: string
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          monto: number
          notas?: string | null
          transaction_id?: string | null
          transaction_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string | null
          doctor_id?: string
          error_message?: string | null
          estado?: Database["public"]["Enums"]["payment_transaction_status"]
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          gateway_provider?:
            | Database["public"]["Enums"]["payment_gateway_provider"]
            | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          notas?: string | null
          transaction_id?: string | null
          transaction_ref?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          doctor_id: string
          id: string
          image_url: string | null
          likes_count: number
          post_type: string
          published: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          doctor_id: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          published?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          doctor_id?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          published?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          clinic_name: string | null
          consultation_fee: number | null
          created_at: string
          full_name: string
          id: string
          is_accepting_patients: boolean | null
          license_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          whatsapp_instance_name: string | null
          whatsapp_last_sync_at: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          created_at?: string
          full_name: string
          id: string
          is_accepting_patients?: boolean | null
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          whatsapp_instance_name?: string | null
          whatsapp_last_sync_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_accepting_patients?: boolean | null
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          whatsapp_instance_name?: string | null
          whatsapp_last_sync_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      rips_batches: {
        Row: {
          archivo_rips_url: string | null
          created_at: string | null
          doctor_id: string
          errores_validacion: Json | null
          estado: Database["public"]["Enums"]["rips_status"]
          fecha_envio: string | null
          fecha_fin: string
          fecha_inicio: string
          fecha_validacion: string | null
          id: string
          json_data: Json | null
          mecanismo_validacion_id: string | null
          nit_pagador: string | null
          observaciones: string | null
          pagador: string
          total_registros: number | null
          total_valor: number | null
          updated_at: string | null
          validation_response: string | null
        }
        Insert: {
          archivo_rips_url?: string | null
          created_at?: string | null
          doctor_id: string
          errores_validacion?: Json | null
          estado?: Database["public"]["Enums"]["rips_status"]
          fecha_envio?: string | null
          fecha_fin: string
          fecha_inicio: string
          fecha_validacion?: string | null
          id?: string
          json_data?: Json | null
          mecanismo_validacion_id?: string | null
          nit_pagador?: string | null
          observaciones?: string | null
          pagador: string
          total_registros?: number | null
          total_valor?: number | null
          updated_at?: string | null
          validation_response?: string | null
        }
        Update: {
          archivo_rips_url?: string | null
          created_at?: string | null
          doctor_id?: string
          errores_validacion?: Json | null
          estado?: Database["public"]["Enums"]["rips_status"]
          fecha_envio?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          fecha_validacion?: string | null
          id?: string
          json_data?: Json | null
          mecanismo_validacion_id?: string | null
          nit_pagador?: string | null
          observaciones?: string | null
          pagador?: string
          total_registros?: number | null
          total_valor?: number | null
          updated_at?: string | null
          validation_response?: string | null
        }
        Relationships: []
      }
      rips_records: {
        Row: {
          codigo_diagnostico_principal: string | null
          codigo_diagnostico_relacionado: string | null
          codigo_servicio: string
          copago: number | null
          created_at: string | null
          datos_json: Json
          descripcion_servicio: string
          fecha_fin_atencion: string | null
          fecha_inicio_atencion: string
          id: string
          invoice_id: string | null
          numero_autorizacion: string | null
          patient_id: string
          rips_batch_id: string
          tipo_archivo: Database["public"]["Enums"]["rips_file_type"]
          tipo_diagnostico_principal: string | null
          valor_neto: number
          valor_total: number
        }
        Insert: {
          codigo_diagnostico_principal?: string | null
          codigo_diagnostico_relacionado?: string | null
          codigo_servicio: string
          copago?: number | null
          created_at?: string | null
          datos_json: Json
          descripcion_servicio: string
          fecha_fin_atencion?: string | null
          fecha_inicio_atencion: string
          id?: string
          invoice_id?: string | null
          numero_autorizacion?: string | null
          patient_id: string
          rips_batch_id: string
          tipo_archivo: Database["public"]["Enums"]["rips_file_type"]
          tipo_diagnostico_principal?: string | null
          valor_neto: number
          valor_total: number
        }
        Update: {
          codigo_diagnostico_principal?: string | null
          codigo_diagnostico_relacionado?: string | null
          codigo_servicio?: string
          copago?: number | null
          created_at?: string | null
          datos_json?: Json
          descripcion_servicio?: string
          fecha_fin_atencion?: string | null
          fecha_inicio_atencion?: string
          id?: string
          invoice_id?: string | null
          numero_autorizacion?: string | null
          patient_id?: string
          rips_batch_id?: string
          tipo_archivo?: Database["public"]["Enums"]["rips_file_type"]
          tipo_diagnostico_principal?: string | null
          valor_neto?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "rips_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rips_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rips_records_rips_batch_id_fkey"
            columns: ["rips_batch_id"]
            isOneToOne: false
            referencedRelation: "rips_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      rips_validation_logs: {
        Row: {
          created_at: string | null
          detalles: string | null
          errores: Json | null
          id: string
          resultado: string
          rips_batch_id: string
          tipo_validacion: string
          validado_por: string | null
          warnings: Json | null
        }
        Insert: {
          created_at?: string | null
          detalles?: string | null
          errores?: Json | null
          id?: string
          resultado: string
          rips_batch_id: string
          tipo_validacion: string
          validado_por?: string | null
          warnings?: Json | null
        }
        Update: {
          created_at?: string | null
          detalles?: string | null
          errores?: Json | null
          id?: string
          resultado?: string
          rips_batch_id?: string
          tipo_validacion?: string
          validado_por?: string | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rips_validation_logs_rips_batch_id_fkey"
            columns: ["rips_batch_id"]
            isOneToOne: false
            referencedRelation: "rips_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          activo: boolean | null
          codigo_cups: string | null
          created_at: string | null
          descripcion: string | null
          doctor_id: string
          id: string
          impuestos_aplican: boolean | null
          nombre_servicio: string
          porcentaje_impuesto: number | null
          precio_unitario: number
          tipo_servicio: Database["public"]["Enums"]["service_type"]
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo_cups?: string | null
          created_at?: string | null
          descripcion?: string | null
          doctor_id: string
          id?: string
          impuestos_aplican?: boolean | null
          nombre_servicio: string
          porcentaje_impuesto?: number | null
          precio_unitario: number
          tipo_servicio: Database["public"]["Enums"]["service_type"]
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo_cups?: string | null
          created_at?: string | null
          descripcion?: string | null
          doctor_id?: string
          id?: string
          impuestos_aplican?: boolean | null
          nombre_servicio?: string
          porcentaje_impuesto?: number | null
          precio_unitario?: number
          tipo_servicio?: Database["public"]["Enums"]["service_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      suggestion_history: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          last_suggested_at: string
          priority: string
          question: string
          reason: string
          specialty: string | null
          suggested_count: number
          transcript_context: string | null
          used_count: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          last_suggested_at?: string
          priority: string
          question: string
          reason: string
          specialty?: string | null
          suggested_count?: number
          transcript_context?: string | null
          used_count?: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          last_suggested_at?: string
          priority?: string
          question?: string
          reason?: string
          specialty?: string | null
          suggested_count?: number
          transcript_context?: string | null
          used_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_recordings: {
        Row: {
          audio_url: string
          created_at: string
          doctor_id: string
          duration_seconds: number | null
          id: string
          patient_id: string | null
          transcript: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string
          doctor_id: string
          duration_seconds?: number | null
          id?: string
          patient_id?: string | null
          transcript?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string
          doctor_id?: string
          duration_seconds?: number | null
          id?: string
          patient_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_payment_gateway: {
        Args: { doctor_uuid: string }
        Returns: {
          gateway_provider: Database["public"]["Enums"]["payment_gateway_provider"]
          is_sandbox: boolean
          public_key: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_rips_structure: { Args: { rips_json: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "doctor" | "staff" | "patient" | "moderator"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      inventory_category:
        | "medication"
        | "surgical"
        | "diagnostic"
        | "disposable"
        | "equipment"
        | "other"
      invoice_status: "DRAFT" | "EMITIDA" | "VALIDADA" | "RECHAZADA" | "ANULADA"
      payment_gateway_provider: "WOMPI" | "PAYU" | "EPAYCO" | "MANUAL"
      payment_method:
        | "EFECTIVO"
        | "TARJETA_CREDITO"
        | "TARJETA_DEBITO"
        | "TRANSFERENCIA"
        | "PSE"
        | "NEQUI"
        | "DAVIPLATA"
        | "OTRO"
      payment_status: "PENDIENTE" | "PAGADA" | "PARCIAL" | "VENCIDA"
      payment_transaction_status:
        | "PENDIENTE"
        | "PROCESANDO"
        | "APROBADO"
        | "RECHAZADO"
        | "CANCELADO"
        | "REEMBOLSADO"
      record_type:
        | "consultation"
        | "procedure"
        | "diagnosis"
        | "prescription"
        | "lab_result"
        | "imaging"
      rips_file_type: "AC" | "AP" | "AU" | "AH" | "AN" | "AM" | "AT"
      rips_status: "DRAFT" | "GENERADO" | "VALIDADO" | "RECHAZADO" | "ENVIADO"
      service_type:
        | "CONSULTA"
        | "PROCEDIMIENTO"
        | "CIRUGIA"
        | "LABORATORIO"
        | "IMAGENES"
        | "TERAPIA"
        | "MEDICAMENTO"
        | "OTRO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "staff", "patient", "moderator"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      inventory_category: [
        "medication",
        "surgical",
        "diagnostic",
        "disposable",
        "equipment",
        "other",
      ],
      invoice_status: ["DRAFT", "EMITIDA", "VALIDADA", "RECHAZADA", "ANULADA"],
      payment_gateway_provider: ["WOMPI", "PAYU", "EPAYCO", "MANUAL"],
      payment_method: [
        "EFECTIVO",
        "TARJETA_CREDITO",
        "TARJETA_DEBITO",
        "TRANSFERENCIA",
        "PSE",
        "NEQUI",
        "DAVIPLATA",
        "OTRO",
      ],
      payment_status: ["PENDIENTE", "PAGADA", "PARCIAL", "VENCIDA"],
      payment_transaction_status: [
        "PENDIENTE",
        "PROCESANDO",
        "APROBADO",
        "RECHAZADO",
        "CANCELADO",
        "REEMBOLSADO",
      ],
      record_type: [
        "consultation",
        "procedure",
        "diagnosis",
        "prescription",
        "lab_result",
        "imaging",
      ],
      rips_file_type: ["AC", "AP", "AU", "AH", "AN", "AM", "AT"],
      rips_status: ["DRAFT", "GENERADO", "VALIDADO", "RECHAZADO", "ENVIADO"],
      service_type: [
        "CONSULTA",
        "PROCEDIMIENTO",
        "CIRUGIA",
        "LABORATORIO",
        "IMAGENES",
        "TERAPIA",
        "MEDICAMENTO",
        "OTRO",
      ],
    },
  },
} as const
