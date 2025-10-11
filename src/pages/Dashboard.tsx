import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Scissors, TrendingUp } from 'lucide-react';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function Dashboard() {
  const { user } = useAuthUser();

  const stats = [
    {
      title: 'Total de Clientes',
      value: '1,234',
      description: '+12% em relação ao mês passado',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Agendamentos Hoje',
      value: '28',
      description: '5 agendamentos pendentes',
      icon: Calendar,
      color: 'text-secondary',
    },
    {
      title: 'Serviços Ativos',
      value: '45',
      description: '8 categorias disponíveis',
      icon: Scissors,
      color: 'text-success',
    },
    {
      title: 'Receita do Mês',
      value: 'R$ 45.2k',
      description: '+18% em relação ao mês passado',
      icon: TrendingUp,
      color: 'text-warning',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name}! Aqui está uma visão geral do salão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Agendamentos Recentes</CardTitle>
            <CardDescription>
              Últimos agendamentos realizados no salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Cliente {i}</p>
                    <p className="text-sm text-muted-foreground">Corte de Cabelo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">14:00</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Serviços Populares</CardTitle>
            <CardDescription>
              Serviços mais agendados este mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Corte de Cabelo', count: 156, percentage: 35 },
                { name: 'Manicure', count: 124, percentage: 28 },
                { name: 'Massagem', count: 98, percentage: 22 },
                { name: 'Depilação', count: 67, percentage: 15 },
              ].map((service) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.count}</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
