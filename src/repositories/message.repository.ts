import { PrismaClient, Message, MessageType } from '@prisma/client';

export interface CreateMessageData {
  matchId: string;
  senderWallet: string;
  content: string;
  messageType: MessageType;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedMessagesResult {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class MessageRepository {
  constructor(private prisma: PrismaClient) {}

  async createMessage(data: CreateMessageData): Promise<Message> {
    return this.prisma.message.create({
      data
    });
  }

  async getMessagesByMatch(
    matchId: string,
    pagination: PaginationParams
  ): Promise<PaginatedMessagesResult> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.message.count({ where: { matchId } })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      messages,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async markAsRead(matchId: string, walletAddress: string): Promise<number> {
    const result = await this.prisma.message.updateMany({
      where: {
        matchId,
        senderWallet: { not: walletAddress },
        readAt: null
      },
      data: { readAt: new Date() }
    });

    return result.count;
  }

  async getUnreadCount(matchId: string, walletAddress: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        matchId,
        senderWallet: { not: walletAddress },
        readAt: null
      }
    });
  }

  async getMessagesByMatchAndWallet(matchId: string, walletAddress: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        matchId,
        senderWallet: walletAddress
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
