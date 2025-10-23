import { PrismaClient } from '@prisma/client';
import { MessageRepository } from './message.repository';

// Mock Prisma client
const mockPrisma = {
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn()
  }
} as unknown as PrismaClient;

const messageRepo = new MessageRepository(mockPrisma);

describe('MessageRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a text message', async () => {
      const messageData = {
        matchId: 'match_001',
        senderWallet: '0x1111111111111111111111111111111111111111',
        content: 'Looking forward to working together!',
        messageType: 'text' as const,
        attachments: []
      };

      const mockCreatedMessage = {
        id: 'msg_001',
        ...messageData,
        createdAt: new Date(),
        readAt: null
      };

      mockPrisma.message.create.mockResolvedValue(mockCreatedMessage);

      const result = await messageRepo.createMessage(messageData);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: messageData
      });
      expect(result).toEqual(mockCreatedMessage);
    });

    it('should create a message with attachments', async () => {
      const messageData = {
        matchId: 'match_001',
        senderWallet: '0x1111111111111111111111111111111111111111',
        content: 'Here are the files',
        messageType: 'file' as const,
        attachments: [{
          fileName: 'project.zip',
          fileUrl: 'https://example.com/file.zip',
          fileType: 'application/zip',
          fileSize: 1024000
        }]
      };

      const mockCreatedMessage = {
        id: 'msg_001',
        ...messageData,
        createdAt: new Date(),
        readAt: null
      };

      mockPrisma.message.create.mockResolvedValue(mockCreatedMessage);

      const result = await messageRepo.createMessage(messageData);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: messageData
      });
      expect(result).toEqual(mockCreatedMessage);
    });
  });

  describe('getMessagesByMatch', () => {
    it('should get messages for a match with pagination', async () => {
      const mockMessages = [
        {
          id: 'msg_001',
          matchId: 'match_001',
          senderWallet: '0x1111111111111111111111111111111111111111',
          content: 'Hello!',
          messageType: 'text',
          createdAt: new Date('2024-01-15T16:45:00Z'),
          readAt: null
        },
        {
          id: 'msg_002',
          matchId: 'match_001',
          senderWallet: '0x2222222222222222222222222222222222222222',
          content: 'Hi there!',
          messageType: 'text',
          createdAt: new Date('2024-01-15T16:50:00Z'),
          readAt: new Date('2024-01-15T16:50:00Z')
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);
      mockPrisma.message.count.mockResolvedValue(2);

      const result = await messageRepo.getMessagesByMatch('match_001', { page: 1, limit: 50 });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { matchId: 'match_001' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50
      });
      expect(result.messages).toEqual(mockMessages);
      expect(result.total).toBe(2);
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockPrisma.message.count.mockResolvedValue(25);

      const result = await messageRepo.getMessagesByMatch('match_001', { page: 2, limit: 10 });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { matchId: 'match_001' },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page - 1) * limit
        take: 10
      });
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read for a specific wallet', async () => {
      mockPrisma.message.updateMany.mockResolvedValue({ count: 3 });

      const result = await messageRepo.markAsRead('match_001', '0x1111111111111111111111111111111111111111');

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          matchId: 'match_001',
          senderWallet: { not: '0x1111111111111111111111111111111111111111' },
          readAt: null
        },
        data: { readAt: expect.any(Date) }
      });
      expect(result).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread messages for a wallet', async () => {
      mockPrisma.message.count.mockResolvedValue(5);

      const result = await messageRepo.getUnreadCount('match_001', '0x1111111111111111111111111111111111111111');

      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: {
          matchId: 'match_001',
          senderWallet: { not: '0x1111111111111111111111111111111111111111' },
          readAt: null
        }
      });
      expect(result).toBe(5);
    });

    it('should return 0 if no unread messages', async () => {
      mockPrisma.message.count.mockResolvedValue(0);

      const result = await messageRepo.getUnreadCount('match_001', '0x1111111111111111111111111111111111111111');

      expect(result).toBe(0);
    });
  });

  describe('getMessagesByMatchAndWallet', () => {
    it('should get messages for a match filtered by wallet', async () => {
      const mockMessages = [
        {
          id: 'msg_001',
          matchId: 'match_001',
          senderWallet: '0x1111111111111111111111111111111111111111',
          content: 'Hello!',
          messageType: 'text',
          createdAt: new Date()
        }
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await messageRepo.getMessagesByMatchAndWallet('match_001', '0x1111111111111111111111111111111111111111');

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          matchId: 'match_001',
          senderWallet: '0x1111111111111111111111111111111111111111'
        },
        orderBy: { createdAt: 'asc' }
      });
      expect(result).toEqual(mockMessages);
    });
  });
});
