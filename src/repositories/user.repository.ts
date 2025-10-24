import { PrismaClient, User, UserType, UserStatus } from '@prisma/client';
import { OnboardingData } from '../schemas/user.schema';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByZoraWallet(zoraWalletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { zoraWalletAddress }
    });
  }

  async createUser(data: OnboardingData): Promise<User> {
    return this.prisma.user.create({
      data: {
        zoraWalletAddress: data.zoraWalletAddress,
        walletAddress: data.walletAddress,
        userType: data.userType as UserType,
        creativeDomains: data.creativeDomains,
        status: data.status as UserStatus,
        name: data.profileData.name,
        tagline: data.profileData.tagline,
        orgName: data.profileData.orgName,
        orgType: data.profileData.orgType,
        skills: data.profileData.skills
      }
    });
  }

  async getCollabCount(zoraWalletAddress: string): Promise<number> {
    const count = await this.prisma.match.count({
      where: {
        OR: [
          { creatorWallet: zoraWalletAddress },
          { collaboratorWallet: zoraWalletAddress }
        ],
        status: 'active'
      }
    });
    return count;
  }

  async getDeltaCollabs(zoraWalletAddress: string): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const count = await this.prisma.match.count({
      where: {
        OR: [
          { creatorWallet: zoraWalletAddress },
          { collaboratorWallet: zoraWalletAddress }
        ],
        status: 'active',
        createdAt: {
          gte: twentyFourHoursAgo
        }
      }
    });
    return count;
  }

  async updateUser(zoraWalletAddress: string, data: Partial<OnboardingData>): Promise<User> {
    return this.prisma.user.update({
      where: { zoraWalletAddress },
      data: {
        ...(data.walletAddress !== undefined && { walletAddress: data.walletAddress }),
        ...(data.userType && { userType: data.userType as UserType }),
        ...(data.creativeDomains && { creativeDomains: data.creativeDomains }),
        ...(data.status && { status: data.status as UserStatus }),
        ...(data.profileData?.name && { name: data.profileData.name }),
        ...(data.profileData?.tagline && { tagline: data.profileData.tagline }),
        ...(data.profileData?.orgName !== undefined && { orgName: data.profileData.orgName }),
        ...(data.profileData?.orgType !== undefined && { orgType: data.profileData.orgType }),
        ...(data.profileData?.skills && { skills: data.profileData.skills })
      }
    });
  }

  async deleteUser(zoraWalletAddress: string): Promise<void> {
    await this.prisma.user.delete({
      where: { zoraWalletAddress }
    });
  }
}
