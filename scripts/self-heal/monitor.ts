import { createClient } from "@supabase/supabase-js";
import { analyzeError } from "./analyzer";
import type { ErrorLog } from "./validator";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[Self-Heal Monitor] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Track in-flight error IDs to prevent duplicate fixes
const processing = new Set<string>();

async function handleError(errorLog: ErrorLog): Promise<void> {
  if (processing.has(errorLog.id)) return;
  processing.add(errorLog.id);

  console.log(`[Self-Heal] Critical error detected: ${errorLog.function_name ?? "unknown"} — ${errorLog.message}`);

  try {
    await analyzeError(errorLog);
  } finally {
    processing.delete(errorLog.id);
  }
}

async function startMonitor(): Promise<void> {
  console.log("[Self-Heal] MEDMIND Self-Heal Monitor starting...");

  // Real-time subscription to critical errors
  supabase
    .channel("production-errors")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "error_logs",
        filter: "severity=eq.critical",
      },
      (payload) => {
        handleError(payload.new as ErrorLog);
      },
    )
    .subscribe((status) => {
      console.log(`[Self-Heal] Realtime subscription: ${status}`);
    });

  // Also poll every 60s for any critical errors that may have been missed
  setInterval(async () => {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .eq("severity", "critical")
      .gte("created_at", oneMinuteAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Self-Heal] Poll error:", error.message);
      return;
    }

    for (const log of data ?? []) {
      await handleError(log as ErrorLog);
    }
  }, 60_000);

  console.log("[Self-Heal] Monitor running. Watching for critical errors...");
}

startMonitor();
