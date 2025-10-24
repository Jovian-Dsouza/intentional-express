import { UserRepository } from '../repositories/user.repository';
import { OnboardingData } from '../schemas/user.schema';
import { User } from '@prisma/client';

export interface OnboardingStatusResponse {
  success: boolean;
  isOnboarded: boolean;
  data: {
    userId: string;
    userType: string;
    creativeDomains: string[];
    status: string;
    profileData: {
      name: string;
      tagline: string;
      orgName: string | null;
      orgType: string | null;
      collabCount: number;
      deltaCollabs: number;
      skills: string[];
    };
    walletAddress: string | null;
    zoraWalletAddress: string;
    onboardedAt: string;
  } | null;
}

export interface OnboardingCompletionResponse {
  success: boolean;
  data: {
    userId: string;
    isOnboarded: boolean;
    message: string;
  };
}

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getOnboardingStatus(zoraWalletAddress: string): Promise<OnboardingStatusResponse> {
    const user = await this.userRepo.findByZoraWallet(zoraWalletAddress);
    
    if (!user) {
      return {
        success: true,
        isOnboarded: false,
        data: null
      };
    }

    // Calculate collaboration counts
    const [collabCount, deltaCollabs] = await Promise.all([
      this.userRepo.getCollabCount(zoraWalletAddress),
      this.userRepo.getDeltaCollabs(zoraWalletAddress)
    ]);

    return {
      success: true,
      isOnboarded: true,
      data: {
        userId: user.id,
        userType: user.userType,
        creativeDomains: user.creativeDomains as string[],
        status: user.status,
        profileData: {
          name: user.name,
          tagline: user.tagline,
          orgName: user.orgName,
          orgType: user.orgType,
          collabCount,
          deltaCollabs,
          skills: user.skills as string[]
        },
        walletAddress: user.walletAddress,
        zoraWalletAddress: user.zoraWalletAddress,
        onboardedAt: user.onboardedAt.toISOString()
      }
    };
  }

  async completeOnboarding(data: OnboardingData): Promise<OnboardingCompletionResponse> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByZoraWallet(data.zoraWalletAddress);
    
    if (existingUser) {
      throw new Error('User already onboarded');
    }

    // Create new user
    const user = await this.userRepo.createUser(data);

    return {
      success: true,
      data: {
        userId: user.id,
        isOnboarded: true,
        message: 'Onboarding completed successfully'
      }
    };
  }

  async updateUserProfile(zoraWalletAddress: string, data: Partial<OnboardingData>): Promise<User> {
    const existingUser = await this.userRepo.findByZoraWallet(zoraWalletAddress);
    
    if (!existingUser) {
      throw new Error('User not found');
    }

    return this.userRepo.updateUser(zoraWalletAddress, data);
  }
}
