import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

const PRIMOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

function calcularDV(nit: string): number {
  const digits = nit.replace(/\D/g, "").split("").map(Number);
  if (digits.length === 0 || digits.length > PRIMOS.length) return -1;
  const sum = [...digits].reverse().reduce((acc, d, i) => acc + d * PRIMOS[i], 0);
  const rem = sum % 11;
  return rem > 1 ? 11 - rem : rem;
}

interface NitInputProps {
  value: string;
  onChange: (nit: string, dv: number, valid: boolean) => void;
  disabled?: boolean;
}

export function NitInput({ value, onChange, disabled }: NitInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [dv, setDv] = useState<number | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    const clean = displayValue.replace(/\D/g, "");
    if (clean.length >= 8) {
      const calculatedDV = calcularDV(clean);
      setDv(calculatedDV);
      setValid(calculatedDV >= 0);
      onChange(clean, calculatedDV, calculatedDV >= 0);
    } else {
      setDv(null);
      setValid(null);
      onChange(clean, -1, false);
    }
  }, [displayValue]);

  return (
    <div className="space-y-1">
      <Label>NIT de la empresa</Label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="900123456"
            maxLength={10}
            disabled={disabled}
            className={valid === false ? "border-destructive" : valid === true ? "border-green-500" : ""}
          />
        </div>
        <span className="text-muted-foreground font-mono text-sm">–</span>
        <div className="w-14 flex items-center gap-1">
          <Input
            value={dv !== null ? String(dv) : ""}
            readOnly
            placeholder="DV"
            className="text-center font-mono bg-muted"
          />
          {valid === true && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
          {valid === false && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
        </div>
      </div>
      {valid === true && (
        <p className="text-xs text-green-600">NIT válido — dígito verificador: {dv}</p>
      )}
      {valid === false && (
        <p className="text-xs text-destructive">NIT inválido. Verifica que sea correcto.</p>
      )}
      {valid === null && displayValue.length > 0 && (
        <p className="text-xs text-muted-foreground">Ingresa mínimo 8 dígitos</p>
      )}
    </div>
  );
}
