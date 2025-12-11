import { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BlackoutDatesPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function BlackoutDatesPicker({ value, onChange, disabled }: BlackoutDatesPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (value.includes(dateStr)) {
      onChange(value.filter(d => d !== dateStr));
    } else {
      onChange([...value, dateStr].sort());
    }
  };

  const handleRemove = (dateStr: string) => {
    onChange(value.filter(d => d !== dateStr));
  };

  const selectedDates = value
    .map(d => {
      const parsed = parse(d, 'yyyy-MM-dd', new Date());
      return isValid(parsed) ? parsed : null;
    })
    .filter((d): d is Date => d !== null);

  return (
    <div className="space-y-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.length > 0 
              ? `${value.length} data(s) bloqueada(s)` 
              : "Selecionar datas bloqueadas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => {
              if (dates) {
                onChange(dates.map(d => format(d, 'yyyy-MM-dd')).sort());
              }
            }}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((dateStr) => {
            const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
            return (
              <Badge key={dateStr} variant="secondary" className="gap-1">
                {isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : dateStr}
                <button
                  type="button"
                  onClick={() => handleRemove(dateStr)}
                  className="ml-1 hover:text-destructive"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
