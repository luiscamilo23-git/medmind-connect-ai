const N8N_WEBHOOK_URL = "https://chispa-ia-n8n.653wwo.easypanel.host/webhook/messages-upsert";

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
    console.log("Sending to n8n webhook:", payload);
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors", // Handle CORS for external webhooks
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: "medmind_smart_scheduler",
      }),
    });

    // With no-cors mode, we can't read the response properly
    // So we assume success if no error was thrown
    return {
      success: true,
      message: "Solicitud enviada a n8n correctamente",
    };
  } catch (error) {
    console.error("Error sending to n8n webhook:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al conectar con n8n",
    };
  }
};
