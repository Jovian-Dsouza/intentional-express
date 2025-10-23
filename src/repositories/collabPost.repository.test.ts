import { PrismaClient } from '@prisma/client';
import { CollabPostRepository } from './collabPost.repository';
import { CreateCollabInput } from '../schemas/collab.schema';

// Mock Prisma client
const mockPrisma = {
  collaborationPost: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
} as unknown as PrismaClient;

const collabPostRepo = new CollabPostRepository(mockPrisma);

describe('CollabPostRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollabPost', () => {
    it('should create a collaboration post', async () => {
      const collabData: CreateCollabInput = {
        role: 'Mix Engineer',
        paymentType: 'paid',
        credits: false,
        workStyle: 'freestyle',
        location: 'LA',
        collaborators: [{
          role: 'Mix Engineer',
          creatorType: 'indie',
          credits: 25,
          compensationType: 'paid',
          timeCommitment: 'one_time',
          jobDescription: 'Must have experience with electronic music'
        }],
        expiresAt: '2024-03-15T23:59:59Z'
      };

      const mockCreatedPost = {
        id: 'collab_001',
        coinAddress: '0x1234567890123456789012345678901234567890',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        ...collabData,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.collaborationPost.create.mockResolvedValue(mockCreatedPost);

      const result = await collabPostRepo.createCollabPost(collabData, '0x1111111111111111111111111111111111111111', '0x1234567890123456789012345678901234567890');

      expect(mockPrisma.collaborationPost.create).toHaveBeenCalledWith({
        data: {
          ...collabData,
          creatorWallet: '0x1111111111111111111111111111111111111111',
          coinAddress: '0x1234567890123456789012345678901234567890',
          expiresAt: new Date('2024-03-15T23:59:59Z')
        }
      });
      expect(result).toEqual(mockCreatedPost);
    });
  });

  describe('findById', () => {
    it('should find collaboration post by ID', async () => {
      const mockPost = {
        id: 'collab_001',
        coinAddress: '0x1234567890123456789012345678901234567890',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        role: 'Mix Engineer',
        paymentType: 'paid',
        credits: false,
        workStyle: 'freestyle',
        location: 'LA',
        status: 'open',
        collaborators: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        pings: [],
        matches: []
      };

      mockPrisma.collaborationPost.findUnique.mockResolvedValue(mockPost);

      const result = await collabPostRepo.findById('collab_001');

      expect(mockPrisma.collaborationPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'collab_001' },
        include: {
          pings: true,
          matches: true
        }
      });
      expect(result).toEqual(mockPost);
    });

    it('should return null if post not found', async () => {
      mockPrisma.collaborationPost.findUnique.mockResolvedValue(null);

      const result = await collabPostRepo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByWallet', () => {
    it('should find posts by wallet address with pagination', async () => {
      const mockPosts = [
        {
          id: 'collab_001',
          coinAddress: '0x1234567890123456789012345678901234567890',
          creatorWallet: '0x1111111111111111111111111111111111111111',
          role: 'Mix Engineer',
          status: 'open',
          createdAt: new Date()
        }
      ];

      mockPrisma.collaborationPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.collaborationPost.count.mockResolvedValue(1);

      const result = await collabPostRepo.findByWallet('0x1111111111111111111111111111111111111111', {}, { page: 1, limit: 20 });

      expect(mockPrisma.collaborationPost.findMany).toHaveBeenCalledWith({
        where: { creatorWallet: '0x1111111111111111111111111111111111111111' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
    });

    it('should apply filters when provided', async () => {
      const filters = { status: 'open', paymentType: 'paid' };
      mockPrisma.collaborationPost.findMany.mockResolvedValue([]);
      mockPrisma.collaborationPost.count.mockResolvedValue(0);

      await collabPostRepo.findByWallet('0x1111111111111111111111111111111111111111', filters, { page: 1, limit: 20 });

      expect(mockPrisma.collaborationPost.findMany).toHaveBeenCalledWith({
        where: {
          creatorWallet: '0x1111111111111111111111111111111111111111',
          status: 'open',
          paymentType: 'paid'
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('getFeed', () => {
    it('should get feed with filters and pagination', async () => {
      const mockPosts = [
        {
          id: 'collab_001',
          coinAddress: '0x1234567890123456789012345678901234567890',
          creatorWallet: '0x2222222222222222222222222222222222222222',
          role: 'Mix Engineer',
          status: 'open',
          createdAt: new Date()
        }
      ];

      mockPrisma.collaborationPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.collaborationPost.count.mockResolvedValue(1);

      const result = await collabPostRepo.getFeed({ paymentType: 'paid' }, { page: 1, limit: 20 }, '0x1111111111111111111111111111111111111111');

      expect(mockPrisma.collaborationPost.findMany).toHaveBeenCalledWith({
        where: {
          paymentType: 'paid',
          creatorWallet: { not: '0x1111111111111111111111111111111111111111' },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
    });

    it('should exclude expired posts', async () => {
      mockPrisma.collaborationPost.findMany.mockResolvedValue([]);
      mockPrisma.collaborationPost.count.mockResolvedValue(0);

      await collabPostRepo.getFeed({}, { page: 1, limit: 20 }, '0x1111111111111111111111111111111111111111');

      expect(mockPrisma.collaborationPost.findMany).toHaveBeenCalledWith({
        where: {
          creatorWallet: { not: '0x1111111111111111111111111111111111111111' },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('updateStatus', () => {
    it('should update collaboration post status', async () => {
      const mockUpdatedPost = {
        id: 'collab_001',
        status: 'closed',
        updatedAt: new Date()
      };

      mockPrisma.collaborationPost.update.mockResolvedValue(mockUpdatedPost);

      const result = await collabPostRepo.updateStatus('collab_001', 'closed');

      expect(mockPrisma.collaborationPost.update).toHaveBeenCalledWith({
        where: { id: 'collab_001' },
        data: { status: 'closed' }
      });
      expect(result).toEqual(mockUpdatedPost);
    });
  });

  describe('deleteCollabPost', () => {
    it('should delete collaboration post', async () => {
      const mockDeletedPost = {
        id: 'collab_001',
        coinAddress: '0x1234567890123456789012345678901234567890'
      };

      mockPrisma.collaborationPost.delete.mockResolvedValue(mockDeletedPost);

      const result = await collabPostRepo.deleteCollabPost('collab_001');

      expect(mockPrisma.collaborationPost.delete).toHaveBeenCalledWith({
        where: { id: 'collab_001' }
      });
      expect(result).toEqual(mockDeletedPost);
    });
  });

  describe('findByCoinAddress', () => {
    it('should find collaboration post by coin address', async () => {
      const mockPost = {
        id: 'collab_001',
        coinAddress: '0x1234567890123456789012345678901234567890',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        role: 'Mix Engineer',
        status: 'open'
      };

      mockPrisma.collaborationPost.findUnique.mockResolvedValue(mockPost);

      const result = await collabPostRepo.findByCoinAddress('0x1234567890123456789012345678901234567890');

      expect(mockPrisma.collaborationPost.findUnique).toHaveBeenCalledWith({
        where: { coinAddress: '0x1234567890123456789012345678901234567890' }
      });
      expect(result).toEqual(mockPost);
    });
  });
});
