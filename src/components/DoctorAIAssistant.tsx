import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, Sparkles, Mic, MicOff, X, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "**Asistente MED** — Apoyo clínico basado en evidencia\n\n Consultas rápidas disponibles:\n\n**💊 Farmacología**\n_\"Dosis de vancomicina en IRC FG 25\"_\n_\"Interacciones warfarina + amiodarona\"_\n\n**🔬 Diagnóstico**\n_\"Criterios diagnósticos de sepsis qSOFA\"_\n_\"Diferenciales de dolor pleurítico\"_\n\n**🏷️ Códigos**\n_\"CUPS consulta medicina interna EPS\"_\n_\"CIE-10 diabetes tipo 2 sin complicaciones\"_\n\n**📊 Laboratorio**\n_\"Interpretar troponina 0.08 ng/mL\"_\n_\"Valores normales TSH por trimestre embarazo\"_\n\n⚕️ *Criterio clínico del profesional prevalece siempre.*",
  timestamp: new Date(),
};

interface DoctorAIAssistantProps {
  expanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
  doctorName?: string;
  specialty?: string;
}

export const DoctorAIAssistant = ({ 
  expanded = false, 
  onToggleExpand, 
  onClose,
  doctorName,
  specialty 
}: DoctorAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + " " + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error de voz",
          description: "No se pudo capturar el audio",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "No disponible",
        description: "El reconocimiento de voz no está soportado en este navegador",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Filter out the welcome message and only send real conversation history
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("doctor-ai-assistant", {
        body: {
          message: userMessage.content,
          history: conversationHistory,
          doctorName,
          specialty,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Lo siento, no pude procesar tu consulta.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`flex flex-col border-border/50 bg-card/80 backdrop-blur ${expanded ? 'h-[80vh]' : 'h-[400px]'}`}>
      <CardHeader className="border-b border-primary/20 py-3 px-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <div className="p-1.5 rounded-full bg-primary shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="flex items-center gap-1.5">
              Asistente MED
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleExpand}>
                {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/60 text-foreground rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="bg-muted/60 rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="border-t border-border/50 p-3">
        <div className="flex gap-2">
          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={toggleListening}
            className={`shrink-0 ${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta algo..."
            disabled={isLoading}
            className="flex-1 bg-background/50 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
