import { PrismaClient, CollaborationPost, CollabStatus, PaymentType, WorkStyle } from '@prisma/client';
import { CreateCollabInput, MintPostCoinInput } from '../schemas/collab.schema';

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
    // Derive legacy fields for backwards compatibility
    const firstCollaborator = data.collaborators[0];
    const role = firstCollaborator?.role || 'Multiple Roles';
    
    // Determine payment type from collaborators
    const paymentTypes = data.collaborators.map(c => c.compensationType);
    const paymentType = paymentTypes.includes('paid') && paymentTypes.includes('barter') 
      ? 'both' 
      : paymentTypes.includes('paid') 
        ? 'paid' 
        : 'barter';
    
    // Check if any collaborator has credits
    const credits = data.collaborators.some(c => c.credits > 0);
    
    // Determine work style from time commitment
    const workStyle = data.collaborators.some(c => c.timeCommitment === 'ongoing')
      ? 'contract'
      : 'freestyle';

    return this.prisma.collaborationPost.create({
      data: {
        title: role, // Use role as title for legacy compatibility
        description: `Collaboration opportunity: ${role}`,
        media: {}, // Empty media object for legacy posts
        metadata: undefined,
        coinName: role,
        coinSymbol: role.substring(0, 5).toUpperCase(),
        role,
        paymentType: paymentType as PaymentType,
        credits,
        workStyle: workStyle as WorkStyle,
        location: data.location,
        creatorWallet,
        coinAddress,
        collaborators: data.collaborators,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });
  }

  async createMintPostCoin(
    data: MintPostCoinInput,
    creatorWallet: string,
    coinAddress: string,
    coinName: string,
    coinSymbol: string
  ): Promise<CollaborationPost> {
    // Derive legacy fields for backwards compatibility
    const firstCollaborator = data.collaboration.collaborators[0];
    const role = firstCollaborator?.role || 'Multiple Roles';
    
    // Determine payment type from collaborators
    const paymentTypes = data.collaboration.collaborators.map(c => c.compensationType);
    const paymentType = paymentTypes.includes('paid') && paymentTypes.includes('barter') 
      ? 'both' 
      : paymentTypes.includes('paid') 
        ? 'paid' 
        : 'barter';
    
    // Check if any collaborator has credits
    const credits = data.collaboration.collaborators.some(c => c.credits > 0);
    
    // Determine work style from time commitment
    const workStyle = data.collaboration.collaborators.some(c => c.timeCommitment === 'ongoing')
      ? 'contract'
      : 'freestyle';
    
    // Use category as location or default to Remote
    const location = data.metadata?.category || 'Remote';

    return this.prisma.collaborationPost.create({
      data: {
        title: data.title,
        description: data.description,
        media: data.media,
        metadata: data.metadata,
        coinName,
        coinSymbol,
        role,
        paymentType: paymentType as PaymentType,
        credits,
        workStyle: workStyle as WorkStyle,
        location,
        creatorWallet,
        coinAddress,
        collaborators: data.collaboration.collaborators,
        expiresAt: data.collaboration.expiresAt ? new Date(data.collaboration.expiresAt) : null
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
