import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: string;
}

const mockServices: Service[] = [
  { id: '1', name: 'Corte Feminino', category: 'Cabelo', duration: 60, price: 'R$ 80,00' },
  { id: '2', name: 'Corte Masculino', category: 'Cabelo', duration: 30, price: 'R$ 40,00' },
  { id: '3', name: 'Manicure', category: 'Unhas', duration: 45, price: 'R$ 35,00' },
  { id: '4', name: 'Massagem Relaxante', category: 'Massagem', duration: 90, price: 'R$ 120,00' },
];

export default function Services() {
  const [services] = useState<Service[]>(mockServices);
  const { can } = usePermission();

  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'category',
      header: 'Categoria',
      render: (service: Service) => (
        <Badge variant="secondary">{service.category}</Badge>
      ),
    },
    {
      key: 'duration',
      header: 'Duração',
      render: (service: Service) => `${service.duration} min`,
    },
    { key: 'price', header: 'Preço' },
    {
      key: 'actions',
      header: 'Ações',
      render: (service: Service) => (
        <div className="flex gap-2">
          {can('services', 'edit') && (
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('services', 'delete') && (
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
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pelo salão
          </p>
        </div>
        {can('services', 'create') && (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        )}
      </div>

      <DataTable
        data={services}
        columns={columns}
        searchPlaceholder="Buscar serviços..."
      />
    </div>
  );
}
