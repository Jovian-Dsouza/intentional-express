import { z } from 'zod';

// Collaborator Role Schema
export const CollaboratorRoleSchema = z.object({
  role: z.string().min(1).max(100),
  creatorType: z.enum(['indie', 'org', 'brand']),
  credits: z.number().min(0).max(100),
  compensationType: z.enum(['paid', 'barter', 'both']),
  timeCommitment: z.enum(['ongoing', 'one_time']),
  jobDescription: z.string().max(500).optional()
});

// Create Collaboration Post Schema
export const CreateCollabSchema = z.object({
  role: z.string().min(1).max(100),
  paymentType: z.enum(['paid', 'barter', 'both']),
  credits: z.boolean(),
  workStyle: z.enum(['contract', 'freestyle']),
  location: z.string().min(1).max(100),
  collaborators: z.array(CollaboratorRoleSchema).min(1).max(10),
  expiresAt: z.string().datetime().optional()
});

// Ping Collaboration Schema
export const PingCollabSchema = z.object({
  interestedRole: z.string().min(1).max(100),
  bio: z.string().min(10).max(500)
});

// Respond to Ping Schema
export const RespondToPingSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

// Send Message Schema
export const SendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  messageType: z.enum(['text', 'image', 'file', 'milestone']).default('text'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileType: z.string(),
    fileSize: z.number().positive()
  })).optional()
});

// Update Collaboration Status Schema
export const UpdateCollabStatusSchema = z.object({
  status: z.enum(['open', 'shortlisted', 'signed', 'closed'])
});

// Feed Query Schema
export const FeedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  filter: z.enum(['paid', 'barter', 'credits', 'contract', 'freestyle', 'remote']).optional(),
  location: z.string().optional(),
  excludeUser: z.string().optional()
});

// Wallet Address Schema
export const WalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format');

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

// Type exports for TypeScript
export type CreateCollabInput = z.infer<typeof CreateCollabSchema>;
export type PingCollabInput = z.infer<typeof PingCollabSchema>;
export type RespondToPingInput = z.infer<typeof RespondToPingSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UpdateCollabStatusInput = z.infer<typeof UpdateCollabStatusSchema>;
export type FeedQueryInput = z.infer<typeof FeedQuerySchema>;
export type CollaboratorRole = z.infer<typeof CollaboratorRoleSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
