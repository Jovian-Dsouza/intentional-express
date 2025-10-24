#!/usr/bin/env tsx
import axios, { AxiosResponse } from 'axios';

// Types based on the API documentation
interface OnboardingData {
  userType: 'indie' | 'commercial';
  creativeDomains: string[];
  status: 'available' | 'gigs' | 'collabs' | 'exploring';
  profileData: {
    name: string;
    tagline: string;
    orgName?: string;
    orgType?: string;
    skills: string[];
  };
  walletAddress?: string | null;
  zoraWalletAddress: string;
}

interface OnboardingStatusResponse {
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

interface OnboardingCompletionResponse {
  success: boolean;
  data: {
    userId: string;
    isOnboarded: boolean;
    message: string;
  };
}

// interface ApiError {
//   success: false;
//   error: {
//     code: string;
//     message: string;
//     details?: Array<{
//       field: string;
//       message: string;
//     }>;
//   };
// }

class UserOnboardingClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if a user is onboarded
   */
  async checkOnboardingStatus(zoraWalletAddress: string): Promise<OnboardingStatusResponse> {
    try {
      const response: AxiosResponse<OnboardingStatusResponse> = await axios.get(
        `${this.baseUrl}/users/${zoraWalletAddress}/onboarding-status`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw error;
    }
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(data: OnboardingData): Promise<OnboardingCompletionResponse> {
    try {
      const response: AxiosResponse<OnboardingCompletionResponse> = await axios.post(
        `${this.baseUrl}/users/${data.zoraWalletAddress}/onboard`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`API Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw error;
    }
  }

  /**
   * Create sample onboarding data
   */
  createSampleData(zoraWalletAddress: string, userType: 'indie' | 'commercial' = 'indie'): OnboardingData {
    const baseData = {
      zoraWalletAddress,
      walletAddress: null,
    };

    if (userType === 'indie') {
      return {
        ...baseData,
        userType: 'indie',
        creativeDomains: ['film', 'music', 'photography'],
        status: 'available',
        profileData: {
          name: 'John Doe',
          tagline: 'Creative filmmaker and photographer',
          orgName: '',
          orgType: '',
          skills: ['VFX', '3D Animation', 'Motion Graphics', 'Color Grading'],
        },
      };
    } else {
      return {
        ...baseData,
        userType: 'commercial',
        creativeDomains: ['advertising', 'branding'],
        status: 'gigs',
        profileData: {
          name: 'Jane Smith',
          tagline: 'Creative Director at Tech Corp',
          orgName: 'Tech Corp',
          orgType: 'Agency',
          skills: ['Brand Strategy', 'Creative Direction', 'Team Management'],
        },
      };
    }
  }
}

async function onboardUser(client: UserOnboardingClient, walletAddress: string, creativeDomain: 'indie' | 'commercial' = 'indie') {
  const response = await client.checkOnboardingStatus(walletAddress);
  if (response.success && response.isOnboarded) {
    console.log('User is onboarded', response.data);
  } else {
    console.log('User is not onboarded');
    const data = client.createSampleData(walletAddress, creativeDomain);
    const response = await client.completeOnboarding(data);
    if (response.success) {
      console.log('User onboarded successfully', response.data);
    } else {
      console.log('User onboarding failed', response);
    }
  }
}

async function main() {
  const client = new UserOnboardingClient();

  const walletAddress = '0x49773872fF6e6115CeADe91EEBAFAC0734A31Ae1';
  await onboardUser(client, walletAddress);

}

main();