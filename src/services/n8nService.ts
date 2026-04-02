import { supabase } from "@/integrations/supabase/client";

export interface N8NSchedulerPayload {
  action: "auto_organize" | "suggest_slots" | "send_reminders";
  doctor_id?: string;
  appointments?: Array<{
    id: string;
    title: string;
    date: string;
    duration: number;
    status: string;
    patient_name?: string;
  }>;
  current_date: string;
  week_start?: string;
  week_end?: string;
  message?: string;
}

export interface N8NResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export const sendToN8NWebhook = async (payload: N8NSchedulerPayload): Promise<N8NResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-proxy", {
      body: {
        ...payload,
        timestamp: new Date().toISOString(),
        source: "medmind_smart_scheduler",
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message ?? "Error al conectar con n8n",
      };
    }

    return data as N8NResponse;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al conectar con n8n",
    };
  }
};
