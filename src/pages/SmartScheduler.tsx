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
      <aside className="w-72 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">SmartScheduler</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Mini Calendar */}
            <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
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
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-sm group hover:border-primary/50"
                onClick={handleNewAppointment}
              >
                <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span>Nueva Cita</span>
                <Badge variant="secondary" className="ml-auto text-xs">Nuevo</Badge>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2 text-sm group hover:border-warning/50">
                <Lock className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
                <span>Bloquear Fechas</span>
              </Button>
            </div>

            <Separator />

            {/* Today's Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Visitas de Hoy
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{todayAppointments.length}</p>
                  <p className="text-xs text-muted-foreground">Citas</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center border border-success/20">
                  <p className="text-2xl font-bold text-success">
                    {todayAppointments.filter(a => a.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Services Filter */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Servicios
              </h4>
              <div className="space-y-2">
                {services.length > 0 ? (
                  services.map(service => (
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
                      />
                      <span className="truncate">{service.nombre_servicio}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No hay servicios configurados</p>
                )}
              </div>
            </div>

            <Separator />

            {/* AI Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-secondary" />
                IA Asistente
              </h4>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8">
                  <Zap className="w-3 h-3 text-warning" />
                  Auto-organizar agenda
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Sugerir horarios óptimos
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8">
                  <MessageSquare className="w-3 h-3 text-info" />
                  Recordatorios automáticos
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{appointments.length} citas totales</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Esta semana
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek("prev")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="font-semibold text-lg">
                {format(currentWeekStart, "d", { locale: es })} - {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: es })}
              </h2>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-muted/30"
                />
              </div>
              
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button 
                  variant={viewMode === "week" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="rounded-none"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === "day" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("day")}
                  className="rounded-none"
                >
                  Día
                </Button>
              </div>

              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="w-4 h-4" />
              </Button>

              <Button onClick={handleNewAppointment} className="gap-2 shadow-lg shadow-primary/20">
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
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/20 sticky top-0 z-10">
                <div className="p-2" />
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 text-center border-l transition-colors ${
                      isToday(day) ? "bg-primary/10" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={`text-xl font-bold mt-1 ${
                      isToday(day) 
                        ? "w-9 h-9 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center" 
                        : ""
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {timeSlots.map((time, timeIdx) => (
                  <>
                    <div 
                      key={`time-${timeIdx}`}
                      className="p-2 text-right text-xs text-muted-foreground border-b h-20 flex items-start justify-end pr-3"
                    >
                      {time}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const hour = 8 + timeIdx;
                      const slotAppointments = getAppointmentsForSlot(day, hour);
                      
                      return (
                        <div
                          key={`cell-${timeIdx}-${dayIdx}`}
                          className={`border-l border-b h-20 p-1 cursor-pointer hover:bg-muted/30 transition-colors relative group ${
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
                              className={`absolute inset-x-1 rounded-md p-2 text-white text-xs cursor-pointer border-l-4 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] ${getStatusColor(apt.status)}`}
                              style={{
                                height: `${Math.max(apt.duration_minutes / 60 * 80, 40)}px`,
                                minHeight: "40px"
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {format(parseISO(apt.appointment_date), "HH:mm")} - {apt.patients?.full_name || apt.title}
                                  </p>
                                  {apt.location && (
                                    <p className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {apt.location}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-80">
                                  {getStatusIcon(apt.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add button on hover */}
                          {slotAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                <Plus className="w-3 h-3 text-primary" />
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
