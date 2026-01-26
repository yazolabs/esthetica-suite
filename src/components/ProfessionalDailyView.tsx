import { useState } from 'react';
import { format, isToday, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, 
  Printer, ChevronDown, ChevronUp, Calendar, Users, ChevronLeft, ChevronRight,
  GripVertical, AlertCircle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
  onQuickStatusChange?: (appointmentId: string, newStatus: Appointment['status']) => void;
  onQuickTimeChange?: (appointmentId: string, newTime: string, onConflict: (availableSlots: string[]) => void) => void;
  onReassignProfessional?: (appointmentId: string, newProfessionalId: string, onConflict: () => void) => void;
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

const statusOptions: Appointment['status'][] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

// Generate time slots (every 30 minutes from 08:00 to 18:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  return slots;
};

const allTimeSlots = generateTimeSlots();

export function ProfessionalDailyView({
  appointments,
  professionals,
  selectedDate,
  onDateChange,
  onEdit,
  onDelete,
  onCheckout,
  onPrint,
  onQuickStatusChange,
  onQuickTimeChange,
  onReassignProfessional,
  canEdit,
  canDelete,
}: ProfessionalDailyViewProps) {
  const [expandedProfessionals, setExpandedProfessionals] = useState<Set<string>>(new Set());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragOverProfessional, setDragOverProfessional] = useState<string | null>(null);
  
  // Time conflict dialog state
  const [timeConflictDialog, setTimeConflictDialog] = useState<{
    open: boolean;
    appointmentId: string;
    availableSlots: string[];
  }>({ open: false, appointmentId: '', availableSlots: [] });
  
  // Professional conflict dialog state with available slots
  const [professionalConflictDialog, setProfessionalConflictDialog] = useState<{
    open: boolean;
    appointmentId: string;
    targetProfessionalId: string;
    targetProfessionalName: string;
    availableSlots: string[];
  }>({ open: false, appointmentId: '', targetProfessionalId: '', targetProfessionalName: '', availableSlots: [] });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isTodaySelected = isToday(selectedDate);
  
  const dayAppointments = appointments.filter(apt => apt.date === dateStr);

  const getProfessionalAppointments = (professionalId: string) => {
    return dayAppointments
      .filter(apt => apt.professionals.includes(professionalId))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

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
    
    const workDayMinutes = 600;
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
    setExpandedProfessionals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    if (!canEdit || !onReassignProfessional) return;
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment.id);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverProfessional(null);
  };

  const handleDragOver = (e: React.DragEvent, professionalId: string) => {
    if (!draggedAppointment || !canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverProfessional(professionalId);
  };

  const handleDragLeave = () => {
    setDragOverProfessional(null);
  };

  // Get available time slots for a professional on the selected date
  const getAvailableSlotsForProfessional = (professionalId: string, excludeAppointmentId?: string): string[] => {
    const profAppointments = dayAppointments.filter(
      apt => apt.professionals.includes(professionalId) && 
             apt.id !== excludeAppointmentId &&
             apt.status !== 'cancelled'
    );

    return allTimeSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = hours * 60 + minutes;
      const slotEnd = slotStart + (draggedAppointment?.duration || 30);

      return profAppointments.every(apt => {
        const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
        const aptStart = aptHours * 60 + aptMinutes;
        const aptEnd = aptStart + (apt.duration || 30);

        return slotEnd <= aptStart || slotStart >= aptEnd;
      });
    });
  };

  const handleDrop = (e: React.DragEvent, targetProfessionalId: string) => {
    e.preventDefault();
    setDragOverProfessional(null);
    
    if (!draggedAppointment || !onReassignProfessional) return;
    
    // Don't do anything if dropping on the same professional
    if (draggedAppointment.professionals.includes(targetProfessionalId)) {
      setDraggedAppointment(null);
      return;
    }

    const targetProfName = professionals.find(p => p.id === targetProfessionalId)?.name || '';
    const availableSlots = getAvailableSlotsForProfessional(targetProfessionalId, draggedAppointment.id);
    
    onReassignProfessional(
      draggedAppointment.id,
      targetProfessionalId,
      () => {
        // Conflict callback - show dialog with available slots
        setProfessionalConflictDialog({
          open: true,
          appointmentId: draggedAppointment.id,
          targetProfessionalId,
          targetProfessionalName: targetProfName,
          availableSlots,
        });
      }
    );
    
    setDraggedAppointment(null);
  };

  // Handle selecting a new time when there's a professional reassignment conflict
  const handleProfessionalConflictTimeSelect = (newTime: string) => {
    if (!onQuickTimeChange) return;

    // First update the time
    onQuickTimeChange(
      professionalConflictDialog.appointmentId,
      newTime,
      () => {} // Should not have conflict since we're selecting from available slots
    );
    
    // Then reassign to the new professional
    if (onReassignProfessional) {
      // Small delay to allow time update to complete
      setTimeout(() => {
        onReassignProfessional(
          professionalConflictDialog.appointmentId,
          professionalConflictDialog.targetProfessionalId,
          () => {} // Should not conflict now
        );
      }, 100);
    }
    
    setProfessionalConflictDialog({ 
      open: false, 
      appointmentId: '', 
      targetProfessionalId: '',
      targetProfessionalName: '', 
      availableSlots: [] 
    });
  };

  // Quick time change with conflict handling
  const handleTimeSelect = (appointmentId: string, newTime: string) => {
    if (!onQuickTimeChange) return;
    
    onQuickTimeChange(
      appointmentId,
      newTime,
      (availableSlots) => {
        setTimeConflictDialog({
          open: true,
          appointmentId,
          availableSlots,
        });
      }
    );
  };

  const handleConflictTimeSelect = (newTime: string) => {
    if (!onQuickTimeChange) return;
    
    onQuickTimeChange(
      timeConflictDialog.appointmentId,
      newTime,
      () => {} // Should not have conflict since we're selecting from available slots
    );
    setTimeConflictDialog({ open: false, appointmentId: '', availableSlots: [] });
  };

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
              {onReassignProfessional && canEdit && (
                <span className="ml-2 text-xs text-primary">• Arraste para realocar</span>
              )}
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
          const isExpanded = expandedProfessionals.has(professional.id);
          const isDragOver = dragOverProfessional === professional.id;

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
                  stats.totalAppointments === 0 && "opacity-60",
                  isDragOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
                )}
                onDragOver={(e) => handleDragOver(e, professional.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, professional.id)}
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
                              draggable={canEdit && !!onReassignProfessional}
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                "p-4 border-l-4 transition-all hover:shadow-md",
                                canEdit && onReassignProfessional && "cursor-grab active:cursor-grabbing",
                                appointment.status === 'completed' && "border-l-green-500 bg-green-50/50 dark:bg-green-900/10",
                                appointment.status === 'confirmed' && "border-l-primary bg-primary/5",
                                appointment.status === 'scheduled' && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
                                appointment.status === 'cancelled' && "border-l-destructive bg-destructive/5 opacity-60"
                              )}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                {/* Drag Handle & Appointment Info */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between md:justify-start gap-3">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                                        #{appointment.id}
                                      </Badge>
                                      {canEdit && onReassignProfessional && (
                                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                      )}
                                      
                                      {/* Quick Time Edit */}
                                      {onQuickTimeChange && canEdit ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-auto p-1 hover:bg-primary/10"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Clock className="h-4 w-4 text-primary mr-1" />
                                              <span className="font-bold text-lg">{appointment.time}</span>
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-48 p-2" align="start">
                                            <p className="text-xs text-muted-foreground mb-2">Alterar horário:</p>
                                            <ScrollArea className="h-48">
                                              <div className="space-y-1">
                                                {allTimeSlots.map((slot) => (
                                                  <Button
                                                    key={slot}
                                                    variant={slot === appointment.time ? "secondary" : "ghost"}
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (slot !== appointment.time) {
                                                        handleTimeSelect(appointment.id, slot);
                                                      }
                                                    }}
                                                  >
                                                    {slot}
                                                  </Button>
                                                ))}
                                              </div>
                                            </ScrollArea>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <span className="font-bold text-lg">{appointment.time}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Quick Status Edit */}
                                    {onQuickStatusChange && canEdit ? (
                                      <Select
                                        value={appointment.status}
                                        onValueChange={(value) => {
                                          onQuickStatusChange(appointment.id, value as Appointment['status']);
                                        }}
                                      >
                                        <SelectTrigger 
                                          className="w-auto h-auto border-0 p-0 focus:ring-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Badge variant={getStatusVariant(appointment.status)} className="cursor-pointer">
                                            {getStatusLabel(appointment.status)}
                                          </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {statusOptions.map((status) => (
                                            <SelectItem key={status} value={status}>
                                              <Badge variant={getStatusVariant(status)}>
                                                {getStatusLabel(status)}
                                              </Badge>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge variant={getStatusVariant(appointment.status)}>
                                        {getStatusLabel(appointment.status)}
                                      </Badge>
                                    )}
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

      {/* Time Conflict Dialog */}
      <Dialog 
        open={timeConflictDialog.open} 
        onOpenChange={(open) => !open && setTimeConflictDialog({ open: false, appointmentId: '', availableSlots: [] })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Horário Ocupado
            </DialogTitle>
            <DialogDescription>
              O horário selecionado está ocupado. Escolha um dos horários disponíveis abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {timeConflictDialog.availableSlots.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {timeConflictDialog.availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant="outline"
                      size="sm"
                      onClick={() => handleConflictTimeSelect(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum horário disponível para este dia.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setTimeConflictDialog({ open: false, appointmentId: '', availableSlots: [] })}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional Conflict Dialog */}
      <Dialog 
        open={professionalConflictDialog.open} 
        onOpenChange={(open) => !open && setProfessionalConflictDialog({ 
          open: false, 
          appointmentId: '', 
          targetProfessionalId: '',
          targetProfessionalName: '', 
          availableSlots: [] 
        })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Conflito de Horário
            </DialogTitle>
            <DialogDescription>
              {professionalConflictDialog.targetProfessionalName} já possui um agendamento neste horário. 
              Escolha um horário disponível para mover o agendamento:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {professionalConflictDialog.availableSlots.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {professionalConflictDialog.availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant="outline"
                      size="sm"
                      onClick={() => handleProfessionalConflictTimeSelect(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum horário disponível para este profissional hoje.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setProfessionalConflictDialog({ 
                open: false, 
                appointmentId: '', 
                targetProfessionalId: '',
                targetProfessionalName: '', 
                availableSlots: [] 
              })}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
