import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

interface Item {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
}

const mockItems: Item[] = [
  { id: '1', name: 'Shampoo Premium', category: 'Cabelo', stock: 25, unit: 'un' },
  { id: '2', name: 'Esmalte Vermelho', category: 'Unhas', stock: 15, unit: 'un' },
  { id: '3', name: 'Óleo de Massagem', category: 'Massagem', stock: 8, unit: 'L' },
  { id: '4', name: 'Cera Depilatória', category: 'Depilação', stock: 12, unit: 'kg' },
];

export default function Items() {
  const [items] = useState<Item[]>(mockItems);
  const { can } = usePermission();

  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'category',
      header: 'Categoria',
      render: (item: Item) => (
        <Badge variant="secondary">{item.category}</Badge>
      ),
    },
    {
      key: 'stock',
      header: 'Estoque',
      render: (item: Item) => {
        const isLow = item.stock < 10;
        return (
          <Badge variant={isLow ? 'destructive' : 'outline'}>
            {item.stock} {item.unit}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (item: Item) => (
        <div className="flex gap-2">
          {can('items', 'edit') && (
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('items', 'delete') && (
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
          <h1 className="text-3xl font-bold tracking-tight">Itens</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de produtos e materiais
          </p>
        </div>
        {can('items', 'create') && (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Buscar itens..."
      />
    </div>
  );
}
