import { z } from "zod";

export const StartWindowSchema = z.object({
  label: z.string().min(1, "Label é obrigatório"),
  latest_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:MM"),
});

export const DurationRuleSchema = z.object({
  min_duration: z.number().int().nonnegative("Duração mínima deve ser >= 0"),
  max_duration: z.number().int().positive("Duração máxima deve ser > 0"),
  start_windows: z.array(StartWindowSchema).min(1, "Pelo menos uma janela de início"),
}).refine(r => r.max_duration >= r.min_duration, { 
  message: "Duração máxima deve ser >= duração mínima",
  path: ["max_duration"]
});

export const FinishConstraintsSchema = z.object({
  must_finish_before_shift_end: z.boolean().default(true),
  respect_breaks: z.enum(["respect", "exception", "merge"]).default("exception"),
  break_exception_minutes: z.number().int().min(0).max(120).default(30),
});

export const WeekdayRulesSchema = z.object({
  allowed_dow: z.array(z.number().int().min(0).max(6)).min(1, "Selecione pelo menos um dia"),
  blackout_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
});

export const OverbookingSchema = z.object({
  max_parallel_per_professional: z.number().int().min(1).max(10).default(1),
});

export const BookingParamsSchema = z.object({
  slot_granularity_min: z.number().int().min(5).max(120).default(15),
  min_lead_time_min: z.number().int().min(0).max(10080).default(60), // max 7 days
  max_horizon_days: z.number().int().min(1).max(365).default(180),
  buffer_before_min: z.number().int().min(0).max(240).default(0),
  buffer_after_min: z.number().int().min(0).max(240).default(0),
  duration_windows: z.array(DurationRuleSchema).min(1, "Pelo menos uma regra de duração"),
  finish_constraints: FinishConstraintsSchema,
  weekday_rules: WeekdayRulesSchema,
  overbooking: OverbookingSchema,
});

export const BookingPolicySchema = z.object({
  id: z.number().optional(),
  scope_type: z.enum(["company", "service", "professional"]),
  scope_id: z.number().int().optional().nullable(),
  priority: z.number().int().min(0).max(999).default(100),
  effective_from: z.string().optional().nullable(),
  effective_to: z.string().optional().nullable(),
  active: z.boolean().default(true),
  params: BookingParamsSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).refine(p => p.scope_type === "company" || !!p.scope_id, {
  message: "ID do escopo é obrigatório para serviço/profissional",
  path: ["scope_id"]
});

export type StartWindow = z.infer<typeof StartWindowSchema>;
export type DurationRule = z.infer<typeof DurationRuleSchema>;
export type FinishConstraints = z.infer<typeof FinishConstraintsSchema>;
export type WeekdayRules = z.infer<typeof WeekdayRulesSchema>;
export type Overbooking = z.infer<typeof OverbookingSchema>;
export type BookingParams = z.infer<typeof BookingParamsSchema>;
export type BookingPolicy = z.infer<typeof BookingPolicySchema>;

export const defaultBookingParams: BookingParams = {
  slot_granularity_min: 15,
  min_lead_time_min: 60,
  max_horizon_days: 90,
  buffer_before_min: 0,
  buffer_after_min: 0,
  duration_windows: [
    { 
      min_duration: 0, 
      max_duration: 60, 
      start_windows: [{ label: "geral", latest_start: "18:00" }] 
    }
  ],
  finish_constraints: { 
    must_finish_before_shift_end: true, 
    respect_breaks: "exception", 
    break_exception_minutes: 30 
  },
  weekday_rules: { 
    allowed_dow: [1, 2, 3, 4, 5, 6], 
    blackout_dates: [] 
  },
  overbooking: { 
    max_parallel_per_professional: 1 
  },
};

export const defaultBookingPolicy = {
  scope_type: "company" as const,
  scope_id: null as number | null | undefined,
  priority: 100,
  effective_from: null as string | null | undefined,
  effective_to: null as string | null | undefined,
  active: true,
  params: defaultBookingParams,
};
