import { z } from 'zod';

// Enums
export const IntentTypeSchema = z.enum([
  'collaboration',
  'hiring',
  'networking',
  'dating',
]);

export const VisibilitySchema = z.enum(['public', 'private']);

export const SwipeActionSchema = z.enum(['right', 'left']);

// Media schemas
export const MediaURLSchema = z.object({
  url: z.string().url('Invalid URL format'),
  mimeType: z.string(),
});

export const MediaInputSchema = z.object({
  images: z
    .array(MediaURLSchema)
    .max(3, 'Maximum 3 images allowed')
    .optional(),
  video: MediaURLSchema.optional(),
});

// Create Intent Input Schema
export const CreateIntentSchema = z.object({
  type: IntentTypeSchema,
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  visibility: VisibilitySchema.default('public'),
  reputationEnabled: z.boolean().default(false),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(168, 'Duration cannot exceed 168 hours (7 days)')
    .default(24),
  tags: z
    .array(z.string())
    .max(5, 'Maximum 5 tags allowed')
    .default([]),
  media: MediaInputSchema,
  metadata: z.record(z.any()).optional(),
});

// Update Intent Schema
export const UpdateIntentSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(100)
    .optional(),
  description: z
    .string()
    .min(10)
    .max(500)
    .optional(),
  tags: z
    .array(z.string())
    .max(5)
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Confirm Payment Schema
export const ConfirmPaymentSchema = z.object({
  transactionHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  network: z.literal('zora-mainnet'),
});

// Swipe Action Schema
export const SwipeInputSchema = z.object({
  targetIntentId: z.string().cuid('Invalid intent ID'),
  action: SwipeActionSchema,
  viewDuration: z.number().min(0).optional(),
  mediaViewed: z.array(z.string()).optional(),
});

// Query schemas
export const FeedQuerySchema = z.object({
  type: IntentTypeSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  reputationFilter: z.boolean().default(false),
});

export const MatchQuerySchema = z.object({
  status: z.enum(['pending', 'finalizing', 'finalized', 'expired']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// Type exports
export type CreateIntentInput = z.infer<typeof CreateIntentSchema>;
export type UpdateIntentInput = z.infer<typeof UpdateIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>;
export type SwipeInput = z.infer<typeof SwipeInputSchema>;
export type FeedQuery = z.infer<typeof FeedQuerySchema>;
export type MatchQuery = z.infer<typeof MatchQuerySchema>;
