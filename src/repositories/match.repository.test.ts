import { PrismaClient } from '@prisma/client';
import { MatchRepository } from './match.repository';

// Mock Prisma client
const mockPrisma = {
  match: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  }
} as unknown as PrismaClient;

const matchRepo = new MatchRepository(mockPrisma);

describe('MatchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMatch', () => {
    it('should create a match from accepted ping', async () => {
      const matchData = {
        collabPostId: 'collab_001',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        collaboratorWallet: '0x2222222222222222222222222222222222222222',
        projectName: 'Neon Dream',
        role: 'VFX Artist'
      };

      const mockCreatedMatch = {
        id: 'match_001',
        ...matchData,
        status: 'active',
        createdAt: new Date(),
        lastMessageAt: new Date(),
        unreadCount: 0
      };

      mockPrisma.match.create.mockResolvedValue(mockCreatedMatch);

      const result = await matchRepo.createMatch(matchData);

      expect(mockPrisma.match.create).toHaveBeenCalledWith({
        data: matchData
      });
      expect(result).toEqual(mockCreatedMatch);
    });
  });

  describe('findById', () => {
    it('should find match by ID', async () => {
      const mockMatch = {
        id: 'match_001',
        collabPostId: 'collab_001',
        creatorWallet: '0x1111111111111111111111111111111111111111',
        collaboratorWallet: '0x2222222222222222222222222222222222222222',
        projectName: 'Neon Dream',
        role: 'VFX Artist',
        status: 'active',
        createdAt: new Date(),
        lastMessageAt: new Date(),
        unreadCount: 0,
        collabPost: {
          id: 'collab_001',
          role: 'Mix Engineer',
          coinAddress: '0x1234567890123456789012345678901234567890'
        },
        messages: []
      };

      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await matchRepo.findById('match_001');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match_001' },
        include: {
          collabPost: true,
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      expect(result).toEqual(mockMatch);
    });

    it('should return null if match not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      const result = await matchRepo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getMatchesByWallet', () => {
    it('should get matches for wallet address with pagination', async () => {
      const mockMatches = [
        {
          id: 'match_001',
          collabPostId: 'collab_001',
          creatorWallet: '0x1111111111111111111111111111111111111111',
          collaboratorWallet: '0x2222222222222222222222222222222222222222',
          projectName: 'Neon Dream',
          role: 'VFX Artist',
          status: 'active',
          createdAt: new Date(),
          lastMessageAt: new Date(),
          unreadCount: 3
        }
      ];

      mockPrisma.match.findMany.mockResolvedValue(mockMatches);
      mockPrisma.match.count.mockResolvedValue(1);

      const result = await matchRepo.getMatchesByWallet('0x1111111111111111111111111111111111111111', { page: 1, limit: 20 });

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { creatorWallet: '0x1111111111111111111111111111111111111111' },
            { collaboratorWallet: '0x1111111111111111111111111111111111111111' }
          ]
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: 0,
        take: 20
      });
      expect(result.matches).toEqual(mockMatches);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.match.findMany.mockResolvedValue([]);
      mockPrisma.match.count.mockResolvedValue(0);

      await matchRepo.getMatchesByWallet('0x1111111111111111111111111111111111111111', { page: 1, limit: 20 }, 'active');

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { creatorWallet: '0x1111111111111111111111111111111111111111' },
            { collaboratorWallet: '0x1111111111111111111111111111111111111111' }
          ],
          status: 'active'
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('updateLastMessageAt', () => {
    it('should update last message timestamp', async () => {
      const mockUpdatedMatch = {
        id: 'match_001',
        lastMessageAt: new Date('2024-01-15T16:45:00Z')
      };

      mockPrisma.match.update.mockResolvedValue(mockUpdatedMatch);

      const result = await matchRepo.updateLastMessageAt('match_001', new Date('2024-01-15T16:45:00Z'));

      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match_001' },
        data: { lastMessageAt: new Date('2024-01-15T16:45:00Z') }
      });
      expect(result).toEqual(mockUpdatedMatch);
    });
  });

  describe('updateUnreadCount', () => {
    it('should update unread message count', async () => {
      const mockUpdatedMatch = {
        id: 'match_001',
        unreadCount: 5
      };

      mockPrisma.match.update.mockResolvedValue(mockUpdatedMatch);

      const result = await matchRepo.updateUnreadCount('match_001', 5);

      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match_001' },
        data: { unreadCount: 5 }
      });
      expect(result).toEqual(mockUpdatedMatch);
    });
  });

  describe('updateMatchStatus', () => {
    it('should update match status', async () => {
      const mockUpdatedMatch = {
        id: 'match_001',
        status: 'completed'
      };

      mockPrisma.match.update.mockResolvedValue(mockUpdatedMatch);

      const result = await matchRepo.updateMatchStatus('match_001', 'completed');

      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match_001' },
        data: { status: 'completed' }
      });
      expect(result).toEqual(mockUpdatedMatch);
    });
  });

  describe('findByCollabPostAndCollaborator', () => {
    it('should find match by collab post and collaborator', async () => {
      const mockMatch = {
        id: 'match_001',
        collabPostId: 'collab_001',
        collaboratorWallet: '0x2222222222222222222222222222222222222222',
        status: 'active'
      };

      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await matchRepo.findByCollabPostAndCollaborator('collab_001', '0x2222222222222222222222222222222222222222');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: {
          collabPostId_collaboratorWallet: {
            collabPostId: 'collab_001',
            collaboratorWallet: '0x2222222222222222222222222222222222222222'
          }
        }
      });
      expect(result).toEqual(mockMatch);
    });

    it('should return null if match not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      const result = await matchRepo.findByCollabPostAndCollaborator('collab_001', '0x2222222222222222222222222222222222222222');

      expect(result).toBeNull();
    });
  });
});
