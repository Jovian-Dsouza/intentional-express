import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../lib/prisma';
import { IntentRepository } from './intent.repository';
import { UserRepository } from './user.repository';

describe('IntentRepository', () => {
  let intentRepository: IntentRepository;
  let userRepository: UserRepository;
  const testUserId = '0xTestIntentUser123';
  const testUserId2 = '0xTestIntentUser456';

  beforeEach(async () => {
    intentRepository = new IntentRepository(prisma);
    userRepository = new UserRepository(prisma);

    // Clean up test data
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xTest' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xTest' } },
    });

    // Create test users
    await userRepository.createUser({ walletAddress: testUserId });
    await userRepository.createUser({ walletAddress: testUserId2 });
  });

  afterEach(async () => {
    await prisma.intent.deleteMany({
      where: { userId: { startsWith: '0xTest' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: '0xTest' } },
    });
  });

  describe('createIntent', () => {
    it('should create intent with valid data', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent for collaboration',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: ['test', 'collaboration'],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      expect(intent).toBeDefined();
      expect(intent.userId).toBe(testUserId);
      expect(intent.type).toBe('collaboration');
      expect(intent.status).toBe('pending_payment');
      expect(intent.expiresAt).toBeDefined();
    });

    it('should set correct expiry time based on duration', async () => {
      const duration = 48; // 48 hours
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'hiring',
        title: 'Hiring Developer',
        description: 'Looking for a full-stack developer',
        visibility: 'public',
        reputationEnabled: false,
        duration,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const expectedExpiry = new Date(Date.now() + duration * 60 * 60 * 1000);
      const expiryDiff = Math.abs(intent.expiresAt.getTime() - expectedExpiry.getTime());
      
      // Allow 1 second difference for test execution time
      expect(expiryDiff).toBeLessThan(1000);
    });

    it('should store media as JSON', async () => {
      const images = [
        {
          ipfsHash: 'QmTest123',
          url: 'ipfs://QmTest123',
          mimeType: 'image/jpeg',
          size: 1024,
        },
      ];

      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'networking',
        title: 'Networking Event',
        description: 'Join us for a networking event',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: ['networking'],
        images,
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      expect(Array.isArray(intent.images)).toBe(true);
      expect(intent.images).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should find intent by id', async () => {
      const created = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const found = await intentRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Test Intent');
    });

    it('should return null for non-existent id', async () => {
      const found = await intentRepository.findById('non_existent_id');
      expect(found).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active intent for user', async () => {
      await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Active Intent',
        description: 'This intent is active',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const active = await intentRepository.findActiveByUserId(testUserId);

      expect(active).toBeDefined();
      expect(active?.userId).toBe(testUserId);
      expect(active?.status).toBe('pending_payment');
    });

    it('should return null when no active intent exists', async () => {
      const active = await intentRepository.findActiveByUserId(testUserId);
      expect(active).toBeNull();
    });

    it('should not return expired intents', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Expired Intent',
        description: 'This will be expired',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      // Manually set expiry to past
      await prisma.intent.update({
        where: { id: intent.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const active = await intentRepository.findActiveByUserId(testUserId);
      expect(active).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update intent status', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const updated = await intentRepository.updateStatus(intent.id, 'active');

      expect(updated.status).toBe('active');
      expect(updated.publishedAt).toBeDefined();
    });

    it('should set publishedAt when status changes to active', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const updated = await intentRepository.updateStatus(intent.id, 'active');

      expect(updated.publishedAt).toBeDefined();
      expect(updated.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('updateIntent', () => {
    it('should update allowed fields', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Original Title',
        description: 'Original description',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: ['original'],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const updated = await intentRepository.updateIntent(intent.id, {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated', 'new'],
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.tags).toEqual(['updated', 'new']);
    });
  });

  describe('getIntentsByStatus', () => {
    beforeEach(async () => {
      // Create multiple intents with different statuses
      const intent1 = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Intent 1',
        description: 'First intent',
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
        userId: testUserId2,
        type: 'hiring',
        title: 'Intent 2',
        description: 'Second intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      // Activate one
      await intentRepository.updateStatus(intent1.id, 'active');
    });

    it('should get intents by status', async () => {
      const activeIntents = await intentRepository.getIntentsByStatus('active');
      const pendingIntents = await intentRepository.getIntentsByStatus('pending_payment');

      expect(activeIntents.length).toBeGreaterThan(0);
      expect(pendingIntents.length).toBeGreaterThan(0);
      expect(activeIntents.every(i => i.status === 'active')).toBe(true);
      expect(pendingIntents.every(i => i.status === 'pending_payment')).toBe(true);
    });

    it('should exclude expired intents', async () => {
      const activeIntents = await intentRepository.getIntentsByStatus('active');
      
      expect(activeIntents.every(i => i.expiresAt > new Date())).toBe(true);
    });
  });

  describe('confirmPayment', () => {
    it('should update payment details and status', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const txHash = '0x' + 'a'.repeat(64);
      const updated = await intentRepository.confirmPayment(intent.id, txHash);

      expect(updated.paymentTxHash).toBe(txHash);
      expect(updated.status).toBe('active');
      expect(updated.publishedAt).toBeDefined();
    });
  });

  describe('setOnChainTxHash', () => {
    it('should set on-chain transaction hash', async () => {
      const intent = await intentRepository.createIntent({
        userId: testUserId,
        type: 'collaboration',
        title: 'Test Intent',
        description: 'This is a test intent',
        visibility: 'public',
        reputationEnabled: false,
        duration: 24,
        tags: [],
        images: [],
        metadata: {},
        activationFee: '0.001',
        activationFeeUsd: '2.50',
      });

      const txHash = '0x' + 'b'.repeat(64);
      const updated = await intentRepository.setOnChainTxHash(intent.id, txHash);

      expect(updated.onChainTxHash).toBe(txHash);
    });
  });
});
