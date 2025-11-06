import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OpenWindow {
  id: string;
  date_start: string;
  date_end: string;
  status: 'open' | 'closed';
}

interface Professional {
  id: string;
  name: string;
  openWindows?: OpenWindow[];
  color?: string;
}

interface Appointment {
  id: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface MonthlyAvailabilityCalendarProps {
  professionals: Professional[];
  appointments: Appointment[];
  onDayClick?: (date: Date) => void;
}

const professionalColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
];

export function MonthlyAvailabilityCalendar({ professionals, appointments, onDayClick }: MonthlyAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const professionalsWithColors = professionals.map((prof, idx) => ({
    ...prof,
    colorScheme: professionalColors[idx % professionalColors.length],
  }));

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availableProfessionals: typeof professionalsWithColors = [];
    const busyProfessionals: typeof professionalsWithColors = [];

    professionalsWithColors.forEach(professional => {
      // Check if date is in open windows
      const hasOpenWindow = professional.openWindows?.some(window => {
        if (window.status !== 'open') return false;
        return dateStr >= window.date_start && dateStr <= window.date_end;
      });

      if (!hasOpenWindow && professional.openWindows && professional.openWindows.length > 0) {
        return; // Professional not available on this date
      }

      // Check if professional has appointments (busy)
      const hasAppointments = appointments.some(apt => 
        apt.date === dateStr && 
        apt.professionals.includes(professional.id) &&
        apt.status !== 'cancelled'
      );

      if (hasAppointments) {
        busyProfessionals.push(professional);
      } else if (hasOpenWindow || !professional.openWindows || professional.openWindows.length === 0) {
        availableProfessionals.push(professional);
      }
    });

    return { availableProfessionals, busyProfessionals };
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-3">
            {professionalsWithColors.map((prof) => (
              <div key={prof.id} className="flex items-center gap-2">
                <div className={cn('w-4 h-4 rounded border-2', prof.colorScheme.bg, prof.colorScheme.border)} />
                <span className="text-sm">{prof.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 opacity-100" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 opacity-40" />
              <span>Ocupado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          const { availableProfessionals, busyProfessionals } = getDayAvailability(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => isCurrentMonth && onDayClick?.(day)}
              className={cn(
                'min-h-[80px] border rounded-lg p-1 relative transition-all',
                !isCurrentMonth && 'bg-muted/30',
                isTodayDate && 'ring-2 ring-primary',
                isCurrentMonth && onDayClick && 'cursor-pointer hover:bg-accent hover:shadow-md'
              )}
            >
              <div className={cn(
                'text-xs font-medium mb-1',
                !isCurrentMonth && 'text-muted-foreground',
                isTodayDate && 'text-primary font-bold'
              )}>
                {format(day, 'd')}
              </div>

              {/* Available professionals indicators */}
              <div className="flex flex-wrap gap-0.5">
                {availableProfessionals.map((prof) => (
                  <div
                    key={`available-${prof.id}`}
                    className={cn(
                      'w-2 h-2 rounded-full',
                      prof.colorScheme.bg,
                      'border',
                      prof.colorScheme.border
                    )}
                    title={`${prof.name} - Disponível`}
                  />
                ))}
                {busyProfessionals.map((prof) => (
                  <div
                    key={`busy-${prof.id}`}
                    className={cn(
                      'w-2 h-2 rounded-full opacity-40',
                      prof.colorScheme.bg,
                      'border',
                      prof.colorScheme.border
                    )}
                    title={`${prof.name} - Ocupado`}
                  />
                ))}
              </div>

              {/* Appointment count */}
              {(availableProfessionals.length > 0 || busyProfessionals.length > 0) && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {busyProfessionals.length > 0 && `${busyProfessionals.length} ocupado`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
