import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { MatchingService } from './matching.service';
import { SwipeRepository } from '../repositories/swipe.repository';
import { MatchRepository } from '../repositories/match.repository';
import { IntentRepository } from '../repositories/intent.repository';
import { UserRepository } from '../repositories/user.repository';

describe('MatchingService', () => {
  let matchingService: MatchingService;
  let swipeRepository: SwipeRepository;
  let matchRepository: MatchRepository;
  let intentRepository: IntentRepository;
  let userRepository: UserRepository;

  const user1Id = '0xMatchingUser1';
  const user2Id = '0xMatchingUser2';
  let intent1Id: string;
  let intent2Id: string;

  beforeEach(async () => {
    swipeRepository = new SwipeRepository(prisma);
    matchRepository = new MatchRepository(prisma);
    intentRepository = new IntentRepository(prisma);
    userRepository = new UserRepository(prisma);
    matchingService = new MatchingService(
      swipeRepository,
      matchRepository,
      intentRepository
    );

    // Cleanup
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: { startsWith: '0xMatching' } },
          { user2Id: { startsWith: '0xMatching' } },
        ],
      },
    });
    await prisma.swipe.deleteMany({
      where: { userId: { startsWith: '0xMatching' } },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xMatching' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xMatching' } },
    });

    // Create test users
    await userRepository.createUser({ walletAddress: user1Id });
    await userRepository.createUser({ walletAddress: user2Id });

    // Create and activate intents
    const intent1 = await intentRepository.createIntent({
      userId: user1Id,
      type: 'collaboration',
      title: 'Intent 1',
      description: 'First test intent for matching',
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
      description: 'Second test intent for matching',
      visibility: 'public',
      reputationEnabled: false,
      duration: 24,
      tags: [],
      images: [],
      metadata: {},
      activationFee: '0.001',
      activationFeeUsd: '2.50',
    });

    // Activate both intents
    await intentRepository.updateStatus(intent1.id, 'active');
    await intentRepository.updateStatus(intent2.id, 'active');

    intent1Id = intent1.id;
    intent2Id = intent2.id;
  });

  afterEach(async () => {
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: { startsWith: '0xMatching' } },
          { user2Id: { startsWith: '0xMatching' } },
        ],
      },
    });
    await prisma.swipe.deleteMany({
      where: { userId: { startsWith: '0xMatching' } },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xMatching' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xMatching' } },
    });
  });

  describe('processSwipe', () => {
    it('should record left swipe without creating match', async () => {
      const result = await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'left',
      });

      expect(result.swipe).toBeDefined();
      expect(result.swipe.action).toBe('left');
      expect(result.match).toBeUndefined();
      expect(result.isMatch).toBe(false);
    });

    it('should record right swipe without match when no reciprocal', async () => {
      const result = await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      expect(result.swipe.action).toBe('right');
      expect(result.match).toBeUndefined();
      expect(result.isMatch).toBe(false);
    });

    it('should create match when reciprocal right swipe exists', async () => {
      // User2 swipes right on User1's intent first
      await matchingService.processSwipe({
        userId: user2Id,
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'right',
      });

      // User1 swipes right on User2's intent - should create match
      const result = await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      expect(result.isMatch).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.match?.user1Id).toBe(user1Id);
      expect(result.match?.user2Id).toBe(user2Id);
      expect(result.match?.status).toBe('pending');
    });

    it('should fail when user has no active intent', async () => {
      // Expire the intent
      await intentRepository.updateStatus(intent1Id, 'expired');

      await expect(
        matchingService.processSwipe({
          userId: user1Id,
          intentId: intent1Id,
          targetIntentId: intent2Id,
          action: 'right',
        })
      ).rejects.toThrow('User has no active intent');
    });

    it('should fail when already swiped on target', async () => {
      await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      await expect(
        matchingService.processSwipe({
          userId: user1Id,
          intentId: intent1Id,
          targetIntentId: intent2Id,
          action: 'left',
        })
      ).rejects.toThrow('Already swiped');
    });

    it('should store swipe metadata', async () => {
      const result = await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
        viewDuration: 3000,
        mediaViewed: ['image1'],
      });

      expect(result.swipe.viewDuration).toBe(3000);
      expect(result.swipe.mediaViewed).toEqual(['image1']);
    });
  });

  describe('checkMutualMatch', () => {
    it('should return true when both swiped right', async () => {
      await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      await matchingService.processSwipe({
        userId: user2Id,
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'right',
      });

      const isMutual = await matchingService.checkMutualMatch(intent1Id, intent2Id);
      expect(isMutual).toBe(true);
    });

    it('should return false when one swiped left', async () => {
      await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      await matchingService.processSwipe({
        userId: user2Id,
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'left',
      });

      const isMutual = await matchingService.checkMutualMatch(intent1Id, intent2Id);
      expect(isMutual).toBe(false);
    });

    it('should return false when only one swipe exists', async () => {
      await matchingService.processSwipe({
        userId: user1Id,
        intentId: intent1Id,
        targetIntentId: intent2Id,
        action: 'right',
      });

      const isMutual = await matchingService.checkMutualMatch(intent1Id, intent2Id);
      expect(isMutual).toBe(false);
    });
  });

  describe('createMatch', () => {
    it('should create match record', async () => {
      const match = await matchingService.createMatch(intent1Id, intent2Id);

      expect(match).toBeDefined();
      expect(match.intent1Id).toBe(intent1Id);
      expect(match.intent2Id).toBe(intent2Id);
      expect(match.status).toBe('pending');
    });

    it('should fail when match already exists', async () => {
      await matchingService.createMatch(intent1Id, intent2Id);

      await expect(
        matchingService.createMatch(intent1Id, intent2Id)
      ).rejects.toThrow();
    });

    it('should fail when one intent is not active', async () => {
      await intentRepository.updateStatus(intent1Id, 'expired');

      await expect(
        matchingService.createMatch(intent1Id, intent2Id)
      ).rejects.toThrow('Both intents must be active');
    });
  });

  describe('finalizeMatch', () => {
    it('should finalize match and burn intents', async () => {
      const match = await matchingService.createMatch(intent1Id, intent2Id);

      const mockTxHash = '0x' + 'a'.repeat(64);
      const finalized = await matchingService.finalizeMatch(match.id, mockTxHash);

      expect(finalized.status).toBe('finalized');
      expect(finalized.finalizeTxHash).toBe(mockTxHash);
      expect(finalized.finalizedAt).toBeDefined();

      // Check intents are marked as matched
      const intent1 = await intentRepository.findById(intent1Id);
      const intent2 = await intentRepository.findById(intent2Id);

      expect(intent1?.status).toBe('matched');
      expect(intent2?.status).toBe('matched');
    });

    it('should fail when match is already finalized', async () => {
      const match = await matchingService.createMatch(intent1Id, intent2Id);
      const mockTxHash = '0x' + 'a'.repeat(64);
      
      await matchingService.finalizeMatch(match.id, mockTxHash);

      await expect(
        matchingService.finalizeMatch(match.id, mockTxHash)
      ).rejects.toThrow('Match already finalized');
    });

    it('should fail when match does not exist', async () => {
      await expect(
        matchingService.finalizeMatch('non_existent', '0x' + 'a'.repeat(64))
      ).rejects.toThrow('Match not found');
    });
  });

  describe('getMatchesForUser', () => {
    it('should return all matches for user', async () => {
      await matchingService.createMatch(intent1Id, intent2Id);

      const matches = await matchingService.getMatchesForUser(user1Id);

      expect(matches).toHaveLength(1);
      expect(matches[0].user1Id).toBe(user1Id);
    });

    it('should return empty array when no matches', async () => {
      const matches = await matchingService.getMatchesForUser(user1Id);
      expect(matches).toHaveLength(0);
    });
  });
});
