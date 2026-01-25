import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileAudio, Loader2, X, Waves, Music } from "lucide-react";
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
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|m4a|ogg)$/i)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor sube un archivo de audio (MP3, WAV, WebM, M4A, OGG)",
        variant: "destructive",
      });
      return;
    }

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

      const invokePromise = supabase.functions.invoke('transcribe-audio', {
        body: {
          audio: base64Audio,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La transcripción está tardando demasiado (timeout). Intenta de nuevo.')), 60_000)
      );

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.error || 'No se pudo transcribir el audio');
      }

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
            "relative overflow-hidden border-2 border-dashed rounded-2xl p-8 transition-all duration-500 cursor-pointer group",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-border/50 bg-gradient-to-br from-muted/30 via-background to-muted/30 hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          {/* Background animated pattern when dragging */}
          {isDragging && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 animate-pulse" />
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-150" />
            </div>
          )}

          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            {/* Icon container with animation */}
            <div className={cn(
              "relative p-5 rounded-2xl transition-all duration-500",
              isDragging 
                ? "bg-primary/20 scale-110 shadow-lg shadow-primary/30" 
                : "bg-muted/50 group-hover:bg-primary/10 group-hover:scale-105"
            )}>
              {isDragging ? (
                <Waves className="h-10 w-10 text-primary animate-pulse" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              )}
              
              {/* Decorative ring */}
              <div className={cn(
                "absolute inset-0 rounded-2xl border-2 transition-all duration-500",
                isDragging 
                  ? "border-primary scale-110 opacity-100" 
                  : "border-transparent scale-100 opacity-0 group-hover:border-primary/30 group-hover:opacity-100"
              )} />
            </div>
            
            <div className="space-y-2">
              <p className={cn(
                "text-lg font-semibold transition-colors duration-300",
                isDragging ? "text-primary" : "text-foreground"
              )}>
                {isDragging ? "¡Suelta el archivo aquí!" : "Arrastra un archivo de audio"}
              </p>
              <p className="text-sm text-muted-foreground">
                o <span className="text-primary font-medium hover:underline">haz clic para seleccionar</span>
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Music className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground/60">
                  MP3, WAV, WebM, M4A, OGG • Máx. 25MB
                </p>
              </div>
            </div>
          </div>

          {/* Animated corner accents when dragging */}
          {isDragging && (
            <>
              <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary rounded-tl-lg animate-pulse" />
              <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary rounded-tr-lg animate-pulse" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary rounded-bl-lg animate-pulse" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary rounded-br-lg animate-pulse" />
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-2xl p-6 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <FileAudio className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para transcribir
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={isTranscribing}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Button
            onClick={transcribeAudio}
            disabled={isTranscribing}
            className="w-full mt-5 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            size="lg"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Transcribiendo con IA...
              </>
            ) : (
              <>
                <Waves className="mr-2 h-5 w-5" />
                Transcribir Audio
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
