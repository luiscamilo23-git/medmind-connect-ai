import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Lock
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`);

  // Get dates that have appointments for mini calendar dots
  const datesWithAppointments = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(apt => {
      const date = format(parseISO(apt.appointment_date), "yyyy-MM-dd");
      dates.add(date);
    });
    return dates;
  }, [appointments]);

  useEffect(() => {
    checkAuth();
    loadAppointments();

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

  // Custom day render for mini calendar with dots
  const modifiers = {
    hasAppointment: (date: Date) => datesWithAppointments.has(format(date, "yyyy-MM-dd"))
  };

  const modifiersStyles = {
    hasAppointment: {
      position: 'relative' as const
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Clean & Minimal */}
      <aside className="w-72 border-r border-border/50 flex flex-col bg-card/20">
        {/* Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">SmartScheduler</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Mini Calendar with dots for appointments */}
            <CalendarComponent
              mode="single"
              selected={miniCalendarDate}
              onSelect={(date) => {
                if (date) {
                  setMiniCalendarDate(date);
                  setCurrentWeekStart(startOfWeek(date, { locale: es }));
                }
              }}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-xl border-0 p-0"
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
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
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
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                }
              }}
            />

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">Acciones Rápidas</p>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-10 text-sm hover:bg-primary/10"
                onClick={handleNewAppointment}
              >
                <Plus className="w-4 h-4 text-primary" />
                Nueva Cita
                <Badge className="ml-auto text-[10px] bg-secondary/20 text-secondary hover:bg-secondary/20">Nuevo</Badge>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-sm hover:bg-warning/10">
                <Lock className="w-4 h-4 text-warning" />
                Bloquear Fechas
              </Button>
            </div>

            {/* Today's Stats */}
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5" />
                Visitas de Hoy
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
                  <p className="text-2xl font-bold text-primary">{todayAppointments.length}</p>
                  <p className="text-[10px] text-muted-foreground">Citas</p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-3 text-center border border-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-500">
                    {todayAppointments.filter(a => a.status === "completed").length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Completadas</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="h-12 px-4 flex items-center justify-between border-t border-border/50 text-xs text-muted-foreground">
          <span>{appointments.length} citas totales</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Clean */}
        <header className="h-16 border-b border-border/50 px-6 flex items-center justify-between gap-4 bg-card/20">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToToday} className="h-9 text-sm">
              Esta semana
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateWeek("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateWeek("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <span className="font-medium text-lg">
              {format(currentWeekStart, "d", { locale: es })} - {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: es })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 h-9 bg-muted/30 border-0"
              />
            </div>
            
            <div className="flex h-9 border rounded-lg overflow-hidden">
              <Button 
                variant={viewMode === "week" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("week")}
                className="rounded-none h-full px-4 text-sm"
              >
                Semana
              </Button>
              <Button 
                variant={viewMode === "day" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("day")}
                className="rounded-none h-full px-4 text-sm"
              >
                Día
              </Button>
            </div>

            <NotificationBell />

            <Button onClick={handleNewAppointment} size="sm" className="h-9 gap-2">
              <Plus className="w-4 h-4" />
              Nueva Cita
            </Button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Cargando agenda...</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {/* Week Header */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b sticky top-0 z-10 bg-background">
                <div className="h-16" />
                {weekDays.map((day, idx) => (
                  <div 
                    key={idx}
                    className={`h-16 flex flex-col items-center justify-center border-l border-border/30 ${
                      isToday(day) ? "bg-primary/5" : ""
                    }`}
                  >
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={`text-xl font-semibold mt-0.5 ${
                      isToday(day) 
                        ? "w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center" 
                        : ""
                    }`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)]">
                {timeSlots.map((time, timeIdx) => (
                  <>
                    <div 
                      key={`time-${timeIdx}`}
                      className="h-16 pr-3 flex items-start justify-end pt-0 text-xs text-muted-foreground"
                    >
                      {time}
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const hour = 8 + timeIdx;
                      const slotAppointments = getAppointmentsForSlot(day, hour);
                      
                      return (
                        <div
                          key={`cell-${timeIdx}-${dayIdx}`}
                          className={`h-16 border-l border-t border-border/20 relative group cursor-pointer hover:bg-muted/10 transition-colors ${
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
                              className={`absolute inset-x-1 top-1 rounded-md px-2 py-1.5 text-white text-xs cursor-pointer shadow-sm hover:shadow-md transition-shadow ${getStatusColor(apt.status)}`}
                              style={{
                                height: `${Math.max((apt.duration_minutes / 60) * 64 - 8, 28)}px`,
                                minHeight: "28px"
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate">
                                  {format(parseISO(apt.appointment_date), "HH:mm")} {apt.patients?.full_name || apt.title}
                                </span>
                                {getStatusIcon(apt.status)}
                              </div>
                              {apt.location && apt.duration_minutes >= 30 && (
                                <p className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  {apt.location}
                                </p>
                              )}
                            </div>
                          ))}
                          
                          {/* Hover indicator */}
                          {slotAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-4 h-4 text-muted-foreground/50" />
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
