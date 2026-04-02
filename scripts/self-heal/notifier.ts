/**
 * Sends a WhatsApp notification via Twilio to the developer.
 * Uses the same Twilio account already configured in MEDMIND.
 */
export async function sendWhatsApp(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
  const to = process.env.DEVELOPER_WHATSAPP;

  if (!accountSid || !authToken || !to) {
    console.error("[Self-Heal Notifier] Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DEVELOPER_WHATSAPP)");
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: message }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[Self-Heal Notifier] WhatsApp send failed:", response.status, text);
  }
}
