import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface WeekdaySelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

const weekdays = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export function WeekdaySelector({ value, onChange, disabled }: WeekdaySelectorProps) {
  const handleToggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {weekdays.map((day) => (
        <div key={day.value} className="flex items-center gap-2">
          <Checkbox
            id={`day-${day.value}`}
            checked={value.includes(day.value)}
            onCheckedChange={() => handleToggle(day.value)}
            disabled={disabled}
          />
          <Label 
            htmlFor={`day-${day.value}`} 
            className="text-sm cursor-pointer"
            title={day.fullLabel}
          >
            {day.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
