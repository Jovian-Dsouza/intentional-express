import { PrismaClient, Ping, PingStatus } from '@prisma/client';

export interface CreatePingData {
  collabPostId: string;
  pingedWallet: string;
  interestedRole: string;
  bio: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedPingsResult {
  pings: Ping[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PingRepository {
  constructor(private prisma: PrismaClient) {}

  async createPing(data: CreatePingData): Promise<Ping> {
    return this.prisma.ping.create({
      data
    });
  }

  async findById(id: string): Promise<Ping | null> {
    return this.prisma.ping.findUnique({
      where: { id },
      include: {
        collabPost: true
      }
    });
  }

  async getReceivedPings(
    walletAddress: string,
    pagination: PaginationParams,
    status?: PingStatus
  ): Promise<PaginatedPingsResult> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      collabPost: {
        creatorWallet: walletAddress
      }
    };

    // By default, only show pending pings (unresponded)
    // If status is explicitly provided, use that instead
    if (status) {
      where.status = status;
    } else {
      where.status = 'pending';
    }

    const [pings, total] = await Promise.all([
      this.prisma.ping.findMany({
        where,
        include: {
          collabPost: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.ping.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      pings,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async updatePingStatus(id: string, status: PingStatus): Promise<Ping> {
    return this.prisma.ping.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date()
      }
    });
  }

  async checkDuplicatePing(collabPostId: string, wallet: string): Promise<boolean> {
    const existingPing = await this.prisma.ping.findUnique({
      where: {
        collabPostId_pingedWallet: {
          collabPostId,
          pingedWallet: wallet
        }
      }
    });

    return existingPing !== null;
  }

  async getPingsByWallet(walletAddress: string): Promise<Ping[]> {
    return this.prisma.ping.findMany({
      where: { pingedWallet: walletAddress },
      orderBy: { createdAt: 'desc' }
    });
  }
}
