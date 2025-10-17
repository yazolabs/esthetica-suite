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
import { X, Plus } from 'lucide-react';
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Finalizar Atendimento</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
