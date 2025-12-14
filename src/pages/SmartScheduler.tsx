import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendToN8NWebhook, N8NSchedulerPayload } from "@/services/n8nService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  ArrowLeft, 
  Plus, 
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Video,
  Phone,
  Users,
  Sparkles,
  Lock,
  Filter,
  Brain,
  Zap,
  MessageSquare,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { NotificationBell } from "@/components/NotificationBell";
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  duration_minutes: number;
  patient_id: string;
  status: string;
  description: string | null;
  notes: string | null;
  location: string | null;
  patients?: {
    full_name: string;
    phone: string;
  };
}

interface Service {
  id: string;
  nombre_servicio: string;
}

const SmartScheduler = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { locale: es }));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [miniCalendarDate, setMiniCalendarDate] = useState<Date>(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Expanded time slots: 6:00 AM to 24:00 (midnight)
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = 6 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const weekDays = viewMode === "week" 
    ? Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
    : [miniCalendarDate];

  // Get dates that have appointments for mini calendar dots
  const datesWithAppointments = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(apt => {
      const date = format(parseISO(apt.appointment_date), "yyyy-MM-dd");
      dates.add(date);
    });
    return dates;
  }, [appointments]);

  const checkWhatsAppStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("whatsapp_instance_name")
        .eq("id", user.id)
        .maybeSingle();

      setWhatsappConnected(!!data?.whatsapp_instance_name);
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  useEffect(() => {
    checkAuth();
    loadAppointments();
    loadServices();
    checkWhatsAppStatus();

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (
            full_name,
            phone
          )
        `)
        .eq("doctor_id", user.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
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

  const loadServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("services")
        .select("id, nombre_servicio")
        .eq("doctor_id", user.id)
        .eq("activo", true);

      if (data) {
        setServices(data);
        setSelectedServices(data.map(s => s.id));
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleDateSelect = (date: Date, hour?: number) => {
    if (hour !== undefined) {
      const dateWithHour = new Date(date);
      dateWithHour.setHours(hour, 0, 0, 0);
      setSelectedDate(dateWithHour);
    } else {
      setSelectedDate(date);
    }
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    if (shouldRefresh) {
      loadAppointments();
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentWeekStart(prev => addDays(prev, direction === "next" ? 7 : -7));
    } else {
      setMiniCalendarDate(prev => addDays(prev, direction === "next" ? 1 : -1));
    }
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { locale: es }));
    setMiniCalendarDate(new Date());
  };

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.appointment_date);
      return isSameDay(aptDate, date) && aptDate.getHours() === hour;
    });
  };

  const todayAppointments = appointments.filter(
    (apt) => isToday(parseISO(apt.appointment_date))
  );

  const sendToN8N = async (action: N8NSchedulerPayload["action"], message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload: N8NSchedulerPayload = {
        action,
        doctor_id: user?.id,
        appointments: appointments.map(apt => ({
          id: apt.id,
          title: apt.title,
          date: apt.appointment_date,
          duration: apt.duration_minutes,
          status: apt.status,
          patient_name: apt.patients?.full_name,
        })),
        current_date: new Date().toISOString(),
        week_start: currentWeekStart.toISOString(),
        week_end: addDays(currentWeekStart, 6).toISOString(),
        message,
      };

      const result = await sendToN8NWebhook(payload);

      if (result.success) {
        toast({
          title: "Solicitud enviada",
          description: "n8n está procesando tu solicitud. Recibirás una respuesta pronto.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo conectar con n8n",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in sendToN8N:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleAIAutoOrganize = () => {
    toast({
      title: "IA Organizando...",
      description: "Enviando agenda a n8n para optimización.",
    });
    sendToN8N("auto_organize", "Organizar automáticamente la agenda del doctor");
  };

  const handleAISuggestSlots = () => {
    toast({
      title: "Analizando disponibilidad",
      description: "Enviando solicitud a n8n para sugerir horarios.",
    });
    sendToN8N("suggest_slots", "Sugerir horarios óptimos para nuevas citas");
  };

  const handleAIReminders = () => {
    toast({
      title: "Configurando recordatorios",
      description: "Enviando solicitud a n8n para programar recordatorios.",
    });
    sendToN8N("send_reminders", "Enviar recordatorios automáticos a pacientes");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-emerald-500/90";
      case "completed": return "bg-sky-500/90";
      case "cancelled": return "bg-red-500/90";
      case "in_progress": return "bg-amber-500/90";
      default: return "bg-primary/90";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <Video className="w-3 h-3" />;
      case "completed": return <Phone className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-72 border-r border-border/50 flex flex-col bg-card/20">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">SmartScheduler</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Mini Calendar with dots */}
            <CalendarComponent
              mode="single"
              selected={miniCalendarDate}
              onSelect={(date) => {
                if (date) {
                  setMiniCalendarDate(date);
                  if (viewMode === "week") {
                    setCurrentWeekStart(startOfWeek(date, { locale: es }));
                  }
                }
              }}
              className="rounded-lg border-0 p-0"
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
                row: "flex w-full mt-1",
                cell: "relative h-8 w-8 text-center text-sm p-0 focus-within:relative focus-within:z-20",
                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md inline-flex items-center justify-center",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
              components={{
                DayContent: ({ date }) => {
                  const hasAppointment = datesWithAppointments.has(format(date, "yyyy-MM-dd"));
                  return (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span>{date.getDate()}</span>
                      {hasAppointment && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                }
              }}
            />

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Acciones Rápidas</p>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-9 text-sm hover:bg-primary/10"
                onClick={handleNewAppointment}
              >
                <Plus className="w-4 h-4 text-primary" />
                Nueva Cita
                <Badge className="ml-auto text-[9px] bg-secondary/20 text-secondary hover:bg-secondary/20 px-1.5">Nuevo</Badge>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm hover:bg-warning/10">
                <Lock className="w-4 h-4 text-warning" />
                Bloquear Fechas
              </Button>
            </div>

            <Separator />

            {/* Today's Stats */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                Visitas de Hoy
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary/5 rounded-lg p-2.5 text-center border border-primary/10">
                  <p className="text-xl font-bold text-primary">{todayAppointments.length}</p>
                  <p className="text-[9px] text-muted-foreground">Citas</p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-2.5 text-center border border-emerald-500/10">
                  <p className="text-xl font-bold text-emerald-500">
                    {todayAppointments.filter(a => a.status === "completed").length}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Completadas</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Services Filter */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                Servicios
              </p>
              {services.length > 0 ? (
                <div className="space-y-0.5">
                  {services.map(service => (
                    <label 
                      key={service.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    >
                      <Checkbox 
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id]);
                          } else {
                            setSelectedServices(selectedServices.filter(id => id !== service.id));
                          }
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate text-xs">{service.nombre_servicio}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground py-2 px-1">No hay servicios configurados</p>
              )}
            </div>

            <Separator />

            {/* AI Assistant */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-secondary" />
                IA Asistente
              </p>
              <div className="space-y-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-xs h-8 hover:bg-muted/50"
                  onClick={handleAIAutoOrganize}
                >
                  <Zap className="w-3.5 h-3.5 text-warning" />
                  Auto-organizar agenda
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-xs h-8 hover:bg-muted/50"
                  onClick={handleAISuggestSlots}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Sugerir horarios óptimos
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-xs h-8 hover:bg-muted/50"
                  onClick={handleAIReminders}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-info" />
                  Recordatorios automáticos
                </Button>
              </div>
            </div>

            <Separator />

            {/* WhatsApp Status */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-emerald-500" />
                WhatsApp
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`w-full justify-start gap-2 text-xs h-9 ${
                  whatsappConnected 
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600' 
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600'
                }`}
                onClick={() => navigate("/profile")}
              >
                {whatsappConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Sin conectar</span>
                    <Badge className="ml-auto text-[9px] bg-amber-500/20 text-amber-600 hover:bg-amber-500/20 px-1.5">Configurar</Badge>
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="h-10 px-4 flex items-center border-t border-border/50 text-[10px] text-muted-foreground">
          {appointments.length} citas totales
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border/50 px-5 flex items-center justify-between gap-4 bg-card/20">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
              Hoy
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <span className="font-medium">
              {viewMode === "week" 
                ? `${format(currentWeekStart, "d", { locale: es })} - ${format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: es })}`
                : format(miniCalendarDate, "EEEE d MMMM yyyy", { locale: es })
              }
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48 h-8 text-sm bg-muted/30 border-0"
              />
            </div>
            
            <div className="flex h-8 border rounded-md overflow-hidden">
              <Button 
                variant={viewMode === "week" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("week")}
                className="rounded-none h-full px-3 text-xs"
              >
                Semana
              </Button>
              <Button 
                variant={viewMode === "day" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("day")}
                className="rounded-none h-full px-3 text-xs"
              >
                Día
              </Button>
            </div>

            <NotificationBell />

            <Button onClick={handleNewAppointment} size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Nueva Cita
            </Button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-xs">Cargando agenda...</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {/* Week/Day Header */}
              <div className={`grid ${viewMode === "week" ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]"} border-b sticky top-0 z-10 bg-background`}>
                <div className="h-12" />
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx}
                    className={`h-12 flex flex-col items-center justify-center border-l border-border/30 ${
                      isToday(day) ? "bg-primary/5" : ""
                    }`}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={`text-lg font-semibold ${
                      isToday(day) 
                        ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm" 
                        : ""
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className={`grid ${viewMode === "week" ? "grid-cols-[60px_repeat(7,1fr)]" : "grid-cols-[60px_1fr]"}`}>
                {timeSlots.map((time, timeIdx) => (
                  <>
                    <div 
                      key={`time-${timeIdx}`}
                      className="h-12 pr-2 flex items-start justify-end text-[10px] text-muted-foreground"
                    >
                      {time}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const hour = 6 + timeIdx;
                      const slotAppointments = getAppointmentsForSlot(day, hour);
                      
                      return (
                        <div
                          key={`cell-${timeIdx}-${dayIdx}`}
                          className={`h-12 border-l border-t border-border/20 relative group cursor-pointer hover:bg-muted/10 transition-colors ${
                            isToday(day) ? "bg-primary/[0.02]" : ""
                          }`}
                          onClick={() => slotAppointments.length === 0 && handleDateSelect(day, hour)}
                        >
                          {slotAppointments.map(apt => (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAppointment(apt);
                              }}
                              className={`absolute inset-x-0.5 top-0.5 rounded px-1.5 py-1 text-white text-[10px] cursor-pointer shadow-sm hover:shadow-md transition-shadow ${getStatusColor(apt.status)}`}
                              style={{
                                height: `${Math.max((apt.duration_minutes / 60) * 48 - 4, 20)}px`,
                                minHeight: "20px"
                              }}
                            >
                              <div className="flex items-center gap-1 truncate">
                                {getStatusIcon(apt.status)}
                                <span className="font-medium truncate">
                                  {format(parseISO(apt.appointment_date), "HH:mm")} {apt.patients?.full_name || apt.title}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Hover indicator */}
                          {slotAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-3 h-3 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={selectedAppointment}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default SmartScheduler;
