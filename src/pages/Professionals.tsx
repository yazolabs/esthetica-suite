import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isAfter, isBefore, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkSchedule {
  dayOfWeek: string;
  isWorkingDay: boolean;
  isDayOff: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

const defaultSchedule: WorkSchedule[] = [
  { dayOfWeek: 'Segunda-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Terça-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Quarta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Quinta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Sexta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Sábado', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '', afternoonEnd: '' },
  { dayOfWeek: 'Domingo', isWorkingDay: false, isDayOff: true, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
];

const professionalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  services: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  schedule: z.array(z.object({
    dayOfWeek: z.string(),
    isWorkingDay: z.boolean(),
    isDayOff: z.boolean(),
    morningStart: z.string(),
    morningEnd: z.string(),
    afternoonStart: z.string(),
    afternoonEnd: z.string(),
  })),
});

interface OpenWindow {
  id: string;
  dateStart: Date;
  dateEnd: Date;
  status: 'open' | 'closed';
  createdAt: Date;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  schedule: WorkSchedule[];
  status: 'active' | 'inactive';
  openWindows: OpenWindow[];
}

const mockServices = [
  { id: '1', name: 'Corte Feminino' },
  { id: '2', name: 'Corte Masculino' },
  { id: '3', name: 'Manicure' },
  { id: '4', name: 'Pedicure' },
  { id: '5', name: 'Massagem' },
  { id: '6', name: 'Escova' },
  { id: '7', name: 'Coloração' },
  { id: '8', name: 'Hidratação' },
];

const mockProfessionals: Professional[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria@salao.com',
    phone: '(11) 98765-4321',
    services: ['1', '6', '7', '8'],
    schedule: defaultSchedule,
    status: 'active',
    openWindows: [],
  },
  {
    id: '2',
    name: 'João Pedro',
    email: 'joao@salao.com',
    phone: '(11) 98765-4322',
    services: ['2'],
    schedule: defaultSchedule,
    status: 'active',
    openWindows: [],
  },
  {
    id: '3',
    name: 'Paula Costa',
    email: 'paula@salao.com',
    phone: '(11) 98765-4323',
    services: ['3', '4'],
    schedule: defaultSchedule,
    status: 'active',
    openWindows: [],
  },
  {
    id: '4',
    name: 'Rita Moura',
    email: 'rita@salao.com',
    phone: '(11) 98765-4324',
    services: ['5'],
    schedule: defaultSchedule,
    status: 'active',
    openWindows: [],
  },
];

const OPEN_WINDOW_MAX_DAYS = 180;

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>(mockProfessionals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const { can } = usePermission();

  const form = useForm<z.infer<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      services: [],
      schedule: defaultSchedule,
    },
  });

  const checkDateOverlap = (
    newStart: Date,
    newEnd: Date,
    existingWindows: OpenWindow[]
  ): boolean => {
    const newStartDay = startOfDay(newStart);
    const newEndDay = startOfDay(newEnd);
    
    return existingWindows.some((window) => {
      if (window.status === 'closed') return false;
      const existingStart = startOfDay(window.dateStart);
      const existingEnd = startOfDay(window.dateEnd);
      
      // Check if ranges overlap
      return !(isAfter(newStartDay, existingEnd) || isBefore(newEndDay, existingStart));
    });
  };

  const handleAddOpenWindow = () => {
    if (!editingProfessional || !dateRange.from || !dateRange.to) return;

    const daysDiff = differenceInDays(dateRange.to, dateRange.from);
    if (daysDiff > OPEN_WINDOW_MAX_DAYS) {
      toast.error(`O período não pode exceder ${OPEN_WINDOW_MAX_DAYS} dias.`);
      return;
    }

    if (isBefore(dateRange.to, dateRange.from)) {
      toast.error('A data final deve ser maior ou igual à data inicial.');
      return;
    }

    const hasOverlap = checkDateOverlap(
      dateRange.from,
      dateRange.to,
      editingProfessional.openWindows
    );

    if (hasOverlap) {
      toast.warning('Existe sobreposição com janelas já cadastradas. Ajuste o período para evitar conflitos.');
      return;
    }

    const newWindow: OpenWindow = {
      id: Math.random().toString(36).substr(2, 9),
      dateStart: dateRange.from,
      dateEnd: dateRange.to,
      status: 'open',
      createdAt: new Date(),
    };

    setProfessionals((prev) =>
      prev.map((p) =>
        p.id === editingProfessional.id
          ? { ...p, openWindows: [...p.openWindows, newWindow] }
          : p
      )
    );

    setEditingProfessional((prev) =>
      prev ? { ...prev, openWindows: [...prev.openWindows, newWindow] } : null
    );

    setDateRange({ from: undefined, to: undefined });

    toast.success('Janela de agenda adicionada com sucesso!');
  };

  const handleCloseWindow = (windowId: string) => {
    if (!editingProfessional) return;

    setProfessionals((prev) =>
      prev.map((p) =>
        p.id === editingProfessional.id
          ? {
              ...p,
              openWindows: p.openWindows.map((w) =>
                w.id === windowId ? { ...w, status: 'closed' as const } : w
              ),
            }
          : p
      )
    );

    setEditingProfessional((prev) =>
      prev
        ? {
            ...prev,
            openWindows: prev.openWindows.map((w) =>
              w.id === windowId ? { ...w, status: 'closed' as const } : w
            ),
          }
        : null
    );

    toast.success('Janela de agenda fechada com sucesso.');
  };

  const handleDeleteWindow = (windowId: string) => {
    if (!editingProfessional) return;

    setProfessionals((prev) =>
      prev.map((p) =>
        p.id === editingProfessional.id
          ? {
              ...p,
              openWindows: p.openWindows.filter((w) => w.id !== windowId),
            }
          : p
      )
    );

    setEditingProfessional((prev) =>
      prev
        ? {
            ...prev,
            openWindows: prev.openWindows.filter((w) => w.id !== windowId),
          }
        : null
    );

    toast.success('Janela de agenda removida com sucesso.');
  };

  const handleAdd = () => {
    setEditingProfessional(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      services: [],
      schedule: defaultSchedule,
    });
    setDialogOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    form.reset({
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      services: professional.services,
      schedule: professional.schedule || defaultSchedule,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProfessionals(professionals.filter((p) => p.id !== id));
    toast.success('Profissional removido com sucesso!');
  };

  const onSubmit = (data: z.infer<typeof professionalSchema>) => {
    if (editingProfessional) {
      setProfessionals(
        professionals.map((p) =>
          p.id === editingProfessional.id
            ? { 
                ...p, 
                name: data.name, 
                email: data.email, 
                phone: data.phone, 
                services: data.services, 
                schedule: data.schedule as WorkSchedule[]
              }
            : p
        )
      );
      toast.success('Profissional atualizado com sucesso!');
    } else {
      const newProfessional: Professional = {
        id: String(professionals.length + 1),
        name: data.name,
        email: data.email,
        phone: data.phone,
        services: data.services,
        schedule: data.schedule as WorkSchedule[],
        status: 'active',
        openWindows: [],
      };
      setProfessionals([...professionals, newProfessional]);
      toast.success('Profissional cadastrado com sucesso!');
    }
    setDialogOpen(false);
    form.reset();
  };

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds
      .map((id) => mockServices.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Telefone' },
    {
      key: 'services',
      header: 'Especializações',
      render: (professional: Professional) => (
        <div className="flex flex-wrap gap-1">
          {professional.services.slice(0, 2).map((serviceId) => {
            const service = mockServices.find((s) => s.id === serviceId);
            return service ? (
              <Badge key={serviceId} variant="secondary">
                {service.name}
              </Badge>
            ) : null;
          })}
          {professional.services.length > 2 && (
            <Badge variant="outline">+{professional.services.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (professional: Professional) => (
        <Badge variant={professional.status === 'active' ? 'success' : 'outline'}>
          {professional.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (professional: Professional) => (
        <div className="flex gap-2">
          {can('professionals', 'edit') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(professional)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('professionals', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(professional.id)}
            >
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
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais e suas especializações
          </p>
        </div>
        {can('professionals', 'create') && (
          <Button className="shadow-md" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        )}
      </div>

      <DataTable
        data={professionals}
        columns={columns}
        searchPlaceholder="Buscar profissionais..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
            <DialogDescription>
              {editingProfessional 
                ? 'Atualize os dados do profissional e gerencie a agenda dinâmica.'
                : 'Preencha os dados do profissional, selecione os serviços e configure os horários de atendimento.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger value="agenda" disabled={!editingProfessional}>
                Agenda Aberta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do profissional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 98765-4321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>Especializações / Serviços Habilitados</FormLabel>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {mockServices.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="services"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, service.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== service.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {service.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 border-t pt-4">
                    <FormLabel className="text-base">Horários de Atendimento</FormLabel>
                    {form.watch('schedule')?.map((day, index) => (
                      <div key={day.dayOfWeek} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">{day.dayOfWeek}</FormLabel>
                          <div className="flex gap-4">
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.isWorkingDay`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">Dia útil</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.isDayOff`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">Folga</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        {form.watch(`schedule.${index}.isWorkingDay`) && !form.watch(`schedule.${index}.isDayOff`) && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-muted-foreground">Manhã</FormLabel>
                              <div className="flex gap-2">
                                <FormField
                                  control={form.control}
                                  name={`schedule.${index}.morningStart`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground self-center">às</span>
                                <FormField
                                  control={form.control}
                                  name={`schedule.${index}.morningEnd`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-muted-foreground">Tarde</FormLabel>
                              <div className="flex gap-2">
                                <FormField
                                  control={form.control}
                                  name={`schedule.${index}.afternoonStart`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground self-center">às</span>
                                <FormField
                                  control={form.control}
                                  name={`schedule.${index}.afternoonEnd`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProfessional ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="agenda" className="mt-4 space-y-6">
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="font-semibold text-lg">Adicionar Período de Agenda</h3>
                <p className="text-sm text-muted-foreground">
                  Defina um período em que este profissional estará disponível para agendamentos. 
                  Máximo de {OPEN_WINDOW_MAX_DAYS} dias por lançamento. O sistema não permite sobreposição de períodos.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecione o período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button
                    onClick={handleAddOpenWindow}
                    disabled={!dateRange.from || !dateRange.to}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Abrir Agenda
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Períodos Cadastrados</h3>
                {!editingProfessional?.openWindows || editingProfessional.openWindows.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Nenhum período cadastrado ainda.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adicione períodos de disponibilidade usando o formulário acima.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingProfessional.openWindows
                      .sort((a, b) => a.dateStart.getTime() - b.dateStart.getTime())
                      .map((window) => (
                        <div
                          key={window.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            window.status === 'closed' && "opacity-50 bg-muted"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(window.dateStart, "dd/MM/yyyy", { locale: ptBR })} até{" "}
                                {format(window.dateEnd, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  window.status === 'open'
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                )}
                              >
                                {window.status === 'open' ? 'Aberto' : 'Fechado'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criado em {format(window.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {window.status === 'open' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCloseWindow(window.id)}
                              >
                                Fechar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWindow(window.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
