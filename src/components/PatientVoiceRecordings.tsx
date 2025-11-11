import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Play, Pause, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, [patientId]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);

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

  const togglePlay = async (recording: VoiceRecording) => {
    if (playingId === recording.id) {
      // Pause current audio
      if (audioElement) {
        audioElement.pause();
        setPlayingId(null);
      }
    } else {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }

      // Create new audio element
      const audio = new Audio(recording.audio_url);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        toast({
          title: "Error",
          description: "No se pudo reproducir el audio",
          variant: "destructive",
        });
        setPlayingId(null);
      };

      setAudioElement(audio);
      setPlayingId(recording.id);
      
      try {
        await audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "No se pudo reproducir el audio",
          variant: "destructive",
        });
        setPlayingId(null);
      }
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      const { error } = await supabase
        .from("voice_recordings")
        .delete()
        .eq("id", recordingId);

      if (error) throw error;

      toast({
        title: "Grabación eliminada",
        description: "La grabación se eliminó exitosamente",
      });

      loadRecordings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Grabaciones de Voz ({recordings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(recording.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                {recording.duration_seconds && (
                  <p className="text-sm text-muted-foreground">
                    Duración: {formatDuration(recording.duration_seconds)}
                  </p>
                )}
                {recording.transcript && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {recording.transcript}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => togglePlay(recording)}
                  title={playingId === recording.id ? "Pausar" : "Reproducir"}
                >
                  {playingId === recording.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteRecording(recording.id)}
                  title="Eliminar grabación"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};