import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StartWindow } from '@/validators/bookingPolicySchema';

interface StartWindowsTableProps {
  value: StartWindow[];
  onChange: (value: StartWindow[]) => void;
  disabled?: boolean;
}

export function StartWindowsTable({ value, onChange, disabled }: StartWindowsTableProps) {
  const handleAdd = () => {
    onChange([...value, { label: '', latest_start: '18:00' }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof StartWindow, fieldValue: string) => {
    const updated = value.map((item, i) => 
      i === index ? { ...item, [field]: fieldValue } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr,120px,40px] gap-2 text-sm font-medium text-muted-foreground">
        <span>Label</span>
        <span>Último início</span>
        <span></span>
      </div>
      
      {value.map((window, index) => (
        <div key={index} className="grid grid-cols-[1fr,120px,40px] gap-2">
          <Input
            value={window.label}
            onChange={(e) => handleChange(index, 'label', e.target.value)}
            placeholder="Ex: manhã, tarde"
            disabled={disabled}
          />
          <Input
            type="time"
            value={window.latest_start}
            onChange={(e) => handleChange(index, 'latest_start', e.target.value)}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(index)}
            disabled={disabled || value.length <= 1}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        Adicionar janela
      </Button>
    </div>
  );
}
