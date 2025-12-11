import { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  CalendarCog,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBookingPoliciesQuery } from '@/hooks/booking-policies/useBookingPoliciesQuery';
import { useDeleteBookingPolicy } from '@/hooks/booking-policies/useBookingPolicyMutations';
import { PolicyEditorDialog } from '@/components/booking-policies/PolicyEditorDialog';
import { ScopeBadge } from '@/components/booking-policies/ScopeBadge';
import { BookingPolicy, defaultBookingPolicy } from '@/validators/bookingPolicySchema';


// Demo data for when API is not available
const demoData: BookingPolicy[] = [
  {
    id: 1,
    scope_type: 'company',
    scope_id: null,
    priority: 100,
    effective_from: null,
    effective_to: null,
    active: true,
    params: {
      slot_granularity_min: 15,
      min_lead_time_min: 60,
      max_horizon_days: 90,
      buffer_before_min: 0,
      buffer_after_min: 0,
      duration_windows: [
        { min_duration: 0, max_duration: 60, start_windows: [{ label: 'geral', latest_start: '18:00' }] },
        { min_duration: 61, max_duration: 180, start_windows: [{ label: 'janela_1', latest_start: '09:00' }, { label: 'janela_2', latest_start: '14:00' }] },
      ],
      finish_constraints: { must_finish_before_shift_end: true, respect_breaks: 'exception', break_exception_minutes: 30 },
      weekday_rules: { allowed_dow: [1, 2, 3, 4, 5, 6], blackout_dates: [] },
      overbooking: { max_parallel_per_professional: 1 },
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    scope_type: 'service',
    scope_id: 1,
    priority: 150,
    effective_from: '2024-06-01',
    effective_to: '2024-12-31',
    active: true,
    params: {
      slot_granularity_min: 30,
      min_lead_time_min: 120,
      max_horizon_days: 60,
      buffer_before_min: 15,
      buffer_after_min: 15,
      duration_windows: [
        { min_duration: 0, max_duration: 120, start_windows: [{ label: 'manhã', latest_start: '11:00' }, { label: 'tarde', latest_start: '17:00' }] },
      ],
      finish_constraints: { must_finish_before_shift_end: true, respect_breaks: 'respect', break_exception_minutes: 0 },
      weekday_rules: { allowed_dow: [1, 2, 3, 4, 5], blackout_dates: ['2024-12-25', '2024-12-31'] },
      overbooking: { max_parallel_per_professional: 1 },
    },
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 3,
    scope_type: 'professional',
    scope_id: 2,
    priority: 200,
    effective_from: null,
    effective_to: null,
    active: false,
    params: {
      slot_granularity_min: 15,
      min_lead_time_min: 30,
      max_horizon_days: 30,
      buffer_before_min: 0,
      buffer_after_min: 10,
      duration_windows: [
        { min_duration: 0, max_duration: 60, start_windows: [{ label: 'livre', latest_start: '19:00' }] },
      ],
      finish_constraints: { must_finish_before_shift_end: false, respect_breaks: 'merge', break_exception_minutes: 0 },
      weekday_rules: { allowed_dow: [0, 1, 2, 3, 4, 5, 6], blackout_dates: [] },
      overbooking: { max_parallel_per_professional: 2 },
    },
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
];

// Demo services and professionals
const demoServices = [
  { id: 1, name: 'Manicure' },
  { id: 2, name: 'Pedicure' },
  { id: 3, name: 'Alongamento' },
];

const demoProfessionals = [
  { id: 1, name: 'Maria Silva' },
  { id: 2, name: 'João Santos' },
  { id: 3, name: 'Ana Oliveira' },
];

export default function BookingPoliciesPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<BookingPolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<BookingPolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading, error } = useBookingPoliciesQuery();
  const deleteMutation = useDeleteBookingPolicy();

  // Use demo data if API fails or returns no data
  const policies = useMemo(() => {
    if (data?.data && data.data.length > 0) {
      return data.data;
    }
    return demoData;
  }, [data]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesId = policy.id?.toString().includes(search);
        const matchesScope = policy.scope_type.includes(search);
        if (!matchesId && !matchesScope) return false;
      }

      // Scope filter
      if (scopeFilter !== 'all' && policy.scope_type !== scopeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isActive = policy.active;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }

      return true;
    });
  }, [policies, searchTerm, scopeFilter, statusFilter]);

  const handleCreate = () => {
    setEditingPolicy(null);
    setEditorOpen(true);
  };

  const handleEdit = (policy: BookingPolicy) => {
    setEditingPolicy(policy);
    setEditorOpen(true);
  };

  const handleDeleteClick = (policy: BookingPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (policyToDelete?.id) {
      await deleteMutation.mutateAsync(policyToDelete.id);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(filteredPolicies, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking-policies.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '-';
    } catch {
      return '-';
    }
  };

  const getScopeName = (policy: BookingPolicy) => {
    if (policy.scope_type === 'company') return 'Empresa';
    if (policy.scope_type === 'service') {
      const service = demoServices.find(s => s.id === policy.scope_id);
      return service?.name || `Serviço #${policy.scope_id}`;
    }
    if (policy.scope_type === 'professional') {
      const professional = demoProfessionals.find(p => p.id === policy.scope_id);
      return professional?.name || `Profissional #${policy.scope_id}`;
    }
    return '-';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Políticas de Agendamento</h1>
            <p className="text-sm text-muted-foreground">
              Configure regras de disponibilidade para agendamentos
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Política
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou escopo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os escopos</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead className="w-[100px]">Prioridade</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma política encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono text-sm">
                        #{policy.id}
                      </TableCell>
                      <TableCell>
                        <ScopeBadge
                          scopeType={policy.scope_type}
                          scopeName={getScopeName(policy)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {policy.effective_from || policy.effective_to ? (
                          <span>
                            {formatDate(policy.effective_from)} - {formatDate(policy.effective_to)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Permanente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.active ? 'default' : 'secondary'}>
                          {policy.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(policy.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(policy)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(policy)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <PolicyEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        policy={editingPolicy}
        services={demoServices}
        professionals={demoProfessionals}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta política de agendamento?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
