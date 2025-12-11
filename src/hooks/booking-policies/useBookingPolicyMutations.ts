import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingPoliciesApi } from '@/api/bookingPolicies';
import { BookingPolicy } from '@/validators/bookingPolicySchema';
import { BOOKING_POLICIES_QUERY_KEY } from './useBookingPoliciesQuery';
import { toast } from 'sonner';

export function useCreateBookingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policy: Omit<BookingPolicy, 'id' | 'created_at' | 'updated_at'>) => 
      bookingPoliciesApi.create(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_POLICIES_QUERY_KEY] });
      toast.success('Política criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar política');
    },
  });
}

export function useUpdateBookingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, policy }: { id: number; policy: Partial<BookingPolicy> }) => 
      bookingPoliciesApi.update(id, policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_POLICIES_QUERY_KEY] });
      toast.success('Política atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar política');
    },
  });
}

export function useDeleteBookingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bookingPoliciesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_POLICIES_QUERY_KEY] });
      toast.success('Política removida com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover política');
    },
  });
}
