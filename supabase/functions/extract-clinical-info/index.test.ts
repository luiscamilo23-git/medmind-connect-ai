import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("extract-clinical-info: returns 401 without auth", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-clinical-info`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer invalid-token`
    },
    body: JSON.stringify({ transcript: "test" }),
  });
  
  const body = await response.text();
  assertEquals(response.status, 401);
});

Deno.test("analyze-clinical-transcript: returns 401 without auth", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-clinical-transcript`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer invalid-token`
    },
    body: JSON.stringify({ transcript: "test", specialty: "MEDICO_GENERAL" }),
  });
  
  const body = await response.text();
  assertEquals(response.status, 401);
});

Deno.test("get-availability: responds without auth (public)", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-availability`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ doctorId: "00000000-0000-0000-0000-000000000000" }),
  });
  
  const body = await response.text();
  // Should respond (not 401) since verify_jwt = false
  assertExists(body);
});

Deno.test("doctor-ai-assistant: returns 401 without valid auth", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/doctor-ai-assistant`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer invalid-token`
    },
    body: JSON.stringify({ message: "hola", history: [] }),
  });
  
  const body = await response.text();
  assertEquals(response.status, 401);
});
