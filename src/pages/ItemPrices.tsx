import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

interface ItemPrice {
  id: string;
  itemName: string;
  currentPrice: string;
  lastUpdate: string;
  updatedBy: string;
}

const mockItemPrices: ItemPrice[] = [
  { id: '1', itemName: 'Shampoo Premium', currentPrice: 'R$ 45,00', lastUpdate: '2025-10-01', updatedBy: 'Admin' },
  { id: '2', itemName: 'Esmalte Vermelho', currentPrice: 'R$ 12,00', lastUpdate: '2025-09-15', updatedBy: 'Manager' },
  { id: '3', itemName: 'Óleo de Massagem', currentPrice: 'R$ 85,00', lastUpdate: '2025-09-20', updatedBy: 'Admin' },
  { id: '4', itemName: 'Cera Depilatória', currentPrice: 'R$ 120,00', lastUpdate: '2025-08-30', updatedBy: 'Manager' },
];

export default function ItemPrices() {
  const [itemPrices] = useState<ItemPrice[]>(mockItemPrices);
  const { can } = usePermission();

  const columns = [
    { key: 'itemName', header: 'Item' },
    { key: 'currentPrice', header: 'Preço Atual' },
    {
      key: 'lastUpdate',
      header: 'Última Atualização',
      render: (price: ItemPrice) => {
        const date = new Date(price.lastUpdate);
        return date.toLocaleDateString('pt-BR');
      },
    },
    { key: 'updatedBy', header: 'Atualizado Por' },
    {
      key: 'actions',
      header: 'Ações',
      render: (price: ItemPrice) => (
        <div className="flex gap-2">
          {can('item-prices', 'edit') && (
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold tracking-tight">Preços de Itens</h1>
          <p className="text-muted-foreground">
            Gerencie os preços dos itens do estoque
          </p>
        </div>
        {can('item-prices', 'create') && (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Atualizar Preço
          </Button>
        )}
      </div>

      <DataTable
        data={itemPrices}
        columns={columns}
        searchPlaceholder="Buscar preços..."
      />
    </div>
  );
}
