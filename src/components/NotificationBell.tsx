import { useState, useEffect } from "react";
import { Bell, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Reminder {
  id: string;
  text: string;
  createdAt: string;
  analysisId: string;
}

interface UpcomingAppointment {
  id: string;
  title: string;
  appointment_date: string;
  patients?: {
    full_name: string;
  };
}

export const NotificationBell = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadReminders();
    loadUpcomingAppointments();

    // Subscribe to appointment changes
    const channel = supabase
      .channel("notification-appointments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          loadUpcomingAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notes_analysis')
        .select('id, reminders, created_at')
        .eq('doctor_id', user.id)
        .not('reminders', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const allReminders: Reminder[] = [];
      data?.forEach(analysis => {
        if (analysis.reminders && Array.isArray(analysis.reminders)) {
          analysis.reminders.forEach((reminder: string) => {
            allReminders.push({
              id: `${analysis.id}-${reminder}`,
              text: reminder,
              createdAt: analysis.created_at,
              analysisId: analysis.id
            });
          });
        }
      });

      setReminders(allReminders.slice(0, 5));
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const tomorrowEnd = new Date(now);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, appointment_date, patients(full_name)')
        .eq('doctor_id', user.id)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', tomorrowEnd.toISOString())
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingAppointments(data || []);
      
      // Update total count
      const todayCount = (data || []).filter(apt => isToday(parseISO(apt.appointment_date))).length;
      setUnreadCount(todayCount + reminders.length);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  useEffect(() => {
    const todayCount = upcomingAppointments.filter(apt => isToday(parseISO(apt.appointment_date))).length;
    setUnreadCount(todayCount + reminders.length);
  }, [upcomingAppointments, reminders]);

  const handleReminderClick = () => {
    navigate('/smart-notes');
  };

  const handleAppointmentClick = () => {
    navigate('/scheduler');
  };

  const formatAppointmentTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return `Hoy ${format(date, "HH:mm")}`;
    } else if (isTomorrow(date)) {
      return `Mañana ${format(date, "HH:mm")}`;
    }
    return format(date, "d MMM HH:mm", { locale: es });
  };

  const todayAppointments = upcomingAppointments.filter(apt => isToday(parseISO(apt.appointment_date)));
  const tomorrowAppointments = upcomingAppointments.filter(apt => isTomorrow(parseISO(apt.appointment_date)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-medium bg-destructive text-destructive-foreground rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {/* Today's Appointments */}
          {todayAppointments.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Citas de Hoy
              </p>
              <div className="space-y-2">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={handleAppointmentClick}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {apt.patients?.full_name || apt.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatAppointmentTime(apt.appointment_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Appointments */}
          {tomorrowAppointments.length > 0 && (
            <>
              {todayAppointments.length > 0 && <Separator />}
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Citas de Mañana
                </p>
                <div className="space-y-2">
                  {tomorrowAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={handleAppointmentClick}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {apt.patients?.full_name || apt.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAppointmentTime(apt.appointment_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Reminders */}
          {reminders.length > 0 && (
            <>
              {(todayAppointments.length > 0 || tomorrowAppointments.length > 0) && <Separator />}
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  Recordatorios
                </p>
                <div className="space-y-2">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      onClick={handleReminderClick}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug line-clamp-2">
                          {reminder.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(reminder.createdAt), "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {todayAppointments.length === 0 && tomorrowAppointments.length === 0 && reminders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          )}
        </ScrollArea>

        {(reminders.length > 0 || upcomingAppointments.length > 0) && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full text-xs h-8"
              onClick={handleAppointmentClick}
            >
              Ver agenda completa
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
