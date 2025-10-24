import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from '../services/user.service';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { OnboardingDataSchema, ZoraWalletParamSchema } from '../schemas/user.schema';
import { prisma } from '../lib/prisma';

const router = Router();

// Initialize repositories, service, and controller
const userRepo = new UserRepository(prisma);
const userService = new UserService(userRepo);
const userController = new UserController(userService);

// GET /api/users/:zoraWalletAddress/onboarding-status - Get user onboarding status
router.get('/:zoraWalletAddress/onboarding-status',
  validateParams(ZoraWalletParamSchema),
  userController.getOnboardingStatus.bind(userController)
);

// POST /api/users/:zoraWalletAddress/onboard - Complete user onboarding
router.post('/:zoraWalletAddress/onboard',
  validateParams(ZoraWalletParamSchema),
  validateBody(OnboardingDataSchema),
  userController.completeOnboarding.bind(userController)
);

export default router;
