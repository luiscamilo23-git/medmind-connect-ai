import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Reminder {
  id: string;
  text: string;
  createdAt: string;
  analysisId: string;
}

export const NotificationBell = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadReminders();
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
        .limit(20);

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

      setReminders(allReminders);
      setUnreadCount(allReminders.length);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleReminderClick = () => {
    navigate('/smart-notes');
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Recordatorios</h3>
          <Badge variant="secondary">{unreadCount}</Badge>
        </div>
        <ScrollArea className="h-[400px]">
          {reminders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay recordatorios</p>
              <p className="text-xs mt-1">Los recordatorios de tus notas aparecerán aquí</p>
            </div>
          ) : (
            <div className="p-2">
              {reminders.map((reminder) => (
                <Card 
                  key={reminder.id}
                  className="mb-2 cursor-pointer hover:bg-accent transition-colors"
                  onClick={handleReminderClick}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start gap-2">
                      <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-normal leading-relaxed">
                          {reminder.text}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(reminder.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        {reminders.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleReminderClick}
            >
              Ver todas las notas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
