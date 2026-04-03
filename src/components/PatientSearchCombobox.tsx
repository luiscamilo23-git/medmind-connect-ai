import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, User, Phone, Droplets } from "lucide-react";

export interface PatientOption {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  address: string | null;
}

interface PatientSearchComboboxProps {
  onSelect: (patient: PatientOption | null) => void;
  selectedPatient?: PatientOption | null;
  placeholder?: string;
  disabled?: boolean;
}

export const PatientSearchCombobox = ({
  onSelect,
  selectedPatient,
  placeholder = "Buscar paciente por nombre o teléfono...",
  disabled,
}: PatientSearchComboboxProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, date_of_birth, blood_type, allergies, address")
        .eq("doctor_id", user.id)
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .order("full_name")
        .limit(8);

      setResults((data as PatientOption[]) ?? []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (patient: PatientOption) => {
    onSelect(patient);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const calcAge = (dob: string | null): string => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} años`;
  };

  if (selectedPatient) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20">
        <User className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedPatient.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {selectedPatient.phone}
            {selectedPatient.date_of_birth && ` · ${calcAge(selectedPatient.date_of_birth)}`}
            {selectedPatient.blood_type && ` · ${selectedPatient.blood_type}`}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">Vinculado</Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleClear}
          disabled={disabled}
          title="Desvincular paciente"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-0"
              onClick={() => handleSelect(p)}
            >
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />{p.phone}
                  </span>
                  {p.date_of_birth && (
                    <span className="text-xs text-muted-foreground">{calcAge(p.date_of_birth)}</span>
                  )}
                  {p.blood_type && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Droplets className="w-3 h-3" />{p.blood_type}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg px-4 py-3 text-sm text-muted-foreground">
          No se encontró ningún paciente. Se creará uno nuevo al guardar.
        </div>
      )}
    </div>
  );
};
