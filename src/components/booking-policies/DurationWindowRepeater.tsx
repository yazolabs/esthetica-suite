import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StartWindowsTable } from './StartWindowsTable';
import { DurationRule } from '@/validators/bookingPolicySchema';

interface DurationWindowRepeaterProps {
  value: DurationRule[];
  onChange: (value: DurationRule[]) => void;
  disabled?: boolean;
}

export function DurationWindowRepeater({ value, onChange, disabled }: DurationWindowRepeaterProps) {
  const handleAdd = () => {
    const lastMax = value.length > 0 ? value[value.length - 1].max_duration : 0;
    onChange([
      ...value,
      {
        min_duration: lastMax + 1,
        max_duration: lastMax + 60,
        start_windows: [{ label: 'geral', latest_start: '18:00' }],
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof DurationRule, fieldValue: any) => {
    const updated = value.map((item, i) =>
      i === index ? { ...item, [field]: fieldValue } : item
    );
    onChange(updated);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {value.map((rule, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Faixa {index + 1}: {formatDuration(rule.min_duration)} - {formatDuration(rule.max_duration)}
              </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração mínima (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={rule.min_duration}
                  onChange={(e) => handleChange(index, 'min_duration', parseInt(e.target.value) || 0)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração máxima (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.max_duration}
                  onChange={(e) => handleChange(index, 'max_duration', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Janelas de início</Label>
              <StartWindowsTable
                value={rule.start_windows}
                onChange={(windows) => handleChange(index, 'start_windows', windows)}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar faixa de duração
      </Button>
    </div>
  );
}
