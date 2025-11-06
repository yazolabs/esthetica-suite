import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Professional {
  id: string;
  name: string;
}

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

interface CompactAppointmentListProps {
  appointments: Appointment[];
  professionals: Professional[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  onCheckout?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'Agendado';
    case 'confirmed':
      return 'Confirmado';
    case 'completed':
      return 'Concluído';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

export function CompactAppointmentList({
  appointments,
  professionals,
  onEdit,
  onDelete,
  onCheckout,
  onPrint,
  canEdit = false,
  canDelete = false,
}: CompactAppointmentListProps) {
  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Group appointments by date
  const groupedAppointments = sortedAppointments.reduce((groups, appointment) => {
    const date = appointment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const getProfessionalNames = (professionalIds: string[]) => {
    return professionalIds
      .map((id) => professionals.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="sticky top-0 bg-background z-10 pb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <Separator className="mt-2" />
          </div>

          {/* Appointments for this date */}
          <div className="space-y-2">
            {dayAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-3">
                <div className="space-y-2">
                  {/* Header with time and status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold text-base">{appointment.time}</span>
                      {appointment.duration && (
                        <span className="text-xs text-muted-foreground">
                          ({appointment.duration}min)
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getStatusColor(appointment.status))}
                    >
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>

                  {/* Client info */}
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{appointment.client}</p>
                      {appointment.clientPhone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{appointment.clientPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex items-start gap-2">
                    <Scissors className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{appointment.service}</p>
                  </div>

                  {/* Professionals */}
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {getProfessionalNames(appointment.professionals)}
                    </p>
                  </div>

                  {/* Price */}
                  {appointment.price !== undefined && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(appointment.price)}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {appointment.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 pt-2 border-t">
                    {onPrint && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(appointment)}
                        className="flex-1"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
                      onCheckout && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCheckout(appointment)}
                          className="flex-1 text-green-600 hover:text-green-700"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                    {canEdit && onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(appointment)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(appointment.id)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {sortedAppointments.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
        </Card>
      )}
    </div>
  );
}
