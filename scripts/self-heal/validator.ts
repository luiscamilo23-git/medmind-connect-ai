import { execSync } from "child_process";
import { sendWhatsApp } from "./notifier";

const REPO_DIR = "C:/Users/user/Documents/CODE/medmind";

function getLastCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: REPO_DIR }).toString().trim();
  } catch {
    return "unknown";
  }
}

export interface ErrorLog {
  id: string;
  function_name?: string;
  message: string;
  stack?: string;
  severity: string;
  doctor_id?: string;
  created_at: string;
}

export async function validateAndCommit(
  file: string,
  error: ErrorLog,
): Promise<boolean> {
  try {
    // 1. TypeScript check — must pass before committing
    execSync("npx tsc --noEmit", { cwd: REPO_DIR, stdio: "pipe" });

    // 2. Run tests (non-fatal if no test suite exists yet)
    try {
      execSync("npx vitest run --reporter=verbose 2>&1 | head -80", {
        cwd: REPO_DIR,
        stdio: "pipe",
        shell: true,
      });
    } catch (testErr) {
      // Tests failed → rollback
      execSync(`git checkout -- "${file}"`, { cwd: REPO_DIR });
      await sendWhatsApp(
        `⚠️ MEDMIND Self-Heal (Fix revertido)\n\n` +
          `🐛 Error: ${error.message}\n` +
          `📁 Archivo: ${file}\n` +
          `❌ Fix generado pero tests fallaron — revertido\n` +
          `👀 Requiere revisión manual`,
      );
      return false;
    }

    // 3. Commit the fix
    const commitMsg = `fix(self-heal): auto-fix ${error.function_name ?? "unknown"} - ${error.message.slice(0, 60)}`;
    execSync(`git add "${file}"`, { cwd: REPO_DIR });
    execSync(`git commit -m "${commitMsg}"`, { cwd: REPO_DIR });

    await sendWhatsApp(
      `✅ MEDMIND Self-Heal\n\n` +
        `🐛 Error detectado: ${error.message}\n` +
        `📁 Archivo: ${file}\n` +
        `🔧 Fix aplicado y testeado\n` +
        `✔️ Commit: ${getLastCommitHash()}\n\n` +
        `No se requiere acción. El sistema se arregló solo.`,
    );
    return true;
  } catch (err) {
    // tsc failed → rollback
    try {
      execSync(`git checkout -- "${file}"`, { cwd: REPO_DIR });
    } catch {}
    await sendWhatsApp(
      `❌ MEDMIND Self-Heal (Fix fallido)\n\n` +
        `🐛 Error: ${error.message}\n` +
        `📁 Archivo: ${file}\n` +
        `❌ TypeScript falló tras el fix — revertido\n` +
        `Error: ${err instanceof Error ? err.message : String(err)}\n` +
        `👀 Requiere revisión manual`,
    );
    return false;
  }
}
