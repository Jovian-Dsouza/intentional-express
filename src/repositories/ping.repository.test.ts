import { PrismaClient } from '@prisma/client';
import { PingRepository } from './ping.repository';

// Mock Prisma client
const mockPrisma = {
  ping: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  }
} as unknown as PrismaClient;

const pingRepo = new PingRepository(mockPrisma);

describe('PingRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPing', () => {
    it('should create a ping', async () => {
      const pingData = {
        collabPostId: 'collab_001',
        pingedWallet: '0x2222222222222222222222222222222222222222',
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX'
      };

      const mockCreatedPing = {
        id: 'ping_001',
        ...pingData,
        status: 'pending',
        createdAt: new Date(),
        respondedAt: null
      };

      mockPrisma.ping.create.mockResolvedValue(mockCreatedPing);

      const result = await pingRepo.createPing(pingData);

      expect(mockPrisma.ping.create).toHaveBeenCalledWith({
        data: pingData
      });
      expect(result).toEqual(mockCreatedPing);
    });
  });

  describe('findById', () => {
    it('should find ping by ID', async () => {
      const mockPing = {
        id: 'ping_001',
        collabPostId: 'collab_001',
        pingedWallet: '0x2222222222222222222222222222222222222222',
        interestedRole: '3D Artist',
        bio: '5 years of experience',
        status: 'pending',
        createdAt: new Date(),
        respondedAt: null,
        collabPost: {
          id: 'collab_001',
          role: 'Mix Engineer',
          creatorWallet: '0x1111111111111111111111111111111111111111'
        }
      };

      mockPrisma.ping.findUnique.mockResolvedValue(mockPing);

      const result = await pingRepo.findById('ping_001');

      expect(mockPrisma.ping.findUnique).toHaveBeenCalledWith({
        where: { id: 'ping_001' },
        include: {
          collabPost: true
        }
      });
      expect(result).toEqual(mockPing);
    });

    it('should return null if ping not found', async () => {
      mockPrisma.ping.findUnique.mockResolvedValue(null);

      const result = await pingRepo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getReceivedPings', () => {
    it('should get pings received on user posts with pagination', async () => {
      const mockPings = [
        {
          id: 'ping_001',
          collabPostId: 'collab_001',
          pingedWallet: '0x2222222222222222222222222222222222222222',
          interestedRole: '3D Artist',
          bio: '5 years of experience',
          status: 'pending',
          createdAt: new Date(),
          collabPost: {
            id: 'collab_001',
            role: 'Mix Engineer',
            coinAddress: '0x1234567890123456789012345678901234567890'
          }
        }
      ];

      mockPrisma.ping.findMany.mockResolvedValue(mockPings);
      mockPrisma.ping.count.mockResolvedValue(1);

      const result = await pingRepo.getReceivedPings('0x1111111111111111111111111111111111111111', { page: 1, limit: 20 });

      expect(mockPrisma.ping.findMany).toHaveBeenCalledWith({
        where: {
          collabPost: {
            creatorWallet: '0x1111111111111111111111111111111111111111'
          }
        },
        include: {
          collabPost: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
      expect(result.pings).toEqual(mockPings);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockPrisma.ping.findMany.mockResolvedValue([]);
      mockPrisma.ping.count.mockResolvedValue(0);

      await pingRepo.getReceivedPings('0x1111111111111111111111111111111111111111', { page: 1, limit: 20 }, 'pending');

      expect(mockPrisma.ping.findMany).toHaveBeenCalledWith({
        where: {
          collabPost: {
            creatorWallet: '0x1111111111111111111111111111111111111111'
          },
          status: 'pending'
        },
        include: {
          collabPost: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('updatePingStatus', () => {
    it('should update ping status to accepted', async () => {
      const mockUpdatedPing = {
        id: 'ping_001',
        status: 'accepted',
        respondedAt: new Date()
      };

      mockPrisma.ping.update.mockResolvedValue(mockUpdatedPing);

      const result = await pingRepo.updatePingStatus('ping_001', 'accepted');

      expect(mockPrisma.ping.update).toHaveBeenCalledWith({
        where: { id: 'ping_001' },
        data: {
          status: 'accepted',
          respondedAt: expect.any(Date)
        }
      });
      expect(result).toEqual(mockUpdatedPing);
    });

    it('should update ping status to declined', async () => {
      const mockUpdatedPing = {
        id: 'ping_001',
        status: 'declined',
        respondedAt: new Date()
      };

      mockPrisma.ping.update.mockResolvedValue(mockUpdatedPing);

      const result = await pingRepo.updatePingStatus('ping_001', 'declined');

      expect(mockPrisma.ping.update).toHaveBeenCalledWith({
        where: { id: 'ping_001' },
        data: {
          status: 'declined',
          respondedAt: expect.any(Date)
        }
      });
      expect(result).toEqual(mockUpdatedPing);
    });
  });

  describe('checkDuplicatePing', () => {
    it('should return true if duplicate ping exists', async () => {
      const mockExistingPing = {
        id: 'ping_001',
        collabPostId: 'collab_001',
        pingedWallet: '0x2222222222222222222222222222222222222222'
      };

      mockPrisma.ping.findUnique.mockResolvedValue(mockExistingPing);

      const result = await pingRepo.checkDuplicatePing('collab_001', '0x2222222222222222222222222222222222222222');

      expect(mockPrisma.ping.findUnique).toHaveBeenCalledWith({
        where: {
          collabPostId_pingedWallet: {
            collabPostId: 'collab_001',
            pingedWallet: '0x2222222222222222222222222222222222222222'
          }
        }
      });
      expect(result).toBe(true);
    });

    it('should return false if no duplicate ping exists', async () => {
      mockPrisma.ping.findUnique.mockResolvedValue(null);

      const result = await pingRepo.checkDuplicatePing('collab_001', '0x2222222222222222222222222222222222222222');

      expect(result).toBe(false);
    });
  });

  describe('getPingsByWallet', () => {
    it('should get pings sent by wallet address', async () => {
      const mockPings = [
        {
          id: 'ping_001',
          collabPostId: 'collab_001',
          pingedWallet: '0x2222222222222222222222222222222222222222',
          status: 'pending',
          createdAt: new Date()
        }
      ];

      mockPrisma.ping.findMany.mockResolvedValue(mockPings);

      const result = await pingRepo.getPingsByWallet('0x2222222222222222222222222222222222222222');

      expect(mockPrisma.ping.findMany).toHaveBeenCalledWith({
        where: { pingedWallet: '0x2222222222222222222222222222222222222222' },
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(mockPings);
    });
  });
});
