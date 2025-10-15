import { PrismaClient, Match, MatchStatus } from '@prisma/client';

interface CreateMatchInput {
  user1Id: string;
  user2Id: string;
  intent1Id: string;
  intent2Id: string;
}

export class MatchRepository {
  constructor(private prisma: PrismaClient) {}

  async createMatch(input: CreateMatchInput): Promise<Match> {
    return this.prisma.match.create({
      data: {
        user1Id: input.user1Id,
        user2Id: input.user2Id,
        intent1Id: input.intent1Id,
        intent2Id: input.intent2Id,
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<Match | null> {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        user1: true,
        user2: true,
        intent1: true,
        intent2: true,
        chatSession: true,
      },
    });
  }

  async findByIntents(
    intent1Id: string,
    intent2Id: string
  ): Promise<Match | null> {
    return this.prisma.match.findUnique({
      where: {
        intent1Id_intent2Id: {
          intent1Id,
          intent2Id,
        },
      },
    });
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    return this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: true,
        user2: true,
        intent1: true,
        intent2: true,
      },
      orderBy: { matchedAt: 'desc' },
    });
  }

  async updateStatus(
    matchId: string,
    status: MatchStatus,
    txHash?: string
  ): Promise<Match> {
    const updateData: any = { status };

    if (status === 'finalized') {
      updateData.finalizedAt = new Date();
    }

    if (txHash) {
      updateData.finalizeTxHash = txHash;
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });
  }

  async setFinalizeTxHash(matchId: string, txHash: string): Promise<Match> {
    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        finalizeTxHash: txHash,
        burnedAt: new Date(),
      },
    });
  }

  async setChatSession(
    matchId: string,
    chatSessionId: string,
    expiresAt: Date
  ): Promise<Match> {
    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        chatSessionId,
        chatExpiresAt: expiresAt,
      },
    });
  }

  async getMatchesByStatus(status: MatchStatus): Promise<Match[]> {
    return this.prisma.match.findMany({
      where: { status },
      include: {
        user1: true,
        user2: true,
        intent1: true,
        intent2: true,
      },
      orderBy: { matchedAt: 'desc' },
    });
  }

  async checkMatchExists(intent1Id: string, intent2Id: string): Promise<boolean> {
    const match = await this.findByIntents(intent1Id, intent2Id);
    return match !== null;
  }

  async deleteMatch(id: string): Promise<void> {
    await this.prisma.match.delete({
      where: { id },
    });
  }
}
