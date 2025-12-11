import { Badge } from '@/components/ui/badge';
import { Building2, Scissors, UserCog } from 'lucide-react';

interface ScopeBadgeProps {
  scopeType: 'company' | 'service' | 'professional';
  scopeName?: string;
}

const scopeConfig = {
  company: {
    label: 'Empresa',
    icon: Building2,
    variant: 'default' as const,
  },
  service: {
    label: 'Serviço',
    icon: Scissors,
    variant: 'secondary' as const,
  },
  professional: {
    label: 'Profissional',
    icon: UserCog,
    variant: 'outline' as const,
  },
};

export function ScopeBadge({ scopeType, scopeName }: ScopeBadgeProps) {
  const config = scopeConfig[scopeType];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      <span>{scopeName || config.label}</span>
    </Badge>
  );
}
