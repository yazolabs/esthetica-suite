import { api } from '@/services/api';
import { BookingPolicy } from '@/validators/bookingPolicySchema';

export interface BookingPoliciesParams {
  scope_type?: 'company' | 'service' | 'professional';
  scope_id?: number;
  active?: boolean;
  page?: number;
  per_page?: number;
}

export interface BookingPoliciesResponse {
  data: BookingPolicy[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export const bookingPoliciesApi = {
  getAll: async (params?: BookingPoliciesParams): Promise<BookingPoliciesResponse> => {
    const response = await api.get('/booking-policies', { params });
    return response.data;
  },

  getById: async (id: number): Promise<BookingPolicy> => {
    const response = await api.get(`/booking-policies/${id}`);
    return response.data;
  },

  create: async (policy: Omit<BookingPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<BookingPolicy> => {
    const response = await api.post('/booking-policies', policy);
    return response.data;
  },

  update: async (id: number, policy: Partial<BookingPolicy>): Promise<BookingPolicy> => {
    const response = await api.patch(`/booking-policies/${id}`, policy);
    return response.data;
  },

  delete: async (id: number): Promise<{ ok: boolean }> => {
    const response = await api.delete(`/booking-policies/${id}`);
    return response.data;
  },
};
