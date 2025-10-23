import { PrismaClient, CollaborationPost, CollabStatus, PaymentType, WorkStyle } from '@prisma/client';
import { CreateCollabInput } from '../schemas/collab.schema';

export interface CollabPostFilters {
  status?: CollabStatus;
  paymentType?: PaymentType;
  workStyle?: WorkStyle;
  location?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  posts: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class CollabPostRepository {
  constructor(private prisma: PrismaClient) {}

  async createCollabPost(
    data: CreateCollabInput,
    creatorWallet: string,
    coinAddress: string
  ): Promise<CollaborationPost> {
    return this.prisma.collaborationPost.create({
      data: {
        ...data,
        creatorWallet,
        coinAddress,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });
  }

  async findById(id: string): Promise<CollaborationPost | null> {
    return this.prisma.collaborationPost.findUnique({
      where: { id },
      include: {
        pings: true,
        matches: true
      }
    });
  }

  async findByWallet(
    walletAddress: string,
    filters: CollabPostFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResult<CollaborationPost>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      creatorWallet: walletAddress,
      ...filters
    };

    const [posts, total] = await Promise.all([
      this.prisma.collaborationPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.collaborationPost.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async getFeed(
    filters: CollabPostFilters = {},
    pagination: PaginationParams,
    excludeWallet?: string
  ): Promise<PaginatedResult<CollaborationPost>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      ...filters,
      // Exclude expired posts
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // Exclude user's own posts
    if (excludeWallet) {
      where.creatorWallet = { not: excludeWallet };
    }

    const [posts, total] = await Promise.all([
      this.prisma.collaborationPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.collaborationPost.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async updateStatus(id: string, status: CollabStatus): Promise<CollaborationPost> {
    return this.prisma.collaborationPost.update({
      where: { id },
      data: { status }
    });
  }

  async deleteCollabPost(id: string): Promise<CollaborationPost> {
    return this.prisma.collaborationPost.delete({
      where: { id }
    });
  }

  async findByCoinAddress(coinAddress: string): Promise<CollaborationPost | null> {
    return this.prisma.collaborationPost.findUnique({
      where: { coinAddress }
    });
  }
}
