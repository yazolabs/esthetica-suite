import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/DataTable';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package,
  Download,
  FileText,
  Calendar,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Period = 'day' | 'week' | 'month';
type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência';

interface Transaction {
  id: string;
  date: string;
  customer: string;
  professional: string;
  service: string;
  items: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

// Mock data - substituir por dados reais da API
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-10-13 09:00',
    customer: 'Maria Silva',
    professional: 'João Santos',
    service: 'Corte Feminino',
    items: 'Shampoo Premium',
    paymentMethod: 'PIX',
    amount: 150.00,
  },
  {
    id: '2',
    date: '2025-10-13 10:30',
    customer: 'Ana Costa',
    professional: 'Pedro Lima',
    service: 'Coloração',
    items: 'Tintura, Condicionador',
    paymentMethod: 'Cartão de Crédito',
    amount: 280.00,
  },
  {
    id: '3',
    date: '2025-10-13 14:00',
    customer: 'Carlos Souza',
    professional: 'João Santos',
    service: 'Corte Masculino',
    items: '-',
    paymentMethod: 'Dinheiro',
    amount: 50.00,
  },
  {
    id: '4',
    date: '2025-10-12 15:00',
    customer: 'Juliana Mendes',
    professional: 'Mariana Alves',
    service: 'Hidratação',
    items: 'Máscara Capilar',
    paymentMethod: 'Cartão de Débito',
    amount: 120.00,
  },
  {
    id: '5',
    date: '2025-10-11 11:00',
    customer: 'Roberto Dias',
    professional: 'Pedro Lima',
    service: 'Barba',
    items: 'Óleo de Barba',
    paymentMethod: 'PIX',
    amount: 45.00,
  },
];

export default function Cashier() {
  const [period, setPeriod] = useState<Period>('day');
  const [selectedDate] = useState(new Date());

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return mockTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionDay = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth(),
        transactionDate.getDate()
      );

      if (period === 'day') {
        return transactionDay.getTime() === today.getTime();
      } else if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return transactionDate >= weekAgo;
      } else {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return transactionDate >= monthAgo;
      }
    });
  }, [period]);

  const summary = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactions = filteredTransactions.length;
    const avgTicket = transactions > 0 ? total / transactions : 0;
    
    const byPaymentMethod = filteredTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.amount;
      return acc;
    }, {} as Record<PaymentMethod, number>);

    const byProfessional = filteredTransactions.reduce((acc, t) => {
      acc[t.professional] = (acc[t.professional] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const byService = filteredTransactions.reduce((acc, t) => {
      acc[t.service] = (acc[t.service] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const byCustomer = filteredTransactions.reduce((acc, t) => {
      acc[t.customer] = (acc[t.customer] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      transactions,
      avgTicket,
      byPaymentMethod,
      byProfessional,
      byService,
      byCustomer,
    };
  }, [filteredTransactions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Caixa', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${getPeriodLabel()}`, 14, 32);
    doc.text(`Total: R$ ${summary.total.toFixed(2)}`, 14, 40);
    doc.text(`Transações: ${summary.transactions}`, 14, 48);
    doc.text(`Ticket Médio: R$ ${summary.avgTicket.toFixed(2)}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Cliente', 'Profissional', 'Serviço', 'Forma Pgto', 'Valor']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleString('pt-BR'),
        t.customer,
        t.professional,
        t.service,
        t.paymentMethod,
        `R$ ${t.amount.toFixed(2)}`,
      ]),
    });

    doc.save(`relatorio-caixa-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTransactions.map(t => ({
        Data: new Date(t.date).toLocaleString('pt-BR'),
        Cliente: t.customer,
        Profissional: t.professional,
        Serviço: t.service,
        Itens: t.items,
        'Forma de Pagamento': t.paymentMethod,
        'Valor (R$)': t.amount.toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');

    // Add summary sheet
    const summaryData = [
      { Métrica: 'Total Faturado', Valor: `R$ ${summary.total.toFixed(2)}` },
      { Métrica: 'Número de Transações', Valor: summary.transactions },
      { Métrica: 'Ticket Médio', Valor: `R$ ${summary.avgTicket.toFixed(2)}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    XLSX.writeFile(wb, `relatorio-caixa-${period}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Última Semana';
      case 'month':
        return 'Último Mês';
      default:
        return '';
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Data/Hora',
      render: (transaction: Transaction) => new Date(transaction.date).toLocaleString('pt-BR'),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (transaction: Transaction) => transaction.customer,
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (transaction: Transaction) => transaction.professional,
    },
    {
      key: 'service',
      header: 'Serviço',
      render: (transaction: Transaction) => transaction.service,
    },
    {
      key: 'items',
      header: 'Itens',
      render: (transaction: Transaction) => transaction.items,
    },
    {
      key: 'paymentMethod',
      header: 'Forma de Pagamento',
      render: (transaction: Transaction) => transaction.paymentMethod,
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (transaction: Transaction) => `R$ ${transaction.amount.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Gestão financeira e relatórios</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactions}</div>
            <p className="text-xs text-muted-foreground">Total de atendimentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.avgTicket.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por atendimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(summary.byCustomer).length}</div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="payment">Por Forma de Pagamento</TabsTrigger>
          <TabsTrigger value="professional">Por Profissional</TabsTrigger>
          <TabsTrigger value="service">Por Serviço</TabsTrigger>
          <TabsTrigger value="customer">Por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Detalhadas</CardTitle>
              <CardDescription>Lista completa de todas as transações do período</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions}
                columns={columns}
                searchPlaceholder="Buscar por cliente, profissional ou serviço..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Forma de Pagamento</CardTitle>
              <CardDescription>Distribuição de valores por método de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{method}</span>
                    <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Profissional</CardTitle>
              <CardDescription>Performance de cada profissional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byProfessional)
                  .sort(([, a], [, b]) => b - a)
                  .map(([professional, amount]) => (
                    <div key={professional} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{professional}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Serviço</CardTitle>
              <CardDescription>Serviços mais vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byService)
                  .sort(([, a], [, b]) => b - a)
                  .map(([service, amount]) => (
                    <div key={service} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{service}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Cliente</CardTitle>
              <CardDescription>Maiores clientes do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byCustomer)
                  .sort(([, a], [, b]) => b - a)
                  .map(([customer, amount]) => (
                    <div key={customer} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{customer}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
