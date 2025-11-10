import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatRoom {
  id: string;
  doctor_id: string;
  last_message_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    specialty: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const PatientChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string>("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
      subscribeToMessages(selectedRoom);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const doctorId = searchParams.get("doctor");
      if (doctorId) {
        await createOrGetChatRoom(session.user.id, doctorId);
      }

      loadChatRooms(session.user.id);
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

  const createOrGetChatRoom = async (patientId: string, doctorId: string) => {
    try {
      const { data: existing } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("patient_id", patientId)
        .eq("doctor_id", doctorId)
        .single();

      if (existing) {
        setSelectedRoom(existing.id);
        return;
      }

      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert({ patient_id: patientId, doctor_id: doctorId })
        .select()
        .single();

      if (error) throw error;
      setSelectedRoom(newRoom.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadChatRooms = async (patientId: string) => {
    try {
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("patient_id", patientId)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch doctor profiles separately
      const roomsWithProfiles = await Promise.all(
        (rooms || []).map(async (room) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, specialty")
            .eq("id", room.doctor_id)
            .single();

          return {
            ...room,
            profiles: profile || { full_name: "", avatar_url: "", specialty: "" },
          };
        })
      );

      setChatRooms(roomsWithProfiles);

      if (roomsWithProfiles && roomsWithProfiles.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsWithProfiles[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        chat_room_id: selectedRoom,
        sender_id: userId,
        message: newMessage,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedRoomData = chatRooms.find((r) => r.id === selectedRoom);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patient/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chat con Médicos</h1>
            <p className="text-muted-foreground">Consulta directa con profesionales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {chatRooms.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No hay conversaciones aún
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        selectedRoom === room.id ? "bg-secondary" : ""
                      }`}
                      onClick={() => setSelectedRoom(room.id)}
                    >
                      <Avatar>
                        <AvatarImage src={room.profiles.avatar_url} />
                        <AvatarFallback>{room.profiles.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{room.profiles.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {room.profiles.specialty}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              {selectedRoomData && (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedRoomData.profiles.avatar_url} />
                    <AvatarFallback>
                      {selectedRoomData.profiles.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedRoomData.profiles.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoomData.profiles.specialty}
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              <ScrollArea className="flex-1 pr-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_id === userId
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={!selectedRoom}
                />
                <Button onClick={sendMessage} disabled={!selectedRoom || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;
