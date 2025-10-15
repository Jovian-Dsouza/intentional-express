import { PrismaClient, Swipe, SwipeAction } from '@prisma/client';

interface CreateSwipeInput {
  userId: string;
  intentId: string;
  targetIntentId: string;
  action: SwipeAction;
  viewDuration?: number;
  mediaViewed?: string[];
}

export class SwipeRepository {
  constructor(private prisma: PrismaClient) {}

  async createSwipe(input: CreateSwipeInput): Promise<Swipe> {
    return this.prisma.swipe.create({
      data: {
        userId: input.userId,
        intentId: input.intentId,
        targetIntentId: input.targetIntentId,
        action: input.action,
        viewDuration: input.viewDuration,
        mediaViewed: input.mediaViewed || [],
      },
    });
  }

  async findSwipe(
    intentId: string,
    targetIntentId: string
  ): Promise<Swipe | null> {
    return this.prisma.swipe.findUnique({
      where: {
        intentId_targetIntentId: {
          intentId,
          targetIntentId,
        },
      },
    });
  }

  async checkReciprocalSwipe(
    intent1Id: string,
    intent2Id: string
  ): Promise<boolean> {
    // Check if there's a reciprocal right swipe
    const reciprocalSwipe = await this.prisma.swipe.findFirst({
      where: {
        intentId: intent2Id,
        targetIntentId: intent1Id,
        action: 'right',
      },
    });

    return reciprocalSwipe !== null;
  }

  async getSwipesByUserId(userId: string): Promise<Swipe[]> {
    return this.prisma.swipe.findMany({
      where: { userId },
      include: {
        targetIntent: true,
      },
      orderBy: { swipedAt: 'desc' },
    });
  }

  async getSwipedIntentIds(intentId: string): Promise<string[]> {
    const swipes = await this.prisma.swipe.findMany({
      where: { intentId },
      select: { targetIntentId: true },
    });

    return swipes.map(s => s.targetIntentId);
  }

  async hasSwipedOnIntent(
    intentId: string,
    targetIntentId: string
  ): Promise<boolean> {
    const swipe = await this.findSwipe(intentId, targetIntentId);
    return swipe !== null;
  }

  async deleteSwipe(id: string): Promise<void> {
    await this.prisma.swipe.delete({
      where: { id },
    });
  }
}
