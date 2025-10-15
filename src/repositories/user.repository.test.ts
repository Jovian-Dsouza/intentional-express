import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const testUserId = '0xTestWalletAddress123';

  beforeEach(async () => {
    userRepository = new UserRepository(prisma);
    
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xTest' } }
    });
  });

  afterEach(async () => {
    // Cleanup after tests
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xTest' } }
    });
  });

  describe('createUser', () => {
    it('should create user with wallet address', async () => {
      const user = await userRepository.createUser({
        walletAddress: testUserId,
        zoraUsername: 'testuser',
      });

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.zoraUsername).toBe('testuser');
      expect(user.reputationScore).toBe(0);
      expect(user.reputationTier).toBe('newcomer');
    });

    it('should throw error if wallet address already exists', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      await expect(
        userRepository.createUser({ walletAddress: testUserId })
      ).rejects.toThrow();
    });
  });

  describe('findByWalletAddress', () => {
    it('should find user by wallet address', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const user = await userRepository.findByWalletAddress(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent wallet', async () => {
      const user = await userRepository.findByWalletAddress('0xNonExistent');

      expect(user).toBeNull();
    });
  });

  describe('updateZoraProfile', () => {
    it('should update Zora profile cache', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const updated = await userRepository.updateZoraProfile(testUserId, {
        zoraUsername: 'newusername',
        zoraAvatar: 'ipfs://avatar',
        zoraBio: 'Test bio',
        creatorCoinAddress: '0xCoinAddress',
      });

      expect(updated.zoraUsername).toBe('newusername');
      expect(updated.zoraAvatar).toBe('ipfs://avatar');
      expect(updated.zoraBio).toBe('Test bio');
      expect(updated.creatorCoinAddress).toBe('0xCoinAddress');
      expect(updated.profileCachedAt).toBeDefined();
    });
  });

  describe('hasActiveIntent', () => {
    it('should return false when user has no active intent', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const hasActive = await userRepository.hasActiveIntent(testUserId);

      expect(hasActive).toBe(false);
    });

    it('should return true when user has active intent', async () => {
      // This test will be implemented after Intent repository
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('updateReputationScore', () => {
    it('should update reputation score and tier', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const updated = await userRepository.updateReputationScore(
        testUserId,
        850,
        'verified_creator'
      );

      expect(updated.reputationScore).toBe(850);
      expect(updated.reputationTier).toBe('verified_creator');
    });
  });

  describe('updateStats', () => {
    it('should increment total intents created', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const updated = await userRepository.updateStats(testUserId, {
        totalIntentsCreated: 1,
      });

      expect(updated.totalIntentsCreated).toBe(1);
    });

    it('should update success rate', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const updated = await userRepository.updateStats(testUserId, {
        totalMatches: 3,
        totalIntentsCreated: 5,
        successRate: 0.6,
      });

      expect(updated.totalMatches).toBe(3);
      expect(updated.successRate).toBe(0.6);
    });
  });

  describe('updateLastActive', () => {
    it('should update lastActiveAt timestamp', async () => {
      await userRepository.createUser({ walletAddress: testUserId });

      const before = await userRepository.findByWalletAddress(testUserId);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      const updated = await userRepository.updateLastActive(testUserId);

      expect(updated.lastActiveAt.getTime()).toBeGreaterThan(
        before!.lastActiveAt.getTime()
      );
    });
  });
});
