import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { SwipeRepository } from './swipe.repository';
import { UserRepository } from './user.repository';
import { IntentRepository } from './intent.repository';

describe('SwipeRepository', () => {
  let swipeRepository: SwipeRepository;
  let userRepository: UserRepository;
  let intentRepository: IntentRepository;
  
  const user1Id = '0xSwipeUser1';
  const user2Id = '0xSwipeUser2';
  let intent1Id: string;
  let intent2Id: string;

  beforeEach(async () => {
    swipeRepository = new SwipeRepository(prisma);
    userRepository = new UserRepository(prisma);
    intentRepository = new IntentRepository(prisma);

    // Cleanup
    await prisma.swipe.deleteMany({
      where: { userId: { startsWith: '0xSwipe' } },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xSwipe' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xSwipe' } },
    });

    // Create test users
    await userRepository.createUser({ walletAddress: user1Id });
    await userRepository.createUser({ walletAddress: user2Id });

    // Create test intents
    const intent1 = await intentRepository.createIntent({
      userId: user1Id,
      type: 'collaboration',
      title: 'Intent 1',
      description: 'First test intent',
      visibility: 'public',
      reputationEnabled: false,
      duration: 24,
      tags: [],
      images: [],
      metadata: {},
      activationFee: '0.001',
      activationFeeUsd: '2.50',
    });

    const intent2 = await intentRepository.createIntent({
      userId: user2Id,
      type: 'collaboration',
      title: 'Intent 2',
      description: 'Second test intent',
      visibility: 'public',
      reputationEnabled: false,
      duration: 24,
      tags: [],
      images: [],
      metadata: {},
      activationFee: '0.001',
      activationFeeUsd: '2.50',
    });

    intent1Id = intent1.id;
    intent2Id = intent2.id;
  });

  afterEach(async () => {
    await prisma.swipe.deleteMany({
      where: { userId: { startsWith: '0xSwipe' } },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xSwipe' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xSwipe' } },
    });
  });

  describe('createSwipe', () => {
    it('should create right swipe', async () => {
      const swipe = await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      expect(swipe).toBeDefined();
      expect(swipe.userId).toBe(user1Id);
      expect(swipe.action).toBe('right');
      expect(swipe.targetIntentId).toBe(intent2Id);
    });

    it('should create left swipe', async () => {
      const swipe = await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'left',
      });

      expect(swipe.action).toBe('left');
    });

    it('should store metadata', async () => {
      const swipe = await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
        viewDuration: 5000,
        mediaViewed: ['image1', 'image2'],
      });

      expect(swipe.viewDuration).toBe(5000);
      expect(swipe.mediaViewed).toEqual(['image1', 'image2']);
    });

    it('should prevent duplicate swipes on same intent pair', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      await expect(
        swipeRepository.createSwipe({
          userId: user1Id,
          intentId: intent1Id,
          targetIntentId: intent2Id,
          action: 'left',
        })
      ).rejects.toThrow();
    });
  });

  describe('findSwipe', () => {
    it('should find existing swipe', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const found = await swipeRepository.findSwipe(intent1Id, intent2Id);

      expect(found).toBeDefined();
      expect(found?.intentId).toBe(intent1Id);
      expect(found?.targetIntentId).toBe(intent2Id);
    });

    it('should return null for non-existent swipe', async () => {
      const found = await swipeRepository.findSwipe(intent1Id, intent2Id);
      expect(found).toBeNull();
    });
  });

  describe('checkReciprocalSwipe', () => {
    it('should return true when reciprocal right swipe exists', async () => {
      // User1 swipes right on User2's intent
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      // User2 swipes right on User1's intent
      await swipeRepository.createSwipe({
        userId: user2Id,
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'right',
      });

      const hasReciprocal = await swipeRepository.checkReciprocalSwipe(
        intent1Id,
        intent2Id
      );

      expect(hasReciprocal).toBe(true);
    });

    it('should return false when reciprocal swipe is left', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      await swipeRepository.createSwipe({
        userId: user2Id,
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'left',
      });

      const hasReciprocal = await swipeRepository.checkReciprocalSwipe(
        intent1Id,
        intent2Id
      );

      expect(hasReciprocal).toBe(false);
    });

    it('should return false when no reciprocal swipe exists', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const hasReciprocal = await swipeRepository.checkReciprocalSwipe(
        intent1Id,
        intent2Id
      );

      expect(hasReciprocal).toBe(false);
    });
  });

  describe('getSwipesByUserId', () => {
    it('should get all swipes for user', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const swipes = await swipeRepository.getSwipesByUserId(user1Id);

      expect(swipes).toHaveLength(1);
      expect(swipes[0].userId).toBe(user1Id);
    });

    it('should return empty array when no swipes exist', async () => {
      const swipes = await swipeRepository.getSwipesByUserId(user1Id);
      expect(swipes).toHaveLength(0);
    });
  });

  describe('getSwipedIntentIds', () => {
    it('should return array of swiped intent IDs', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const swipedIds = await swipeRepository.getSwipedIntentIds(intent1Id);

      expect(swipedIds).toContain(intent2Id);
      expect(swipedIds).toHaveLength(1);
    });
  });

  describe('hasSwipedOnIntent', () => {
    it('should return true when swipe exists', async () => {
      await swipeRepository.createSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const hasSwiped = await swipeRepository.hasSwipedOnIntent(
        intent1Id,
        intent2Id
      );

      expect(hasSwiped).toBe(true);
    });

    it('should return false when no swipe exists', async () => {
      const hasSwiped = await swipeRepository.hasSwipedOnIntent(
        intent1Id,
        intent2Id
      );

      expect(hasSwiped).toBe(false);
    });
  });
});
