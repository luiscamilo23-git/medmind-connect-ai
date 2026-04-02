import { spawn } from "child_process";
import { sendWhatsApp } from "./notifier";
import { validateAndCommit, type ErrorLog } from "./validator";

const REPO_DIR = "C:/Users/user/Documents/CODE/medmind";

/**
 * Maps error context keywords to the responsible source file.
 * Extend this map as new functions are added.
 */
const ERROR_TO_FILE_MAP: Record<string, string> = {
  "emit-invoice-dian": "supabase/functions/emit-invoice-dian/index.ts",
  "transcribe-audio": "supabase/functions/transcribe-audio/index.ts",
  "doctor-ai-assistant": "supabase/functions/doctor-ai-assistant/index.ts",
  "book-appointment": "supabase/functions/book-appointment/index.ts",
  "patient-ai-chat": "supabase/functions/patient-ai-chat/index.ts",
  "generate-rips": "supabase/functions/generate-rips/index.ts",
  "validate-rips": "supabase/functions/validate-rips/index.ts",
  "n8n-proxy": "supabase/functions/n8n-proxy/index.ts",
  ProtectedRoute: "src/components/ProtectedRoute.tsx",
  VoiceNotes: "src/pages/VoiceNotes.tsx",
  SmartNotes: "src/pages/SmartNotes.tsx",
  SmartScheduler: "src/pages/SmartScheduler.tsx",
  MyAgentAI: "src/pages/MyAgentAI.tsx",
};

function identifyFile(error: ErrorLog): string | null {
  const searchIn = `${error.function_name ?? ""} ${error.message} ${error.stack ?? ""}`;
  for (const [keyword, file] of Object.entries(ERROR_TO_FILE_MAP)) {
    if (searchIn.includes(keyword)) return file;
  }
  return null;
}

export async function analyzeError(error: ErrorLog): Promise<void> {
  const responsibleFile = identifyFile(error);

  if (!responsibleFile) {
    await sendWhatsApp(
      `⚠️ Error en MEDMIND sin archivo identificado:\n${error.message}\nFunción: ${error.function_name ?? "desconocida"}`,
    );
    return;
  }

  const prompt = [
    `Error en producción de MEDMIND:`,
    `- Mensaje: ${error.message}`,
    `- Stack: ${error.stack ?? "(no stack)"}`,
    `- Función: ${error.function_name ?? "desconocida"}`,
    `- Archivo: ${responsibleFile}`,
    `- Hora: ${new Date().toISOString()}`,
    ``,
    `Analiza el error, encuentra la causa raíz en ${responsibleFile},`,
    `y escribe el fix mínimo necesario. NO hagas cambios grandes.`,
    `Solo corrige puntualmente el error sin romper otras funcionalidades.`,
  ].join("\n");

  await runClaudeCodeFix(responsibleFile, prompt, error);
}

async function runClaudeCodeFix(
  file: string,
  prompt: string,
  error: ErrorLog,
): Promise<void> {
  return new Promise((resolve) => {
    const claude = spawn(
      "claude",
      [
        "--print",
        "--allowedTools",
        "Read,Edit,Bash",
        "--max-turns",
        "5",
        prompt,
      ],
      {
        cwd: REPO_DIR,
        env: { ...process.env, CLAUDE_SELF_HEAL: "true" },
        shell: true,
      },
    );

    let output = "";
    claude.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    claude.on("close", async (code: number | null) => {
      if (code === 0) {
        await validateAndCommit(file, error);
      } else {
        await sendWhatsApp(
          `❌ Claude Code no pudo hacer el fix automático:\n${error.message}\nRevisar manualmente: ${file}\nOutput: ${output.slice(0, 300)}`,
        );
      }
      resolve();
    });
  });
}
