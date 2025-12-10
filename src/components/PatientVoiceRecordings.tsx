import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Play, Pause, Trash2, Clock, Download, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";

interface VoiceRecording {
  id: string;
  audio_url: string;
  transcript: string | null;
  duration_seconds: number | null;
  created_at: string;
}

interface PatientVoiceRecordingsProps {
  patientId: string;
}

export const PatientVoiceRecordings = ({ patientId }: PatientVoiceRecordingsProps) => {
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Record<string, number>>({});
  const [duration, setDuration] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, [patientId]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("voice_recordings")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateAudio = (recording: VoiceRecording): HTMLAudioElement => {
    if (!audioRefs.current[recording.id]) {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = recording.audio_url;
      
      audio.onloadedmetadata = () => {
        setDuration(prev => ({ ...prev, [recording.id]: audio.duration }));
      };
      
      audio.ontimeupdate = () => {
        setCurrentTime(prev => ({ ...prev, [recording.id]: audio.currentTime }));
      };
      
      audio.onended = () => {
        setPlayingId(null);
        setCurrentTime(prev => ({ ...prev, [recording.id]: 0 }));
      };
      
      audio.onerror = (e) => {
        console.error("Audio error:", e);
        toast({
          title: "Error de reproducción",
          description: "No se pudo cargar el audio. Intenta descargar el archivo.",
          variant: "destructive",
        });
        setPlayingId(null);
      };
      
      audioRefs.current[recording.id] = audio;
    }
    return audioRefs.current[recording.id];
  };

  const togglePlay = async (recording: VoiceRecording) => {
    const audio = getOrCreateAudio(recording);
    
    if (playingId === recording.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause any other playing audio
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      
      setPlayingId(recording.id);
      try {
        await audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "No se pudo reproducir. Intenta descargar el archivo.",
          variant: "destructive",
        });
        setPlayingId(null);
      }
    }
  };

  const handleSeek = (recording: VoiceRecording, value: number[]) => {
    const audio = getOrCreateAudio(recording);
    audio.currentTime = value[0];
    setCurrentTime(prev => ({ ...prev, [recording.id]: value[0] }));
  };

  const downloadRecording = async (recording: VoiceRecording) => {
    try {
      const response = await fetch(recording.audio_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabacion_${format(new Date(recording.created_at), "yyyy-MM-dd_HH-mm")}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga iniciada",
        description: "El archivo de audio se está descargando",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el audio",
        variant: "destructive",
      });
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      // Stop if playing
      if (playingId === recordingId && audioRefs.current[recordingId]) {
        audioRefs.current[recordingId].pause();
        setPlayingId(null);
      }
      
      const { error } = await supabase
        .from("voice_recordings")
        .delete()
        .eq("id", recordingId);

      if (error) throw error;

      toast({
        title: "Grabación eliminada",
        description: "La grabación se eliminó exitosamente",
      });

      // Clean up audio ref
      delete audioRefs.current[recordingId];
      loadRecordings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Mic className="w-5 h-5 text-primary" />
            Grabaciones de Voz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Cargando grabaciones...</p>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Mic className="w-5 h-5 text-primary" />
            Grabaciones de Voz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay grabaciones de voz para este paciente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Mic className="w-5 h-5 text-primary" />
          Grabaciones de Voz ({recordings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recordings.map((recording) => {
            const audioDuration = duration[recording.id] || recording.duration_seconds || 0;
            const audioCurrentTime = currentTime[recording.id] || 0;
            const isPlaying = playingId === recording.id;
            
            return (
              <div
                key={recording.id}
                className="p-4 border border-border/50 rounded-xl bg-background/50 hover:bg-muted/30 transition-all"
              >
                {/* Header with date */}
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {format(new Date(recording.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </span>
                </div>

                {/* Audio Player */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mb-3">
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="icon"
                    onClick={() => togglePlay(recording)}
                    className="shrink-0 h-10 w-10 rounded-full"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                  
                  <div className="flex-1 space-y-1">
                    <Slider
                      value={[audioCurrentTime]}
                      max={audioDuration || 100}
                      step={0.1}
                      onValueChange={(value) => handleSeek(recording, value)}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(audioCurrentTime)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                  
                  <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>

                {/* Transcript */}
                {recording.transcript && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 italic">
                    "{recording.transcript}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadRecording(recording)}
                    className="gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRecording(recording.id)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
