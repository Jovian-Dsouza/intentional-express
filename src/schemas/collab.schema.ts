import { z } from 'zod';

// Media Schema
export const MediaSchema = z.object({
  ipfsUrl: z.string().min(1),
  gatewayUrl: z.string().url(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive()
});

// Budget Schema
export const BudgetSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().optional()
});

// Metadata Schema
export const MetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  estimatedDuration: z.string().optional(),
  budget: BudgetSchema.optional()
});

// Collaborator Role Schema
export const CollaboratorRoleSchema = z.object({
  role: z.string().min(1).max(100),
  creatorType: z.enum(['indie', 'org', 'brand']),
  credits: z.number().min(0).max(100),
  compensationType: z.enum(['paid', 'barter', 'both']),
  timeCommitment: z.enum(['ongoing', 'one-time']),
  jobDescription: z.string().max(500).optional()
});

// Collaboration Schema
export const CollaborationSchema = z.object({
  collaborators: z.array(CollaboratorRoleSchema).min(1).max(10),
  expiresAt: z.string().datetime().optional()
});

// Mint PostCoin Schema - New main schema for the API
export const MintPostCoinSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  media: MediaSchema,
  collaboration: CollaborationSchema,
  creatorWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
  metadata: MetadataSchema.optional()
});

// Create Collaboration Post Schema - Legacy schema (kept for backwards compatibility)
export const CreateCollabSchema = z.object({
  role: z.string().min(1).max(100),
  paymentType: z.enum(['paid', 'barter', 'both']),
  credits: z.number().min(0).max(100),
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
export type MintPostCoinInput = z.infer<typeof MintPostCoinSchema>;
export type CreateCollabInput = z.infer<typeof CreateCollabSchema>;
export type PingCollabInput = z.infer<typeof PingCollabSchema>;
export type RespondToPingInput = z.infer<typeof RespondToPingSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UpdateCollabStatusInput = z.infer<typeof UpdateCollabStatusSchema>;
export type FeedQueryInput = z.infer<typeof FeedQuerySchema>;
export type CollaboratorRole = z.infer<typeof CollaboratorRoleSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
