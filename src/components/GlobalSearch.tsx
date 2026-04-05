import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, FileText, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: "patient" | "invoice" | "appointment";
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [patientsRes, invoicesRes, appointmentsRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name, phone")
          .eq("doctor_id", user.id)
          .ilike("full_name", `%${q}%`)
          .limit(5),
        supabase
          .from("invoices")
          .select("id, numero_factura_dian, total, patients(full_name)")
          .ilike("numero_factura_dian", `%${q}%`)
          .limit(3),
        supabase
          .from("appointments")
          .select("id, title, appointment_date, patients(full_name)")
          .eq("doctor_id", user.id)
          .ilike("title", `%${q}%`)
          .limit(3),
      ]);

      const newResults: SearchResult[] = [];

      (patientsRes.data || []).forEach((p) =>
        newResults.push({
          id: p.id,
          label: p.full_name,
          sublabel: p.phone,
          type: "patient",
          url: "/patients",
        })
      );

      (invoicesRes.data || []).forEach((inv) =>
        newResults.push({
          id: inv.id,
          label: inv.numero_factura_dian || `Factura #${inv.id.slice(0, 8)}`,
          sublabel: (inv.patients as any)?.full_name,
          type: "invoice",
          url: "/billing/invoices",
        })
      );

      (appointmentsRes.data || []).forEach((apt) =>
        newResults.push({
          id: apt.id,
          label: apt.title,
          sublabel: `${(apt.patients as any)?.full_name} — ${new Date(apt.appointment_date).toLocaleDateString("es-CO")}`,
          type: "appointment",
          url: "/appointments",
        })
      );

      setResults(newResults);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.url);
  };

  const patientResults = results.filter((r) => r.type === "patient");
  const invoiceResults = results.filter((r) => r.type === "invoice");
  const appointmentResults = results.filter((r) => r.type === "appointment");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start text-muted-foreground gap-2 px-3"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Buscar...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar pacientes, facturas, citas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <CommandEmpty>Sin resultados para "{query}"</CommandEmpty>
          )}
          {!loading && !query.trim() && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe para buscar
            </div>
          )}

          {patientResults.length > 0 && (
            <CommandGroup heading="Pacientes">
              {patientResults.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => handleSelect(r)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{r.label}</div>
                    {r.sublabel && (
                      <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {invoiceResults.length > 0 && (
            <>
              {patientResults.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Facturas">
                {invoiceResults.map((r) => (
                  <CommandItem
                    key={r.id}
                    onSelect={() => handleSelect(r)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{r.label}</div>
                      {r.sublabel && (
                        <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {appointmentResults.length > 0 && (
            <>
              {(patientResults.length > 0 || invoiceResults.length > 0) && <CommandSeparator />}
              <CommandGroup heading="Citas">
                {appointmentResults.map((r) => (
                  <CommandItem
                    key={r.id}
                    onSelect={() => handleSelect(r)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{r.label}</div>
                      {r.sublabel && (
                        <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
