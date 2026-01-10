import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Pen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignaturePadProps {
  onSignatureChange: (url: string | null) => void;
  initialSignature?: string | null;
}

export const SignaturePad = ({ onSignatureChange, initialSignature }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignature || null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl(null);
    onSignatureChange(null);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileName = `${user.id}/${Date.now()}_signature.png`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setSignatureUrl(publicUrl);
      onSignatureChange(publicUrl);

      toast({
        title: "Firma guardada",
        description: "La firma se ha guardado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setSignatureUrl(publicUrl);
      onSignatureChange(publicUrl);

      toast({
        title: "Firma cargada",
        description: "La firma se ha cargado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Firma Médica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatureUrl ? (
          <div className="relative">
            <img src={signatureUrl} alt="Firma médica" className="w-full border rounded-lg" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearSignature}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed rounded-lg">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={clearSignature} variant="outline" size="sm">
                Limpiar
              </Button>
              <Button onClick={saveSignature} size="sm" disabled={isUploading}>
                Guardar Firma
              </Button>
              <div className="flex-1" />
              <label htmlFor="signature-upload">
                <Button variant="secondary" size="sm" asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Cargar Imagen
                  </span>
                </Button>
              </label>
              <input
                id="signature-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};