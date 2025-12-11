import { useQuery } from '@tanstack/react-query';
import { bookingPoliciesApi, BookingPoliciesParams } from '@/api/bookingPolicies';

export const BOOKING_POLICIES_QUERY_KEY = 'booking-policies';

export function useBookingPoliciesQuery(params?: BookingPoliciesParams) {
  return useQuery({
    queryKey: [BOOKING_POLICIES_QUERY_KEY, params],
    queryFn: () => bookingPoliciesApi.getAll(params),
  });
}

export function useBookingPolicyQuery(id: number | null) {
  return useQuery({
    queryKey: [BOOKING_POLICIES_QUERY_KEY, id],
    queryFn: () => bookingPoliciesApi.getById(id!),
    enabled: !!id,
  });
}
