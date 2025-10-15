import { PrismaClient, Intent, IntentType, Visibility, IntentStatus } from '@prisma/client';
import { IPFSMedia } from '../types/intent.types';

interface CreateIntentInput {
  userId: string;
  type: IntentType;
  title: string;
  description: string;
  visibility: Visibility;
  reputationEnabled: boolean;
  duration: number; // hours
  tags: string[];
  images: IPFSMedia[];
  video?: IPFSMedia;
  metadata: Record<string, any>;
  activationFee: string;
  activationFeeUsd: string;
}

interface UpdateIntentInput {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class IntentRepository {
  constructor(private prisma: PrismaClient) {}

  async createIntent(input: CreateIntentInput): Promise<Intent> {
    const expiresAt = new Date(Date.now() + input.duration * 60 * 60 * 1000);
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for payment

    return this.prisma.intent.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        reputationEnabled: input.reputationEnabled,
        status: 'pending_payment',
        tags: input.tags,
        images: input.images as any,
        video: input.video as any,
        metadata: input.metadata as any,
        activationFee: input.activationFee,
        activationFeeUsd: input.activationFeeUsd,
        paymentExpiresAt,
        expiresAt,
      },
    });
  }

  async findById(id: string): Promise<Intent | null> {
    return this.prisma.intent.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<Intent | null> {
    return this.prisma.intent.findFirst({
      where: {
        userId,
        status: { in: ['pending_payment', 'active'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    intentId: string,
    status: IntentStatus,
    txHash?: string
  ): Promise<Intent> {
    const updateData: any = { status };

    // Set publishedAt when intent becomes active
    if (status === 'active') {
      updateData.publishedAt = new Date();
    }

    // Set matchedAt when intent is matched
    if (status === 'matched') {
      updateData.matchedAt = new Date();
    }

    if (txHash) {
      updateData.onChainTxHash = txHash;
    }

    return this.prisma.intent.update({
      where: { id: intentId },
      data: updateData,
    });
  }

  async updateIntent(
    intentId: string,
    input: UpdateIntentInput
  ): Promise<Intent> {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: input,
    });
  }

  async getIntentsByStatus(
    status: IntentStatus,
    includeExpired: boolean = false
  ): Promise<Intent[]> {
    const where: any = { status };

    if (!includeExpired) {
      where.expiresAt = { gt: new Date() };
    }

    return this.prisma.intent.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async confirmPayment(intentId: string, txHash: string): Promise<Intent> {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: {
        paymentTxHash: txHash,
        status: 'active',
        publishedAt: new Date(),
      },
    });
  }

  async setOnChainTxHash(intentId: string, txHash: string): Promise<Intent> {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: {
        onChainTxHash: txHash,
      },
    });
  }

  async setBurnTxHash(intentId: string, txHash: string): Promise<Intent> {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: {
        burnTxHash: txHash,
        status: 'burned',
      },
    });
  }

  async getExpiredIntents(): Promise<Intent[]> {
    return this.prisma.intent.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
    });
  }

  async markAsExpired(intentId: string): Promise<Intent> {
    return this.prisma.intent.update({
      where: { id: intentId },
      data: {
        status: 'expired',
      },
    });
  }

  async deleteIntent(intentId: string): Promise<void> {
    await this.prisma.intent.delete({
      where: { id: intentId },
    });
  }
}
