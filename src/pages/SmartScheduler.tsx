import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  ArrowLeft, 
  Plus, 
  Clock, 
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarClock,
  Users,
  MapPin,
  Video,
  Phone,
  Sparkles,
  Brain,
  Zap,
  Bell,
  Settings,
  Filter,
  LayoutGrid,
  List,
  Lock,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentDialog } from "@/components/AppointmentDialog";
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
  checked: boolean;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

  useEffect(() => {
    checkAuth();
    loadAppointments();
    loadServices();

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
        setServices(data.map(s => ({ ...s, checked: true })));
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
    setCurrentWeekStart(prev => addDays(prev, direction === "next" ? 7 : -7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { locale: es }));
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

  const filteredAppointments = searchQuery
    ? appointments.filter(apt => 
        apt.patients?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appointments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/90 border-success";
      case "completed": return "bg-info/90 border-info";
      case "cancelled": return "bg-destructive/90 border-destructive";
      case "in_progress": return "bg-warning/90 border-warning";
      default: return "bg-primary/90 border-primary";
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
      <aside className="w-80 border-r bg-card/30 backdrop-blur-sm flex flex-col">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">SmartScheduler</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-8">
            {/* Mini Calendar */}
            <div className="bg-muted/20 rounded-2xl p-4 border border-border/30">
              <CalendarComponent
                mode="single"
                selected={miniCalendarDate}
                onSelect={(date) => {
                  if (date) {
                    setMiniCalendarDate(date);
                    setCurrentWeekStart(startOfWeek(date, { locale: es }));
                  }
                }}
                className="rounded-md"
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Acciones Rápidas</h4>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 text-sm group hover:border-primary/50 h-12"
                onClick={handleNewAppointment}
              >
                <Plus className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span>Nueva Cita</span>
                <Badge variant="secondary" className="ml-auto text-xs">Nuevo</Badge>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-3 text-sm group hover:border-warning/50 h-12">
                <Lock className="w-5 h-5 text-warning group-hover:scale-110 transition-transform" />
                <span>Bloquear Fechas</span>
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Today's Stats */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Visitas de Hoy
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Citas</p>
                </div>
                <div className="bg-success/10 rounded-xl p-4 text-center border border-success/20">
                  <p className="text-3xl font-bold text-success">
                    {todayAppointments.filter(a => a.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Completadas</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Services Filter */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Servicios
              </h4>
              <div className="space-y-1">
                {services.length > 0 ? (
                  services.map(service => (
                    <label 
                      key={service.id}
                      className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
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
                      />
                      <span className="truncate">{service.nombre_servicio}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-3 text-center bg-muted/20 rounded-lg">No hay servicios configurados</p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* AI Features */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-secondary" />
                IA Asistente
              </h4>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-sm h-11 hover:bg-muted/50">
                  <Zap className="w-4 h-4 text-warning" />
                  Auto-organizar agenda
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-sm h-11 hover:bg-muted/50">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Sugerir horarios óptimos
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-sm h-11 hover:bg-muted/50">
                  <MessageSquare className="w-4 h-4 text-info" />
                  Recordatorios automáticos
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-5 border-t bg-muted/10">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{appointments.length} citas totales</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b bg-card/30 backdrop-blur-sm px-8 py-5">
          <div className="flex items-center justify-between gap-6">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="default" onClick={goToToday} className="h-10">
                Esta semana
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigateWeek("prev")}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigateWeek("next")}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <h2 className="font-semibold text-xl ml-2">
                {format(currentWeekStart, "d", { locale: es })} - {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: es })}
              </h2>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-72 bg-muted/20 h-10"
                />
              </div>
              
              <div className="flex items-center border rounded-xl overflow-hidden">
                <Button 
                  variant={viewMode === "week" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="rounded-none h-10 px-5"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === "day" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("day")}
                  className="rounded-none h-10 px-5"
                >
                  Día
                </Button>
              </div>

              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Bell className="w-5 h-5" />
              </Button>

              <Button onClick={handleNewAppointment} className="gap-2 shadow-lg shadow-primary/20 h-10 px-5">
                <Plus className="w-4 h-4" />
                Nueva Cita
              </Button>
            </div>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Cargando agenda...</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {/* Week Header */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-muted/10 sticky top-0 z-10">
                <div className="p-4" />
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx}
                    className={`py-5 px-4 text-center border-l transition-colors ${
                      isToday(day) ? "bg-primary/10" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={`text-2xl font-bold mt-2 ${
                      isToday(day) 
                        ? "w-11 h-11 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center" 
                        : ""
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                {timeSlots.map((time, timeIdx) => (
                  <>
                    <div 
                      key={`time-${timeIdx}`}
                      className="p-3 text-right text-sm text-muted-foreground border-b h-24 flex items-start justify-end pr-4 font-medium"
                    >
                      {time}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const hour = 8 + timeIdx;
                      const slotAppointments = getAppointmentsForSlot(day, hour);
                      
                      return (
                        <div
                          key={`cell-${timeIdx}-${dayIdx}`}
                          className={`border-l border-b h-24 p-2 cursor-pointer hover:bg-muted/20 transition-colors relative group ${
                            isToday(day) ? "bg-primary/5" : ""
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
                              className={`absolute inset-x-2 rounded-lg p-3 text-white text-sm cursor-pointer border-l-4 shadow-md hover:shadow-xl transition-all hover:scale-[1.02] ${getStatusColor(apt.status)}`}
                              style={{
                                height: `${Math.max(apt.duration_minutes / 60 * 96, 48)}px`,
                                minHeight: "48px"
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">
                                    {format(parseISO(apt.appointment_date), "HH:mm")} - {apt.patients?.full_name || apt.title}
                                  </p>
                                  {apt.location && (
                                    <p className="text-xs opacity-80 flex items-center gap-1.5 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {apt.location}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-90">
                                  {getStatusIcon(apt.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add button on hover */}
                          {slotAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary/40">
                                <Plus className="w-4 h-4 text-primary" />
                              </div>
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
