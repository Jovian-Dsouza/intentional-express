import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { OnboardingData } from '../schemas/user.schema';

export class UserController {
  constructor(private userService: UserService) {}

  async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { zoraWalletAddress } = req.params;

      const result = await this.userService.getOnboardingStatus(zoraWalletAddress);

      res.json(result);
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get onboarding status'
        }
      });
    }
  }

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const { zoraWalletAddress } = req.params;
      const onboardingData: OnboardingData = req.body;

      // Ensure the zoraWalletAddress in the body matches the URL parameter
      if (onboardingData.zoraWalletAddress !== zoraWalletAddress) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Zora wallet address in body must match URL parameter'
          }
        });
        return;
      }

      const result = await this.userService.completeOnboarding(onboardingData);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      if (error instanceof Error && error.message === 'User already onboarded') {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User is already onboarded'
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete onboarding'
        }
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { zoraWalletAddress } = req.params;
      const updateData: Partial<OnboardingData> = req.body;

      const user = await this.userService.updateUserProfile(zoraWalletAddress, updateData);

      res.json({
        success: true,
        data: {
          userId: user.id,
          message: 'Profile updated successfully'
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile'
        }
      });
    }
  }
}
