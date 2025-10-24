import { z } from 'zod';

// Zora Wallet Address Parameter Schema
export const ZoraWalletParamSchema = z.object({
  zoraWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Zora wallet address format')
});

// Onboarding Data Schema
export const OnboardingDataSchema = z.object({
  userType: z.enum(['indie', 'commercial']),
  creativeDomains: z.array(z.string()).min(1, 'At least one creative domain is required'),
  status: z.enum(['available', 'gigs', 'collabs', 'exploring']),
  profileData: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    tagline: z.string().min(1, 'Tagline is required').max(200, 'Tagline must be less than 200 characters'),
    orgName: z.string().optional(),
    orgType: z.string().optional(),
    skills: z.array(z.string()).min(1, 'At least one skill is required').max(20, 'Maximum 20 skills allowed')
  }),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format').optional().nullable(),
  zoraWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Zora wallet address format')
});

// Type exports for TypeScript
export type ZoraWalletParam = z.infer<typeof ZoraWalletParamSchema>;
export type OnboardingData = z.infer<typeof OnboardingDataSchema>;
