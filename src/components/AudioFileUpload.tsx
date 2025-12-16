import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileAudio, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AudioFileUploadProps {
  onTranscriptionComplete: (transcript: string) => void;
  className?: string;
}

export const AudioFileUpload = ({ onTranscriptionComplete, className }: AudioFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    // Validar tipo de archivo
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|m4a|ogg)$/i)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor sube un archivo de audio (MP3, WAV, WebM, M4A, OGG)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 25MB para Whisper)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 25MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const transcribeAudio = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    try {
      // Convertir archivo a base64
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(selectedFile);
      const base64Audio = await base64Promise;

      // Llamar a la función de transcripción
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        onTranscriptionComplete(data.text);
        setSelectedFile(null);
        toast({
          title: "✓ Transcripción completada",
          description: "El audio ha sido transcrito exitosamente",
        });
      } else {
        throw new Error('No se recibió transcripción');
      }
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error de transcripción",
        description: error.message || "No se pudo transcribir el audio. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
        onChange={handleInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer",
            "hover:border-primary/50 hover:bg-primary/5",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20" 
              : "border-muted-foreground/25 bg-muted/20"
          )}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className={cn(
              "p-4 rounded-full transition-all duration-300",
              isDragging ? "bg-primary/20 scale-110" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-8 w-8 transition-colors duration-300",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="space-y-2">
              <p className={cn(
                "font-medium transition-colors duration-300",
                isDragging ? "text-primary" : "text-foreground"
              )}>
                {isDragging ? "Suelta el archivo aquí" : "Arrastra un archivo de audio"}
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground/70">
                MP3, WAV, WebM, M4A, OGG • Máx. 25MB
              </p>
            </div>
          </div>

          {/* Animated border effect when dragging */}
          {isDragging && (
            <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse pointer-events-none" />
          )}
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileAudio className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={isTranscribing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={transcribeAudio}
            disabled={isTranscribing}
            className="w-full mt-4"
            size="lg"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Transcribiendo con IA...
              </>
            ) : (
              <>
                <FileAudio className="mr-2 h-5 w-5" />
                Transcribir Audio
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
