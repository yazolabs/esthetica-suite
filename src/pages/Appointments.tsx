import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { AppointmentCheckoutDialog } from '@/components/AppointmentCheckoutDialog';

interface Appointment {
  id: string;
  client: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

const mockAppointments: Appointment[] = [
  { id: '1', client: 'Ana Silva', service: 'Corte Feminino', professional: 'Maria Santos', date: '2025-10-15', time: '14:00', status: 'scheduled' },
  { id: '2', client: 'Carlos Souza', service: 'Corte Masculino', professional: 'João Pedro', date: '2025-10-15', time: '15:00', status: 'confirmed' },
  { id: '3', client: 'Beatriz Lima', service: 'Manicure', professional: 'Paula Costa', date: '2025-10-15', time: '16:00', status: 'completed' },
  { id: '4', client: 'Diego Alves', service: 'Massagem', professional: 'Rita Moura', date: '2025-10-16', time: '10:00', status: 'cancelled' },
];

export default function Appointments() {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [checkoutAppointment, setCheckoutAppointment] = useState<Appointment | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const { can } = usePermission();

  const handleCheckout = (appointment: Appointment) => {
    setCheckoutAppointment(appointment);
    setCheckoutDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
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

  const columns = [
    { key: 'client', header: 'Cliente' },
    { key: 'service', header: 'Serviço' },
    { key: 'professional', header: 'Profissional' },
    {
      key: 'date',
      header: 'Data',
      render: (appointment: Appointment) => {
        const date = new Date(appointment.date);
        return date.toLocaleDateString('pt-BR');
      },
    },
    { key: 'time', header: 'Horário' },
    {
      key: 'status',
      header: 'Status',
      render: (appointment: Appointment) => (
        <Badge variant={getStatusVariant(appointment.status)}>
          {getStatusLabel(appointment.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (appointment: Appointment) => (
        <div className="flex gap-2">
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
            can('appointments', 'edit') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCheckout(appointment)}
                title="Finalizar Atendimento"
              >
                <DollarSign className="h-4 w-4 text-success" />
              </Button>
            )}
          {can('appointments', 'edit') && (
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('appointments', 'delete') && (
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos do salão
          </p>
        </div>
        {can('appointments', 'create') && (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        )}
      </div>

      <DataTable
        data={appointments}
        columns={columns}
        searchPlaceholder="Buscar agendamentos..."
      />

      <AppointmentCheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        appointment={checkoutAppointment}
      />
    </div>
  );
}
