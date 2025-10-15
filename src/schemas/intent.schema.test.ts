import { describe, it, expect } from '@jest/globals';
import {
  CreateIntentSchema,
  UpdateIntentSchema,
  ConfirmPaymentSchema,
  SwipeInputSchema,
  FeedQuerySchema,
} from './intent.schema';

describe('Intent Validation Schemas', () => {
  describe('CreateIntentSchema', () => {
    const validInput = {
      type: 'collaboration' as const,
      title: 'Looking for a designer',
      description: 'Need help with UI/UX design for a new project',
      visibility: 'public' as const,
      reputationEnabled: false,
      duration: 24,
      tags: ['design', 'ui', 'collaboration'],
      media: {
        images: [{ url: 'https://example.com/image.jpg', mimeType: 'image/jpeg' }],
      },
    };

    it('should validate correct input', () => {
      const result = CreateIntentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid intent type', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject title shorter than 3 characters', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        title: 'ab',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject title longer than 100 characters', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        title: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('not exceed 100 characters');
      }
    });

    it('should reject description shorter than 10 characters', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        description: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 500 characters', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 tags', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Maximum 5 tags');
      }
    });

    it('should reject duration less than 1 hour', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        duration: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject duration more than 168 hours', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        duration: 169,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid media URL', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        media: {
          images: [{ url: 'not-a-url', mimeType: 'image/jpeg' }],
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 3 images', () => {
      const result = CreateIntentSchema.safeParse({
        ...validInput,
        media: {
          images: [
            { url: 'https://example.com/1.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/2.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/3.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/4.jpg', mimeType: 'image/jpeg' },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalInput = {
        type: 'collaboration' as const,
        title: 'Test Title',
        description: 'Test Description for validation',
        media: {},
      };
      const result = CreateIntentSchema.safeParse(minimalInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe('public');
        expect(result.data.reputationEnabled).toBe(false);
        expect(result.data.duration).toBe(24);
        expect(result.data.tags).toEqual([]);
      }
    });
  });

  describe('UpdateIntentSchema', () => {
    it('should validate partial update', () => {
      const result = UpdateIntentSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid title length', () => {
      const result = UpdateIntentSchema.safeParse({
        title: 'ab',
      });
      expect(result.success).toBe(false);
    });

    it('should allow empty object', () => {
      const result = UpdateIntentSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('ConfirmPaymentSchema', () => {
    it('should validate correct transaction hash', () => {
      const result = ConfirmPaymentSchema.safeParse({
        transactionHash: '0x' + 'a'.repeat(64),
        network: 'zora-mainnet',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid transaction hash format', () => {
      const result = ConfirmPaymentSchema.safeParse({
        transactionHash: 'invalid',
        network: 'zora-mainnet',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-zora network', () => {
      const result = ConfirmPaymentSchema.safeParse({
        transactionHash: '0x' + 'a'.repeat(64),
        network: 'ethereum',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SwipeInputSchema', () => {
    it('should validate right swipe', () => {
      const result = SwipeInputSchema.safeParse({
        targetIntentId: 'clx123abc',
        action: 'right',
      });
      expect(result.success).toBe(true);
    });

    it('should validate left swipe', () => {
      const result = SwipeInputSchema.safeParse({
        targetIntentId: 'clx123abc',
        action: 'left',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = SwipeInputSchema.safeParse({
        targetIntentId: 'clx123abc',
        action: 'up',
      });
      expect(result.success).toBe(false);
    });

    it('should validate with optional metadata', () => {
      const result = SwipeInputSchema.safeParse({
        targetIntentId: 'clx123abc',
        action: 'right',
        viewDuration: 5000,
        mediaViewed: ['image1', 'image2'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('FeedQuerySchema', () => {
    it('should apply default values', () => {
      const result = FeedQuerySchema.safeParse({});
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.reputationFilter).toBe(false);
      }
    });

    it('should validate with type filter', () => {
      const result = FeedQuerySchema.safeParse({
        type: 'collaboration',
      });
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers to numbers', () => {
      const result = FeedQuerySchema.safeParse({
        page: '2',
        limit: '10',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit greater than 50', () => {
      const result = FeedQuerySchema.safeParse({
        limit: 51,
      });
      expect(result.success).toBe(false);
    });
  });
});
