import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { MatchRepository } from './match.repository';
import { UserRepository } from './user.repository';
import { IntentRepository } from './intent.repository';

describe('MatchRepository', () => {
  let matchRepository: MatchRepository;
  let userRepository: UserRepository;
  let intentRepository: IntentRepository;
  
  const user1Id = '0xMatchUser1';
  const user2Id = '0xMatchUser2';
  let intent1Id: string;
  let intent2Id: string;

  beforeEach(async () => {
    matchRepository = new MatchRepository(prisma);
    userRepository = new UserRepository(prisma);
    intentRepository = new IntentRepository(prisma);

    // Cleanup
    await prisma.match.deleteMany({
      where: { 
        OR: [
          { user1Id: { startsWith: '0xMatch' } },
          { user2Id: { startsWith: '0xMatch' } },
        ],
      },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xMatch' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xMatch' } },
    });

    // Create test users and intents
    await userRepository.createUser({ walletAddress: user1Id });
    await userRepository.createUser({ walletAddress: user2Id });

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
    await prisma.match.deleteMany({
      where: { 
        OR: [
          { user1Id: { startsWith: '0xMatch' } },
          { user2Id: { startsWith: '0xMatch' } },
        ],
      },
    });
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xMatch' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xMatch' } },
    });
  });

  describe('createMatch', () => {
    it('should create match between two intents', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      expect(match).toBeDefined();
      expect(match.user1Id).toBe(user1Id);
      expect(match.user2Id).toBe(user2Id);
      expect(match.intent1Id).toBe(intent1Id);
      expect(match.intent2Id).toBe(intent2Id);
      expect(match.status).toBe('pending');
    });

    it('should set matchedAt timestamp', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      expect(match.matchedAt).toBeDefined();
      expect(match.matchedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should prevent duplicate matches', async () => {
      await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      await expect(
        matchRepository.createMatch({
          user1Id,
          user2Id,
          intent1Id,
          intent2Id,
        })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find match by id', async () => {
      const created = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const found = await matchRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await matchRepository.findById('non_existent');
      expect(found).toBeNull();
    });
  });

  describe('findByIntents', () => {
    it('should find match by intent IDs', async () => {
      await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const found = await matchRepository.findByIntents(intent1Id, intent2Id);

      expect(found).toBeDefined();
      expect(found?.intent1Id).toBe(intent1Id);
      expect(found?.intent2Id).toBe(intent2Id);
    });

    it('should return null when no match exists', async () => {
      const found = await matchRepository.findByIntents(intent1Id, intent2Id);
      expect(found).toBeNull();
    });
  });

  describe('getMatchesByUserId', () => {
    it('should get all matches for user as user1', async () => {
      await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const matches = await matchRepository.getMatchesByUserId(user1Id);

      expect(matches).toHaveLength(1);
      expect(matches[0].user1Id).toBe(user1Id);
    });

    it('should get all matches for user as user2', async () => {
      await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const matches = await matchRepository.getMatchesByUserId(user2Id);

      expect(matches).toHaveLength(1);
      expect(matches[0].user2Id).toBe(user2Id);
    });

    it('should return empty array when no matches exist', async () => {
      const matches = await matchRepository.getMatchesByUserId(user1Id);
      expect(matches).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    it('should update match status', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const updated = await matchRepository.updateStatus(match.id, 'finalizing');

      expect(updated.status).toBe('finalizing');
    });

    it('should set finalizedAt when status is finalized', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const updated = await matchRepository.updateStatus(match.id, 'finalized');

      expect(updated.status).toBe('finalized');
      expect(updated.finalizedAt).toBeDefined();
    });
  });

  describe('setFinalizeTxHash', () => {
    it('should set finalize transaction hash', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const txHash = '0x' + 'a'.repeat(64);
      const updated = await matchRepository.setFinalizeTxHash(match.id, txHash);

      expect(updated.finalizeTxHash).toBe(txHash);
    });
  });

  describe('setChatSession', () => {
    it('should set chat session details', async () => {
      const match = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const chatSessionId = 'chat_session_123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updated = await matchRepository.setChatSession(
        match.id,
        chatSessionId,
        expiresAt
      );

      expect(updated.chatSessionId).toBe(chatSessionId);
      expect(updated.chatExpiresAt).toBeDefined();
    });
  });

  describe('getMatchesByStatus', () => {
    it('should filter matches by status', async () => {
      const match1 = await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      await matchRepository.updateStatus(match1.id, 'finalized');

      const finalized = await matchRepository.getMatchesByStatus('finalized');
      const pending = await matchRepository.getMatchesByStatus('pending');

      expect(finalized).toHaveLength(1);
      expect(finalized[0].status).toBe('finalized');
      expect(pending).toHaveLength(0);
    });
  });

  describe('checkMatchExists', () => {
    it('should return true when match exists', async () => {
      await matchRepository.createMatch({
        user1Id,
        user2Id,
        intent1Id,
        intent2Id,
      });

      const exists = await matchRepository.checkMatchExists(intent1Id, intent2Id);

      expect(exists).toBe(true);
    });

    it('should return false when no match exists', async () => {
      const exists = await matchRepository.checkMatchExists(intent1Id, intent2Id);
      expect(exists).toBe(false);
    });
  });
});
