import { useState } from 'react';
import { format, isToday, parseISO, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, 
  Printer, ChevronDown, ChevronUp, Calendar, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price?: number;
}

interface Professional {
  id: string;
  name: string;
}

interface ProfessionalDailyViewProps {
  appointments: Appointment[];
  professionals: Professional[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  onCheckout?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'scheduled': return 'secondary';
    case 'confirmed': return 'default';
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'scheduled': return 'Agendado';
    case 'confirmed': return 'Confirmado';
    case 'completed': return 'Concluído';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

export function ProfessionalDailyView({
  appointments,
  professionals,
  selectedDate,
  onDateChange,
  onEdit,
  onDelete,
  onCheckout,
  onPrint,
  canEdit,
  canDelete,
}: ProfessionalDailyViewProps) {
  const [expandedProfessional, setExpandedProfessional] = useState<string | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isTodaySelected = isToday(selectedDate);
  
  // Filter appointments for selected date
  const dayAppointments = appointments.filter(apt => apt.date === dateStr);

  // Get appointments per professional for selected date
  const getProfessionalAppointments = (professionalId: string) => {
    return dayAppointments
      .filter(apt => apt.professionals.includes(professionalId))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Get stats for a professional
  const getProfessionalStats = (professionalId: string) => {
    const profAppointments = getProfessionalAppointments(professionalId);
    const totalAppointments = profAppointments.length;
    const completed = profAppointments.filter(a => a.status === 'completed').length;
    const pending = profAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const cancelled = profAppointments.filter(a => a.status === 'cancelled').length;
    const totalRevenue = profAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.price || 0), 0);
    const occupiedMinutes = profAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.duration || 0), 0);
    
    const workDayMinutes = 600; // 10 hours
    const occupationPercentage = Math.min(Math.round((occupiedMinutes / workDayMinutes) * 100), 100);

    return {
      totalAppointments,
      completed,
      pending,
      cancelled,
      totalRevenue,
      occupiedMinutes,
      occupationPercentage,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const toggleProfessional = (id: string) => {
    setExpandedProfessional(expandedProfessional === id ? null : id);
  };

  const handlePreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="space-y-4">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold text-primary">
              Agenda do Dia - {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''} • {professionals.length} profissiona{professionals.length !== 1 ? 'is' : 'l'}
            </p>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay} title="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                {isTodaySelected ? 'Hoje' : format(selectedDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={handleNextDay} title="Próximo dia">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {!isTodaySelected && (
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Hoje
            </Button>
          )}
        </div>
      </div>

      {/* Professional Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((professional) => {
          const stats = getProfessionalStats(professional.id);
          const profAppointments = getProfessionalAppointments(professional.id);
          const isExpanded = expandedProfessional === professional.id;

          return (
            <Collapsible
              key={professional.id}
              open={isExpanded}
              onOpenChange={() => toggleProfessional(professional.id)}
            >
              <Card
                className={cn(
                  "transition-all duration-300",
                  isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : "",
                  stats.totalAppointments === 0 && "opacity-60"
                )}
              >
                {/* Card Header - Clickable */}
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {professional.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{professional.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalAppointments} agendamento{stats.totalAppointments !== 1 ? 's' : ''} hoje
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-primary">
                            {formatCurrency(stats.totalRevenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stats.occupationPercentage}% ocupado
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="mt-3 space-y-2">
                      <Progress value={stats.occupationPercentage} className="h-2" />
                      <div className="flex gap-2 flex-wrap">
                        {stats.pending > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.completed > 0 && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            {stats.completed} concluído{stats.completed !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.cancelled > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {stats.cancelled} cancelado{stats.cancelled !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.totalAppointments === 0 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sem agendamentos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content - Appointment Details */}
                <CollapsibleContent>
                  <Separator />
                  <div className="p-4">
                    {profAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum agendamento para hoje</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3">
                          {profAppointments.map((appointment) => (
                            <Card
                              key={appointment.id}
                              className={cn(
                                "p-4 border-l-4 transition-all hover:shadow-md",
                                appointment.status === 'completed' && "border-l-green-500 bg-green-50/50 dark:bg-green-900/10",
                                appointment.status === 'confirmed' && "border-l-primary bg-primary/5",
                                appointment.status === 'scheduled' && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
                                appointment.status === 'cancelled' && "border-l-destructive bg-destructive/5 opacity-60"
                              )}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                {/* Appointment Info */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between md:justify-start gap-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      <span className="font-bold text-lg">{appointment.time}</span>
                                    </div>
                                    <Badge variant={getStatusVariant(appointment.status)}>
                                      {getStatusLabel(appointment.status)}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{appointment.client}</span>
                                    </div>
                                    {appointment.clientPhone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{appointment.clientPhone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Scissors className="h-4 w-4 text-muted-foreground" />
                                      <span>{appointment.service}</span>
                                    </div>
                                    {appointment.duration && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatDuration(appointment.duration)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {appointment.price !== undefined && (
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                      <DollarSign className="h-4 w-4" />
                                      <span>{formatCurrency(appointment.price)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 md:flex-col">
                                  {onPrint && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onPrint(appointment);
                                      }}
                                      title="Imprimir"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onCheckout && (appointment.status === 'scheduled' || appointment.status === 'confirmed') && canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCheckout(appointment);
                                      }}
                                      title="Finalizar"
                                    >
                                      <DollarSign className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                  {onEdit && canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(appointment);
                                      }}
                                      title="Editar"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onDelete && canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(appointment.id);
                                      }}
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
