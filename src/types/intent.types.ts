// Type definitions for Intent domain

export type IntentType = 'collaboration' | 'hiring' | 'networking' | 'dating';
export type Visibility = 'public' | 'private';
export type IntentStatus = 'pending_payment' | 'active' | 'matched' | 'expired' | 'burned';
export type SwipeAction = 'right' | 'left';
export type MatchStatus = 'pending' | 'finalizing' | 'finalized' | 'expired';

export interface IPFSMedia {
  ipfsHash: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
  originalUrl?: string;
}

export interface CreateIntentInput {
  type: IntentType;
  title: string;
  description: string;
  visibility: Visibility;
  reputationEnabled: boolean;
  duration: number; // hours
  tags: string[];
  media: {
    images?: Array<{ url: string; mimeType: string }>;
    video?: { url: string; mimeType: string };
  };
  metadata?: Record<string, any>;
}

export interface SwipeMetadata {
  viewDuration?: number;
  mediaViewed?: string[];
  timestamp?: string;
}

export interface MediaUploadResult {
  images: IPFSMedia[];
  video?: IPFSMedia;
  totalSize: number;
}

export interface ActivationFee {
  amount: string;
  currency: string;
  usdEquivalent: string;
  paymentAddress: string;
  expiresAt: Date;
}
