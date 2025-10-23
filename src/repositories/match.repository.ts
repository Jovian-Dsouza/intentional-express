import { PrismaClient, Match, MatchStatus } from '@prisma/client';

export interface CreateMatchData {
  collabPostId: string;
  creatorWallet: string;
  collaboratorWallet: string;
  projectName: string;
  role: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedMatchesResult {
  matches: Match[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class MatchRepository {
  constructor(private prisma: PrismaClient) {}

  async createMatch(data: CreateMatchData): Promise<Match> {
    return this.prisma.match.create({
      data
    });
  }

  async findById(id: string): Promise<Match | null> {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        collabPost: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getMatchesByWallet(
    walletAddress: string,
    pagination: PaginationParams,
    status?: MatchStatus
  ): Promise<PaginatedMatchesResult> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { creatorWallet: walletAddress },
        { collaboratorWallet: walletAddress }
      ]
    };

    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.match.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      matches,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async updateLastMessageAt(matchId: string, timestamp: Date): Promise<Match> {
    return this.prisma.match.update({
      where: { id: matchId },
      data: { lastMessageAt: timestamp }
    });
  }

  async updateUnreadCount(matchId: string, count: number): Promise<Match> {
    return this.prisma.match.update({
      where: { id: matchId },
      data: { unreadCount: count }
    });
  }

  async updateMatchStatus(id: string, status: MatchStatus): Promise<Match> {
    return this.prisma.match.update({
      where: { id },
      data: { status }
    });
  }

  async findByCollabPostAndCollaborator(
    collabPostId: string,
    collaboratorWallet: string
  ): Promise<Match | null> {
    return this.prisma.match.findUnique({
      where: {
        collabPostId_collaboratorWallet: {
          collabPostId,
          collaboratorWallet
        }
      }
    });
  }
}
