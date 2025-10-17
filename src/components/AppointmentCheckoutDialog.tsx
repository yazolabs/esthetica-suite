import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  discount: z.number().min(0).max(100),
  paymentMethod: z.string().min(1, 'Forma de pagamento é obrigatória'),
  cardBrand: z.string().optional(),
  installments: z.number().min(1).optional(),
  installmentFee: z.number().min(0).optional(),
});

interface Professional {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  professionals: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Appointment {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price?: number;
}

interface AppointmentCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

const mockProfessionals: Professional[] = [
  { id: '1', name: 'Maria Santos' },
  { id: '2', name: 'João Pedro' },
  { id: '3', name: 'Paula Costa' },
  { id: '4', name: 'Rita Moura' },
];

const mockServices = [
  { id: '1', name: 'Corte Feminino', price: 80 },
  { id: '2', name: 'Corte Masculino', price: 50 },
  { id: '3', name: 'Manicure', price: 40 },
  { id: '4', name: 'Pedicure', price: 45 },
  { id: '5', name: 'Massagem', price: 120 },
  { id: '6', name: 'Escova', price: 60 },
];

const mockProducts = [
  { id: '1', name: 'Shampoo Premium', price: 45 },
  { id: '2', name: 'Condicionador', price: 40 },
  { id: '3', name: 'Máscara Capilar', price: 55 },
  { id: '4', name: 'Esmalte', price: 15 },
];

export function AppointmentCheckoutDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentCheckoutDialogProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discount: 0,
      paymentMethod: '',
      cardBrand: '',
      installments: 1,
      installmentFee: 0,
    },
  });

  // Pré-preencher serviços e valores quando o dialog abrir com um appointment
  useEffect(() => {
    if (open && appointment) {
      // Encontrar o serviço correspondente
      const service = mockServices.find(s => s.name === appointment.service);
      
      if (service) {
        // Adicionar o serviço do agendamento automaticamente
        const prefilledService: ServiceItem = {
          id: service.id,
          name: service.name,
          price: appointment.price || service.price,
          professionals: appointment.professionals,
        };
        
        setServices([prefilledService]);
      }
      
      // Limpar produtos
      setProducts([]);
      
      // Reset form
      form.reset({
        discount: 0,
        paymentMethod: '',
        cardBrand: '',
        installments: 1,
        installmentFee: 0,
      });
    }
  }, [open, appointment, form]);

  const addService = () => {
    if (!selectedService || selectedProfessionals.length === 0) {
      toast.error('Selecione um serviço e pelo menos um profissional');
      return;
    }

    const service = mockServices.find((s) => s.id === selectedService);
    if (service) {
      setServices([
        ...services,
        {
          id: service.id,
          name: service.name,
          price: service.price,
          professionals: selectedProfessionals,
        },
      ]);
      setSelectedService('');
      setSelectedProfessionals([]);
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    const product = mockProducts.find((p) => p.id === selectedProduct);
    if (product) {
      const existing = products.find((p) => p.id === product.id);
      if (existing) {
        setProducts(
          products.map((p) =>
            p.id === product.id
              ? { ...p, quantity: p.quantity + productQuantity }
              : p
          )
        );
      } else {
        setProducts([
          ...products,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: productQuantity,
          },
        ]);
      }
      setSelectedProduct('');
      setProductQuantity(1);
    }
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const toggleProfessional = (professionalId: string) => {
    if (selectedProfessionals.includes(professionalId)) {
      setSelectedProfessionals(
        selectedProfessionals.filter((id) => id !== professionalId)
      );
    } else {
      setSelectedProfessionals([...selectedProfessionals, professionalId]);
    }
  };

  const servicesTotal = services.reduce((sum, service) => sum + service.price, 0);
  const productsTotal = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  const subtotal = servicesTotal + productsTotal;
  const discount = form.watch('discount') || 0;
  const paymentMethod = form.watch('paymentMethod');
  const installments = form.watch('installments') || 1;
  const installmentFee = form.watch('installmentFee') || 0;
  
  let totalAfterDiscount = subtotal - (subtotal * discount) / 100;
  
  // Aplicar acréscimo de parcelas se for crédito
  if (paymentMethod === 'credit' && installments > 1) {
    totalAfterDiscount = totalAfterDiscount + (totalAfterDiscount * installmentFee) / 100;
  }
  
  const total = totalAfterDiscount;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const printAppointmentReceipt = () => {
    if (!appointment) return;

    const professionalNames = appointment.professionals
      .map((id) => mockProfessionals.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const date = new Date(appointment.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long',
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão. Verifique se pop-ups não estão bloqueados.');
      return;
    }

    const paymentMethodLabels: Record<string, string> = {
      cash: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
    };

    const cardBrandLabels: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      elo: 'Elo',
      amex: 'American Express',
      hipercard: 'Hipercard',
    };

    const paymentInfo = form.getValues();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comanda - ${appointment.client}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              margin: 1cm;
              size: A4;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
              background-color: white;
              color: #333;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding: 25px;
              background: linear-gradient(135deg, #e63888 0%, #c8286e 100%);
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(230, 56, 136, 0.2);
            }
            
            .header h1 {
              color: white;
              font-size: 32px;
              margin-bottom: 8px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
              letter-spacing: 1px;
            }
            
            .header .subtitle {
              color: rgba(255,255,255,0.95);
              font-size: 16px;
              margin-bottom: 15px;
            }

            .header .document-type {
              display: inline-block;
              background-color: white;
              color: #e63888;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 10px;
            }
            
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .section-title {
              background: linear-gradient(135deg, #e63888 0%, #c8286e 100%);
              color: white;
              padding: 12px 18px;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(230, 56, 136, 0.15);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .info-item {
              padding: 15px;
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
              border-left: 4px solid #e63888;
              border-radius: 8px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            }
            
            .info-label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 6px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 16px;
              color: #1a1a1a;
              font-weight: 600;
              word-wrap: break-word;
            }
            
            .full-width {
              grid-column: 1 / -1;
            }
            
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-scheduled {
              background-color: #fef3c7;
              color: #92400e;
              border: 2px solid #fbbf24;
            }
            
            .status-confirmed {
              background-color: #dbeafe;
              color: #1e40af;
              border: 2px solid #3b82f6;
            }
            
            .status-completed {
              background-color: #d1fae5;
              color: #065f46;
              border: 2px solid #10b981;
            }
            
            .status-cancelled {
              background-color: #fee2e2;
              color: #991b1b;
              border: 2px solid #ef4444;
            }
            
            .footer {
              margin-top: 50px;
              padding-top: 25px;
              border-top: 3px dashed #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }

            .footer p {
              margin: 5px 0;
            }

            .footer strong {
              color: #e63888;
              font-size: 14px;
            }

            .service-item, .product-item {
              padding: 15px;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border-radius: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.05);
              border-left: 4px solid #e63888;
            }

            .service-item .service-name,
            .product-item .product-name {
              font-weight: 700;
              font-size: 16px;
              color: #1a1a1a;
              margin-bottom: 5px;
            }

            .service-item .service-detail,
            .product-item .product-detail {
              font-size: 13px;
              color: #666;
            }

            .service-item .service-price,
            .product-item .product-price {
              font-weight: 800;
              font-size: 18px;
              color: #e63888;
            }

            .totals-box {
              background: linear-gradient(135deg, #fff5f9 0%, #ffe6f0 100%);
              padding: 20px;
              border-radius: 12px;
              border: 3px solid #e63888;
              box-shadow: 0 4px 12px rgba(230, 56, 136, 0.15);
            }

            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 15px;
              color: #333;
            }

            .total-line.subtotal {
              font-weight: 600;
              padding-top: 10px;
              border-top: 2px solid rgba(230, 56, 136, 0.2);
            }

            .total-line.discount {
              color: #dc2626;
              font-weight: 600;
            }

            .total-line.fee {
              color: #f59e0b;
              font-weight: 600;
            }

            .total-line.final {
              font-size: 28px;
              font-weight: 900;
              color: #e63888;
              border-top: 3px solid #e63888;
              padding-top: 15px;
              margin-top: 12px;
              text-shadow: 1px 1px 2px rgba(230, 56, 136, 0.1);
            }
            
            .notes-box {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border: 2px solid #fbbf24;
              border-left: 6px solid #f59e0b;
              padding: 18px;
              border-radius: 8px;
              font-size: 14px;
              color: #78350f;
              box-shadow: 0 2px 6px rgba(251, 191, 36, 0.1);
              line-height: 1.6;
            }

            .payment-badge {
              display: inline-block;
              background: linear-gradient(135deg, #e63888 0%, #c8286e 100%);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 14px;
              box-shadow: 0 2px 6px rgba(230, 56, 136, 0.3);
            }

            .divider {
              height: 2px;
              background: linear-gradient(to right, transparent, #e63888, transparent);
              margin: 25px 0;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .no-print {
                display: none;
              }

              .section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Studio Unhas Delicadas</h1>
            <p class="subtitle">Michele Fonseca e Equipe</p>
            <div class="document-type">Comanda de Atendimento</div>
          </div>

          <div class="section">
            <div class="section-title">📋 Informações do Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome do Cliente</div>
                <div class="info-value">${appointment.client}</div>
              </div>
              ${appointment.clientPhone ? `
                <div class="info-item">
                  <div class="info-label">Telefone de Contato</div>
                  <div class="info-value">${appointment.clientPhone}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">📅 Detalhes do Agendamento</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data do Atendimento</div>
                <div class="info-value">${formattedDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Horário</div>
                <div class="info-value">${appointment.time}</div>
              </div>
              ${appointment.duration ? `
                <div class="info-item">
                  <div class="info-label">Duração Estimada</div>
                  <div class="info-value">${appointment.duration} minutos</div>
                </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">Status do Agendamento</div>
                <div class="info-value">
                  <span class="status-badge status-${appointment.status}">
                    ${getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">✨ Serviços Realizados</div>
            ${services.length > 0 ? services.map(service => `
              <div class="service-item">
                <div>
                  <div class="service-name">${service.name}</div>
                  <div class="service-detail">
                    Profissionais: ${service.professionals.map(id => 
                      mockProfessionals.find(p => p.id === id)?.name
                    ).join(', ')}
                  </div>
                </div>
                <div class="service-price">R$ ${service.price.toFixed(2)}</div>
              </div>
            `).join('') : `
              <div class="service-item">
                <div>
                  <div class="service-name">${appointment.service}</div>
                  <div class="service-detail">Profissionais: ${professionalNames}</div>
                </div>
                <div class="service-price">R$ ${(appointment.price || 0).toFixed(2)}</div>
              </div>
            `}
          </div>

          ${products.length > 0 ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">🛍️ Produtos Adquiridos</div>
              ${products.map(product => `
                <div class="product-item">
                  <div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-detail">Quantidade: ${product.quantity} unidade(s)</div>
                  </div>
                  <div class="product-price">R$ ${(product.price * product.quantity).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">💰 Resumo Financeiro</div>
            <div class="totals-box">
              <div class="total-line">
                <span>Subtotal Serviços:</span>
                <span>R$ ${servicesTotal.toFixed(2)}</span>
              </div>
              ${products.length > 0 ? `
                <div class="total-line">
                  <span>Subtotal Produtos:</span>
                  <span>R$ ${productsTotal.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-line subtotal">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
              </div>
              ${discount > 0 ? `
                <div class="total-line discount">
                  <span>Desconto (${discount}%):</span>
                  <span>- R$ ${((subtotal * discount) / 100).toFixed(2)}</span>
                </div>
              ` : ''}
              ${paymentMethod === 'credit' && installments > 1 && installmentFee > 0 ? `
                <div class="total-line fee">
                  <span>Acréscimo Parcelamento (${installmentFee}%):</span>
                  <span>+ R$ ${(((subtotal - (subtotal * discount) / 100) * installmentFee) / 100).toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-line final">
                <span>TOTAL:</span>
                <span>R$ ${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${paymentInfo.paymentMethod ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">💳 Forma de Pagamento</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Método de Pagamento</div>
                  <div class="info-value">
                    <span class="payment-badge">${paymentMethodLabels[paymentInfo.paymentMethod] || paymentInfo.paymentMethod}</span>
                  </div>
                </div>
                ${paymentInfo.cardBrand ? `
                  <div class="info-item">
                    <div class="info-label">Bandeira do Cartão</div>
                    <div class="info-value">${cardBrandLabels[paymentInfo.cardBrand] || paymentInfo.cardBrand}</div>
                  </div>
                ` : ''}
                ${paymentInfo.paymentMethod === 'credit' && installments > 1 ? `
                  <div class="info-item full-width">
                    <div class="info-label">Parcelamento</div>
                    <div class="info-value" style="font-size: 20px; color: #e63888;">
                      ${installments}x de R$ ${(total / installments).toFixed(2)}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${appointment.notes ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">📝 Observações</div>
              <div class="notes-box">
                <strong>Observação:</strong> ${appointment.notes}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Studio Unhas Delicadas - Michele Fonseca e Equipe</strong></p>
            <p>Comanda gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style="margin-top: 15px; font-size: 14px; color: #e63888;">✨ Obrigada pela preferência! Volte sempre! 💅 ✨</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const onSubmit = (data: z.infer<typeof checkoutSchema>) => {
    if (services.length === 0) {
      toast.error('Adicione pelo menos um serviço');
      return;
    }

    console.log('Checkout:', {
      appointment,
      services,
      products,
      ...data,
      subtotal,
      total,
    });

    toast.success('Atendimento finalizado com sucesso!');
    onOpenChange(false);
    
    // Reset form
    setServices([]);
    setProducts([]);
    form.reset();
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
          <DialogDescription>
            Cliente: {appointment.client} • {new Date(appointment.date).toLocaleDateString('pt-BR')} às{' '}
            {appointment.time}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Serviços */}
          <div className="space-y-4">
            <h3 className="font-semibold">Serviços Realizados</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addService}
                  disabled={!selectedService || selectedProfessionals.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </div>

              {selectedService && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selecione os profissionais (pode selecionar múltiplos):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockProfessionals.map((prof) => (
                      <Badge
                        key={prof.id}
                        variant={selectedProfessionals.includes(prof.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleProfessional(prof.id)}
                      >
                        {prof.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Profissionais:{' '}
                        {service.professionals
                          .map(
                            (id) =>
                              mockProfessionals.find((p) => p.id === id)?.name
                          )
                          .join(', ')}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Produtos */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produtos Adquiridos</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={productQuantity}
                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                placeholder="Qtd"
              />

              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {products.length > 0 && (
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {product.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium">
                        R$ {(product.price * product.quantity).toFixed(2)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pagamento */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <h3 className="font-semibold">Pagamento</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bandeira do Cartão - aparece para crédito ou débito */}
              {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                <FormField
                  control={form.control}
                  name="cardBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira do Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a bandeira" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="elo">Elo</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                          <SelectItem value="hipercard">Hipercard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Parcelas e Acréscimo - aparecem apenas para crédito */}
              {paymentMethod === 'credit' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installmentFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acréscimo (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Totais */}
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Serviços:</span>
                  <span>R$ {servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produtos:</span>
                  <span>R$ {productsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto ({discount}%):</span>
                    <span>- R$ {((subtotal * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod === 'credit' && installments > 1 && installmentFee > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Acréscimo Parcelamento ({installmentFee}%):</span>
                    <span>+ R$ {(((subtotal - (subtotal * discount) / 100) * installmentFee) / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                {paymentMethod === 'credit' && installments > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{installments}x de:</span>
                    <span>R$ {(total / installments).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={printAppointmentReceipt}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Comanda
                </Button>
                <div className="flex gap-2 flex-1 justify-end">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Finalizar Atendimento</Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
