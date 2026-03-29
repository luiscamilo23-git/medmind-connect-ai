import { Calendar, dateFnsLocalizer, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Activity } from "lucide-react";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  patients?: {
    full_name: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectEvent: (appointment: Appointment) => void;
  onSelectSlot: (date: Date) => void;
  loading: boolean;
}

export const AppointmentCalendar = ({
  appointments,
  onSelectEvent,
  onSelectSlot,
  loading,
}: AppointmentCalendarProps) => {
  const events: CalendarEvent[] = appointments.map((apt) => {
    const start = new Date(apt.appointment_date);
    const end = new Date(start.getTime() + apt.duration_minutes * 60000);

    return {
      id: apt.id,
      title: apt.patients?.full_name || apt.title,
      start,
      end,
      resource: apt,
    };
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent(event.resource);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    onSelectSlot(slotInfo.start);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "hsl(210, 70%, 50%)"; // primary

    switch (status) {
      case "confirmed":
        backgroundColor = "hsl(211, 63%, 45%)"; // primary (blue)
        break;
      case "completed":
        backgroundColor = "hsl(199, 89%, 48%)"; // info (blue)
        break;
      case "cancelled":
        backgroundColor = "hsl(0, 84%, 60%)"; // destructive (red)
        break;
      case "scheduled":
      default:
        backgroundColor = "hsl(210, 70%, 50%)"; // primary
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "0.85rem",
      },
    };
  };

  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay citas en este rango",
    showMore: (total: number) => `+ Ver más (${total})`,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="appointment-calendar h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={messages}
        culture="es"
        defaultView="month"
        views={["month", "week", "day", "agenda"]}
        step={30}
        showMultiDayTimes
        popup
      />
    </div>
  );
};
