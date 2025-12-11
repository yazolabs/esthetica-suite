import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BookingPolicy,
  BookingPolicySchema,
  defaultBookingPolicy,
} from '@/validators/bookingPolicySchema';
import { WeekdaySelector } from './WeekdaySelector';
import { BlackoutDatesPicker } from './BlackoutDatesPicker';
import { DurationWindowRepeater } from './DurationWindowRepeater';
import { JsonPreviewCard } from './JsonPreviewCard';
import { useCreateBookingPolicy, useUpdateBookingPolicy } from '@/hooks/booking-policies/useBookingPolicyMutations';

interface PolicyEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: BookingPolicy | null;
  services?: { id: number; name: string }[];
  professionals?: { id: number; name: string }[];
}

export function PolicyEditorDialog({
  open,
  onOpenChange,
  policy,
  services = [],
  professionals = [],
}: PolicyEditorDialogProps) {
  const isEditing = !!policy?.id;
  const createMutation = useCreateBookingPolicy();
  const updateMutation = useUpdateBookingPolicy();

  const form = useForm<BookingPolicy>({
    resolver: zodResolver(BookingPolicySchema),
    defaultValues: defaultBookingPolicy as BookingPolicy,
  });

  const scopeType = form.watch('scope_type');
  const params = form.watch('params');

  useEffect(() => {
    if (open) {
      if (policy) {
        form.reset(policy);
      } else {
        form.reset(defaultBookingPolicy as BookingPolicy);
      }
    }
  }, [open, policy, form]);

  const onSubmit = async (data: BookingPolicy) => {
    try {
      if (isEditing && policy?.id) {
        await updateMutation.mutateAsync({ id: policy.id, policy: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Política de Agendamento' : 'Nova Política de Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="duration">Duração</TabsTrigger>
                <TabsTrigger value="finish">Término</TabsTrigger>
                <TabsTrigger value="calendar">Calendário</TabsTrigger>
                <TabsTrigger value="technical">Técnico</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="scope_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escopo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === 'company') {
                              form.setValue('scope_id', null);
                            }
                          }}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company" id="company" />
                            <Label htmlFor="company">Empresa</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="service" id="service" />
                            <Label htmlFor="service">Serviço</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="professional" id="professional" />
                            <Label htmlFor="professional">Profissional</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Políticas de profissional têm prioridade sobre serviço, que têm prioridade sobre empresa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {scopeType === 'service' && (
                  <FormField
                    control={form.control}
                    name="scope_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serviço</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {scopeType === 'professional' && (
                  <FormField
                    control={form.control}
                    name="scope_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissional</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um profissional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professionals.map((professional) => (
                              <SelectItem key={professional.id} value={professional.id.toString()}>
                                {professional.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={999}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Quanto maior o valor, maior a prioridade (0-999).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effective_from"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vigência início</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Sem data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => 
                                field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                              }
                              locale={ptBR}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effective_to"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vigência fim</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Sem data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => 
                                field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                              }
                              locale={ptBR}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Política ativa</FormLabel>
                        <FormDescription>
                          Políticas inativas não afetam o cálculo de disponibilidade.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Duration Tab */}
              <TabsContent value="duration" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Regras por duração</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure janelas de horário de início baseadas na duração do serviço.
                    Serviços mais longos podem ter restrições de horário de início.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="params.duration_windows"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DurationWindowRepeater
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Finish Tab */}
              <TabsContent value="finish" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="params.finish_constraints.must_finish_before_shift_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Terminar antes do fim do turno</FormLabel>
                        <FormDescription>
                          O serviço deve terminar antes do horário de fechamento do profissional.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="params.finish_constraints.respect_breaks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tratamento de intervalos</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="respect">Respeitar (não agendar durante)</SelectItem>
                          <SelectItem value="exception">Exceção (permitir se curto)</SelectItem>
                          <SelectItem value="merge">Mesclar (ignorar intervalos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Como tratar intervalos/pausas do profissional.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('params.finish_constraints.respect_breaks') === 'exception' && (
                  <FormField
                    control={form.control}
                    name="params.finish_constraints.break_exception_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exceção de intervalo (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Permite agendar sobre intervalos menores que este valor.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="params.weekday_rules.allowed_dow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias da semana permitidos</FormLabel>
                      <FormControl>
                        <WeekdaySelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Selecione os dias em que agendamentos são permitidos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="params.weekday_rules.blackout_dates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datas bloqueadas</FormLabel>
                      <FormControl>
                        <BlackoutDatesPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Datas específicas onde agendamentos não são permitidos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="technical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="params.slot_granularity_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Granularidade (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={120}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                          />
                        </FormControl>
                        <FormDescription>
                          Intervalos entre slots disponíveis.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="params.min_lead_time_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Antecedência mínima (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Tempo mínimo antes do agendamento.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="params.max_horizon_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horizonte máximo (dias)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 90)}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantos dias no futuro podem ser agendados.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="params.overbooking.max_parallel_per_professional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atendimentos paralelos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Máximo de atendimentos simultâneos por profissional.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="params.buffer_before_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer antes (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={240}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Tempo reservado antes do serviço.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="params.buffer_after_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer depois (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={240}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Tempo reservado após o serviço.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-6">
                  <JsonPreviewCard params={params} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
