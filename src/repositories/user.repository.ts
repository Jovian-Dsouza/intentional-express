import { PrismaClient, User } from '@prisma/client';

interface CreateUserInput {
  walletAddress: string;
  zoraUsername?: string;
  zoraAvatar?: string;
  zoraBio?: string;
  creatorCoinAddress?: string;
}

interface UpdateZoraProfileInput {
  zoraUsername?: string;
  zoraAvatar?: string;
  zoraBio?: string;
  creatorCoinAddress?: string;
}

interface UpdateStatsInput {
  totalIntentsCreated?: number;
  totalMatches?: number;
  successRate?: number;
}

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        id: input.walletAddress,
        zoraUsername: input.zoraUsername,
        zoraAvatar: input.zoraAvatar,
        zoraBio: input.zoraBio,
        creatorCoinAddress: input.creatorCoinAddress,
      },
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: walletAddress },
    });
  }

  async updateZoraProfile(
    walletAddress: string,
    profile: UpdateZoraProfileInput
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: walletAddress },
      data: {
        ...profile,
        profileCachedAt: new Date(),
      },
    });
  }

  async hasActiveIntent(walletAddress: string): Promise<boolean> {
    const activeIntent = await this.prisma.intent.findFirst({
      where: {
        userId: walletAddress,
        status: { in: ['pending_payment', 'active'] },
        expiresAt: { gt: new Date() },
      },
    });

    return activeIntent !== null;
  }

  async updateReputationScore(
    walletAddress: string,
    score: number,
    tier: string
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: walletAddress },
      data: {
        reputationScore: score,
        reputationTier: tier,
      },
    });
  }

  async updateStats(
    walletAddress: string,
    stats: UpdateStatsInput
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: walletAddress },
      data: stats,
    });
  }

  async updateLastActive(walletAddress: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: walletAddress },
      data: {
        lastActiveAt: new Date(),
      },
    });
  }
}
