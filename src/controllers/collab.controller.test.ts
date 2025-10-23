import { Request, Response } from 'express';
import { CollabController } from '../controllers/collab.controller';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { PingRepository } from '../repositories/ping.repository';
import { mintCoin, getCachedCoinData } from '../services/zora.service';

// Mock dependencies
jest.mock('../repositories/collabPost.repository');
jest.mock('../repositories/ping.repository');
jest.mock('../services/zora.service');

const MockedCollabPostRepository = CollabPostRepository as jest.MockedClass<typeof CollabPostRepository>;
const MockedPingRepository = PingRepository as jest.MockedClass<typeof PingRepository>;
const mockMintCoin = mintCoin as jest.MockedFunction<typeof mintCoin>;
const mockGetCachedCoinData = getCachedCoinData as jest.MockedFunction<typeof getCachedCoinData>;

describe('CollabController', () => {
  let collabController: CollabController;
  let mockCollabPostRepo: jest.Mocked<CollabPostRepository>;
  let mockPingRepo: jest.Mocked<PingRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockCollabPostRepo = {
      createCollabPost: jest.fn(),
      findById: jest.fn(),
      findByWallet: jest.fn(),
      getFeed: jest.fn(),
      updateStatus: jest.fn(),
      deleteCollabPost: jest.fn(),
      findByCoinAddress: jest.fn()
    } as any;

    mockPingRepo = {
      createPing: jest.fn(),
      findById: jest.fn(),
      getReceivedPings: jest.fn(),
      updatePingStatus: jest.fn(),
      checkDuplicatePing: jest.fn(),
      getPingsByWallet: jest.fn()
    } as any;

    collabController = new CollabController(mockCollabPostRepo, mockPingRepo);

    mockReq = {
      wallet: '0x1111111111111111111111111111111111111111',
      body: {},
      query: {},
      params: {}
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should return collaboration feed', async () => {
      const mockPosts = [
        {
          id: 'collab_001',
          coinAddress: '0x1234567890123456789012345678901234567890',
          creatorWallet: '0x2222222222222222222222222222222222222222',
          role: 'Mix Engineer',
          paymentType: 'paid',
          credits: false,
          workStyle: 'freestyle',
          location: 'LA',
          status: 'open',
          collaborators: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null
        }
      ];

      const mockCoinData = {
        name: 'Test Coin',
        symbol: 'TEST',
        description: 'A test coin',
        totalSupply: '1000000',
        marketCap: '5000',
        volume24h: '250',
        creatorAddress: '0x2222222222222222222222222222222222222222',
        createdAt: '2024-01-01T00:00:00Z',
        uniqueHolders: 15,
        mediaContent: {
          previewImage: 'https://example.com/image.jpg'
        }
      };

      mockCollabPostRepo.getFeed.mockResolvedValue({
        posts: mockPosts,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });

      mockGetCachedCoinData.mockResolvedValue(mockCoinData);

      await collabController.getFeed(mockReq as Request, mockRes as Response);

      expect(mockCollabPostRepo.getFeed).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 20 },
        '0x1111111111111111111111111111111111111111'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          collabs: [
            {
              ...mockPosts[0],
              coinData: mockCoinData
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    });

    it('should apply filters from query parameters', async () => {
      mockReq.query = {
        filter: 'paid',
        location: 'remote',
        page: '2',
        limit: '10'
      };

      mockCollabPostRepo.getFeed.mockResolvedValue({
        posts: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: true
      });

      await collabController.getFeed(mockReq as Request, mockRes as Response);

      expect(mockCollabPostRepo.getFeed).toHaveBeenCalledWith(
        { paymentType: 'paid', location: 'remote' },
        { page: 2, limit: 10 },
        '0x1111111111111111111111111111111111111111'
      );
    });
  });

  describe('createCollabPost', () => {
    it('should create a collaboration post', async () => {
      const collabData = {
        role: 'Mix Engineer',
        paymentType: 'paid' as const,
        credits: false,
        workStyle: 'freestyle' as const,
        location: 'LA',
        collaborators: [{
          role: 'Mix Engineer',
          creatorType: 'indie' as const,
          credits: 25,
          compensationType: 'paid' as const,
          timeCommitment: 'one_time' as const,
          jobDescription: 'Must have experience with electronic music'
        }],
        expiresAt: '2024-03-15T23:59:59Z'
      };

      mockReq.body = collabData;

      const mockMintResult = {
        coinAddress: '0x1234567890123456789012345678901234567890',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
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

      mockMintCoin.mockResolvedValue(mockMintResult);
      mockCollabPostRepo.createCollabPost.mockResolvedValue(mockCreatedPost);

      await collabController.createCollabPost(mockReq as Request, mockRes as Response);

      expect(mockMintCoin).toHaveBeenCalledWith({
        name: collabData.role,
        symbol: collabData.role.substring(0, 5).toUpperCase(),
        description: `Collaboration opportunity: ${collabData.role}`
      });
      expect(mockCollabPostRepo.createCollabPost).toHaveBeenCalledWith(
        collabData,
        '0x1111111111111111111111111111111111111111',
        '0x1234567890123456789012345678901234567890'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'collab_001',
          coinAddress: '0x1234567890123456789012345678901234567890',
          coinMinted: true,
          message: 'Collaboration post created and Zora coin minted successfully'
        }
      });
    });

    it('should handle coin minting failure', async () => {
      const collabData = {
        role: 'Mix Engineer',
        paymentType: 'paid' as const,
        credits: false,
        workStyle: 'freestyle' as const,
        location: 'LA',
        collaborators: [{
          role: 'Mix Engineer',
          creatorType: 'indie' as const,
          credits: 25,
          compensationType: 'paid' as const,
          timeCommitment: 'one_time' as const
        }]
      };

      mockReq.body = collabData;
      mockMintCoin.mockRejectedValue(new Error('Coin minting failed'));

      await collabController.createCollabPost(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create collaboration post'
        }
      });
    });
  });

  describe('updateCollabStatus', () => {
    it('should update collaboration post status', async () => {
      mockReq.params = { collabId: 'collab_001' };
      mockReq.body = { status: 'closed' };

      const mockExistingPost = {
        id: 'collab_001',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        status: 'open'
      };

      const mockUpdatedPost = {
        id: 'collab_001',
        status: 'closed',
        updatedAt: new Date()
      };

      mockCollabPostRepo.findById.mockResolvedValue(mockExistingPost);
      mockCollabPostRepo.updateStatus.mockResolvedValue(mockUpdatedPost);

      await collabController.updateCollabStatus(mockReq as Request, mockRes as Response);

      expect(mockCollabPostRepo.findById).toHaveBeenCalledWith('collab_001');
      expect(mockCollabPostRepo.updateStatus).toHaveBeenCalledWith('collab_001', 'closed');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Collaboration post status updated'
        }
      });
    });

    it('should handle post not found', async () => {
      mockReq.params = { collabId: 'nonexistent' };
      mockReq.body = { status: 'closed' };

      mockCollabPostRepo.updateStatus.mockRejectedValue(new Error('Post not found'));

      await collabController.updateCollabStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Collaboration post not found'
        }
      });
    });
  });

  describe('pingCollabPost', () => {
    it('should create a ping for collaboration post', async () => {
      mockReq.params = { collabId: 'collab_001' };
      mockReq.body = {
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX'
      };

      const mockCollabPost = {
        id: 'collab_001',
        creatorWallet: '0x2222222222222222222222222222222222222222',
        role: 'Mix Engineer'
      };

      const mockCreatedPing = {
        id: 'ping_001',
        collabPostId: 'collab_001',
        pingedWallet: '0x1111111111111111111111111111111111111111',
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX',
        status: 'pending',
        createdAt: new Date(),
        respondedAt: null
      };

      mockCollabPostRepo.findById.mockResolvedValue(mockCollabPost);
      mockPingRepo.checkDuplicatePing.mockResolvedValue(false);
      mockPingRepo.createPing.mockResolvedValue(mockCreatedPing);

      await collabController.pingCollabPost(mockReq as Request, mockRes as Response);

      expect(mockCollabPostRepo.findById).toHaveBeenCalledWith('collab_001');
      expect(mockPingRepo.checkDuplicatePing).toHaveBeenCalledWith(
        'collab_001',
        '0x1111111111111111111111111111111111111111'
      );
      expect(mockPingRepo.createPing).toHaveBeenCalledWith({
        collabPostId: 'collab_001',
        pingedWallet: '0x1111111111111111111111111111111111111111',
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          pingId: 'ping_001',
          message: 'Ping sent successfully'
        }
      });
    });

    it('should prevent duplicate pings', async () => {
      mockReq.params = { collabId: 'collab_001' };
      mockReq.body = {
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX'
      };

      const mockCollabPost = {
        id: 'collab_001',
        creatorWallet: '0x2222222222222222222222222222222222222222',
        role: 'Mix Engineer'
      };

      mockCollabPostRepo.findById.mockResolvedValue(mockCollabPost);
      mockPingRepo.checkDuplicatePing.mockResolvedValue(true);

      await collabController.pingCollabPost(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'You have already pinged this collaboration post'
        }
      });
    });
  });
});
